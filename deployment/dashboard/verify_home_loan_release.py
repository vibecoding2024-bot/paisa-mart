"""Read-only validation of the frozen archive and extracted release."""

import json

from pathlib import Path

import re

import sys

from release_validation import digest, validate_release, PRODUCTION_API



def verify(directory, manifest_path, expected_commit):

    manifest_path = Path(manifest_path)

    manifest = json.loads(manifest_path.read_text())

    if not re.fullmatch('[a-f0-9]{40}', expected_commit) or manifest.get('source_commit') != expected_commit:

        raise ValueError('Unexpected source SHA')

    if manifest.get('production_api_url') != PRODUCTION_API:

        raise ValueError('Wrong production API configuration')

    if digest(manifest_path.parent / 'approved-web.tar.gz') != manifest['archive_sha256']:

        raise ValueError('Archive checksum mismatch')

    validate_release(directory, manifest)

    return manifest



if __name__ == '__main__':

    if len(sys.argv) != 4:

        raise SystemExit('Usage: verify_home_loan_release.py RELEASE_DIRECTORY MANIFEST_JSON EXPECTED_SOURCE_SHA')

    m = verify(*sys.argv[1:])

    print('Verified source, approved shell, referenced assets, archive and ' + str(len(m['files'])) + ' file checksums.')

