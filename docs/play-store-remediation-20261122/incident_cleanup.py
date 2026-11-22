#!/usr/bin/env python3
"""Targeted cleanup of the four incident-created test profiles (22 Nov 2026). FOR REVIEW; NOT YET AUTHORIZED.

Run as ec2-user from EC2 Instance Connect, pasting this file through stdin (numbers are arguments, never in Git):
    python3 - plan     <n1> <n2> <n3> <n4> <<'PYEOF' ... PYEOF
    python3 - apply    <n1> <n2> <n3> <n4> --expect <fp1,fp2,fp3,fp4> --confirm DELETE-4-INCIDENT-PROFILES <<'PYEOF' ... PYEOF
    python3 - rollback <n1> <n2> <n3> <n4> --backup-dir <dir> --confirm RESTORE-4-INCIDENT-PROFILES <<'PYEOF' ... PYEOF

plan      Read-only. Confirms the live DB and schema, the preserved backup, each row's eligibility and linked records,
          and prints a content fingerprint per row for review. Changes nothing.
apply     Re-runs every plan check, then in ONE transaction: re-reads the four rows, requires each fingerprint to
          equal the reviewed one, re-scans every other table/column for linked records, writes a mode-0600 backup
          of the exact rows (fsynced and read back) into a NEW directory, deletes exactly those four rows (each
          DELETE matches every column), verifies, and commits. Any difference aborts with ROLLBACK: nothing deleted.
rollback  Re-inserts exactly the saved rows from a cleanup backup directory, in one transaction. It never overwrites:
          if any of the four numbers has a row again, it aborts.

Never: restores or copies the whole database, touches any other row, writes inside the preserved backup
LIVE-BEFORE-REMEDIATION-20261122T145011Z, restarts or deploys anything, prints names, emails, raw numbers,
environment values or tokens.
"""
import glob, hashlib, json, os, re, sqlite3, subprocess, sys, time
from datetime import datetime, timezone
from pathlib import Path

APP = Path('/home/ec2-user/paisa-mart-new/backend')
DATA = Path('/home/ec2-user/paisa-mart-data')
BACKUPS = DATA / 'backups'
PRESERVED_NAME = 'LIVE-BEFORE-REMEDIATION-20261122T145011Z'
INCIDENT_START, INCIDENT_END = '2026-11-22T05:20:00', '2026-11-22T11:45:00'
COLUMNS = ['phoneNumber', 'name', 'email', 'occupation', 'qualification', 'annualIncome', 'pincode', 'panCard',
           'cibilScore', 'dateOfBirth', 'kycStatus', 'createdAt', 'updatedAt']
CONFIRM = {'apply': 'DELETE-4-INCIDENT-PROFILES', 'rollback': 'RESTORE-4-INCIDENT-PROFILES'}

def out(*a): print(*a, flush=True)
class Abort(Exception): pass
def require(ok, msg):
    if not ok: raise Abort(msg)
