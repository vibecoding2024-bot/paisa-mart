"""AWS release candidate packaging on the DEPLOYED PR #7 baseline. Local only; never contacts EC2.

Reuses the maintained guarded tooling from the release worktree (deployment/requirements/prepare_release.py,
deployment/dashboard/*) exactly as the PR #7 packager did, with these differences:
  * expected live backend = the deployed PR #7 release 20261121-595e5212-on-pr6-dashboard (its recorded
    expected_baseline overlaid with its installed hashes), verified against its checksum root;
  * source = a clean, explicitly named local release commit. This is a PRE-MERGE CANDIDATE for review: after approval
    and merge, regenerate from merged origin/main and require the merged tree to equal this candidate's tree;
  * the web export is a fresh production export of the same commit built from a clean clone (frozen lockfile).
Usage: python -B prepare_aws_release_on_pr7.py <release-worktree> <expected-commit> <raw-web-export-dir> <label>
"""
import hashlib, json, os, shutil, subprocess, sys, tarfile
from pathlib import Path

SOURCE = Path(sys.argv[1]).resolve()
EXPECTED = sys.argv[2]
RAW_INPUT = Path(sys.argv[3]).resolve()
LABEL = sys.argv[4]
REPO = SOURCE.parent
sys.path.insert(0, str(SOURCE/'deployment/requirements'))
import prepare_release as pr  # also puts deployment/dashboard on sys.path
from prepare_release import frontend, files, safe_output, PRODUCTION_API, validate_release, verify_personal

PR7_COMMIT = '595e521211e13dd9cdcdcd7d50dbc8c940ef9574'
PR7_RELEASE = '20261121-595e5212-on-pr6-dashboard'
PR7_UPLOAD = REPO/'release/pr7-on-pr6-595e5212-20261121/upload'/PR7_RELEASE
PR7_SUMS_SHA = '4e7845d1e12f76c373d3c1d147bb2bfddd49dbd21c7f4d5d8b419da0938f46e9'
DATE = '20261122'

def sha(b): return hashlib.sha256(b).hexdigest()
def digest(p): return sha(Path(p).read_bytes())
def git(*a): return subprocess.check_output(['git', '-C', str(SOURCE), *a])
def need(ok, msg):
    if not ok: raise SystemExit('REFUSED: ' + msg)

def source_guard():
    need(pr.ROOT == SOURCE, 'Packager must come from the release worktree')
    need(not git('status', '--porcelain').strip(), 'Clean release worktree required')
    head = git('rev-parse', 'HEAD').decode().strip()
    need(head == EXPECTED, 'HEAD must equal the named release commit ' + EXPECTED)
    git('merge-base', '--is-ancestor', PR7_COMMIT, head)  # built on the deployed PR #7 source
    return head

def deployed_pr7():
    sums = PR7_UPLOAD/'SHA256SUMS.txt'
    need(digest(sums) == PR7_SUMS_SHA, 'PR #7 release checksum root mismatch')
    for line in sums.read_text().splitlines():
        h, name = line.split('  ', 1)
        need(digest(PR7_UPLOAD/name) == h, 'PR #7 release file changed: ' + name)
    manifest = json.loads((PR7_UPLOAD/'manifest.json').read_text())
    need(manifest['release_name'] == PR7_RELEASE, 'PR #7 manifest identity mismatch')
    info = json.loads((PR7_UPLOAD/'backend/comparison.json').read_text())
    need(info['release_name'] == PR7_RELEASE and info['source_commit'] == PR7_COMMIT, 'PR #7 comparison identity mismatch')
    for name, h in info['install_lf_hashes'].items():
        data = (PR7_UPLOAD/'backend/files'/name).read_bytes()
        need(sha(data) == h and data == git('show', PR7_COMMIT + ':backend/' + name), 'PR #7 installed payload mismatch: ' + name)
    live = {**info['expected_baseline'], **info['install_lf_hashes']}
    need('MISSING' not in live.values(), 'Unexpected MISSING entry after PR #7')
    return live, info, manifest

def runtime_paths(commit):
    return [p for p in git('ls-tree', '-r', '--name-only', commit, 'backend/').decode().split()
            if (p.startswith('backend/src/') and not p.endswith('.test.ts')) or p == 'backend/package.json']

def derive_delta(live, info, commit):
    rel = {p.removeprefix('backend/'): p for p in runtime_paths(commit)}
    need(not (set(live) - set(rel)), 'Live file deleted in release source; unsupported: ' + str(set(live) - set(rel)))
    preserved = info['personal_preserved_files']
    for name in preserved:  # October CRLF bytes stay; Git source must be unchanged since PR #7
        need(git('show', commit + ':backend/' + name) == git('show', PR7_COMMIT + ':backend/' + name), 'Personal source changed: ' + name)
    delta = {}
    for name, path in sorted(rel.items()):
        h = sha(git('show', commit + ':' + path))
        if live.get(name) != h and name not in preserved: delta[name] = h
    by_git = {p.removeprefix('backend/') for p in git('diff', '--name-only', PR7_COMMIT, commit, '--', 'backend').decode().split()
              if (p.startswith('backend/src/') and not p.endswith('.test.ts')) or p == 'backend/package.json'}
    need(set(delta) == by_git, 'Hash-derived delta differs from git delta: ' + str(sorted(set(delta) ^ by_git)))
    old = {**live, **{n: 'MISSING' for n in delta if n not in live}}
    return delta, old

