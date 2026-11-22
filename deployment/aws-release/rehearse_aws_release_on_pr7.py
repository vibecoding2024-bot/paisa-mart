"""Local rehearsal of an AWS release candidate on the DEPLOYED PR #7 baseline, using its own packaged backend-update.py.
Never contacts EC2.
1. Rebuild the PR #7 live backend tree from deployed artifacts (PR #7 installed files, October CRLF Personal files,
   git 595e521 for the rest) and require every expected_baseline hash.
2. Drift: one changed live file must be refused by the packaged check.
3. Migration: seed a PR #7 SQLite DB with the PR #7 code, then run the packaged MIGRATION with the
   candidate files in an isolated copy; require integrity_check ok and unchanged row counts.
4. Install/rollback: install staged files with the packaged atomic writer, verify NEW, restore from a
   verified backup with the packaged restore_files, verify every OLD hash.
Usage: python -B rehearse_aws_release_on_pr7.py <release-worktree> <upload-dir> <bun.exe>
"""
import hashlib, importlib.util, json, os, shutil, sqlite3, subprocess, sys, tarfile, tempfile
from contextlib import closing
from pathlib import Path

SOURCE, UPLOAD, BUN = (Path(a).resolve() for a in sys.argv[1:4])
REPO = SOURCE.parent
PR7 = REPO/'release/pr7-on-pr6-595e5212-20261121/upload/20261121-595e5212-on-pr6-dashboard'
PERSONAL = REPO/'release/pl4/backend-review/personal-loan-backend.tar.gz'
results = []
def sha(b): return hashlib.sha256(b).hexdigest()
def ok(label, cond):
    if not cond: raise SystemExit('FAIL ' + label)
    results.append(label); print('PASS ' + label)

spec = importlib.util.spec_from_file_location('backend_update', UPLOAD/'backend/backend-update.py')
bu = importlib.util.module_from_spec(spec); spec.loader.exec_module(bu)
info = json.loads((UPLOAD/'backend/comparison.json').read_text())
OLD, NEW = info['expected_baseline'], info['install_lf_hashes']
bu.OLD, bu.NEW, bu.STAGE = OLD, NEW, UPLOAD/'backend'

def build_pr7_tree(app):
    pr7 = json.loads((PR7/'backend/comparison.json').read_text())
    with tarfile.open(PERSONAL) as t:
        personal = {m.name.removeprefix('backend/'): t.extractfile(m).read() for m in t.getmembers() if m.isfile()}
    for name, expected in OLD.items():
        if expected == 'MISSING': continue
        if name in pr7['install_lf_hashes']: data = (PR7/'backend/files'/name).read_bytes()
        elif name in personal: data = personal[name]
        else: data = subprocess.check_output(['git', '-C', str(SOURCE), 'show', '595e521:backend/' + name])
        target = app/name; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)