def mask(n): return n[:2] + 'XXXXXX' + n[-2:]
def now_utc(): return datetime.now(timezone.utc)
def utc(ts): return datetime.fromtimestamp(ts, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()
def fingerprint(row):
    """Short content fingerprint over ALL 13 columns (any change to any column changes it). Not reversible."""
    canon = json.dumps([row.get(c) for c in COLUMNS], ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(('paisa-mart-incident-20261122|' + canon).encode()).hexdigest()[:20]
def reserved_email(row): return bool(re.search(r'@example\.(com|test|org|net)$', (row.get('email') or '').strip(), re.I))
def in_window(ts): return bool(ts) and INCIDENT_START <= ts[:19] <= INCIDENT_END

def parse_args(argv):
    require(argv and argv[0] in ('plan', 'apply', 'rollback'), 'first argument must be plan, apply or rollback')
    mode, rest, opts = argv[0], argv[1:], {}
    nums = []
    while rest:
        a = rest.pop(0)
        if a.startswith('--'):
            require(rest, 'missing value for ' + a); opts[a[2:]] = rest.pop(0)
        else: nums.append(a)
    require(len(nums) == 4 and len(set(nums)) == 4 and all(re.fullmatch(r'[6-9]\d{9}', n) for n in nums),
            'pass exactly four distinct 10-digit numbers')
    if mode != 'plan': require(opts.get('confirm') == CONFIRM[mode], 'confirmation phrase missing or wrong')
    if mode == 'apply':
        fps = (opts.get('expect') or '').split(',')
        require(len(fps) == 4 and all(re.fullmatch(r'[0-9a-f]{20}', f) for f in fps), '--expect needs 4 fingerprints from plan, in number order')
        opts['expect'] = dict(zip(nums, fps))
    if mode == 'rollback': require(opts.get('backup-dir'), '--backup-dir is required')
    return mode, nums, opts

def live_database():
    """Same confirmation as incident_readonly_check.py: the DB the live process really uses and holds open."""
    rows = [p for p in json.loads(subprocess.check_output(['pm2', 'jlist'], text=True)) if p.get('name') == 'paisa-mart']
    require(len(rows) == 1, 'expected exactly one paisa-mart process')
    proc, env = rows[0], rows[0]['pm2_env']
    require(Path(env.get('pm_cwd', '')).resolve() == APP.resolve(), 'unexpected backend working directory')
    probe = ("const p=require('path');console.log(JSON.stringify({profiles:p.resolve(process.env.USER_DB??process.env.TXN_DB??'payments.db'),"
             "leads:p.resolve(process.env.LEADS_DB??process.env.TXN_DB??'payments.db')}))")
    penv = os.environ.copy(); penv.update({k: v for k, v in env.items() if isinstance(v, str)})
    r = json.loads(subprocess.check_output([env['pm_exec_path'], '-e', probe], cwd=APP, env=penv, text=True).strip().splitlines()[-1])
    held = set()
    for fd in os.listdir('/proc/%d/fd' % proc['pid']):
        try: held.add(os.readlink('/proc/%d/fd/%s' % (proc['pid'], fd)))
        except OSError: pass
    require(r['profiles'] in held, 'profile DB is not held open by the live process')
    require(r['profiles'] == r['leads'], 'profiles and leads are in different databases; one transaction cannot cover both, stop for review')
    out('live process pm_id %s status %s | DB %s' % (proc.get('pm_id'), env.get('status'), r['profiles']))
    return r['profiles']

def connect(path, readonly=False, immutable=False):
    if readonly:
        con = sqlite3.connect(Path(path).resolve().as_uri() + '?mode=ro' + ('&immutable=1' if immutable else ''), uri=True)
        con.execute('PRAGMA query_only=ON')
    else:
        con = sqlite3.connect(path, isolation_level=None, timeout=5)
    con.row_factory = sqlite3.Row
    return con

def check_schema(con):
    cols = [r['name'] for r in con.execute('PRAGMA table_info(user_profiles)')]
    require(set(cols) == set(COLUMNS), 'user_profiles columns differ from the reviewed schema')
    pk = [r['name'] for r in con.execute('PRAGMA table_info(user_profiles)') if r['pk']]
    require(pk == ['phoneNumber'], 'unexpected primary key')

def rows_for(con, nums):
    found = {}
    for n in nums:
        rs = [dict(r) for r in con.execute('SELECT %s FROM user_profiles WHERE phoneNumber=? OR instr(phoneNumber, ?) > 0' % ','.join(COLUMNS), (n, n))]
        found[n] = rs
    return found

def linked_hits(con, nums):
    hits = []
    for t in [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name<>'user_profiles' AND name NOT LIKE 'sqlite_%'")]:
        for c in [r[1] for r in con.execute('PRAGMA table_info("%s")' % t)]:
            for n in nums:
                k = con.execute('SELECT count(*) FROM "%s" WHERE instr(CAST("%s" AS TEXT), ?) > 0' % (t, c), (n,)).fetchone()[0]
                if k: hits.append('%s.%s %s=%d' % (t, c, mask(n), k))
    return hits

def eligible(found, nums, expect=None):
    """Each number: exactly one exact-match row, created in the window, reserved test email, KYC not started."""
    for n in nums:
        rs = found[n]
        require(len(rs) == 1 and rs[0]['phoneNumber'] == n, '%s: expected exactly one exact row, found %d' % (mask(n), len(rs)))
        r = rs[0]
        require(in_window(r['createdAt']), '%s: createdAt is outside the incident window' % mask(n))
        require(reserved_email(r), '%s: email is not a reserved test domain' % mask(n))
        require(r['kycStatus'] == 'not_started', '%s: kycStatus is not not_started' % mask(n))
        if expect: require(fingerprint(r) == expect[n], '%s: row changed since the reviewed plan (fingerprint differs)' % mask(n))

def preserved_backup(nums):
    """Locate the owner's verified backup by name. It is only read, never written."""
    found = set()
    for depth in range(1, 5):  # fixed-depth globs under the home directory: fast, no node_modules crawl
        found.update(glob.glob('/home/ec2-user/' + '*/' * (depth - 1) + PRESERVED_NAME + '*'))
    matches = sorted(p for p in found if not any(q.name.startswith(PRESERVED_NAME) for q in Path(p).parents))
    require(len(matches) == 1, 'preserved backup %s: expected exactly one match, found %d' % (PRESERVED_NAME, len(matches)))
    root = Path(matches[0])
    files = [root] if root.is_file() else sorted(p for p in root.rglob('*') if p.is_file())
    state = {str(p): (p.stat().st_size, p.stat().st_mtime_ns, sha256_file(p)) for p in files}
    out('preserved backup:', root, '| files:', len(files), '| bytes:', sum(v[0] for v in state.values()))
    dbs = [p for p in files if re.search(r'\.(db|sqlite)$', p.name)]
    held = {}  # number -> set of fingerprints held by the preserved backup's databases
    for p in dbs:
        con = connect(p, readonly=True, immutable=True)
        try:
            require(con.execute('PRAGMA integrity_check').fetchone()[0] == 'ok', 'preserved backup %s failed integrity_check' % p.name)
            if con.execute("SELECT 1 FROM sqlite_master WHERE name='user_profiles'").fetchone():
                present = rows_for(con, nums)
                for n in nums:
                    if len(present[n]) == 1: held.setdefault(n, set()).add(fingerprint(present[n][0]))
                out('  %s: integrity ok | rows held:' % p.name, ', '.join('%s=%s' % (mask(n), fingerprint(present[n][0]) if len(present[n]) == 1 else len(present[n])) for n in nums))
        finally: con.close()
    return root, state, held

def preserved_unchanged(state):
    for p, (size, mtime, digest) in state.items():
        st = os.stat(p)
        require((st.st_size, st.st_mtime_ns) == (size, mtime) and sha256_file(p) == digest, 'preserved backup changed: ' + p)

def write_private(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data); f.flush(); os.fsync(f.fileno())

def plan(nums, db, expect=None):
    con = connect(db, readonly=True)
    check_schema(con)
    found = rows_for(con, nums)
    for n in nums:
        for r in found[n]:
            out('%s | fingerprint %s | createdAt %s | updatedAt %s | kycStatus %s | in window %s | reserved email %s' % (
                mask(n), fingerprint(r), r['createdAt'], r['updatedAt'], r['kycStatus'], in_window(r['createdAt']), reserved_email(r)))
        if not found[n]: out(mask(n), 'NO ROW')
    hits = linked_hits(con, nums)
    out('linked records:', '; '.join(hits) or 'NONE')
    eligible(found, nums, expect); require(not hits, 'linked records exist')
    out('PLAN OK. To apply, pass in this number order: --expect ' + ','.join(fingerprint(found[n][0]) for n in nums))
    con.close()

def apply(nums, db, expect, preserved_state, preserved_root):
    stamp = now_utc().strftime('%Y%m%dT%H%M%SZ')
    target = BACKUPS / ('incident-cleanup-%s-%d' % (stamp, os.getpid()))
    require(not str(target.resolve()).startswith(str(preserved_root.resolve())), 'refusing to write inside the preserved backup')
    os.umask(0o077)
    os.mkdir(target, 0o700)
    pfd = os.open(BACKUPS, os.O_RDONLY); os.fsync(pfd); os.close(pfd)  # make the new directory entry itself durable
    con = connect(db)
    t0 = time.monotonic()
    # IMMEDIATE takes the write lock first: no other writer can commit while the rows are re-checked and deleted
    # (measured ~4 ms locally; WAL readers are unaffected, a backend write in that window waits or gets SQLITE_BUSY).
    con.execute('BEGIN IMMEDIATE')
    try:
        check_schema(con)
        total_before = con.execute('SELECT count(*) FROM user_profiles').fetchone()[0]
        found = rows_for(con, nums)
        eligible(found, nums, expect)
        hits = linked_hits(con, nums)
        require(not hits, 'linked records appeared: ' + '; '.join(hits))
        rows = [found[n][0] for n in nums]
        payload = json.dumps({'database': db, 'table': 'user_profiles', 'columns': COLUMNS, 'rows': rows,
                              'fingerprints': {mask(n): expect[n] for n in nums}, 'createdAt': stamp}, ensure_ascii=False, indent=1).encode()
        write_private(target / 'rows.json', payload)
        write_private(target / 'manifest.json', json.dumps({'rows.json': hashlib.sha256(payload).hexdigest(), 'count': 4}).encode())
        dfd = os.open(target, os.O_RDONLY); os.fsync(dfd); os.close(dfd)
        saved = json.loads((target / 'rows.json').read_bytes())
        require(sha256_file(target / 'rows.json') == hashlib.sha256(payload).hexdigest() and
                [fingerprint(r) for r in saved['rows']] == [expect[n] for n in nums], 'row backup failed read-back verification')
        for r in rows:
            cond = ' AND '.join('%s IS ?' % c for c in COLUMNS)
            cur = con.execute('DELETE FROM user_profiles WHERE ' + cond, [r[c] for c in COLUMNS])
            require(cur.rowcount == 1, '%s: delete matched %d rows' % (mask(r['phoneNumber']), cur.rowcount))
        require(all(not v for v in rows_for(con, nums).values()), 'rows still present after delete')
        require(con.execute('SELECT count(*) FROM user_profiles').fetchone()[0] == total_before - 4, 'unexpected row count after delete')
        con.execute('COMMIT')
    except BaseException:
        try: con.execute('ROLLBACK')
        except sqlite3.Error: pass
        # Nothing was deleted, so the row copy is not needed: remove only the files this run created.
        for name in ('rows.json', 'manifest.json'):
            try: (target / name).unlink()
            except FileNotFoundError: pass
        target.rmdir()
        out('ABORTED: transaction rolled back, nothing deleted; this run\'s backup directory removed.')
        raise
    finally:
        con.close()
    out('COMMITTED in %.0f ms: deleted exactly 4 profiles. Row backup: %s (0600). Total profiles %d -> %d' % (
        (time.monotonic() - t0) * 1000, target, total_before, total_before - 4))
    ro = connect(db, readonly=True)
    require(all(not v for v in rows_for(ro, nums).values()), 'post-check: rows visible again')
    ro.close()
    preserved_unchanged(preserved_state)
    out('post-checks OK: rows absent; preserved backup unchanged. Rollback: rollback ... --backup-dir', target)

def rollback(nums, db, backup_dir):
    d = Path(backup_dir)
    require(d.resolve().parent == BACKUPS.resolve() and d.name.startswith('incident-cleanup-'), 'backup-dir must be an incident-cleanup-* directory under ' + str(BACKUPS))
    manifest = json.loads((d / 'manifest.json').read_text())
    require(sha256_file(d / 'rows.json') == manifest['rows.json'], 'rows.json checksum mismatch')
    saved = json.loads((d / 'rows.json').read_text())
    require(saved['columns'] == COLUMNS and saved['database'] == db, 'backup is for a different table layout or database')
    rows = saved['rows']
    require(sorted(r['phoneNumber'] for r in rows) == sorted(nums), 'backup rows do not match the four numbers')
    con = connect(db)
    con.execute('BEGIN IMMEDIATE')
    try:
        check_schema(con)
        present = rows_for(con, nums)
        require(all(not v for v in present.values()), 'a row exists again for: ' + ', '.join(mask(n) for n in nums if present[n]) + ' (never overwritten)')
        for r in rows:
            con.execute('INSERT INTO user_profiles (%s) VALUES (%s)' % (','.join(COLUMNS), ','.join('?' * len(COLUMNS))), [r[c] for c in COLUMNS])
        back = rows_for(con, nums)
        require([fingerprint(back[r['phoneNumber']][0]) for r in rows] == [fingerprint(r) for r in rows], 'restored rows differ from backup')
        con.execute('COMMIT')
    except BaseException:
        try: con.execute('ROLLBACK')
        except sqlite3.Error: pass
        out('ABORTED: nothing restored.'); raise
    finally: con.close()
    out('RESTORED exactly 4 rows from', d, '| fingerprints:', ', '.join('%s=%s' % (mask(r['phoneNumber']), fingerprint(r)) for r in rows))

def main():
    try:
        mode, nums, opts = parse_args(sys.argv[1:])
        out('=== incident cleanup: %s | %s | %s ===' % (mode, ', '.join(mask(n) for n in nums), now_utc().strftime('%Y-%m-%dT%H:%M:%SZ')))
        db = live_database()
        if mode == 'rollback': rollback(nums, db, opts['backup-dir']); return
        root, state, held = preserved_backup(nums)
        if mode == 'plan':
            plan(nums, db); preserved_unchanged(state); return
        for n in nums:  # the owner's full backup must hold exactly the rows about to be deleted
            require(opts['expect'][n] in held.get(n, set()), '%s: the preserved backup does not hold this exact row' % mask(n))
        plan(nums, db, opts['expect'])  # pre-check outside the transaction; repeated inside it
        apply(nums, db, opts['expect'], state, root)
    except Abort as e:
        out('STOP:', e); sys.exit(2)
    except sqlite3.OperationalError as e:
        out('STOP: database busy or changed during the transaction (%s); nothing was changed. Retry later.' % e); sys.exit(3)

main()
