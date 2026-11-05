"""Install frozen workspace dependencies in isolated staging; never alter another checkout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def copy_path(path):
    path = Path(path).resolve()
    return Path('\\\\?\\' + str(path)) if os.name == 'nt' else path

def copy_dependencies(source, target):
    # Native packages contain paths beyond Win32's legacy 260-character limit.
    # Use extended paths for copying; never alter global Windows settings.
    shutil.copytree(copy_path(source), copy_path(target))

def install(staging, bun):
    staging = Path(staging).resolve()
    if staging == ROOT.resolve() or ROOT.resolve() in staging.parents:
        raise ValueError('Dependency staging must be outside the source checkout')
    if any(part.lower() in ('public','final-good-20261006') for part in staging.parts):
        raise ValueError('Protected staging path')
    for relative in ('node_modules','mobile/node_modules','backend/node_modules'):
        target = ROOT/relative
        if target.exists() or target.is_symlink():
            raise ValueError('Existing dependencies must be preserved: '+str(target))
    staging.mkdir(parents=True,exist_ok=False)
    receipt = {'bun_version':subprocess.check_output([bun,'--version'],text=True).strip(),
               'node_version':subprocess.check_output(['node','--version'],text=True).strip(),
               'frozen_lockfile':True,'lifecycle_scripts':False,'workspaces':{}}
    for workspace in ('mobile','backend'):
        source = ROOT/workspace
        isolated = staging/workspace
        isolated.mkdir()
        inputs = [source/'package.json',source/'bun.lock']
        if (source/'patches').exists(): inputs += sorted(p for p in (source/'patches').rglob('*') if p.is_file())
        hashes = {p.relative_to(source).as_posix():digest(p) for p in inputs}
        for path in inputs:
            target=isolated/path.relative_to(source);target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(path,target)
        print('Installing frozen '+workspace+' dependencies in isolated staging',flush=True)
        subprocess.run([bun,'install','--frozen-lockfile','--ignore-scripts'],cwd=isolated,check=True)
        if any(digest(source/name)!=expected or digest(isolated/name)!=expected for name,expected in hashes.items()):
            raise ValueError('Dependency input changed during installation')
        target=ROOT/workspace/'node_modules'
        if not target.resolve().is_relative_to(ROOT.resolve()) or target.exists() or target.is_symlink():
            raise ValueError('Unsafe/existing dependency destination')
        copy_dependencies(isolated/'node_modules',target)
        receipt['workspaces'][workspace]={'input_sha256':hashes,'installed_path':str(target)}
    # Expo's workspace resolver watches this path even when all packages are
    # installed in the individual workspaces. No packages are copied into it.
    (ROOT/'node_modules').mkdir(exist_ok=False)
    (staging/'dependency-install.json').write_text(json.dumps(receipt,indent=2)+'\n')
    print('Verified frozen dependency receipt: '+str(staging/'dependency-install.json'))
    return receipt

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--staging',required=True)
    parser.add_argument('--bun',required=True,help='Absolute path to the tested Bun executable')
    args=parser.parse_args()
    try: install(args.staging,str(Path(args.bun).resolve()))
    except shutil.Error as error:
        print('Dependency copy failed; partial files retained. First errors: '+str(error.args[0][:3]))
        raise SystemExit(1)
