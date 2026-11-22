# Exposed credentials: inventory and rotation plan (A-05), 22 Nov 2026

- **Status:** local cleanup done on branch `fix/play-store-remediation-20261122`, not pushed. **No credential has been rotated or revoked yet**; the owner does that in each provider account.
- **Masking:** identifiers show the first 4 characters, the length and the first 8 hex digits of the value's SHA-256. Complete values are never written here.

## 1. Inventory (from a redacted scan of the branch and of every blob in Git history)

| # | Provider | Variable | Masked identifier | Where it is exposed | Used by current code? |
|---|---|---|---|---|---|
| 1 | OpenAI | `OPENAI_API_KEY`, `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` | `sk-p…` (len 48, sha256:3ebe616a) | `backend/paisa-mart-mvp.zip` (4 `.env` files inside); history: `.env` (8861c06), `backend/.env` (82bf80c), `backend/.env.production`, `mobile/.env.production` | **No** |
| 2 | Anthropic | `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY` | `sk-a…` (len 53, sha256:25a3f962) | archive; history `.env`, `mobile/.env.production` | **No** |
| 3 | xAI (Grok) | `EXPO_PUBLIC_VIBECODE_GROK_API_KEY` | `xai-…` (len 44, sha256:2bd869f6) | archive; history `.env`, `mobile/.env.production` | **No** |
| 4 | Google (AI key; not the usual `AIza` format, so it may have been issued through Vibecode) | `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY` | `UeHo…` (len 40, sha256:c84c7617) | archive; history `.env`, `mobile/.env.production` | **No** |
| 5 | ElevenLabs | `EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY` | `elev…` (len 59, sha256:ccd7dc7b) | archive; history `.env`, `mobile/.env.production` | **No** |
| 6 | VimoPay | `VIMOPAY_SECRET_KEY` | `f377…` (len 32, sha256:f5eedd20) | history `backend/.env` (f423e2c, 9 Jun 2026; untracked on 11 Jul in f031066, but still in history) | **Yes:** `backend/src/lib/vimopay.ts` (AES-GCM encrypt/decrypt of gateway requests) |
| 7 | VimoPay | `VIMOPAY_SALT_KEY` | `bb13…` (len 32, sha256:43e6fcdb) | same commit | **Yes:** `lib/vimopay.ts` (GCM IV) |
| 8 | VimoPay | `VIMOPAY_ED_KEY` | `47cd…` (len 32, sha256:71b1051b) | same commit | **Yes:** `lib/vimopay.ts` (partner authorization) |
| 9 | Paisa Mart admin (demo) | README "Demo Credentials" (email and 8-character password) | password sha256:240be518 | `mobile/README.md` (now redacted) and its history; the archive | No code default. The admin password comes only from `HOME_LOAN_ADMIN_PASSWORD` and the staff accounts. |

**Also removed from the branch:**
- `backend/payments.db`: 3 UAT payment rows whose payloads may hold customer details. It is private data, not a credential.
- The public `/download` route that served the archive.

**Not found anywhere in the scanned history:**
- MSG91 keys;
- AWS keys;
- database passwords;
- private keys;
- the app token secrets (`AUTH_TOKEN_SECRET`, `HOME_LOAN_ADMIN_TOKEN_SECRET`);
- review-account values;
- an Android upload keystore or `keystore.properties`.

**Scope of the scan:**
- 469 tracked paths;
- 1,355 historical blobs from all local refs, including the zlib-compressed `.git` objects inside the archive;
- provider-format patterns plus secret-named assignments.

A dedicated scanner (e.g. GitHub secret scanning, gitleaks) is a useful second check.

**Exposure surface:**
- **GitHub:** the commits that added items 1–8 are on `origin/main` and at least 11 other branches of `vibecoding2024-bot/paisa-mart`. The repository's visibility could not be checked from here.
- **Copies:** any clone, fork or downloaded zip.
- **Former `/download` route:** it pointed at a Vibecode sandbox path, `/home/user/workspace/...`.
- **Built app bundles:** older `EXPO_PUBLIC_*` keys may be compiled into them, because `EXPO_PUBLIC_*` values are public by design.

## 2. Deleting files does not remove the exposure
- Removing the files from this branch stops new copies only.
- Every earlier commit on GitHub and in every clone still contains them, and they are recoverable with ordinary Git commands.
- **Rotation and revocation are the only effective fix.**
- Shared history has **not** been rewritten. Rewriting would mean:
  - `git filter-repo` or BFG on all branches;
  - a coordinated force-push;
  - GitHub support to purge cached views;
  - every collaborator re-cloning.

  It is an optional owner decision **after** rotation, and it does not replace rotation.

## 3. Rotation steps (owner, in each provider account; nothing is done remotely by the agent)

