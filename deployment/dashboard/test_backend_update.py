"""Isolated tests. PM2, Bun and network are replaced; all paths are temporary."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import signal
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('backend-update.py').resolve()

def load():
    spec = importlib.util.spec_from_file_location('review_backend_update', SCRIPT)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m

def digest(data): return hashlib.sha256(data).hexdigest()

class IsolatedUpdateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='paisa-backend-safety-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.assertTrue(self.root.resolve().is_relative_to(Path(tempfile.gettempdir()).resolve()))
        self.m = load()
        self.m.APP = self.root/'backend'
        self.m.DB = self.root/'payments.db'
        self.m.BACKUP = self.root/'backup'
        self.m.STAGE = self.root/'stage'
        self.m.LOCK = self.root/'backend.lock'
        self.m.OLD = {}; self.m.NEW = {}
        self.old_bytes = {'src/routes/home-loans.ts':b'original route', 'src/lib/home-loan-pipeline.ts':b'original pipeline', 'src/index.ts':b'unchanged index', 'package.json':b'{}'}
        self.new_bytes = {'src/routes/home-loans.ts':b'new route', 'src/lib/home-loan-pipeline.ts':b'new pipeline', 'src/lib/customer-token.ts':b'new verifier'}
        for name, data in self.old_bytes.items():
            p = self.m.APP/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(data)
            self.m.OLD[name] = digest(data)
        self.m.OLD['src/lib/customer-token.ts'] = 'MISSING'
        for name,data in self.new_bytes.items():
            p=self.m.STAGE/'files'/name; p.parent.mkdir(parents=True,exist_ok=True); p.write_bytes(data)
            self.m.NEW[name]=digest(data)
        (self.m.APP/'.env').write_text('TEST_ONLY=yes')
        with sqlite3.connect(self.m.DB) as db:
            db.execute('CREATE TABLE leads(id INTEGER PRIMARY KEY, stage TEXT)')
            db.execute("INSERT INTO leads VALUES (1, 'new')")
        db.close()
        self.live_db_hash=digest(self.m.DB.read_bytes())
        self.status='online'; self.controls=[]; self.restart_attempts=0
        self.fail_restart_once=False; self.fail_restart_always=False; self.interrupt_stop=False
        self.term_stop=False; self.second_interrupt_in_recovery=False
        self.health_calls=0; self.network_calls=0
        self.addCleanup(patch.stopall)
        patch.object(self.m,'process',side_effect=self.fake_process).start()
        patch.object(self.m.subprocess,'run',side_effect=self.fake_run).start()
        patch.object(self.m,'health',side_effect=self.fake_health).start()
        patch.object(self.m,'urlopen',side_effect=AssertionError('Network forbidden in isolated tests')).start()
        patch.object(self.m,'command',side_effect=AssertionError('Actual PM2 command forbidden')).start()
        real_connect=sqlite3.connect
        def local_connect(database,*args,**kwargs):
            value=str(database)
            if value.startswith('file:'):
                from urllib.parse import unquote,urlsplit
                value=unquote(urlsplit(value).path)
                if os.name=='nt' and value.startswith('/'): value=value[1:]
            self.assertTrue(Path(value).resolve().is_relative_to(self.root.resolve()), 'Non-test DB access')
            return real_connect(database,*args,**kwargs)
        patch.object(self.m.sqlite3,'connect',side_effect=local_connect).start()
    def fake_process(self):
        return {'name':'paisa-mart','pm_id':7,'pid':123,'pm2_env':{'status':self.status,'pm_cwd':str(self.m.APP),'pm_exec_path':'/fake/bun','args':['run','src/index.ts']}}
    def fake_health(self):
        self.health_calls+=1
        self.assertEqual(self.status,'online')
    def fake_run(self,args,**kwargs):
        if args[0]=='/fake/bun':
            self.assertEqual(kwargs['cwd'],self.m.APP)
            return subprocess.CompletedProcess(args,0)
        self.assertEqual(args[0],'pm2')
        self.assertEqual(args[2],'7')
        self.controls.append(tuple(args))
        if args[1]=='stop':
            self.status='stopped'
            if self.interrupt_stop:
                self.interrupt_stop=False
                raise KeyboardInterrupt()
            if self.term_stop:
                self.term_stop=False
                signal.raise_signal(signal.SIGTERM)
        elif args[1]=='restart':
            self.restart_attempts+=1
            if self.fail_restart_always or (self.fail_restart_once and self.restart_attempts==1):
                raise subprocess.CalledProcessError(1,args)
            if self.second_interrupt_in_recovery and self.restart_attempts==2:
                signal.raise_signal(signal.SIGINT)
                signal.raise_signal(signal.SIGTERM)
            self.status='online'
        else: self.fail('Unexpected process command')
        return subprocess.CompletedProcess(args,0)
    def assert_original(self):
        for name,data in self.old_bytes.items(): self.assertEqual((self.m.APP/name).read_bytes(),data)
        self.assertFalse((self.m.APP/'src/lib/customer-token.ts').exists())
        self.assertEqual(digest(self.m.DB.read_bytes()),self.live_db_hash)
    def test_update_and_rollback_leave_deployed_personal_files_untouched(self):
        personal = ['src/routes/personal-loans.ts', 'src/routes/personal-loan-applications.ts', 'src/lib/personal-loan-application-store.ts', 'src/lib/personal-loan-lead-store.ts']
        for name in personal:
            data = ('deployed Personal: ' + name).encode()
            path = self.m.APP/name; path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
            self.old_bytes[name] = data; self.m.OLD[name] = digest(data)
        self.m.update()
        for name in personal: self.assertEqual((self.m.APP/name).read_bytes(), self.old_bytes[name])
        self.m.rollback()
        self.assert_original()

    def test_successful_update(self):
        self.m.update()
        for name,data in self.new_bytes.items(): self.assertEqual((self.m.APP/name).read_bytes(),data)
        self.assertEqual(self.status,'online')
        self.assertEqual(self.controls,[('pm2','stop','7'),('pm2','restart','7')])
        self.assertEqual(digest(self.m.DB.read_bytes()),self.live_db_hash)
        self.m.prepare_restore()
    def test_failed_restart_recovers_original_backend(self):
        self.fail_restart_once=True
        with self.assertRaises(subprocess.CalledProcessError): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
        self.assertEqual(self.restart_attempts,2)
    def test_failed_restart_during_rollback_recovers_original_backend(self):
        self.m.update(); self.restart_attempts=0; self.fail_restart_once=True
        with self.assertRaises(subprocess.CalledProcessError): self.m.rollback()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_lock_is_held_during_recovery(self):
        self.fail_restart_once=True
        base=self.m.restart_process
        def locked_restart(identity):
            with self.assertRaisesRegex(RuntimeError,'Another backend'):
                with self.m.operation_lock(): pass
            return base(identity)
        with patch.object(self.m,'restart_process',side_effect=locked_restart):
            with self.assertRaises(subprocess.CalledProcessError): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_successful_rollback(self):
        self.m.update(); self.controls.clear()
        self.m.rollback()
        self.assert_original(); self.assertEqual(self.status,'online')
        self.assertEqual(self.controls,[('pm2','stop','7'),('pm2','restart','7')])
    def test_corrupt_backup_rejected_before_stop(self):
        self.m.update(); self.controls.clear()
        (self.m.BACKUP/'src/routes/home-loans.ts').write_bytes(b'corrupt')
        with self.assertRaisesRegex(RuntimeError,'Backup checksum'): self.m.rollback()
        self.assertEqual(self.controls,[]); self.assertEqual(self.status,'online')
    def test_missing_backup_rejected_before_stop(self):
        self.m.update(); self.controls.clear()
        (self.m.BACKUP/'src/lib/home-loan-pipeline.ts').unlink()
        with self.assertRaisesRegex(RuntimeError,'Backup checksum'): self.m.rollback()
        self.assertEqual(self.controls,[]); self.assertEqual(self.status,'online')
    def test_backup_database_corruption_rejected_before_stop(self):
        self.m.update(); self.controls.clear()
        (self.m.BACKUP/'payments.db').write_bytes(b'corrupt')
        with self.assertRaisesRegex(RuntimeError,'Backup checksum'): self.m.rollback()
        self.assertEqual(self.controls,[])
    def test_keyboard_interrupt_during_first_stop_recovers(self):
        self.interrupt_stop=True
        with self.assertRaises(KeyboardInterrupt): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_keyboard_interrupt_after_partial_install_recovers(self):
        original=self.m.atomic_write; once=[True]
        def interrupted(*args):
            original(*args)
            if once[0]: once[0]=False; raise KeyboardInterrupt()
        with patch.object(self.m,'atomic_write',side_effect=interrupted):
            with self.assertRaises(KeyboardInterrupt): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_interrupt_during_completion_marker_recovers(self):
        original=self.m.atomic_write
        def interrupted(target,*args):
            original(target,*args)
            if target == self.m.BACKUP/'update-complete': raise KeyboardInterrupt()
        with patch.object(self.m,'atomic_write',side_effect=interrupted):
            with self.assertRaises(KeyboardInterrupt): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
        self.assertFalse((self.m.BACKUP/'update-complete').exists())
    def test_verified_backup_bytes_are_preloaded_before_stop(self):
        self.m.update(); self.controls.clear()
        actual_run=self.fake_run
        deleted=[False]
        def after_stop(args,**kwargs):
            result=actual_run(args,**kwargs)
            if args[:2]==['pm2','stop'] and not deleted[0]:
                deleted[0]=True
                (self.m.BACKUP/'src/routes/home-loans.ts').unlink()
            return result
        with patch.object(self.m.subprocess,'run',side_effect=after_stop): self.m.rollback()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_keyboard_interrupt_during_rollback_recovers(self):
        self.m.update()
        original=self.m.atomic_write; once=[True]
        def interrupted(*args):
            original(*args)
            if once[0]: once[0]=False; raise KeyboardInterrupt()
        with patch.object(self.m,'atomic_write',side_effect=interrupted):
            with self.assertRaises(KeyboardInterrupt): self.m.rollback()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_sigterm_after_stop_recovers(self):
        self.term_stop=True
        with self.assertRaises(InterruptedError): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
    def test_repeated_signals_during_recovery_do_not_abort_it(self):
        self.fail_restart_once=True; self.second_interrupt_in_recovery=True
        old_int=signal.getsignal(signal.SIGINT);old_term=signal.getsignal(signal.SIGTERM)
        with self.assertRaises(subprocess.CalledProcessError): self.m.update()
        self.assert_original(); self.assertEqual(self.status,'online')
        self.assertEqual(signal.getsignal(signal.SIGINT),old_int)
        self.assertEqual(signal.getsignal(signal.SIGTERM),old_term)
    def test_recovery_failure_reports_service_uncertainty(self):
        self.fail_restart_always=True
        with self.assertRaisesRegex(RuntimeError,'Recovery could not be confirmed'): self.m.update()
        self.assert_original();self.assertEqual(self.status,'stopped')
        with self.m.operation_lock(): pass
    def test_concurrent_process_cannot_take_lock_then_can_after_release(self):
        code = "import importlib.util,sys;from pathlib import Path;s=importlib.util.spec_from_file_location('m',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);m.LOCK=Path(sys.argv[2]);\ntry:\n with m.operation_lock(): print('acquired')\nexcept RuntimeError:\n sys.exit(23)"
        def child():
            p=subprocess.Popen([sys.executable,'-c',code,str(SCRIPT),str(self.m.LOCK)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            stdout,stderr=p.communicate(timeout=10)
            return p.returncode,stdout,stderr
        with self.m.operation_lock(): self.assertEqual(child()[0],23)
        result=child();self.assertEqual(result[0],0,result[2]);self.assertIn('acquired',result[1])
    def test_both_entrypoints_obey_lock(self):
        with self.m.operation_lock():
            for op in (self.m.update,self.m.rollback):
                with self.assertRaisesRegex(RuntimeError,'Another backend'): op()
        self.assertEqual(self.controls,[])
    def test_unchanged_file_drift_rejected_before_rollback_stop(self):
        self.m.update(); self.controls.clear()
        (self.m.APP/'src/index.ts').write_bytes(b'unexpected live change')
        with self.assertRaisesRegex(RuntimeError,'Unexpected live file'): self.m.rollback()
        self.assertEqual(self.controls,[])

if __name__ == '__main__': unittest.main(verbosity=2)
