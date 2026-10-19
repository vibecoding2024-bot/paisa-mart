"""Package a reviewed frontend export locally; never accesses EC2 or production."""

import hashlib

import json

from pathlib import Path

import re

import sys

import tarfile

import subprocess

from datetime import datetime

import prepare_web

from release_validation import validate_export, validate_release, safe_output, digest, BACKEND_FILES





def package(export_directory, output_directory, commit, release_date):

    if not re.fullmatch(r'[a-f0-9]{40}', commit):

        raise ValueError('A full Git commit SHA is required')

    source_root = Path(__file__).resolve().parents[2]

    actual_commit = subprocess.check_output(['git', '-C', str(source_root), 'rev-parse', 'HEAD'], text=True).strip()

    dirty = subprocess.check_output(['git', '-C', str(source_root), 'status', '--porcelain'], text=True).strip()

    if actual_commit != commit or dirty:

        raise ValueError('Packaging requires the clean checkout matching the supplied source SHA')

    export = Path(export_directory).resolve()

    output = safe_output(output_directory)

    receipt = validate_export(export, commit)

    if output == export or export in output.parents:

        raise ValueError('Output must be outside the web export')

    datetime.strptime(release_date, '%Y%m%d')

    name = release_date + '-' + commit[:8] + '-dashboard'

    destination = output / name

    destination.mkdir(parents=True, exist_ok=False)

    packaging = output / (name + '-manifest')

    packaging.mkdir(exist_ok=False)

    previous_head, previous_version = prepare_web.HEAD, prepare_web.VERSION

    try:

        prepare_web.HEAD = previous_head.replace(previous_version, commit[:8])

        prepare_web.VERSION = commit

        prepare_web.package(export, packaging)

    finally:

        prepare_web.HEAD, prepare_web.VERSION = previous_head, previous_version

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

    for file, expected_digest in manifest['files'].items():

        if hashlib.sha256((destination / file).read_bytes()).hexdigest() != expected_digest:

            raise ValueError('Release file checksum mismatch')

    if digest(archive) != manifest['archive_sha256']:

        raise ValueError('Archive checksum mismatch')

    validate_release(destination, manifest)

    source_root = Path(__file__).resolve().parents[2]

    backend = {file: digest(source_root / file) for file in BACKEND_FILES}

    manifest.update({'build_receipt': receipt, 'production_api_url': receipt['api_url'],

                     'backend_files': backend, 'authentication': 'Existing environment admin plus hashed staff logins; existing customer receipts preserved',

                     'release_name': name, 'source_commit': commit, 'backend_required': True,

                     'approval_status': 'Candidate only; dashboard preview, PR review, merge and deployment require separate approval.',

                     'aws_release_directory': '/home/ec2-user/paisa-mart-new/backend/.frontend-releases/' + name})

    (packaging / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')

    (packaging / 'approved-web.tar.gz.sha256').write_text(digest(archive) + '  approved-web.tar.gz\n')

    print('Release: ' + name)

    print('Prepared locally only; not uploaded or deployed.')





if __name__ == '__main__':

    if len(sys.argv) != 5:

        raise SystemExit('Usage: prepare_home_loan_release.py EXPORT_DIRECTORY OUTPUT_DIRECTORY FULL_GIT_SHA YYYYMMDD')

    package(*sys.argv[1:])

