"""REVIEW ONLY until explicitly authorized. No frontend or DB restore operations."""
import re
import hashlib, json, os, shlex, shutil, sqlite3, subprocess, sys, time, tempfile, signal
from contextlib import contextmanager, closing
from pathlib import Path
from urllib.request import urlopen

APP = Path('/home/ec2-user/paisa-mart-new/backend')
DB = Path('/home/ec2-user/paisa-mart-data/payments.db')
BACKUP = Path('/home/ec2-user/paisa-mart-data/backups/backend-before-dashboard-CANDIDATE')
STAGE = Path(__file__).resolve().parent
# Stable across update/rollback and bundle versions. Never unlink this lock file.
LOCK = Path('/home/ec2-user/paisa-mart-deployment/.paisa-mart-backend.lock')
OLD, NEW = {}, {}

def load_configuration():
    require(Path(__file__).resolve().parent == STAGE, 'Script must be in the reviewed staging directory')
    info = json.loads((STAGE / 'comparison.json').read_text())
    require(bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', info['release_name'])), 'Invalid release name')
    for name in set(info['expected_baseline']) | set(info['install_lf_hashes']):
        require(not Path(name).is_absolute() and '..' not in Path(name).parts and (name.startswith('src/') or name == 'package.json'), 'Invalid source path')
    preserved = info.get('personal_preserved_files', {})
    require(not (set(preserved) & set(info['install_lf_hashes'])), 'Personal runtime files must not be redeployed')
    require(all(info['expected_baseline'].get(name) == digest for name, digest in preserved.items()), 'Personal baseline must be preserved')
    global OLD, NEW, BACKUP
    BACKUP = Path('/home/ec2-user/paisa-mart-data/backups') / ('backend-before-' + info['release_name'])
    OLD, NEW = info['expected_baseline'], info['install_lf_hashes']

@contextmanager
def operation_lock():
    flags = os.O_RDWR | os.O_CREAT | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(LOCK, flags, 0o600)
    acquired = False
    try:
        if os.name == 'nt':
            import msvcrt
            if os.fstat(fd).st_size == 0: os.write(fd, b'0')
            os.lseek(fd, 0, os.SEEK_SET)
            try: msvcrt.locking(fd, msvcrt.LK_NBLCK, 1)
            except OSError as exc: raise RuntimeError('Another backend update/rollback is running') from exc
        else:
            import fcntl
            try: fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc: raise RuntimeError('Another backend update/rollback is running') from exc
        acquired = True
        yield
    finally:
        if acquired:
            if os.name == 'nt':
                os.lseek(fd, 0, os.SEEK_SET)
                msvcrt.locking(fd, msvcrt.LK_UNLCK, 1)
            else: fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)

@contextmanager
def transaction_signals(recovering=False):
    # SIGINT normally raises KeyboardInterrupt. Turn SIGTERM into a catchable failure.
    # Ignore repeated termination requests during recovery; children inherit SIG_IGN.
    def terminate(signum, frame):
        raise InterruptedError('Backend operation interrupted by signal ' + str(signum))
    handlers = {}
    try:
        for sig in (signal.SIGINT, signal.SIGTERM):
            handlers[sig] = signal.getsignal(sig)
            signal.signal(sig, signal.SIG_IGN if recovering else
                          signal.default_int_handler if sig == signal.SIGINT else terminate)
        yield
    finally:
        for sig, handler in handlers.items(): signal.signal(sig, handler)


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else 'MISSING'
def require(ok, message):
    if not ok: raise RuntimeError(message)
def command(*args):
    return subprocess.check_output(args, text=True)
def process():
    require((Path.home()/'.pm2/rpc.sock').exists(), 'PM2 daemon socket missing; stop for manual inspection')
    rows = [p for p in json.loads(command('pm2','jlist')) if p.get('name') == 'paisa-mart']
    require(len(rows) == 1, 'Expected exactly one paisa-mart process')
    p = rows[0]; e = p['pm2_env']
    require(Path(e['pm_cwd']).resolve() == APP.resolve(), 'Unexpected backend working directory')
    args = e.get('args', [])
    if isinstance(args,str): args = shlex.split(args)
    require(Path(e['pm_exec_path']).name == 'bun' and args == ['run','src/index.ts'], 'Startup is not the verified bun run src/index.ts; stop')
    return p

def health():
    for _ in range(20):
        try:
            with urlopen('http://127.0.0.1:3000/health',timeout=2) as r:
                if r.status == 200 and json.load(r).get('status') == 'ok': return
        except Exception: pass
        time.sleep(1)
    raise RuntimeError('Health check failed')

def atomic_write(target, data, mode):
    fd, name = tempfile.mkstemp(prefix='.backend-dashboard-', dir=target.parent)
    temp = Path(name)
    try:
        with os.fdopen(fd, 'wb') as out:
            out.write(data)
            out.flush()
            os.fsync(out.fileno())
        os.chmod(temp, mode)
        os.replace(temp, target)
    finally:
        if temp.exists(): temp.unlink()

