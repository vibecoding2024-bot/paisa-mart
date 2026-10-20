"""Read-only validation shared by preparation and local package review."""

import hashlib

import json

import re

from html.parser import HTMLParser

from pathlib import Path

from urllib.parse import urlsplit, unquote



PRODUCTION_API = 'https://paisa-mart.com'

BACKEND_FILES = ['backend/src/routes/admin.ts', 'backend/src/routes/admin-operations.ts', 'backend/src/lib/admin-operations.ts']



def safe_output(path):

    path = Path(path).resolve()

    if any(p.lower() in ('public', 'final-good-20261006') for p in path.parts):

        raise ValueError('Protected output path')

    return path



def digest(path):

    return hashlib.sha256(Path(path).read_bytes()).hexdigest()



def files(root):

    root = Path(root)

    result = {}

    for p in sorted(root.rglob('*')):

        if p.is_symlink():

            raise ValueError('Symlinks are not allowed in artifacts')

        if p.is_file():

            result[p.relative_to(root).as_posix()] = digest(p)

    return result



def validate_export(export, commit):

    export = Path(export)

    receipt = json.loads(export.with_suffix('.build.json').read_text())

    if receipt['source_commit'] != commit or receipt['api_url'] != PRODUCTION_API:

        raise ValueError('Source SHA or production API receipt mismatch')

    if files(export) != receipt['files']:

        raise ValueError('Export changed after build')

    scripts = list(export.rglob('*.js'))

    combined = '\n'.join(p.read_text(encoding='utf-8') for p in scripts)

    if PRODUCTION_API not in combined or any(url in combined for url in ['http://127.0.0.1:4790', 'http://127.0.0.1:4793', 'http://localhost:4793']):

        raise ValueError('Not a production-configured export')

    if 'paisa-web-polish' in (export / 'index.html').read_text(encoding='utf-8'):

        raise ValueError('Expected fresh unprocessed Expo export')

    return receipt



class References(HTMLParser):

    def __init__(self):

        super().__init__()

        self.refs = []

    def handle_starttag(self, tag, attrs):

        data = dict(attrs)

        key = 'src' if tag == 'script' else 'href' if tag == 'link' else None

        if key and data.get(key):

            self.refs.append(data[key])



def validate_release(root, manifest):

    root = Path(root).resolve()

    if files(root) != manifest['files']:

        raise ValueError('Release file set/checksum mismatch')

    html = (root / 'index.html').read_text(encoding='utf-8')

    for required in ['id="paisa-web-polish"', 'height:100%;width:100%;margin:0', '#root{display:flex;flex:1}']:

        if required not in html:

            raise ValueError('Missing approved shell: ' + required)

    if 'id="web-brand-header"' in html or 'id="web-brand-footer"' in html:

        raise ValueError('Legacy phone shell present')

    parser = References()

    parser.feed(html)

    refs = [(root / 'index.html', ref) for ref in parser.refs]

    for css in root.rglob('*.css'):

        refs.extend((css, ref.strip(' \"\'')) for ref in re.findall(r'url\(([^)]+)\)', css.read_text(encoding='utf-8')))

    for origin, ref in refs:

        parts = urlsplit(ref)

        if parts.scheme == 'data' or ref.startswith('#'):

            continue

        if parts.scheme or parts.netloc:

            raise ValueError('External asset reference: ' + ref)

        target = (root / unquote(parts.path).lstrip('/')) if parts.path.startswith('/') else origin.parent / unquote(parts.path)

        target = target.resolve()

        if not target.is_relative_to(root) or not target.is_file():

            raise ValueError('Missing or unsafe asset: ' + ref)

    if not any(ref.endswith('.js') for ref in parser.refs):

        raise ValueError('No entry JavaScript')

