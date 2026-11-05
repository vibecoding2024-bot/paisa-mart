"""Guarded local packaging from approved merged main only. Never contacts EC2."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]
DASH = ROOT/'deployment/dashboard'
sys.path.insert(0, str(DASH))
import prepare_home_loan_release as frontend
from release_validation import files, safe_output, PRODUCTION_API, validate_release
from package_backend import verify_personal, PERSONAL_FILES

BASELINE = '17eac94b39b708ee9e0979de0bda4efd551e6d24'
DASHBOARD_SHA = '5f149daae3a0a7afa0d4e252e3b5cf80860987b3a93221caa24cae4a0a11bb8a'
PERSONAL_SHA = '66435ab4231afe50e44e31905511f0c55181b7619756a506faa7715da8dc9e5b'
RUNTIME = ['backend/src/'+p for p in (
    'index.ts', 'lib/admin-operations.ts', 'lib/business-loan-lead-store.ts',
    'lib/insurance-lead-store.ts', 'lib/service-application-store.ts', 'lib/vehicle-loan-lead-store.ts',
    'routes/admin-operations.ts', 'routes/business-loans.ts', 'routes/life-insurance.ts',
    'routes/service-applications.ts', 'routes/vehicle-loans.ts')]

def git(*args): return subprocess.check_output(['git','-C',str(ROOT),*args])
def sha(data): return hashlib.sha256(data).hexdigest()
def digest(path): return sha(Path(path).read_bytes())

def approved_source(reviewed):
    if git('status','--porcelain').strip(): raise ValueError('Clean source required')
    head = git('rev-parse','HEAD').decode().strip()
    if head != git('rev-parse','origin/main').decode().strip():
        raise ValueError('Final packaging requires fetched merged origin/main; feature branches are refused')
    git('merge-base','--is-ancestor',reviewed,head)
    if git('rev-parse',reviewed+'^{tree}') != git('rev-parse',head+'^{tree}'):
        raise ValueError('Merged tree differs from reviewed tree; review/test new changes first')
    changed = git('diff','--name-only',BASELINE,head,'--','backend/src').decode().splitlines()
    if set(p for p in changed if not p.endswith('.test.ts')) != set(RUNTIME):
        raise ValueError('Unexpected runtime delta; expected exactly 11 reviewed files')
    return head

def baseline_hashes(archive, personal_archive, personal_manifest, commit):
    if digest(archive) != DASHBOARD_SHA or digest(personal_archive) != PERSONAL_SHA:
        raise ValueError('Recorded deployed archive checksum mismatch')
    personal = verify_personal(personal_archive, personal_manifest, commit)
    with tarfile.open(archive) as source:
        info = json.load(source.extractfile('comparison.json'))
        if info['source_commit'] != BASELINE: raise ValueError('Dashboard source mismatch')
        for name, expected in info['install_lf_hashes'].items():
            data = source.extractfile('files/'+name).read()
            if sha(data) != expected or data != git('show',BASELINE+':backend/'+name):
                raise ValueError('Recorded dashboard payload differs from approved source')
    old = {**info['expected_baseline'], **info['install_lf_hashes']}
    for path, expected in personal['runtime_files'].items():
        if old.get(path.removeprefix('backend/')) != expected: raise ValueError('Personal baseline mismatch')
    for path in RUNTIME: old.setdefault(path.removeprefix('backend/'), 'MISSING')
    return old, personal

def package(output, date, reviewed, dashboard_archive, personal_archive, personal_manifest):
    commit = approved_source(reviewed)
    datetime.strptime(date, '%Y%m%d')
    old, personal = baseline_hashes(dashboard_archive, personal_archive, personal_manifest, commit)
    output = safe_output(output)
    if output == ROOT or ROOT in output.parents: raise ValueError('Output must be outside source checkout')
    output.mkdir(parents=True, exist_ok=False)
    raw = output/'raw'
    env = {**os.environ, 'EXPO_NO_DOTENV':'1', 'DARK_MODE':'class',
           'EXPO_PUBLIC_API_URL':PRODUCTION_API, 'EXPO_PUBLIC_BACKEND_URL':PRODUCTION_API,
           'EXPO_PUBLIC_VIBECODE_BACKEND_URL':PRODUCTION_API}
    subprocess.run(['node','node_modules/expo/bin/cli','export','--clear','--max-workers','2',
                    '--platform','web','--output-dir',str(raw)],cwd=ROOT/'mobile',env=env,check=True)
    if approved_source(reviewed) != commit: raise ValueError('Source changed during build')
    raw.with_suffix('.build.json').write_text(json.dumps({'source_commit':commit,'api_url':PRODUCTION_API,
        'files':files(raw),'build_cwd':'mobile','dotenv_loading':False},indent=2)+'\n')
    # Reuse the reviewed frontend shell/validation and its unique date-SHA naming.
    frontend.BACKEND_FILES = RUNTIME
    frontend.package(raw, output, commit, date)
    name = date+'-'+commit[:8]+'-dashboard'
    packaged = output/(name+'-manifest')
    manifest = json.loads((packaged/'manifest.json').read_text())
    stage = output/'backend'; stage.mkdir()
    new = {}
    for path in RUNTIME:
        name_in_backend = path.removeprefix('backend/')
        content = git('show',commit+':'+path)
        target = stage/'files'/name_in_backend
        target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(content)
        new[name_in_backend] = sha(content)
    info = {'source_commit':commit,'release_name':name,'baseline_commit':BASELINE,
        'reviewed_commit':reviewed,'expected_baseline':old,'install_lf_hashes':new,
        'personal_archive_sha256':PERSONAL_SHA,
        'personal_preserved_files':{p.removeprefix('backend/'):h for p,h in personal['runtime_files'].items()},
        'rollback_scope':'Only reviewed runtime code; preserve database, additive schema, history and Personal files'}
    (stage/'comparison.json').write_text(json.dumps(info,indent=2)+'\n')
    shutil.copy2(Path(__file__).with_name('backend-update.py'),stage/'backend-update.py')
    for tool in ['deploy.py','rollback.py','frontend_toolkit.py','stage-frontend.py']:
        shutil.copy2(DASH/tool,stage/tool)
    bundle = output/'requirements-backend.tar.gz'
    with tarfile.open(bundle,'w:gz') as archive:
        for path in sorted(stage.rglob('*')):
            if path.is_file(): archive.add(path,arcname=path.relative_to(stage).as_posix())
    with tarfile.open(bundle) as archive:
        members=archive.getmembers()
        actual={m.name:sha(archive.extractfile(m).read()) for m in members if m.isfile()}
        expected={p.relative_to(stage).as_posix():digest(p) for p in stage.rglob('*') if p.is_file()}
        if len(members)!=len(actual) or actual!=expected: raise ValueError('Backend archive verification failed')
    with tarfile.open(packaged/'approved-web.tar.gz') as archive:
        members=archive.getmembers()
        actual={m.name.removeprefix('./'):sha(archive.extractfile(m).read()) for m in members if m.isfile()}
        if len(members)!=len(actual) or actual!=manifest['files']: raise ValueError('Frontend archive verification failed')
    manifest.update(backend_bundle_sha256=digest(bundle),backend_install_lf_hashes=new,
        backend_baseline_commit=BASELINE,personal_preserved_files=info['personal_preserved_files'],
        reviewed_commit=reviewed,approval_status='Merged-main preparation only; upload and deployment require separate approval')
    (packaged/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    validate_release(output/name,manifest)
    upload = output/'upload'/name; upload.mkdir(parents=True)
    shutil.copytree(stage,upload/'backend')
    for path in [bundle,packaged/'approved-web.tar.gz',packaged/'manifest.json']:
        shutil.copy2(path,upload/path.name)
    checksums = {p.relative_to(upload).as_posix():digest(p) for p in sorted(upload.rglob('*')) if p.is_file()}
    (upload/'SHA256SUMS.txt').write_bytes(''.join(f'{h}  {p}\n' for p,h in checksums.items()).encode())
    if approved_source(reviewed) != commit: raise ValueError('Source changed during packaging')
    result = {'source_commit':commit,'reviewed_commit':reviewed,'release_name':name,
        'backend_runtime_files':new,'upload_directory':str(upload),
        'checksum_file_sha256':digest(upload/'SHA256SUMS.txt'),'uploaded':False,'deployed':False}
    (output/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True)
    parser.add_argument('--date',required=True,help='YYYYMMDD in the release owner timezone')
    parser.add_argument('--reviewed-commit',required=True)
    parser.add_argument('--dashboard-archive',required=True)
    parser.add_argument('--personal-archive',required=True)
    parser.add_argument('--personal-manifest',required=True)
    args=parser.parse_args()
    package(args.output,args.date,args.reviewed_commit,args.dashboard_archive,args.personal_archive,args.personal_manifest)
