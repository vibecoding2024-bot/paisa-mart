"""Local dashboard-only packaging against the already-deployed Personal Loan source."""
import hashlib, json, re, subprocess, sys, tarfile
from pathlib import Path
from release_validation import BACKEND_FILES, safe_output
ROOT = Path(__file__).resolve().parents[2]
BASELINE = '46d07d53bfd48500f07b46c46e0fc681eb3cbd19'
PERSONAL_FILES = (
    'backend/src/routes/personal-loans.ts',
    'backend/src/routes/personal-loan-applications.ts',
    'backend/src/lib/personal-loan-application-store.ts',
    'backend/src/lib/personal-loan-lead-store.ts',
)
def git(*args): return subprocess.check_output(['git', '-C', str(ROOT), *args])
def sha(data): return hashlib.sha256(data).hexdigest()

def verify_personal(archive, manifest, commit):
    info = json.loads(Path(manifest).read_text(encoding='utf-8'))
    if info['source_commit'] != BASELINE or sha(Path(archive).read_bytes()) != info['archive_sha256']:
        raise ValueError('Personal baseline artifact identity mismatch')
    if set(info['runtime_files']) != set(PERSONAL_FILES):
        raise ValueError('Personal baseline must contain the four recorded runtime files')
    with tarfile.open(archive, 'r:gz') as source:
        for path in PERSONAL_FILES:
            member = source.getmember(path)
            if not member.isfile(): raise ValueError('Personal baseline has a non-file member')
            data = source.extractfile(member).read()
            if sha(data) != info['runtime_files'][path]: raise ValueError('Personal artifact checksum mismatch')
            baseline = git('show', BASELINE + ':' + path)
            if data.replace(b'\r\n', b'\n') != baseline or git('show', commit + ':' + path) != baseline:
                raise ValueError('Personal runtime code changed; refusing to repeat its deployment')
    return info

def main(output, release, personal_archive, personal_manifest):
    if git('status', '--porcelain').strip(): raise ValueError('Clean committed source required')
    commit = git('rev-parse', 'HEAD').decode().strip()
    if not re.fullmatch(r'\d{8}-' + commit[:8] + r'-dashboard', release):
        raise ValueError('Release name must match the current source SHA')
    out = safe_output(output)
    if out == ROOT or ROOT in out.parents: raise ValueError('Output must be outside the source checkout')
    changed = git('diff', '--name-only', BASELINE, commit, '--', 'backend/src').decode().splitlines()
    changed = sorted(p for p in changed if not p.endswith('.test.ts'))
    if set(changed) != set(BACKEND_FILES): raise ValueError('Unexpected backend delta; dashboard runtime scope must be reviewed')
    personal = verify_personal(personal_archive, personal_manifest, commit)
    stage = out / 'backend'
    stage.mkdir(parents=True, exist_ok=False)
    tracked = git('ls-tree', '-r', '--name-only', BASELINE, 'backend/src', 'backend/package.json').decode().splitlines()
    old, new = {}, {}
    for path in sorted(set(tracked + changed)):
        if path.endswith('.test.ts'): continue
        # Personal byte hashes come from the recorded October release artifact.
        old[path.removeprefix('backend/')] = personal['runtime_files'].get(path, sha(git('show', BASELINE + ':' + path)) if path in tracked else 'MISSING')
    for path in changed:
        data = git('show', commit + ':' + path)
        name = path.removeprefix('backend/')
        target = stage / 'files' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        new[name] = sha(data)
    info = {'source_commit': commit, 'release_name': release, 'baseline_commit': BASELINE,
            'baseline_kind': 'User-confirmed Personal deployment 2026-10-18; compared locally with recorded source/archive, not a fresh EC2 inventory. Exact live drift stops execution.',
            'personal_archive_sha256': personal['archive_sha256'],
            'personal_preserved_files': {p.removeprefix('backend/'): h for p, h in personal['runtime_files'].items()},
            'expected_baseline': old, 'install_lf_hashes': new,
            'rollback_scope': 'Only the three dashboard runtime files; never Personal files, secrets or databases'}
    (stage / 'comparison.json').write_text(json.dumps(info, indent=2) + '\n')
    for name in ['backend-update.py', 'deploy.py', 'rollback.py', 'frontend_toolkit.py', 'stage-frontend.py']:
        (stage / name).write_bytes((Path(__file__).parent / name).read_bytes())
    archive = out / 'dashboard-backend.tar.gz'
    if archive.exists(): raise FileExistsError(archive)
    with tarfile.open(archive, 'w:gz') as bundle:
        for path in sorted(stage.rglob('*')):
            if path.is_file(): bundle.add(path, arcname=path.relative_to(stage).as_posix())
    print(json.dumps({'archive': str(archive), 'sha256': sha(archive.read_bytes()), 'files': changed}, indent=2))
if __name__ == '__main__': main(*sys.argv[1:])