def validate_restore_targets():
    # Validate unchanged files too, before stopping a currently working service.
    for name, old_hash in OLD.items():
        target = APP/name
        require(not target.is_symlink(), 'Refuse symlink: '+name)
        allowed = (old_hash, NEW[name]) if name in NEW else (old_hash,)
        require(sha(target) in allowed, 'Unexpected live file during rollback: '+name)

def prepare_restore():
    # Everything below runs BEFORE the first PM2 stop. Retain verified restore
    # bytes in memory, so recovery does not depend on reopening backup files.
    state = json.loads((BACKUP/'backup-ready.json').read_text())
    require(state.get('version') == 2, 'Expected version-2 verified backup metadata')
    require(state['old'] == OLD and state['new'] == NEW, 'Unexpected backup metadata')
    hashes = state['backup_hashes']
    require('process.json' in hashes and 'payments.db' in hashes, 'Incomplete backup manifest')
    for name, expected in hashes.items():
        source = BACKUP/name
        require(source.resolve().is_relative_to(BACKUP.resolve()) and not source.is_symlink(), 'Unsafe backup path')
        require(sha(source) == expected, 'Backup checksum mismatch: '+name)
    for name, expected in OLD.items():
        if expected != 'MISSING':
            require(hashes.get(name) == expected and sha(BACKUP/name) == expected, 'Backup checksum mismatch: '+name)
    with closing(sqlite3.connect((BACKUP/'payments.db').as_uri()+'?mode=ro', uri=True)) as saved:
        require(saved.execute('PRAGMA integrity_check').fetchall() == [('ok',)], 'Backup database integrity failed')
    saved_process = json.loads((BACKUP/'process.json').read_text())
    require(saved_process['pm_id'] == state['pm_id'], 'Backup process identity mismatch')
    restore = {}
    for name in NEW:
        if OLD[name] == 'MISSING': restore[name] = None
        else:
            source = BACKUP/name
            data = source.read_bytes()
            require(hashlib.sha256(data).hexdigest() == OLD[name], 'Backup changed while loading: '+name)
            restore[name] = (data, source.stat().st_mode & 0o777)
    return state, restore

def restore_files(restore):
    validate_restore_targets()
    for name, saved in restore.items():
        target = APP/name
        if saved is None:
            if target.exists(): target.unlink()
        else: atomic_write(target, saved[0], saved[1])
    for name in OLD: require(sha(APP/name) == OLD[name], 'Rollback verification failed: '+name)

def assert_process(identity, online=False):
    p = process()
    require(str(p['pm_id']) == identity, 'PM2 identity changed; manual review required')
    if online: require(p['pm2_env'].get('status') == 'online', 'Process did not return online')
    return p

def stop_process(identity):
    assert_process(identity)
    subprocess.run(['pm2', 'stop', identity], check=True)
    require(assert_process(identity)['pm2_env'].get('status') == 'stopped', 'PM2 process did not stop')

def restart_process(identity):
    subprocess.run(['pm2', 'restart', identity], check=True)
    health()
    assert_process(identity, online=True)

def run_transaction(identity, restore, action, finalize=lambda: None):
    # Include the FIRST stop in the protected region: it can stop the service
    # and then raise, including KeyboardInterrupt or InterruptedError.
    try:
        with transaction_signals():
            stop_process(identity)
            action()
            restart_process(identity)
            finalize()
    except BaseException:
        with transaction_signals(recovering=True):
            try:
                stop_process(identity)
                restore_files(restore)
                restart_process(identity)
                marker = BACKUP/'update-complete'
                if marker.exists(): marker.unlink()
            except BaseException as recovery_error:
                raise RuntimeError('Recovery could not be confirmed; service may be stopped. Keep backup: '+str(BACKUP)) from recovery_error
        print('Operation failed/interrupted; original backend restored and health verified. Database and frontend retained.', file=sys.stderr)
        raise

