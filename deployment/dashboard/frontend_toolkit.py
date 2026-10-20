"""Frontend-only release switching. Import and --help have no side effects."""
import argparse
import hashlib
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import urllib.request
import uuid
from datetime import datetime, timezone

BASE = Path('/home/ec2-user/paisa-mart-new/backend')
TOOLKIT = Path('/home/ec2-user/paisa-mart-deployment')
MASTER = 'FINAL-GOOD-20261006'
MASTER_HASH = '12ade36e0f27ffe256d7e466ef062204db0477520ac12c14dfcf319085d41c9a'


def tree_hashes(directory):
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError(f'Expected a real directory: {directory}')
    result = {}
    for root, dirs, files in os.walk(directory, followlinks=False):
        for name in dirs + files:
            item = Path(root) / name
            if item.is_symlink():
                raise ValueError(f'Symlinks are not permitted: {item}')
            if name in files:
                if not item.is_file():
                    raise ValueError(f'Not a regular file: {item}')
                result[str(item.relative_to(directory))] = hashlib.sha256(item.read_bytes()).hexdigest()
    if 'index.html' not in result:
        raise ValueError('Release must contain index.html at its root')
    return result


def select_source(name, backup=False, recovery=False):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', name) or name in ('.', '..'):
        raise ValueError('Supply a release name, not a path')
    if name == MASTER and (backup or not recovery):
        raise ValueError('FINAL-GOOD-20261006 is emergency recovery only; use rollback.py --release explicitly')
    parent = BASE / ('.frontend-backups' if backup else '.frontend-releases')
    if parent.is_symlink() or parent.resolve().parent != BASE.resolve():
        raise ValueError('Unexpected release/backup directory location')
    source = parent / name
    hashes = tree_hashes(source)
    if name == MASTER and hashes['index.html'] != MASTER_HASH:
        raise ValueError('Emergency master checksum does not match the approved handoff')
    return source, hashes


def verify():
    script = TOOLKIT / 'verify.py'
    if not script.is_file():
        raise RuntimeError('Installed verify.py is required')
    result = subprocess.run(['python3', str(script)], capture_output=True, text=True, timeout=60)
    print(result.stdout, end='')
    if result.returncode or 'FAILED' in (result.stdout + result.stderr).upper():
        raise RuntimeError('verify.py failed; stopping')
    for url in ('http://127.0.0.1:3000/health', 'https://paisa-mart.com/'):
        with urllib.request.urlopen(url, timeout=15) as response:
            if response.status != 200:
                raise RuntimeError(f'Health check failed: {url}')


def switch(source, expected):
    """Call only after verification, lock, and exact-name confirmation."""
    public = BASE / 'public'
    before = tree_hashes(public)
    backups = BASE / '.frontend-backups'
    if backups.is_symlink():
        raise ValueError('Backup directory cannot be a symlink')
    backups.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8]
    backup = backups / ('before-' + stamp)
    # Finish a verified backup before replacing any production files.
    shutil.copytree(public, backup)
    if tree_hashes(backup) != before:
        raise RuntimeError('Backup checksum verification failed; production is unchanged')
    staged = Path(tempfile.mkdtemp(prefix='.frontend-staging-', dir=BASE))
    previous = BASE / ('.frontend-previous-' + stamp)
    failed = BASE / ('.frontend-failed-' + stamp)
    try:
        shutil.copytree(source, staged, dirs_exist_ok=True)
        if tree_hashes(staged) != expected or tree_hashes(source) != expected:
            raise RuntimeError('Release changed during preparation; production is unchanged')
        if tree_hashes(public) != before:
            raise RuntimeError('Production changed during preparation; stopping')
        public.rename(previous)
        try:
            staged.rename(public)
            verify()
            if tree_hashes(public) != expected:
                raise RuntimeError('Published files do not match the selected release')
        except BaseException:
            if public.exists():
                public.rename(failed)
            previous.rename(public)
            print(f'Previous production restored. Verified backup: {backup}')
            raise
        print(f'Published {source.name}. Previous-production backup: {backup}')
        print(f'Previous files also retained at {previous}')
        print('Open the site in Incognito and verify Home, Products, Login, Dashboard and changed pages.')
        print('HTTP 200 alone does not confirm the correct design.')
    finally:
        # Remove only our unused staging copy; never the selected release or master.
        if staged.exists():
            shutil.rmtree(staged)


def main(rollback=False):
    parser = argparse.ArgumentParser(description='Restore an explicitly selected frontend build.' if rollback else 'Deploy an approved frontend release without restarting the backend.')
    if rollback:
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument('--release', help='Release name; emergency master requires this explicit option')
        group.add_argument('--backup', help='Explicit OLD-production backup name')
    else:
        parser.add_argument('release', help='New approved release name; never the emergency master')
    parser.add_argument('--dry-run', action='store_true', help='Read-only validation; no files created or changed')
    args = parser.parse_args()
    backup = bool(getattr(args, 'backup', None))
    name = args.backup if backup else args.release
    try:
        source, expected = select_source(name, backup=backup, recovery=rollback)
        tree_hashes(BASE / 'public')
        print(f'Selected {"OLD-production backup" if backup else "release"}: {source}')
        print(f'index.html SHA256: {expected["index.html"]}')
        verify()
        if args.dry_run:
            print('Read-only validation complete. No files changed.')
            return 0
        if input(f'Type the exact name "{name}" to confirm: ').strip() != name:
            print('Cancelled. Production unchanged.')
            return 1
        import fcntl  # EC2/Linux only; --help and dry-run need no lock file.
        with (TOOLKIT / '.frontend-switch.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            verify()
            source, latest = select_source(name, backup=backup, recovery=rollback)
            if latest != expected:
                raise RuntimeError('Selected release changed after confirmation')
            switch(source, expected)
        return 0
    except (Exception, KeyboardInterrupt) as error:
        print(f'STOPPED: {error}')
        return 1
