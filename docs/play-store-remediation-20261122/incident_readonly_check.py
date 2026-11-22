#!/usr/bin/env python3
"""READ-ONLY production check for the 22 Nov 2026 test-profile incident.

Usage (EC2 Instance Connect, as ec2-user; numbers are passed as arguments and never stored in Git):
    python3 - <10-digit> <10-digit> <10-digit> <10-digit> <<'PYEOF'
    ...this file...
    PYEOF

Guarantees:
- No writes. It creates no files, calls no API, makes no PM2 action (only `pm2 jlist`) and does no restart.
- SQLite is opened with mode=ro and PRAGMA query_only=ON. Backups are also opened immutable.
- It never prints environment values, secrets, tokens, names, emails or raw phone numbers. Output is
  masked numbers, timestamps, booleans, counts, table and column names, and same/different flags.
"""
import glob, gzip, hashlib, json, os, re, sqlite3, subprocess, sys, urllib.request
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

APP = Path('/home/ec2-user/paisa-mart-new/backend')
EXPECTED_DB = '/home/ec2-user/paisa-mart-data/payments.db'
BACKUPS = Path('/home/ec2-user/paisa-mart-data/backups')
INCIDENT_START = '2026-11-22T05:20:00'   # first affected test build installed 05:22:44Z
INCIDENT_END = '2026-11-22T11:45:00'     # fixed build (local only) from 11:41:52Z
FIELDS = ['name', 'email', 'occupation', 'qualification', 'annualIncome', 'pincode',
          'panCard', 'cibilScore', 'dateOfBirth']
EXPECTED_COLUMNS = set(FIELDS + ['phoneNumber', 'kycStatus', 'createdAt', 'updatedAt'])

NUMS = sys.argv[1:]
if len(NUMS) != 4 or not all(re.fullmatch(r'[6-9]\d{9}', n) for n in NUMS):
    sys.exit('STOP: pass exactly the four 10-digit numbers as arguments.')

def mask(n): return n[:2] + 'XXXXXX' + n[-2:]
ANY_PHONE = re.compile(r'(?<!\d)(?:\+?91)?([6-9]\d{9})(?!\d)')
def scrub(text): return ANY_PHONE.sub(lambda m: mask(m.group(1)), text)
def out(*a): print(*a, flush=True)
def stop(msg): out('STOP:', msg); sys.exit(2)
def utc(ts): return datetime.fromtimestamp(ts, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def in_window(ts): return bool(ts) and INCIDENT_START <= ts[:19] <= INCIDENT_END
def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()
def open_ro(path, immutable=False):
    uri = Path(path).resolve().as_uri() + '?mode=ro' + ('&immutable=1' if immutable else '')
    con = sqlite3.connect(uri, uri=True)
    con.execute('PRAGMA query_only=ON')
    return con

out('=== 0. Target ===')
out('user:', os.environ.get('USER'), '| now:', datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))
try:
    tok = urllib.request.urlopen(urllib.request.Request('http://169.254.169.254/latest/api/token', method='PUT',
          headers={'X-aws-ec2-metadata-token-ttl-seconds': '60'}), timeout=2).read().decode()
    md = lambda p: urllib.request.urlopen(urllib.request.Request('http://169.254.169.254/latest/meta-data/' + p,
          headers={'X-aws-ec2-metadata-token': tok}), timeout=2).read().decode()
    out('instance:', md('instance-id'), '| region:', md('placement/region'), '| public-ip:', md('public-ipv4'))
except Exception as e:
    out('instance metadata unavailable:', type(e).__name__)
out('numbers:', ', '.join(mask(n) for n in NUMS))

out('\n=== 1. Live process (pm2 jlist, read-only; env never printed) ===')
rows = [p for p in json.loads(subprocess.check_output(['pm2', 'jlist'], text=True)) if p.get('name') == 'paisa-mart']
if len(rows) != 1: stop('expected exactly one paisa-mart process, found %d' % len(rows))
proc = rows[0]; env = proc['pm2_env']
out('pm_id:', proc.get('pm_id'), '| pid:', proc.get('pid'), '| status:', env.get('status'),
    '| cwd:', env.get('pm_cwd'), '| exec:', Path(env.get('pm_exec_path', '')).name, '| args:', env.get('args'))