def main():
    commit = source_guard()
    live, pr7info, pr7manifest = deployed_pr7()
    delta, old = derive_delta(live, pr7info, commit)
    personal = verify_personal(REPO/'release/pl4/backend-review/personal-loan-backend.tar.gz',
                               REPO/'release/pl4/backend-review/manifest.json', commit)
    for path, h in personal['runtime_files'].items():
        need(old.get(path.removeprefix('backend/')) == h == pr7info['personal_preserved_files'][path.removeprefix('backend/')], 'Personal baseline mismatch: ' + path)
    name = f'{DATE}-{commit[:8]}-{LABEL}-on-pr7'
    output = safe_output(REPO/'release'/f'aws-{LABEL}-{commit[:8]}-{DATE}')
    output.mkdir(parents=True, exist_ok=False)
    runtime = ['backend/' + n for n in delta]
    # Fresh production export of this commit (clean clone, frozen lockfile); copied in, then receipted.
    raw = output/'raw'
    shutil.copytree(RAW_INPUT, raw)
    raw.with_suffix('.build.json').write_text(json.dumps({'source_commit': commit, 'api_url': PRODUCTION_API, 'files': files(raw),
        'build_cwd': 'mobile (fresh WSL clone, pnpm --frozen-lockfile)', 'dotenv_loading': False}, indent=2) + '\n')
    frontend.BACKEND_FILES = runtime
    frontend.package(raw, output, commit, DATE)
    default = DATE + '-' + commit[:8] + '-dashboard'
    (output/default).rename(output/name)
    (output/(default + '-manifest')).rename(output/(name + '-manifest'))
    packaged = output/(name + '-manifest')
    manifest = json.loads((packaged/'manifest.json').read_text())
    manifest.update(release_name=name, aws_release_directory='/home/ec2-user/paisa-mart-new/backend/.frontend-releases/' + name)
    stage = output/'backend'; stage.mkdir()
    for n in delta:
        content = git('show', commit + ':backend/' + n)
        target = stage/'files'/n; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(content)
        need(sha(content) == delta[n], 'Staged hash mismatch: ' + n)
    info = {'source_commit': commit, 'release_name': name, 'baseline_commit': PR7_COMMIT, 'baseline_release': PR7_RELEASE,
            'baseline_live_frontend_index_sha256': pr7manifest['files']['index.html'],
            'expected_baseline': old, 'install_lf_hashes': delta, 'personal_archive_sha256': pr.PERSONAL_SHA,
            'personal_preserved_files': pr7info['personal_preserved_files'],
            'rollback_scope': 'Only these runtime files; preserve database, additive schema, history and Personal files'}
    (stage/'comparison.json').write_text(json.dumps(info, indent=2) + '\n')
    for tool in ['backend-update.py', 'deploy.py', 'rollback.py', 'frontend_toolkit.py', 'stage-frontend.py']:
        src = SOURCE/('deployment/requirements' if tool == 'backend-update.py' else 'deployment/dashboard')/tool
        shutil.copy2(src, stage/tool)
        need(digest(stage/tool) == digest(PR7_UPLOAD/'backend'/tool), 'Tool differs from the deployed PR #7 tool: ' + tool)
    bundle = output/'requirements-backend.tar.gz'
    with tarfile.open(bundle, 'w:gz') as archive:
        for path in sorted(stage.rglob('*')):
            if path.is_file(): archive.add(path, arcname=path.relative_to(stage).as_posix())
    with tarfile.open(bundle) as archive:
        members = archive.getmembers()
        actual = {m.name: sha(archive.extractfile(m).read()) for m in members if m.isfile()}
        expected = {p.relative_to(stage).as_posix(): digest(p) for p in stage.rglob('*') if p.is_file()}
        need(len(members) == len(actual) and actual == expected, 'Backend archive verification failed')
    with tarfile.open(packaged/'approved-web.tar.gz') as archive:
        members = archive.getmembers()
        actual = {m.name.removeprefix('./'): sha(archive.extractfile(m).read()) for m in members if m.isfile()}
        need(len(members) == len(actual) and actual == manifest['files'], 'Frontend archive verification failed')
    manifest.update(backend_bundle_sha256=digest(bundle), backend_install_lf_hashes=delta, backend_baseline_commit=PR7_COMMIT,
                    baseline_release=PR7_RELEASE, personal_preserved_files=pr7info['personal_preserved_files'],
                    approval_status='PRE-MERGE RELEASE CANDIDATE for review. Not merged, not uploaded, not deployed. After approval: '
                                    'merge, then regenerate from merged origin/main (tree must equal this candidate) before upload.')
    (packaged/'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    validate_release(output/name, manifest)
    upload = output/'upload'/name; upload.mkdir(parents=True)
    shutil.copytree(stage, upload/'backend')
    for path in [bundle, packaged/'approved-web.tar.gz', packaged/'manifest.json']: shutil.copy2(path, upload/path.name)
    sums = {p.relative_to(upload).as_posix(): digest(p) for p in sorted(upload.rglob('*')) if p.is_file()}
    (upload/'SHA256SUMS.txt').write_bytes(''.join(f'{h}  {p}\n' for p, h in sums.items()).encode())
    need(source_guard() == commit, 'Source changed during packaging')
    result = {'source_commit': commit, 'source_tree': git('rev-parse', commit + '^{tree}').decode().strip(), 'release_name': name,
              'baseline_release': PR7_RELEASE, 'baseline_commit': PR7_COMMIT, 'backend_runtime_files': delta,
              'backend_runtime_file_count': len(delta), 'new_files': sorted(n for n in delta if old[n] == 'MISSING'),
              'frontend_index_sha256': manifest['files']['index.html'], 'upload_directory': str(upload),
              'checksum_file_sha256': digest(upload/'SHA256SUMS.txt'), 'packager_sha256': digest(Path(__file__)),
              'pre_merge_candidate': True, 'uploaded': False, 'deployed': False}
    (output/'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
