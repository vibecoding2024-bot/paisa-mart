"""Local fixtures only. No real build, credentials, PM2 or network."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
import tarfile
import io
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('requirements_package',HERE/'prepare_release.py')
pack=importlib.util.module_from_spec(spec);spec.loader.exec_module(pack)

class SourceGuards(unittest.TestCase):
    def setUp(self):
        self.head='a'*40;self.reviewed='b'*40;self.main=self.head;self.dirty=b'';self.changed=pack.RUNTIME[:];self.tree=b'tree';self.review_tree=b'tree'
    def git(self,*args):
        if args[0]=='status': return self.dirty
        if args[0]=='merge-base': return b''
        if args[0]=='diff': return '\n'.join(self.changed).encode()
        if args[1]=='HEAD': return self.head.encode()
        if args[1]=='origin/main': return self.main.encode()
        return self.review_tree if args[1]==self.reviewed+'^{tree}' else self.tree
    def check(self):
        with patch.object(pack,'git',side_effect=self.git): return pack.approved_source(self.reviewed)
    def test_clean_merged_identical_tree_allowed(self):self.assertEqual(self.check(),self.head)
    def test_feature_branch_refused_before_build(self):
        self.main='c'*40
        with self.assertRaisesRegex(ValueError,'merged origin/main'):self.check()
    def test_dirty_source_refused(self):
        self.dirty=b' M file'
        with self.assertRaisesRegex(ValueError,'Clean source'):self.check()
    def test_unreviewed_tree_refused(self):
        self.tree=b'changed'
        with self.assertRaisesRegex(ValueError,'differs'):self.check()
    def test_changed_runtime_scope_refused(self):
        self.changed.append('backend/src/auth.ts')
        with self.assertRaisesRegex(ValueError,'exactly 11'):self.check()
    def test_protected_personal_not_installable(self):
        self.assertEqual(len(pack.RUNTIME),11)
        self.assertFalse(set(pack.RUNTIME)&set(pack.PERSONAL_FILES))

class FixturePackaging(unittest.TestCase):
    def test_complete_fixture_bundle_members_checksums_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as folder:
            out=Path(folder)/'out';commit='a'*40;date='20261104';name=date+'-'+commit[:8]+'-dashboard'
            personal={'runtime_files':{p:'old-hash' for p in pack.PERSONAL_FILES}}
            def fake_build(args,**kwargs):
                raw=Path(args[-1]);raw.mkdir(parents=True);(raw/'index.html').write_text('synthetic review fixture')
            def fake_frontend(raw,output,sha,date):
                destination=output/name;destination.mkdir();(destination/'index.html').write_text('fixture')
                stage=output/(name+'-manifest');stage.mkdir()
                with tarfile.open(stage/'approved-web.tar.gz','w:gz') as archive:archive.add(destination/'index.html',arcname='index.html')
                (stage/'manifest.json').write_text(json.dumps({'files':{'index.html':pack.digest(destination/'index.html')},'source_commit':sha}))
            with patch.object(pack,'approved_source',return_value=commit),patch.object(pack,'baseline_hashes',return_value=({},personal)),patch.object(pack,'git',return_value=b'synthetic runtime fixture\n'),patch.object(pack.subprocess,'run',side_effect=fake_build),patch.object(pack.frontend,'package',side_effect=fake_frontend),patch.object(pack,'validate_release'):
                pack.package(out,date,'b'*40,'unused','unused','unused')
                with self.assertRaises(FileExistsError):pack.package(out,date,'b'*40,'unused','unused','unused')
            upload=out/'upload'/name
            info=json.loads((upload/'backend/comparison.json').read_text())
            self.assertEqual(set(info['install_lf_hashes']),{p.removeprefix('backend/') for p in pack.RUNTIME})
            self.assertFalse(set(info['install_lf_hashes'])&set(info['personal_preserved_files']))
            for line in (upload/'SHA256SUMS.txt').read_text().splitlines():
                expected,path=line.split('  ',1);self.assertEqual(pack.digest(upload/path),expected)
            with tarfile.open(upload/'requirements-backend.tar.gz') as archive:
                self.assertEqual({m.name for m in archive if m.name.startswith('files/')},{'files/'+p.removeprefix('backend/') for p in pack.RUNTIME})

# Reuse the maintained safety suite against the new installer; controls are fake.
sys.path.insert(0,str(HERE.parent/'dashboard'))
import test_backend_update as existing
existing.SCRIPT=HERE/'backend-update.py'
class InstallerSafety(existing.IsolatedUpdateTests):
    def setUp(self):
        super().setUp()
        # Rehearsal is covered separately below; no real Bun is called here.
        patch.object(self.m,'rehearse_migrations').start()

class RehearsalSafety(unittest.TestCase):
    def test_copy_migration_cannot_change_live_or_backup_and_detects_removed_rows(self):
        m=existing.load()
        import sqlite3,subprocess
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);m.APP=root/'app';m.BACKUP=root/'backup';m.STAGE=root/'stage'
            (m.APP/'src').mkdir(parents=True);m.BACKUP.mkdir();m.STAGE.mkdir()
            original=m.BACKUP/'payments.db'
            with sqlite3.connect(original) as db:db.execute('CREATE TABLE saved(id INT)');db.execute('INSERT INTO saved VALUES(1)')
            db.close()
            before=original.read_bytes();m.NEW={}
            def run(args,**kwargs):
                target=Path(kwargs['env']['LEADS_DB'])
                self.assertNotEqual(target,original);self.assertTrue(target.is_relative_to(root))
                with sqlite3.connect(target) as db:db.execute('DELETE FROM saved')
                db.close()
                return subprocess.CompletedProcess(args,0)
            with patch.object(Path,'symlink_to'),patch.object(m.subprocess,'run',side_effect=run):
                with self.assertRaisesRegex(RuntimeError,'row count'):m.rehearse_migrations('/fake/bun',{})
            self.assertEqual(original.read_bytes(),before)
    def test_readonly_verification_checks_environment_without_migrating(self):
        m=existing.load();m.OLD={};m.NEW={}
        with tempfile.TemporaryDirectory() as folder:
            m.APP=Path(folder);m.DB=m.APP/'payments.db';m.DB.touch()
            with patch.object(m,'process',return_value={}),patch.object(m,'health'),patch.object(m,'verify_runtime_environment') as env,patch.object(m,'rehearse_migrations') as migration:
                m.verify_candidate();env.assert_called_once();migration.assert_not_called()

if __name__=='__main__':unittest.main()
