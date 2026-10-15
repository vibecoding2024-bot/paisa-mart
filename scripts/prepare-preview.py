"""Prepare a local preview with the approved HTML shell; never touches public or AWS."""
from pathlib import Path
import sys
import tarfile
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'deployment'))
import prepare_web
source = ROOT / '.preview/export'
output = ROOT / '.preview/package'
web = ROOT / '.preview/web'
prepare_web.package(source, output)
with tarfile.open(output / 'approved-web.tar.gz') as archive:
    for member in archive:
        target = web / member.name
        if not member.isfile() or not target.resolve().is_relative_to(web.resolve()):
            raise ValueError('Invalid export member')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(archive.extractfile(member).read())
html = (web / 'index.html').read_text(encoding='utf-8')
assert 'id="paisa-web-polish"' in html
assert 'id="web-brand-header"' not in html
print('Local preview prepared. No deployment performed.')
