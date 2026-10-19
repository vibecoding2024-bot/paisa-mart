"""Prepare a candidate backend bundle locally. Never connects to EC2."""
import hashlib, json, subprocess, sys, tarfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASELINE='9ec235ad104eb7805518a4338f00e5df03b6ebfd'
def git(*args): return subprocess.check_output(['git','-C',str(ROOT),*args])
def sha(data): return hashlib.sha256(data).hexdigest()
def main(output,release):
    if git('status','--porcelain').strip(): raise ValueError('Clean committed source required')
    commit=git('rev-parse','HEAD').decode().strip()
    out=Path(output).resolve(); stage=out/'backend';stage.mkdir(parents=True,exist_ok=False)
    changed=git('diff','--name-only',BASELINE,commit,'--','backend/src').decode().splitlines()
    changed=[p for p in changed if not p.endswith('.test.ts')]
    old={};new={}
    tracked=git('ls-tree','-r','--name-only',BASELINE,'backend/src','backend/package.json').decode().splitlines()
    for path in sorted(set(tracked+changed)):
        if path.endswith('.test.ts'): continue
        name=path.removeprefix('backend/')
        old[name]=sha(git('show',BASELINE+':'+path)) if path in tracked else 'MISSING'
    for path in changed:
        data=git('show',commit+':'+path);name=path.removeprefix('backend/')
        target=stage/'files'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);new[name]=sha(data)
    info={'source_commit':commit,'release_name':release,'baseline_commit':BASELINE,'baseline_kind':'Git source expectation; NOT a live EC2 inventory. Any mismatch must stop for review.','expected_baseline':old,'install_lf_hashes':new}
    (stage/'comparison.json').write_text(json.dumps(info,indent=2)+'\n')
    for name in ['backend-update.py','deploy.py','rollback.py','frontend_toolkit.py','stage-frontend.py']:
        (stage/name).write_bytes((Path(__file__).parent/name).read_bytes())
    archive=out/'dashboard-backend.tar.gz'
    with tarfile.open(archive,'w:gz') as bundle:
        for path in sorted(stage.rglob('*')):
            if path.is_file(): bundle.add(path,arcname=path.relative_to(stage).as_posix())
    print(json.dumps({'archive':str(archive),'sha256':sha(archive.read_bytes()),'files':changed},indent=2))
if __name__=='__main__': main(*sys.argv[1:])