def _update():
    require(APP.is_dir() and DB.is_file(), 'Missing live paths')
    for name, expected in OLD.items():
        require(not (APP/name).is_symlink() and sha(APP/name)==expected, 'Production drift detected: '+name)
    for name, expected in NEW.items():
        require(sha(STAGE/'files'/name)==expected, 'Staged source checksum mismatch: '+name)
    p = process(); e = p['pm2_env']; identity = str(p['pm_id'])
    require(e.get('status')=='online', 'Current process is not online')
    health()
    # Only validate presence; never print or regenerate existing secrets.
    env = os.environ.copy()
    env.update({k:v for k,v in e.items() if isinstance(v,str)})
    probe = "for (const k of ['AUTH_TOKEN_SECRET','HOME_LOAN_ADMIN_TOKEN_SECRET','HOME_LOAN_ADMIN_PASSWORD']) if (!process.env[k]) process.exit(1)"
    subprocess.run([e['pm_exec_path'],'-e',probe],cwd=APP,env=env,check=True,stdout=subprocess.DEVNULL)
    # Existing process DB path must be known; source configuration stays untouched.
    probe = "const p=process.env.LEADS_DB??process.env.TXN_DB??'payments.db'; if((process.env.PERSONAL_LOANS_DATABASE_URL??process.env.BUSINESS_LOANS_DATABASE_URL??process.env.HOME_LOANS_DATABASE_URL??process.env.DATABASE_URL??process.env.POSTGRES_URL)||require('path').resolve(p)!=='/home/ec2-user/paisa-mart-data/payments.db')process.exit(1)"
    subprocess.run([e['pm_exec_path'],'-e',probe],cwd=APP,env=env,check=True,stdout=subprocess.DEVNULL)
    BACKUP.mkdir(mode=0o700,exist_ok=False)
    require(not any(x.is_symlink() for x in (APP/'src').rglob('*')), 'Source symlinks need manual review')
    shutil.copytree(APP/'src',BACKUP/'src')
    for name in ['package.json','bun.lock','bun.lockb','.env']:
        source=APP/name
        if source.is_file():
            shutil.copy2(source,BACKUP/name)
            if name=='.env': os.chmod(BACKUP/name,0o600)
    (BACKUP/'process.json').write_text(json.dumps(p))
    os.chmod(BACKUP/'process.json',0o600)
    for name,expected in OLD.items():
        if expected!='MISSING': require(sha(BACKUP/name)==expected,'Backup verification failed: '+name)
    # Consistent snapshot; source opened read-only. No automatic database restore.
    with closing(sqlite3.connect(DB.as_uri()+'?mode=ro',uri=True)) as source:
        with closing(sqlite3.connect(BACKUP/'payments.db')) as saved:
            source.backup(saved)
            require(saved.execute('PRAGMA integrity_check').fetchall()==[('ok',)],'Database backup failed integrity check')
    os.chmod(BACKUP/'payments.db',0o600)
    backup_hashes = {f.relative_to(BACKUP).as_posix(): sha(f) for f in BACKUP.rglob('*') if f.is_file()}
    (BACKUP/'backup-ready.json').write_text(json.dumps({'version':2,'pm_id':p['pm_id'],'original_pid':p['pid'],'old':OLD,'new':NEW,'backup_hashes':backup_hashes}))
    state, restore = prepare_restore()
    # Final drift check immediately before stopping exactly the identified service.
    current=process()
    require(current['pm_id']==p['pm_id'] and current['pid']==p['pid'],'Process changed during backup')
    for name,expected in OLD.items(): require(sha(APP/name)==expected,'Production changed during backup: '+name)
    def install():
        for name in NEW:
            target = APP/name
            mode = (target.stat().st_mode & 0o777) if target.exists() else 0o644
            atomic_write(target, (STAGE/'files'/name).read_bytes(), mode)
        for name, expected in NEW.items(): require(sha(APP/name) == expected, 'Installed checksum failed: '+name)
        subprocess.run([e['pm_exec_path'], '-e', "await (await import('./src/lib/admin-operations.ts')).migrate();"], cwd=APP, env=env, check=True, stdout=subprocess.DEVNULL)
    def finalize():
        atomic_write(BACKUP/'update-complete', b'Backend update completed; database snapshot is recovery-only.\n', 0o600)
    run_transaction(identity, restore, install, finalize)
    print('Backend code updated. Backup: '+str(BACKUP))
    print('Verify authenticated customer/admin behavior separately before any frontend activation.')

def _rollback():
    state, restore = prepare_restore()
    p = process(); identity = str(p['pm_id'])
    require(p['pm_id'] == state['pm_id'], 'PM2 identity changed; manual review required')
    validate_restore_targets()
    run_transaction(identity, restore, lambda: restore_files(restore))
    print('Original backend restored. Frontend, database and secrets retained unchanged.')

def verify_candidate():
    for name, expected in OLD.items():
        require(not (APP/name).is_symlink() and sha(APP/name)==expected, 'Production drift detected: '+name)
    for name, expected in NEW.items():
        require(sha(STAGE/'files'/name)==expected, 'Staged source checksum mismatch: '+name)
    process(); health()
    print('Source and health preflight passed. No service or database changes made.')

def update():
    with operation_lock(): _update()

def rollback():
    with operation_lock(): _rollback()

if __name__ == '__main__':
    if not (len(sys.argv)==2 and sys.argv[1]=='verify') and not (len(sys.argv)==3 and sys.argv[2]=='--execute' and sys.argv[1] in ('update','rollback')):
        raise SystemExit('REVIEW ONLY. After separate authorization: backend-update.py update|rollback --execute')
    os.umask(0o077)
    load_configuration()
    try:
        {'verify':verify_candidate,'update':update,'rollback':rollback}[sys.argv[1]]()
    except KeyboardInterrupt:
        raise SystemExit(130)
