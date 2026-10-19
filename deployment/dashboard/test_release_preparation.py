import json

from pathlib import Path

import tempfile

import unittest

import prepare_web

from release_validation import files, validate_export, validate_release, safe_output, PRODUCTION_API



class PackagingTests(unittest.TestCase):

    def setUp(self):

        self.tmp = tempfile.TemporaryDirectory()

        self.addCleanup(self.tmp.cleanup)

        self.root = Path(self.tmp.name)

        self.raw = self.root / 'raw'

        (self.raw / '_expo').mkdir(parents=True)

        (self.raw / '_expo/app.js').write_text('const api="' + PRODUCTION_API + '";')

        (self.raw / 'index.html').write_text('<html><head></head><body><script src="/_expo/app.js"></script></body></html>')

        self.commit = 'a' * 40

        self.receipt()

    def receipt(self):

        self.raw.with_suffix('.build.json').write_text(json.dumps({'source_commit': self.commit, 'api_url': PRODUCTION_API, 'files': files(self.raw)}))

    def packaged(self):

        import tarfile

        output = self.root / 'package'

        prepare_web.package(self.raw, output)

        web = self.root / 'web'

        with tarfile.open(output / 'approved-web.tar.gz') as t:

            for member in t:

                target = web / member.name

                target.parent.mkdir(parents=True, exist_ok=True)

                target.write_bytes(t.extractfile(member).read())

        return web, json.loads((output / 'manifest.json').read_text())

    def test_raw_export_is_not_a_release(self):

        with self.assertRaises(ValueError): validate_release(self.raw, {'files': files(self.raw)})

    def test_packaged_export_has_valid_shell_assets_and_hashes(self):

        validate_export(self.raw, self.commit)

        web, manifest = self.packaged()

        validate_release(web, manifest)

    def test_tampered_export_rejected(self):

        (self.raw / '_expo/app.js').write_text('tampered')

        with self.assertRaises(ValueError): validate_export(self.raw, self.commit)

    def test_wrong_source_sha_rejected(self):

        with self.assertRaises(ValueError): validate_export(self.raw, 'b' * 40)

    def test_localhost_export_rejected(self):

        (self.raw / '_expo/app.js').write_text('const api="http://127.0.0.1:4790";')

        self.receipt()

        with self.assertRaises(ValueError): validate_export(self.raw, self.commit)

    def test_missing_asset_rejected_even_with_matching_manifest(self):

        (self.raw / 'index.html').write_text('<head></head><script src="/missing.js"></script>')

        web, manifest = self.packaged()

        with self.assertRaises(ValueError): validate_release(web, manifest)

    def test_packaged_file_tampering_rejected(self):

        web, manifest = self.packaged()

        (web / '_expo/app.js').write_text('tampered')

        with self.assertRaises(ValueError): validate_release(web, manifest)

    def test_protected_destinations_rejected(self):

        for path in [self.root / 'backend/public/new', self.root / 'FINAL-GOOD-20261006']:

            with self.assertRaises(ValueError): safe_output(path)

    def test_full_packager_records_backend_and_refuses_overwrite(self):

        from unittest.mock import patch

        import prepare_home_loan_release

        with patch('prepare_home_loan_release.subprocess.check_output', side_effect=lambda args, **kwargs: self.commit if args[-1] == 'HEAD' else ''):

            prepare_home_loan_release.package(self.raw, self.root / 'out', self.commit, '20261008')

            name = '20261008-' + self.commit[:8] + '-dashboard'

            manifest = json.loads((self.root / 'out' / (name + '-manifest') / 'manifest.json').read_text())

            self.assertEqual(manifest['source_commit'], self.commit)

            self.assertEqual(len(manifest['backend_files']), 7)

            self.assertTrue((self.root / 'out' / (name + '-manifest') / 'approved-web.tar.gz.sha256').is_file())

            with self.assertRaises(FileExistsError):

                prepare_home_loan_release.package(self.raw, self.root / 'out', self.commit, '20261008')



    def test_css_missing_asset_rejected(self):

        (self.raw / '_expo/style.css').write_text('body{background:url(missing.png)}')

        web, manifest = self.packaged()

        with self.assertRaises(ValueError): validate_release(web, manifest)



if __name__ == '__main__': unittest.main()