out('started:', utc(env['pm_uptime'] / 1000) if env.get('pm_uptime') else '?', '| restarts:', env.get('restart_time'),
    '| log time prefix:', bool(env.get('log_date_format') or env.get('time')))
if Path(env.get('pm_cwd', '')).resolve() != APP.resolve(): stop('unexpected backend working directory')

probe = ("const p=require('path');const r=k=>process.env[k]?p.resolve(process.env[k]):null;"
         "console.log(JSON.stringify({USER_DB:r('USER_DB'),TXN_DB:r('TXN_DB'),LEADS_DB:r('LEADS_DB'),"
         "profiles:p.resolve(process.env.USER_DB??process.env.TXN_DB??'payments.db'),"
         "leads:p.resolve(process.env.LEADS_DB??process.env.TXN_DB??'payments.db'),"
         "postgresVarsSet:['PERSONAL_LOANS_DATABASE_URL','BUSINESS_LOANS_DATABASE_URL','HOME_LOANS_DATABASE_URL',"
         "'LIFE_INSURANCE_DATABASE_URL','VEHICLE_LOANS_DATABASE_URL','DATABASE_URL','POSTGRES_URL'].filter(k=>!!process.env[k])}))")
penv = os.environ.copy(); penv.update({k: v for k, v in env.items() if isinstance(v, str)})
resolved = json.loads(subprocess.check_output([env['pm_exec_path'], '-e', probe], cwd=APP, env=penv, text=True).strip().splitlines()[-1])
out('resolved DB paths (names only):', json.dumps(resolved))
open_files = set()
try:
    for fd in os.listdir('/proc/%d/fd' % proc['pid']):
        try:
            t = os.readlink('/proc/%d/fd/%s' % (proc['pid'], fd))
            if re.search(r'\.(db|sqlite)(-wal|-shm|-journal)?$', t): open_files.add(t)
        except OSError: pass
except OSError as e:
    out('cannot list open files:', type(e).__name__)
out('DB files held open by the live process:', sorted(open_files) or 'none visible')
PROFILE_DB, LEADS_DB = resolved['profiles'], resolved['leads']
if resolved['postgresVarsSet']: out('NOTE: Postgres URL variables set (names above); those stores are NOT checked here.')
if open_files and PROFILE_DB not in open_files: stop('profile DB path is not among the files the live process holds open')
if PROFILE_DB != EXPECTED_DB: out('WARNING: profile DB differs from recorded baseline', EXPECTED_DB)
st = os.stat(PROFILE_DB)
out('profile DB:', PROFILE_DB, '| size:', st.st_size, '| mtime:', utc(st.st_mtime))

