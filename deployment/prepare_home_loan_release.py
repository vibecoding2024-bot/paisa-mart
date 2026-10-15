"""Package a reviewed frontend export locally; never accesses EC2 or production."""
import hashlib
import json
from pathlib import Path
import re
import sys
import tarfile
from datetime import datetime
import prepare_web


def package(export_directory, output_directory, commit, release_date):
    if not re.fullmatch(r'[a-f0-9]{40}', commit):
        raise ValueError('A full Git commit SHA is required')
    export = Path(export_directory).resolve()
    output = Path(output_directory).resolve()
    if output == export or export in output.parents:
        raise ValueError('Output must be outside the web export')
    datetime.strptime(release_date, '%Y%m%d')
    name = release_date + '-' + commit[:8] + '-home-loan-pipeline'
    destination = output / name
    destination.mkdir(parents=True, exist_ok=False)
    packaging = output / (name + '-manifest')
    packaging.mkdir(exist_ok=False)
    prepare_web.HEAD = prepare_web.HEAD.replace(prepare_web.VERSION, commit[:8])
    prepare_web.VERSION = commit
    prepare_web.package(export, packaging)
    archive = packaging / 'approved-web.tar.gz'
    with tarfile.open(archive, 'r:gz') as source:
        # prepare_web emits only whitelisted regular files; validate again at extraction.
        for member in source.getmembers():
            target = destination / member.name
            if not member.isfile() or not target.resolve().is_relative_to(destination.resolve()):
                raise ValueError('Unsafe archive member')
            target.parent.mkdir(parents=True, exist_ok=True)
            content = source.extractfile(member)
            if content is None:
                raise ValueError('Missing archive member')
            target.write_bytes(content.read())
    manifest = json.loads((packaging / 'manifest.json').read_text())
    for file, digest in manifest['files'].items():
        if hashlib.sha256((destination / file).read_bytes()).hexdigest() != digest:
            raise ValueError('Release file checksum mismatch')
    manifest.update({'release_name': name, 'source_commit': commit, 'backend_required': True,
                     'approval_status': 'Requires PR review/approval before deployment',
                     'aws_release_directory': '/home/ec2-user/paisa-mart-new/backend/.frontend-releases/' + name})
    (packaging / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Release: ' + name)
    print('Prepared locally only; not uploaded or deployed.')


if __name__ == '__main__':
    if len(sys.argv) != 5:
        raise SystemExit('Usage: prepare_home_loan_release.py EXPORT_DIRECTORY OUTPUT_DIRECTORY FULL_GIT_SHA YYYYMMDD')
    package(*sys.argv[1:])
