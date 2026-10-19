"""Validate and stage an approved archive; never switches the live frontend."""
import hashlib,json,sys,tarfile
from pathlib import Path
BASE=Path('/home/ec2-user/paisa-mart-new/backend/.frontend-releases')
def digest(data): return hashlib.sha256(data).hexdigest()
def main(archive,manifest):
    archive=Path(archive);info=json.loads(Path(manifest).read_text());name=info['release_name']
    if not name or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in name) or name=='FINAL-GOOD-20261006':raise ValueError('Unsafe release name')
    if digest(archive.read_bytes())!=info['archive_sha256']:raise ValueError('Archive checksum mismatch')
    expected=info['files'];contents={}
    with tarfile.open(archive,'r:gz') as source:
        for member in source:
            path=Path(member.name)
            if not member.isfile() or path.is_absolute() or '..' in path.parts or member.name in contents:raise ValueError('Unsafe archive member')
            data=source.extractfile(member).read()
            if expected.get(member.name)!=digest(data):raise ValueError('File checksum mismatch: '+member.name)
            contents[member.name]=data
    if set(contents)!=set(expected):raise ValueError('Manifest members differ')
    if BASE.is_symlink() or not BASE.is_dir():raise ValueError('Release parent must be an existing real directory')
    target=BASE/name;target.mkdir(exist_ok=False)
    for name,data in contents.items():
        path=target/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    print('Staged only: '+str(target))
if __name__=='__main__':main(*sys.argv[1:])