with tempfile.TemporaryDirectory(prefix='aws-on-pr7-rehearsal-') as tmp:
    tmp = Path(tmp); app = tmp/'app'; app.mkdir()
    build_pr7_tree(app)
    bu.APP = app
    ok('rebuilt PR #7 live tree matches every expected_baseline hash (%d files)' % len(OLD),
       all(bu.sha(app/n) == h for n, h in OLD.items()))
    ok('new files are absent on the PR #7 baseline', all(not (app/n).exists() for n, h in OLD.items() if h == 'MISSING'))
    ok('staged files match install hashes', all(bu.sha(UPLOAD/'backend/files'/n) == h for n, h in NEW.items()))
    ok('Personal files are preserved, not redeployed', not set(info['personal_preserved_files']) & set(NEW))
    # Drift refusal, using the packaged verify loop's exact condition.
    probe = app/'src/routes/auth.ts'; original = probe.read_bytes(); probe.write_bytes(original + b'\n// drift\n')
    drift = [n for n, h in OLD.items() if bu.sha(app/n) != h]
    ok('a drifted live file is detected and would be refused', drift == ['src/routes/auth.ts'])
    probe.write_bytes(original)

    # Migration rehearsal: seed with PR #7 code, migrate with candidate code, isolated copies only.
    nm = SOURCE/'backend/node_modules'
    baseroot = tmp/'pr6'; shutil.copytree(app/'src', baseroot/'src'); shutil.copy2(app/'package.json', baseroot/'package.json')
    shutil.copytree(nm, baseroot/'node_modules', symlinks=True)
    db = tmp/'payments.db'
    env = {**os.environ, 'LEADS_DB': str(db), 'TXN_DB': str(db)}
    for k in ['DATABASE_URL', 'POSTGRES_URL', 'HOME_LOANS_DATABASE_URL', 'PERSONAL_LOANS_DATABASE_URL', 'BUSINESS_LOANS_DATABASE_URL',
              'VEHICLE_LOANS_DATABASE_URL', 'LIFE_INSURANCE_DATABASE_URL']: env.pop(k, None)
    seed = ("const c={phoneNumber:'9000000000',fullName:'Seed',cibil:'750',dateOfBirth:'01/01/1990',city:'X',state:'Y',monthlyIncome:'1',loanAmountRequired:'100000',existingEmi:'0'};"
            + bu.MIGRATION +
            "await (await import('./src/lib/business-loan-lead-store.ts')).saveBusinessLoanLead({...c,businessType:'Retail',loanPurpose:'Expansion'});"
            "await (await import('./src/lib/vehicle-loan-lead-store.ts')).saveVehicleLoanLead({...c,occupation:'Salaried',vehicleType:'Car',vehicleCondition:'New Vehicle'});"
            "await (await import('./src/lib/service-application-store.ts')).saveServiceApplication('bank-accounts',{...c,provider:'B',productName:'S'},crypto.randomUUID());"
            "await (await import('./src/lib/home-loan-lead-store.ts')).saveHomeLoanLead({...c,loanType:'House Purchase'});"
            "const s=await import('./src/lib/admin-operations.ts');await s.saveStaff({name:'ops',email:'ops@example.test',password:'Seed-password-2026',role:'ops',active:true},{id:'admin',email:'a@example.test',role:'admin'});")
    subprocess.run([str(BUN), '-e', seed], cwd=baseroot, env=env, check=True, stdout=subprocess.DEVNULL)
    with closing(sqlite3.connect(db)) as before:
        tables = [r[0] for r in before.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        counts = {t: before.execute('SELECT count(*) FROM "%s"' % t).fetchone()[0] for t in tables}
    ok('PR #7 database seeded with existing rows (%d tables, %d rows)' % (len(counts), sum(counts.values())), sum(counts.values()) >= 5)
    cand = tmp/'candidate'; shutil.copytree(baseroot/'src', cand/'src')
    for n in NEW:
        (cand/n).parent.mkdir(parents=True, exist_ok=True); shutil.copy2(UPLOAD/'backend/files'/n, cand/n)
    shutil.copy2(baseroot/'package.json', cand/'package.json'); shutil.copytree(nm, cand/'node_modules', symlinks=True)
    rehearsal_db = tmp/'rehearsal.db'
    with closing(sqlite3.connect(db)) as src, closing(sqlite3.connect(rehearsal_db)) as dst: src.backup(dst)
    renv = {**env, 'LEADS_DB': str(rehearsal_db), 'TXN_DB': str(rehearsal_db)}
    subprocess.run([str(BUN), '-e', bu.MIGRATION], cwd=cand, env=renv, check=True, stdout=subprocess.DEVNULL)
    with closing(sqlite3.connect(rehearsal_db)) as after:
        ok('candidate migration keeps integrity_check ok', after.execute('PRAGMA integrity_check').fetchall() == [('ok',)])
        ok('candidate migration preserves every existing row count',
           all(after.execute('SELECT count(*) FROM "%s"' % t).fetchone()[0] == n for t, n in counts.items()))
    # Candidate code serves the PR #7 data through the new endpoint (import check on migrated copy).
    check = ("const s=await import('./src/lib/admin-operations.ts');const r=await s.customerApplications('9000000000');"
             "if(r.length!==4||r.some(x=>x.stage!=='new'))process.exit(3);")
    subprocess.run([str(BUN), '-e', check], cwd=cand, env=renv, check=True)
    ok('candidate code lists the 4 pre-existing PR #7 submissions for their customer', True)
    with closing(sqlite3.connect(db)) as orig:
        ok('original seeded database untouched by rehearsal',
           all(orig.execute('SELECT count(*) FROM "%s"' % t).fetchone()[0] == n for t, n in counts.items()))

    # Install then rollback with the packaged writers.
    backup = tmp/'backup'; shutil.copytree(app/'src', backup/'src'); shutil.copy2(app/'package.json', backup/'package.json')
    ok('backup copy matches every existing OLD hash', all(bu.sha(backup/n) == h for n, h in OLD.items() if h != 'MISSING'))
    restore = {n: (None if OLD[n] == 'MISSING' else ((backup/n).read_bytes(), 0o644)) for n in NEW}
    for n in NEW:
        target = app/n; target.parent.mkdir(parents=True, exist_ok=True)
        bu.atomic_write(target, (UPLOAD/'backend/files'/n).read_bytes(), 0o644)
    ok('install writes exactly the %d candidate hashes' % len(NEW), all(bu.sha(app/n) == h for n, h in NEW.items()))
    ok('all non-candidate live files unchanged after install', all(bu.sha(app/n) == h for n, h in OLD.items() if n not in NEW))
    bu.restore_files(restore)  # packaged: validates targets, restores, verifies every OLD hash
    ok('packaged rollback restores every PR #7 hash and removes new files', all(bu.sha(app/n) == h for n, h in OLD.items()))

(UPLOAD.parent.parent/'rehearsal-results.json').write_text(json.dumps({'passed': results, 'count': len(results)}, indent=2) + '\n')
print('ALL %d CHECKS PASSED' % len(results))
