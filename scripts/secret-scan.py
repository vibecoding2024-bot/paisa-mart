#!/usr/bin/env python3
"""Redacted secret scan of Git-tracked files (and archives inside them).

Prints only: location, provider guess, variable name, and a MASKED identifier
(first 4 characters, length, and the first 8 hex of its SHA-256 so findings can be matched across files).
It never prints a complete secret. Exit code 1 if any finding is not allowlisted.

Usage: python scripts/secret-scan.py [--paths FILE...]   (default: every file from `git ls-files`)
"""
import fnmatch, hashlib, io, re, subprocess, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_SUFFIX = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.ttf', '.otf', '.woff', '.woff2', '.mp4', '.pdf', '.lock', '.keystore', '.jar')
SKIP_NAMES = ('bun.lock', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock')
# Placeholders and well-known public values that are not secrets.
PLACEHOLDER = re.compile(r'^(?:<[^>]*>|x{4,}|\*{3,}|changeme|replace[-_ ]?me|your[-_ ].*|example.*|test[-_ ].*|dummy.*|placeholder.*|\$\{?[A-Z_]+\}?|process\.env.*|android)$', re.I)

PATTERNS = [
    ('Private key', re.compile(r'-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----')),
    ('AWS access key', re.compile(r'\b(AKIA|ASIA)[0-9A-Z]{16}\b')),
    ('Anthropic', re.compile(r'\bsk-ant-[A-Za-z0-9_-]{20,}')),
    ('OpenAI', re.compile(r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}')),
    ('Google API key', re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b')),
    ('xAI (Grok)', re.compile(r'\bxai-[A-Za-z0-9]{20,}')),
    ('Groq', re.compile(r'\bgsk_[A-Za-z0-9]{20,}')),
    ('GitHub token', re.compile(r'\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}')),
    ('Slack token', re.compile(r'\bxox[abpr]-[A-Za-z0-9-]{10,}')),
    ('Stripe', re.compile(r'\b(?:sk|rk)_live_[A-Za-z0-9]{16,}')),
    ('JWT', re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}')),
]
ASSIGN = re.compile(r'''(?ix)\b([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|API[_-]?KEY|APIKEY|AUTH[_-]?KEY|AUTHKEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|SALT[_-]?KEY|ED[_-]?KEY|CLIENT[_-]?SECRET|WEBHOOK[_-]?SECRET|DATABASE_URL|POSTGRES_URL)[A-Z0-9_]*)
    \s*[:=]\s*['"]?([^\s'"#,;]{8,})''')

PROVIDER_BY_NAME = [
    ('ANTHROPIC', 'Anthropic'), ('OPENAI', 'OpenAI'), ('GROK', 'xAI (Grok)'), ('XAI', 'xAI (Grok)'), ('GOOGLE', 'Google'),
    ('GEMINI', 'Google (Gemini)'), ('ELEVENLABS', 'ElevenLabs'), ('NANOBANANA', 'Nano Banana'), ('REPLICATE', 'Replicate'),
    ('GROQ', 'Groq'), ('PERPLEXITY', 'Perplexity'), ('MSG91', 'MSG91'), ('VIMOPAY', 'VimoPay'), ('AWS', 'AWS'),
    ('STRIPE', 'Stripe'), ('SUPABASE', 'Supabase'), ('FIREBASE', 'Firebase'), ('DATABASE', 'Database'), ('POSTGRES', 'Database'),
    ('AUTH_TOKEN_SECRET', 'Paisa Mart (app secret)'), ('HOME_LOAN_ADMIN', 'Paisa Mart (app secret)'), ('ADMIN', 'Paisa Mart (app secret)'),
    ('VIBECODE', 'Vibecode'),
]

def mask(value: str) -> str:
    return f"{value[:4]}… (len {len(value)}, sha256:{hashlib.sha256(value.encode()).hexdigest()[:8]})"

def provider_for(name: str, fallback: str) -> str:
    upper = name.upper()
    return next((p for key, p in PROVIDER_BY_NAME if key in upper), fallback)

def scan_text(location: str, text: str, findings: list):
    for lineno, line in enumerate(text.splitlines(), 1):
        seen = set()
        for provider, pattern in PATTERNS:
            for m in pattern.finditer(line):
                value = m.group(0)
                if value in seen: continue
                seen.add(value)
                findings.append((f'{location}:{lineno}', provider, '-', mask(value)))
        for m in ASSIGN.finditer(line):
            name, value = m.group(1), m.group(2)
            if value in seen or PLACEHOLDER.match(value) or value.lower() in ('true', 'false', 'null', 'undefined'): continue
            if re.fullmatch(r'[A-Za-z_][A-Za-z0-9_.]*(\(.*)?', value) and not re.search(r'\d', value):  # an identifier/expression, not a literal
                continue
            if re.search(r'[(){}!$]|=>', value) or value.startswith(('z.', 'Record<')):  # code, not a literal value
                continue
            seen.add(value)
            findings.append((f'{location}:{lineno}', provider_for(name, 'Unknown'), name, mask(value)))

def scan_bytes(location: str, data: bytes, findings: list, depth=0):
    if data[:4] == b'PK\x03\x04' and depth < 3:
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            for info in zf.infolist():
                if info.is_dir() or info.file_size > 5_000_000: continue
                name = info.filename
                if '/node_modules/' in '/' + name or name.endswith(SKIP_SUFFIX): continue
                scan_bytes(f'{location}!/{name}', zf.read(info), findings, depth + 1)
        return
    if b'\x00' in data[:4096]: return  # binary
    scan_text(location, data.decode('utf-8', 'replace'), findings)

def main():
    args = sys.argv[1:]
    paths = args[args.index('--paths') + 1:] if '--paths' in args else \
        subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines()
    findings = []
    for rel in paths:
        p = ROOT / rel
        if not p.is_file() or rel.endswith(SKIP_SUFFIX) or Path(rel).name in SKIP_NAMES: continue
        scan_bytes(rel, p.read_bytes(), findings)
    allow = load_allowlist()
    blocking, allowed = [], []
    for f in findings:
        loc, provider, name = f[0], f[1], f[2]
        path = loc.split('!/')[0].rsplit(':', 1)[0]
        # The allowlist covers only generic NAME=value matches (synthetic test values, doc placeholders);
        # provider-format keys (sk-, AKIA, AIza, private keys, ...) are never allowlisted.
        (allowed if name != '-' and any(fnmatch.fnmatch(path, g) for g in allow) else blocking).append(f)
    for loc, provider, name, masked in blocking:
        print(f'{provider:24} {name:34} {masked:48} {loc}')
    print(f'\n{len(blocking)} finding(s) needing action; {len(allowed)} allowlisted (synthetic test values / doc placeholders); '
          f'{len(paths)} path(s) scanned. Values are masked.')
    sys.exit(1 if blocking else 0)

def load_allowlist():
    p = ROOT / 'scripts' / 'secret-scan-allowlist.txt'
    if not p.exists(): return []
    return [l.split('#', 1)[0].strip() for l in p.read_text().splitlines() if l.split('#', 1)[0].strip()]

if __name__ == '__main__':
    main()