### Items 1–5: AI provider keys (OpenAI, Anthropic, xAI, Google, ElevenLabs)
The current app and backend do not use any of these keys, so revoking them breaks nothing.
1. **Find the key.** Sign in to the account where it was created. The `EXPO_PUBLIC_VIBECODE_*` names suggest they were issued through Vibecode's API/ENV tab, so check there first. Otherwise use the provider consoles:
   - OpenAI: platform.openai.com → API keys;
   - Anthropic: console.anthropic.com → API keys;
   - xAI: console.x.ai;
   - Google: aistudio.google.com or the Cloud console → Credentials;
   - ElevenLabs: elevenlabs.io → API keys.

   Match the key by its first 4 characters and its creation date (around May 2026).
2. **Check usage.** Review usage and billing since May 2026 for anything unexpected. Report misuse to the provider.
3. **Revoke** (delete or disable) the key. **No replacement is needed.**
4. **Validate.** The provider console shows the key as revoked or deleted. Do not test the old key against live APIs from a shared machine.
5. **If AI features are ever added:** keep keys server-side only, never in `EXPO_PUBLIC_*` variables.

### Items 6–8: VimoPay (payment gateway)
1. **Check whether production uses the exposed values** (EC2 Instance Connect, read-only; prints 8-hex fingerprints only):
   ```sh
   cd /home/ec2-user/paisa-mart-new/backend && python3 - <<'PY'
   import hashlib
   env = {}
   for line in open('.env'):
       if '=' in line and not line.lstrip().startswith('#'):
           k, v = line.split('=', 1); env[k.strip()] = v.strip().strip('"').strip("'")
   for k in ('VIMOPAY_SECRET_KEY', 'VIMOPAY_SALT_KEY', 'VIMOPAY_ED_KEY'):
       print(k, hashlib.sha256(env[k].encode()).hexdigest()[:8] if env.get(k) else 'unset in .env (check the PM2 environment)')
   PY
   ```
   - Matches with `f5eedd20`, `43e6fcdb` and `71b1051b` mean production uses the exposed keys.
   - If they differ, the exposed keys are older (UAT) keys; revoke them anyway.
2. **Request new keys** for your merchant user ID from VimoPay (merchant dashboard or account manager) for UAT and for production. At the same time, ask for the server-to-server transaction-status API or the callback-signature method (the A-03/A-04 follow-up).
3. **Replace** (separately authorized backend window):
   1. `cp -p .env .env.bak-$(date -u +%Y%m%dT%H%M%SZ)` (mode 600).
   2. Set the three new values in `.env`.
   3. Restart the backend through the guarded procedure.
4. **Validate:**
   - `GET /api/payment/config` shows `haveSecret`, `haveSalt` and `haveEd` true and `secretLen` 32 (no values shown);
   - `GET /api/payment/auth` returns `httpStatus 200` and `decryptOk true` (UAT);
   - one UAT payment can be created.
5. **Revoke:** ask VimoPay to disable the old keys, and get written confirmation. **Rollback before revocation:** restore `.env.bak-*`. After revocation, the only way back is a new key.

### Item 9: demo admin credentials
- Confirm the production admin password (`HOME_LOAN_ADMIN_PASSWORD`) and the staff passwords are not the demo value from the old README. If one is, change it in the server `.env` or the admin Staff page and restart in an authorized window.

### GitHub
- **Visibility:** check the repository under Settings → General. If it is or ever was public, treat every item above as fully compromised.
- **Alerts:** review the **Security → Secret scanning** alerts.

## 4. Signing material
- **`android/app/debug.keystore`:** the standard Android debug keystore. It is **kept** in Git, as intended for debug builds. It must never sign a release (audit A-49).
- **Upload keystore:** not tracked. Its location and credentials stay with the owner, outside Git. The agent did not read `keystore.properties`.
- **New ignore rules** block `*.jks`, `*.keystore` (except the debug keystore), `*.p12`, `*.pem`, `*.key`, `keystore.properties`, `.env*` (except `.env.example`), the source archive and local databases.
- **Preserved outside Git:** the removed `paisa-mart-mvp.zip` and `payments.db`, in a folder readable only by the owner's Windows account: `%USERPROFILE%\paisa-mart-secure\2026-11-22-removed-from-git\`. Delete them there once rotation is confirmed and they are no longer needed.

## 5. Checks
- **Scan of tracked files:** `python scripts/secret-scan.py` reports **0** findings needing action (exit 0). It reports 23 allowlisted generic matches: synthetic test values and documentation placeholders, listed in `scripts/secret-scan-allowlist.txt`. Provider-format keys are never allowlisted.
- **Scanner detection check:** the scanner still detects the keys in the preserved archive (17 findings, exit 1).
- **Regression test:** `scripts/no-secret-files.test.ts`. It fails if env files, the archive, backend databases or private keys are tracked again, if an example env file holds a secret value, or if `/download` serves the archive again.
