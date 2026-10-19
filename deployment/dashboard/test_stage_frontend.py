import hashlib, importlib.util, io, json, tarfile, tempfile, unittest
from pathlib import Path
class StagingTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  spec=importlib.util.spec_from_file_location('stage',Path(__file__).with_name('stage-frontend.py'));self.m=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.m);self.m.BASE=self.root/'releases';self.m.BASE.mkdir()
  self.archive=self.root/'web.tar.gz';self.manifest=self.root/'manifest.json'
 def prepare(self,name='20261020-test-dashboard',member='index.html'):
  data=b'<html>test</html>'
  with tarfile.open(self.archive,'w:gz') as t:
   i=tarfile.TarInfo(member);i.size=len(data);t.addfile(i,io.BytesIO(data))
  self.manifest.write_text(json.dumps({'release_name':name,'archive_sha256':hashlib.sha256(self.archive.read_bytes()).hexdigest(),'files':{member:hashlib.sha256(data).hexdigest()}}))
 def test_stage_and_refuse_overwrite(self):
  self.prepare();self.m.main(self.archive,self.manifest)
  self.assertTrue((self.m.BASE/'20261020-test-dashboard/index.html').exists())
  with self.assertRaises(FileExistsError):self.m.main(self.archive,self.manifest)
 def test_reject_traversal_and_master(self):
  for name,member in [('FINAL-GOOD-20261006','index.html'),('20261020-test-dashboard','../escape')]:
   self.prepare(name,member)
   with self.assertRaises(ValueError):self.m.main(self.archive,self.manifest)
 def test_checksum_failure_leaves_no_release(self):
  self.prepare();self.archive.write_bytes(b'changed')
  with self.assertRaises(ValueError):self.m.main(self.archive,self.manifest)
  self.assertEqual(list(self.m.BASE.iterdir()),[])
