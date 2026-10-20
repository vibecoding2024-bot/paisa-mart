import io,json,hashlib,tarfile,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
import package_backend as pack

def digest(data):return hashlib.sha256(data).hexdigest()
class DashboardBundleTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.commit='b'*40
  self.baseline={p:('old '+p+'\n').encode() for p in (*pack.PERSONAL_FILES,'backend/src/routes/admin.ts','backend/package.json')}
  self.current={**self.baseline,**{p:('new '+p+'\n').encode() for p in pack.BACKEND_FILES}}
  self.archive=self.root/'personal.tar.gz';self.manifest=self.root/'personal.json';runtime={}
  with tarfile.open(self.archive,'w:gz') as t:
   for path in pack.PERSONAL_FILES:
    data=self.baseline[path].replace(b'\n',b'\r\n');runtime[path]=digest(data);member=tarfile.TarInfo(path);member.size=len(data);t.addfile(member,io.BytesIO(data))
  self.manifest.write_text(json.dumps({'source_commit':pack.BASELINE,'archive_sha256':digest(self.archive.read_bytes()),'runtime_files':runtime}))
  self.patch=patch.object(pack,'git',side_effect=self.git);self.patch.start();self.addCleanup(self.patch.stop)
 def git(self,*args):
  if args[0]=='status':return b''
  if args[0]=='rev-parse':return self.commit.encode()
  if args[0]=='diff':return '\n'.join([*pack.BACKEND_FILES,'backend/src/routes/admin-operations.test.ts']).encode()
  if args[0]=='ls-tree':return '\n'.join(self.baseline).encode()
  if args[0]=='show':
   commit,path=args[1].split(':',1);return (self.baseline if commit==pack.BASELINE else self.current)[path]
  raise AssertionError(args)
 def run_package(self):pack.main(self.root/'out','20261020-bbbbbbbb-dashboard',self.archive,self.manifest)
 def test_only_dashboard_files_installed_with_exact_personal_baseline(self):
  self.run_package()
  with tarfile.open(self.root/'out/dashboard-backend.tar.gz') as t:
   info=json.load(t.extractfile('comparison.json'));payload={m.name for m in t if m.name.startswith('files/')}
  self.assertEqual(payload,{'files/'+p.removeprefix('backend/') for p in pack.BACKEND_FILES})
  self.assertEqual(info['baseline_commit'],pack.BASELINE)
  for path in pack.PERSONAL_FILES:
   name=path.removeprefix('backend/');self.assertNotIn(name,info['install_lf_hashes']);self.assertEqual(info['expected_baseline'][name],digest(self.baseline[path].replace(b'\n',b'\r\n')))
  with self.assertRaises(FileExistsError):self.run_package()
 def test_personal_code_change_refuses_packaging(self):
  self.current[pack.PERSONAL_FILES[0]]=b'changed'
  with self.assertRaisesRegex(ValueError,'Personal runtime code changed'):self.run_package()
  self.assertFalse((self.root/'out').exists())
 def test_tampered_deployed_artifact_refuses_packaging(self):
  self.archive.write_bytes(b'bad')
  with self.assertRaisesRegex(ValueError,'artifact identity mismatch'):self.run_package()
 def test_mismatched_release_sha_refused(self):
  with self.assertRaisesRegex(ValueError,'Release name'):pack.main(self.root/'out','20261020-aaaaaaaa-dashboard',self.archive,self.manifest)
 def test_unexpected_runtime_delta_refused(self):
  with patch.object(pack,'BACKEND_FILES',pack.BACKEND_FILES+['backend/src/extra.ts']):
   # Diff stub sees the changed list too, so override diff only.
   original=self.git
   with patch.object(pack,'git',side_effect=lambda *args: '\n'.join(pack.BACKEND_FILES[:-1]).encode() if args[0]=='diff' else original(*args)):
    with self.assertRaisesRegex(ValueError,'Unexpected backend delta'):self.run_package()
