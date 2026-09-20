"""Frontend-only deployment on the existing Sydney EC2 instance. No dependencies."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import signal
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from urllib.parse import quote

INSTANCE = "i-0e6f35bc4e48cde49"
REGION = "ap-southeast-2"
VERSION = "4e19e00"
HERE = Path(__file__).resolve().parent


def run(*args):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=90)
    if result.returncode:
        # Do not print command arguments, which could include transient credentials.
        raise RuntimeError(f"{Path(args[0]).name} failed (exit {result.returncode})")
    return result.stdout


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def within(root, name):
    rel = PurePosixPath(name)
    if rel.is_absolute() or ".." in rel.parts or "\\" in name or not name or ":" in name:
        raise ValueError("Unsafe release path")
    target = root.joinpath(*rel.parts)
    if not target.resolve().is_relative_to(root.resolve()):
        raise ValueError("Release path leaves its target directory")
    for candidate in (target, *target.parents):
        if candidate == root.parent:
            break
        if candidate.is_symlink():
            raise ValueError("Symlink in deployment path")
    return target


def atomic_copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix=".paisa-deploy-", dir=target.parent)
    try:
        with os.fdopen(fd, "wb") as out, Path(source).open("rb") as inp:
            shutil.copyfileobj(inp, out)
            out.flush()
            os.fsync(out.fileno())
        os.chmod(temp, 0o644)
        os.replace(temp, target)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def require_instance():
    token = run("curl", "--noproxy", "*", "-fsS", "--max-time", "5", "-X", "PUT",
                "-H", "X-aws-ec2-metadata-token-ttl-seconds: 60",
                "http://169.254.169.254/latest/api/token").decode().strip()
    identity = json.loads(run("curl", "--noproxy", "*", "-fsS", "--max-time", "5",
                              "-H", "X-aws-ec2-metadata-token: " + token,
                              "http://169.254.169.254/latest/dynamic/instance-identity/document"))
    if identity.get("instanceId") != INSTANCE or identity.get("region") != REGION:
        raise RuntimeError("This is not the intended Paisa Mart EC2 instance")


def app_directory():
    processes = json.loads(run("pm2", "jlist"))
    matches = [p["pm2_env"] for p in processes if p.get("name") == "paisa-mart"]
    if len(matches) != 1 or matches[0].get("status") != "online":
        raise RuntimeError("Expected exactly one online PM2 process named paisa-mart")
    app = Path(matches[0]["pm_cwd"]).resolve()
    if not any(app.is_relative_to(Path(prefix)) for prefix in ("/home/ec2-user", "/opt", "/srv", "/var/www")):
        raise RuntimeError("Unexpected backend path; review it before deployment")
    source = app / "src/index.ts"
    text = source.read_text()
    if not re.search(r'PUBLIC_DIR\s*=\s*import\.meta\.dir\s*\+\s*[\"\x27]/\.\./public[\"\x27]', text):
        raise RuntimeError("Cannot confirm the backend's public directory")
    if not re.search(r'html\.includes\([\"\x27]paisa-web-polish[\"\x27]\)', text):
        raise RuntimeError("The backend does not support this frontend compatibility marker")
    public = app / "public"
    if public.is_symlink() or not (public / "index.html").is_file():
        raise RuntimeError("Expected a normal backend/public folder with index.html")
    return app, public


def curl(url, host=None):
    args = ["curl", "--noproxy", "*", "-fsS", "--connect-timeout", "5", "--max-time", "30"]
    if host:
        args += ["--resolve", f"{host}:443:127.0.0.1"]
    return run(*args, url)


def healthy():
    if json.loads(curl("http://127.0.0.1:3000/health")).get("status") != "ok":
        raise RuntimeError("Backend health check failed")


def extract_release(archive, manifest, stage):
    if sha(archive) != manifest["archive_sha256"]:
        raise RuntimeError("Release archive checksum mismatch")
    with tarfile.open(archive, "r:gz") as tar:
        members = tar.getmembers()
        names = [m.name for m in members]
        if len(set(names)) != len(names) or set(names) != set(manifest["files"]):
            raise RuntimeError("Release archive and manifest do not match")
        for member in members:
            target = within(stage, member.name)
            if not member.isfile() or member.size > 30 * 1024 * 1024:
                raise RuntimeError("Release contains an unexpected entry")
            target.parent.mkdir(parents=True, exist_ok=True)
            with tar.extractfile(member) as source, target.open("wb") as out:
                shutil.copyfileobj(source, out)
            if sha(target) != manifest["files"][member.name]:
                raise RuntimeError("Release file checksum mismatch")
    if f'name="paisa-design-version" content="{VERSION}"' not in (stage / "index.html").read_text():
        raise RuntimeError("Wrong design version")


def restore(backup, public):
    saved = backup / "public"
    state = json.loads((backup / "state.json").read_text())
    if state["public"] != str(public) or sha(saved / "index.html") != state["previous_index_sha256"]:
        raise RuntimeError("Backup does not match this deployment target")
    # Existing files are restored before the previous index becomes visible.
    # New content-hashed assets can safely remain for clients holding the new HTML.
    for name in state["files"]:
        source = within(saved, name)
        if name != "index.html" and source.is_file():
            atomic_copy(source, within(public, name))
    atomic_copy(saved / "index.html", public / "index.html")


def check_release(public, manifest):
    healthy()
    expected = (public / "index.html").read_bytes()
    for host in ("paisa-mart.com", "www.paisa-mart.com"):
        if curl(f"https://{host}/?design-check={VERSION}", host) != expected:
            raise RuntimeError(f"HTTPS HTML verification failed for {host}")
    # Check every file on disk, and the referenced scripts/styles through HTTPS.
    for name, expected_sha in manifest["files"].items():
        if sha(within(public, name)) != expected_sha:
            raise RuntimeError("Published asset checksum mismatch")
        if name.startswith("_expo/"):
            response = curl("https://www.paisa-mart.com/" + quote(name), "www.paisa-mart.com")
            if hashlib.sha256(response).hexdigest() != expected_sha:
                raise RuntimeError("HTTPS script/style verification failed")


def deploy(app, public):
    manifest = json.loads((HERE / "manifest.json").read_text())
    if manifest.get("design_commit") != VERSION:
        raise RuntimeError("Unexpected release version")
    if sha(public / "index.html") == manifest["files"]["index.html"]:
        check_release(public, manifest)
        print("This approved release is already installed and healthy.")
        return
    healthy()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + VERSION
    stage = within(app, ".frontend-releases/" + stamp)
    backup = within(app, ".frontend-backups/" + stamp)
    size = sum(p.stat().st_size for p in public.rglob("*") if p.is_file())
    if shutil.disk_usage(app).free < size + 100 * 1024 * 1024:
        raise RuntimeError("Insufficient free space for a complete frontend backup")
    if any(p.is_symlink() for p in public.rglob("*")):
        raise RuntimeError("Review public directory symlinks before deployment")
    stage.mkdir(parents=True, exist_ok=False)
    extract_release(HERE / "approved-web.tar.gz", manifest, stage)
    for name in manifest["files"]:
        target = within(public, name)
        if target.exists() and not target.is_file():
            raise RuntimeError("Asset path conflicts with an existing directory")
    backup.mkdir(parents=True, exist_ok=False)
    shutil.copytree(public, backup / "public")
    state = {"public": str(public), "design_commit": VERSION,
             "previous_index_sha256": sha(public / "index.html"), "files": list(manifest["files"])}
    (backup / "state.json").write_text(json.dumps(state, indent=2) + "\n")
    shutil.copy2(__file__, backup / "deploy_frontend.py")
    print("Frontend backup:", backup, flush=True)
    # SIGTERM is converted to an exception so a interrupted publish is restored.
    signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        for name in manifest["files"]:
            if name != "index.html":
                atomic_copy(within(stage, name), within(public, name))
        atomic_copy(stage / "index.html", public / "index.html")
        check_release(public, manifest)
    except BaseException:
        restore(backup, public)
        print("Deployment verification failed. Previous frontend restored.", flush=True)
        raise
    print("PUBLISHED: approved design", VERSION)
    print("HTTPS verified: https://paisa-mart.com/ and https://www.paisa-mart.com/")
    print("Backend process, source, environment, database, DNS and SSL were not modified.")
    print("Rollback command:")
    import shlex
    print("python3 " + shlex.quote(str(backup / "deploy_frontend.py")) + " --rollback " + shlex.quote(str(backup)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rollback", type=Path)
    args = parser.parse_args()
    require_instance()
    app, public = app_directory()
    # Serialize publishing/rollback without changing the running application.
    import fcntl
    with (app / ".frontend-deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args.rollback:
            backup = args.rollback.resolve()
            if not backup.is_relative_to((app / ".frontend-backups").resolve()):
                raise RuntimeError("Backup must belong to this backend")
            restore(backup, public)
            healthy()
            print("Previous frontend restored from", backup)
        else:
            deploy(app, public)


if __name__ == "__main__":
    try:
        main()
    except (Exception, KeyboardInterrupt) as error:
        print("Stopped:", str(error) or type(error).__name__, file=sys.stderr)
        sys.exit(1)
