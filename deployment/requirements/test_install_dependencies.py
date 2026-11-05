import importlib.util
from pathlib import Path
import tempfile
import shutil
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('dependency_installer',Path(__file__).with_name('install_dependencies.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class DependencyGuards(unittest.TestCase):
    def test_long_native_package_paths_copy_without_changing_global_settings(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve()
            try:
                source=root/'source';target=root/'target'
                relative=Path(*(['native-component-directory-1234567890']*7))/'fixture.h'
                original=m.copy_path(source/relative);original.parent.mkdir(parents=True);original.write_text('native fixture')
                m.copy_dependencies(source,target)
                self.assertEqual(m.copy_path(target/relative).read_text(),'native fixture')
            finally:
                # Only this test's resolved, newly created temporary directory.
                self.assertTrue(root.is_relative_to(Path(tempfile.gettempdir()).resolve()))
                shutil.rmtree(m.copy_path(root))
    def test_frozen_install_preserves_inputs_and_refuses_reused_dependencies(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)/'source';stage=Path(folder)/'stage'
            for name in ('mobile','backend'):
                (root/name).mkdir(parents=True)
                for file in ('package.json','bun.lock'):(root/name/file).write_text('{}')
            def run(command,**kwargs):
                self.assertIn('--frozen-lockfile',command);self.assertIn('--ignore-scripts',command)
                (kwargs['cwd']/'node_modules').mkdir();(kwargs['cwd']/'node_modules/fixture.txt').write_text('fixture')
            with patch.object(m,'ROOT',root),patch.object(m.subprocess,'check_output',return_value='test'),patch.object(m.subprocess,'run',side_effect=run):
                receipt=m.install(stage,'fake-bun')
                self.assertEqual(set(receipt['workspaces']),{'mobile','backend'})
                self.assertTrue((root/'node_modules').is_dir())
                self.assertEqual((root/'mobile/node_modules/fixture.txt').read_text(),'fixture')
                with self.assertRaisesRegex(ValueError,'preserved'):m.install(Path(folder)/'again','fake-bun')
    def test_staging_inside_checkout_is_refused(self):
        with tempfile.TemporaryDirectory() as folder,patch.object(m,'ROOT',Path(folder)):
            with self.assertRaisesRegex(ValueError,'outside'):m.install(Path(folder)/'stage','fake-bun')

if __name__=='__main__':unittest.main()
