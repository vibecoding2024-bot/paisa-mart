"""Offline checks: never contact AWS, the production site, or an SMS provider."""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("deploy", HERE / "deploy_frontend.py")
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.app = Path(self.temp.name)
        self.public = self.app / "public"
        self.public.mkdir()
        (self.public / "index.html").write_text("original frontend")
        (self.public / "metadata.json").write_text("original metadata")
        (self.public / "paisa-mart.apk").write_bytes(b"existing download")
        (self.public / "previous.js").write_text("existing cached bundle")
        (self.app / ".env").write_text("fixture secret - must not change")
        (self.app / "data.json").write_text("fixture customer data")

    def tearDown(self):
        self.temp.cleanup()

    def assert_unrelated_files_preserved(self):
        self.assertEqual((self.public / "paisa-mart.apk").read_bytes(), b"existing download")
        self.assertEqual((self.public / "previous.js").read_text(), "existing cached bundle")
        self.assertEqual((self.app / ".env").read_text(), "fixture secret - must not change")
        self.assertEqual((self.app / "data.json").read_text(), "fixture customer data")

    def test_publish_then_rollback_preserves_existing_downloads_and_backend(self):
        with patch.object(deploy, "healthy"), patch.object(deploy, "check_release"):
            deploy.deploy(self.app, self.public)
        self.assertIn('content="4e19e00"', (self.public / "index.html").read_text())
        self.assert_unrelated_files_preserved()
        backup = next((self.app / ".frontend-backups").iterdir())
        self.assertEqual((backup / "public/paisa-mart.apk").read_bytes(), b"existing download")
        deploy.restore(backup, self.public)
        self.assertEqual((self.public / "index.html").read_text(), "original frontend")
        self.assertEqual((self.public / "metadata.json").read_text(), "original metadata")
        self.assert_unrelated_files_preserved()

    def test_failed_https_verification_automatically_rolls_back(self):
        with patch.object(deploy, "healthy"), patch.object(deploy, "check_release", side_effect=RuntimeError("simulated HTTPS failure")):
            with self.assertRaisesRegex(RuntimeError, "simulated HTTPS failure"):
                deploy.deploy(self.app, self.public)
        self.assertEqual((self.public / "index.html").read_text(), "original frontend")
        self.assertEqual((self.public / "metadata.json").read_text(), "original metadata")
        self.assert_unrelated_files_preserved()

    def test_package_checksums_and_backend_injection_compatibility(self):
        manifest = json.loads((HERE / "manifest.json").read_text())
        stage = self.app / "stage"
        stage.mkdir()
        deploy.extract_release(HERE / "approved-web.tar.gz", manifest, stage)
        html = (stage / "index.html").read_text()
        # Match the current backend serveHtml branch. Legacy chrome must be skipped.
        served = html if "paisa-web-polish" in html else html.replace("</head>", "LEGACY PHONE FRAME</head>")
        self.assertEqual(served, html)
        self.assertNotIn("LEGACY PHONE FRAME", served)
        self.assertNotIn("web-brand-footer", served)
        self.assertEqual(html.count('id="paisa-web-polish"'), 1)
        manifest["archive_sha256"] = "0" * 64
        with self.assertRaisesRegex(RuntimeError, "checksum mismatch"):
            deploy.extract_release(HERE / "approved-web.tar.gz", manifest, self.app / "bad-stage")

    def test_refuses_wrong_instance_and_region(self):
        for identity in ({"instanceId": "wrong", "region": deploy.REGION},
                         {"instanceId": deploy.INSTANCE, "region": "ap-south-1"}):
            with patch.object(deploy, "run", side_effect=[b"fixture token", json.dumps(identity).encode()]):
                with self.assertRaisesRegex(RuntimeError, "not the intended"):
                    deploy.require_instance()

    def test_rejects_paths_outside_frontend(self):
        for name in ("../.env", "/etc/nginx/nginx.conf", "assets/../../data.json", "C:\\private"):
            with self.assertRaises(ValueError):
                deploy.within(self.public, name)


if __name__ == "__main__":
    unittest.main()