out('\n=== 2. Schema (read-only) ===')
live = open_ro(PROFILE_DB)
out('journal_mode:', live.execute('PRAGMA journal_mode').fetchone()[0], '| quick_check:', live.execute('PRAGMA quick_check').fetchone()[0])
tables = [r[0] for r in live.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
out('tables:', ', '.join('%s(%d)' % (t, live.execute('SELECT count(*) FROM "%s"' % t).fetchone()[0]) for t in tables))
cols = {r[1] for r in live.execute('PRAGMA table_info(user_profiles)')}
if cols != EXPECTED_COLUMNS: stop('user_profiles columns differ from the reviewed schema: %s' % sorted(cols ^ EXPECTED_COLUMNS))
out('user_profiles schema matches the reviewed store (13 columns, phoneNumber primary key)')

def profile(con, n):
    con.row_factory = sqlite3.Row
    rows = con.execute('SELECT * FROM user_profiles WHERE phoneNumber=? OR instr(phoneNumber, ?) > 0', (n, n)).fetchall()
    con.row_factory = None
    return [dict(r) for r in rows]
def reserved_email(r): return bool(re.search(r'@example\.(com|test|org|net)$', (r.get('email') or '').strip(), re.I))

out('\n=== 3. Live profiles ===')
LIVE = {}
for n in NUMS:
    rs = profile(live, n); LIVE[n] = rs[0] if rs else None
    if not rs: out(mask(n), 'NO ROW'); continue
    if len(rs) > 1: out(mask(n), 'WARNING: %d rows match' % len(rs))
    r = rs[0]
    out(mask(n), '| stored as exact 10 digits:', r['phoneNumber'] == n, '| createdAt:', r['createdAt'], '| updatedAt:', r['updatedAt'],
        '| kycStatus:', r['kycStatus'], '| createdAt in incident window:', in_window(r['createdAt']),
        '| updatedAt in window:', in_window(r['updatedAt']), '| reserved test email domain:', reserved_email(r),
        '| non-empty fields:', ','.join(f for f in FIELDS if r.get(f) not in (None, '')))
out('all profiles: created in window = %d, updated in window = %d' % (
    live.execute('SELECT count(*) FROM user_profiles WHERE substr(createdAt,1,19) BETWEEN ? AND ?', (INCIDENT_START, INCIDENT_END)).fetchone()[0],
    live.execute('SELECT count(*) FROM user_profiles WHERE substr(updatedAt,1,19) BETWEEN ? AND ?', (INCIDENT_START, INCIDENT_END)).fetchone()[0]))

out('\n=== 4. Backups (read-only, immutable) ===')
candidates = []
for db in sorted(set(glob.glob(str(BACKUPS / '**' / 'payments.db'), recursive=True))):
    p = Path(db); meta = {}
    for m in (p.parent / 'backup-ready.json', p.parent.parent / 'backup-ready.json'):
        if m.exists():
            j = json.loads(m.read_text())
            meta = {'version': j.get('version'), 'manifest_ok': (j.get('backup_hashes') or {}).get('payments.db') == sha256(db),
                    'meta_mtime': utc(m.stat().st_mtime)}
            break
    mt = utc(p.stat().st_mtime)
    out(str(p.relative_to(BACKUPS)), '| mtime:', mt, '| size:', p.stat().st_size, '|', meta or 'no backup-ready.json')
    # Pre-incident only if both the database file and its backup metadata predate the first affected request.
    if mt < INCIDENT_START + 'Z' and (not meta or meta['meta_mtime'] < INCIDENT_START + 'Z'): candidates.append((mt, p, meta))
verified = [c for c in candidates if c[2].get('manifest_ok')]
if not verified: out('NO checksum-verified pre-incident backup found; prior state will be INCONCLUSIVE.')
base = max(verified)[1] if verified else None
BASE = {}
if base:
    with closing(open_ro(base, immutable=True)) as b:
        out('baseline:', base.relative_to(BACKUPS), '| integrity_check:', b.execute('PRAGMA integrity_check').fetchone()[0])
        has = b.execute("SELECT 1 FROM sqlite_master WHERE name='user_profiles'").fetchone()
        for n in NUMS:
            rs = profile(b, n) if has else []; BASE[n] = rs[0] if rs else None
            out(mask(n), 'in baseline:', bool(rs), *(['| createdAt:', rs[0]['createdAt'], '| updatedAt:', rs[0]['updatedAt'], '| kycStatus:', rs[0]['kycStatus']] if rs else []))
    for mt, p, meta in sorted(candidates):
        if p == base: continue
        with closing(open_ro(p, immutable=True)) as b:
            if not b.execute("SELECT 1 FROM sqlite_master WHERE name='user_profiles'").fetchone():
                out('older', p.relative_to(BACKUPS), 'no user_profiles table'); continue
            out('older', p.relative_to(BACKUPS), '| present:', ','.join(mask(n) for n in NUMS if profile(b, n)) or 'none')

out('\n=== 5. Overwritten-field comparison (live vs baseline; values never shown) ===')
for n in NUMS:
    l, b = LIVE[n], BASE.get(n)
    if not l: out(mask(n), 'no live row'); continue
    if not base: out(mask(n), 'INCONCLUSIVE: no verified baseline'); continue
    if not b: out(mask(n), 'not in baseline: every field was first written after the baseline'); continue
    out(mask(n), ' '.join('%s=%s' % (f, 'same' if (l.get(f) or '') == (b.get(f) or '') else 'DIFFERENT') for f in FIELDS),
        '| createdAt preserved:', l['createdAt'] == b['createdAt'], '| kycStatus same:', l['kycStatus'] == b['kycStatus'],
        '| baseline email reserved test domain:', reserved_email(b))

def linked(con, label):
    n_cols = 0; hits = []
    for t in [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table' AND name<>'user_profiles' AND name NOT LIKE 'sqlite_%'")]:
        for c in [r[1] for r in con.execute('PRAGMA table_info("%s")' % t)]:
            n_cols += 1
            for n in NUMS:
                k = con.execute('SELECT count(*) FROM "%s" WHERE instr(CAST("%s" AS TEXT), ?) > 0' % (t, c), (n,)).fetchone()[0]
                if k: hits.append('%s.%s %s=%d' % (t, c, mask(n), k))
    out(label, '| columns scanned:', n_cols, '| substring matches (counts only):', '; '.join(hits) or 'NONE')

out('\n=== 6. Linked records (every table and column except user_profiles; counts only) ===')
with closing(open_ro(LEADS_DB)) as c: linked(c, 'live ' + LEADS_DB)
if PROFILE_DB != LEADS_DB: linked(live, 'live ' + PROFILE_DB)
if base:
    with closing(open_ro(base, immutable=True)) as c: linked(c, 'baseline')

out('\n=== 7. Request logs (method, masked path, status only; no query strings, IPs or bodies) ===')
log_paths = {env.get('pm_out_log_path'), env.get('pm_err_log_path')} - {None}
files = sorted({f for lp in log_paths for f in glob.glob(str(Path(lp).parent / 'paisa-mart*'))})
REQ = re.compile(r'(<--|-->)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s+(\S+)(?:\s+(?:\x1b?\[[0-9;]*m)?(\d{3}))?')
shown = 0
for f in files:
    try:
        op = gzip.open if f.endswith('.gz') else open
        with op(f, 'rt', errors='replace') as fh: lines = fh.read().splitlines()
    except OSError as e:
        out(os.path.basename(f), 'unreadable:', type(e).__name__); continue
    stat = os.stat(f)
    posts = sum(1 for x in lines if re.search(r'-->\s+POST\s+/api/users/profile\b', x))
    lists = sum(1 for x in lines if re.search(r'-->\s+GET\s+/api/users/profiles\b', x))
    kycp = sum(1 for x in lines if re.search(r'/api/users/profile/\d+/kyc', x))
    out(os.path.basename(f), '| lines:', len(lines), '| mtime:', utc(stat.st_mtime),
        '| first line has timestamp:', bool(lines and re.match(r'^\d{4}-\d\d-\d\d', lines[0])),
        '| POST /api/users/profile responses (any number):', posts, '| GET /api/users/profiles (list all):', lists,
        '| /kyc PATCH lines:', kycp)
    for i, x in enumerate(lines, 1):
        if not any(n in x for n in NUMS): continue
        if 'VIMOPAY CALLBACK' in x: out('  line', i, 'callback line mentions a number (body not shown)'); continue
        m = REQ.search(x)
        ts = re.match(r'^(\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d)', x)
        if shown < 300:
            out('  line', i, ts.group(1) if ts else '-', *( [m.group(1), m.group(2), scrub(m.group(3).split('?')[0]), m.group(4) or ''] if m else ['non-request line (not shown)']))
        shown += 1
out('matching log lines:', shown, '(first 300 shown)')
for d in ('/var/log/nginx', '/var/log/httpd', '/var/log/caddy'):
    if os.path.isdir(d):
        out(d, 'exists | readable without sudo:', os.access(d, os.R_OK) and all(os.access(x, os.R_OK) for x in glob.glob(d + '/*access*')))

out('\n=== Done. Nothing was written. ===')
