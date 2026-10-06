"""Package a verified Expo web export for the existing Paisa Mart server."""
import gzip
import hashlib
import io
import json
from pathlib import Path
import sys
import tarfile

VERSION = "4e19e00"
HEAD = f'''<meta name="paisa-design-version" content="{VERSION}">
<meta name="theme-color" content="#112D46">
<meta name="description" content="Explore financial products and manage your Paisa Mart journey.">
<!-- The existing server recognizes this ID and skips its legacy phone frame. -->
<style id="paisa-web-polish">
html,body,#root{{height:100%;width:100%;margin:0;background:#F4F7FA}}
body{{overflow:hidden}}#root{{display:flex;flex:1}}
</style>
'''


def package(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    files = {}
    for path in sorted(source.rglob("*")):
        if path.is_symlink():
            raise ValueError("Symlinks are not permitted in a web export")
        if not path.is_file():
            continue
        name = path.relative_to(source).as_posix()
        if not (name in ("index.html", "metadata.json") or name.startswith(("assets/", "_expo/"))):
            raise ValueError(f"Unexpected export file: {name}")
        if path.suffix.lower() not in (".html", ".json", ".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ttf", ".woff", ".woff2", ".ico", ".webp"):
            raise ValueError(f"Unexpected asset type: {name}")
        files[name] = path.read_bytes()
    html = files["index.html"].decode("utf-8")
    if "paisa-design-version" in html or "paisa-web-polish" in html or html.count("</head>") != 1:
        raise ValueError("Use the original, unprocessed Expo export")
    files["index.html"] = html.replace("</head>", HEAD + "</head>").encode("utf-8")
    output.mkdir(parents=True, exist_ok=True)
    archive = output / "approved-web.tar.gz"
    with archive.open("wb") as raw, gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode="w") as tar:
            for name, data in files.items():
                info = tarfile.TarInfo(name)
                info.size, info.mode, info.mtime = len(data), 0o644, 0
                tar.addfile(info, io.BytesIO(data))
    manifest = {"design_commit": VERSION, "archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
                "files": {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Packaged {len(files)} files, {archive.stat().st_size:,} bytes; design {VERSION}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python prepare_web.py EXPO_EXPORT OUTPUT_DIRECTORY")
    package(*sys.argv[1:])
