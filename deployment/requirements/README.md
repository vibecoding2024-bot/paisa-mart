# PR #6 guarded release procedure — AWS EC2 / SQLite

These are instructions for a later, separately authorized release. No feature-branch production package, upload, migration, restart or deployment was performed during review. Use this procedure only after the user approves merging the final reviewed PR head. Upload and deployment need separate authorization.

The implementation lives on `feature/loan-requirements-review-20261103` in `.requirements-review`. Preserve the dirty original `main`, other worktrees and all existing release directories. Do not run the server's obsolete `deploy.sh`: `/home/ec2-user/paisa-mart-new` is not a Git checkout. Never modify or use `FINAL-GOOD-20261006` for this release.

## 1. Build only approved merged main, in a new local checkout

Run PowerShell from the existing local repository. Supply the **full final PR head approved by the user**, including its handoff commit. The guard checks clean source, fetched main equality, reviewed ancestry, identical reviewed/merged trees, and exactly 11 runtime backend changes against `17eac94b39b708ee9e0979de0bda4efd551e6d24`. A squash/rebase merge without reviewed ancestry, unrelated main changes or changed dependencies must stop for review; do not weaken the guard.

```powershell
$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\Swetha Anusha\Pictures\CHAITANYA\paisa mart\paisa-mart'
$reviewed = Read-Host 'Full approved PR #6 head SHA'
if ($reviewed -notmatch '^[a-f0-9]{40}$') { throw 'Full reviewed SHA required' }
git -C $repo fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Fetch failed' }
$merged = (git -C $repo rev-parse origin/main).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve merged main' }
$stamp = Get-Date -Format 'yyyyMMdd'
$source = Join-Path $repo ('.release-pr6-' + $merged.Substring(0,8) + '-' + $stamp)
$output = Join-Path $repo ('release/pr6-' + $merged.Substring(0,8) + '-' + $stamp)
if ((Test-Path -LiteralPath $source) -or (Test-Path -LiteralPath $output)) {
    throw 'Release checkout/output already exists; inspect it rather than overwrite it'
}
git -C $repo worktree add --detach $source origin/main
if ($LASTEXITCODE -ne 0) { throw 'Worktree creation failed' }
Set-Location -LiteralPath $source
$dependencyStage = Join-Path $repo ('release/pr6-dependencies-' + $merged.Substring(0,8) + '-' + $stamp)
$bun = Join-Path $repo '.build-tools/bun-runtime/bun-windows-x64/bun.exe'
python -B deployment/requirements/install_dependencies.py --staging $dependencyStage --bun $bun
if ($LASTEXITCODE -ne 0) { throw 'Frozen dependency installation failed; do not change locks or reuse partial output' }
python -B -m unittest discover -s deployment/requirements -p 'test_*.py'
if ($LASTEXITCODE -ne 0) { throw 'Packaging safety checks failed' }
python -B deployment/requirements/prepare_release.py `
  --reviewed-commit $reviewed `
  --date $stamp `
  --output $output `
  --dashboard-archive (Join-Path $repo 'release/dash-final/dashboard-backend.tar.gz') `
  --personal-archive (Join-Path $repo 'release/pl4/backend-review/personal-loan-backend.tar.gz') `
  --personal-manifest (Join-Path $repo 'release/pl4/backend-review/manifest.json')
if ($LASTEXITCODE -ne 0) { throw 'Release preparation failed; do not upload partial output' }
Get-Content -LiteralPath (Join-Path $output 'verification.json')
```

The root npm lockfile contains empty dependency entries and `npm ci` fails with `Invalid Version` (also with legacy peer resolution). Use the maintained installer above. It installs each workspace in a new isolated staging directory with Bun's `--frozen-lockfile --ignore-scripts`, verifies the committed manifest/lock/patch hashes before and after installation, then copies fresh dependencies using extended Windows paths. It also creates the empty root `node_modules` directory required by Expo's workspace resolver. Existing dependency trees and staging directories are refused; no dependencies are moved out of another checkout. The receipt is `<dependencyStage>/dependency-install.json`. Tested tools are Bun 1.4.2 and Node 24.17.0.

To reuse an already-validated isolated worktree, require `git status --porcelain` to be empty, verify every workspace manifest/lock/patch hash against its successful `dependency-install.json`, and verify that each recorded dependency directory is present in that same worktree. After fetching the approved merge, use a normal `git checkout --detach <merged-main-SHA>` in that clean isolated worktree; do not reset, force-checkout, or touch the original dirty main. Recheck the receipt inputs against merged main, then run the packaging checks and `prepare_release.py` below with a new unique output directory. The packager still enforces reviewed ancestry, identical trees and the 11-file runtime scope. This avoids reinstalling verified dependencies; it does not authorize packaging a feature-branch tree.

The mobile Bun lock was reconciled with the already-committed manifest: Expo Router 6.0.24, MSG91 2.1.0 and Expo Local Authentication 17.0.9, plus their locked transitive entries. No package.json or runtime backend dependency was changed. The old available preview dependency tree had Router 6.0.14 and omitted those two declared packages; final release validation must use the freshly installed frozen tree. The root npm lock remains unchanged and is not used for this release.

The entry point performs a fresh Expo export with all three API variables set to `https://paisa-mart.com`, dotenv loading disabled and the existing frontend shell packaging/validation. It emits LF Git source for the exact 11-file backend delta, verifies archives by reading their members and hashes back, validates the four Personal source files against the approved October archive, and refuses existing output. Old three-/seven-file bundles are not used as installers.

Read `verification.json` for the actual release name, merged source SHA, upload directory and **SHA256 of SHA256SUMS.txt**. Archive names inside that new upload directory are `approved-web.tar.gz`, `manifest.json`, and `requirements-backend.tar.gz`; `backend/` contains the same reviewed payload and guarded tools. `SHA256SUMS.txt` covers every upload file except itself, including the manifest, both archives, all 11 runtime files and tools. Record these exact final paths/checksums in the release handoff after the build. They do not exist yet and cannot be supplied from feature review artifacts.

## 2. FileZilla — only after separate upload approval

Confirm the current instance, host, selected Region and SSH host key using the AWS Console. The previously confirmed instance/IP were `i-0e6f35bc4e48cde49` / `54.252.33.16` in `ap-southeast-2`; they are historical context, not a fresh verification. Use the existing authorized SFTP key, port **22**, user **ec2-user**, and **Binary** transfer mode.

In FileZilla select the exact `upload_directory` printed in `verification.json`. Upload that entire uniquely named release directory to `/home/ec2-user/paisa-mart-deployment/incoming/`. Stop if the destination already exists. Confirm the queue is empty with no failed transfers. Do not upload raw previews, source checkouts, SQLite databases, `.env`, dependencies or old October bundles. Do not upload directly into the live application, `backend/public`, `backend/src`, `.frontend-releases` or the recovery master.

## 3. Read-only live EC2 baseline verification — mandatory before deployment

Use the established AWS Console EC2 Instance Connect terminal as `ec2-user`. If an earlier script is waiting at `Paste your EC2 instance ID:`, press Ctrl+C first. The following subshell prompts for values from the **final merged-main** `verification.json`; it changes no application/service/database files. Do not paste secrets or `pm2 jlist` output into chat.

```bash
(
set -eu
read -r -p 'Final release_name from verification.json: ' release_name
read -r -p 'Final checksum_file_sha256: ' checksum_sha
case "$release_name" in ''|*[!A-Za-z0-9_-]*|FINAL-GOOD-20261006) exit 1;; esac
case "$checksum_sha" in ''|*[!a-f0-9]*) exit 1;; esac
test "${#checksum_sha}" -eq 64
cd "/home/ec2-user/paisa-mart-deployment/incoming/$release_name"
printf '%s  %s\n' "$checksum_sha" SHA256SUMS.txt | sha256sum -c -
sha256sum -c SHA256SUMS.txt
python3 -B backend/backend-update.py verify
printf '%s  %s\n' '1eb63519c0a82bb4dfb470dabc33240d1e737bc8bb1980950489f8030251c79f' '/home/ec2-user/paisa-mart-new/backend/public/index.html' | sha256sum -c -
python3 -B /home/ec2-user/paisa-mart-deployment/verify.py
)
```

The index hash is from the retained manifest for the user-confirmed `20261021-17eac94b-dashboard` release, not a newly observed live hash. Any mismatch stops the release for investigation; do not restore the old release to make the check pass.

`backend-update.py verify` checks the complete recorded source baseline, including unchanged Personal files, staged source hashes, exactly one existing PM2 `paisa-mart` process with cwd `/home/ec2-user/paisa-mart-new/backend` and `bun run src/index.ts`, online/health state, required secret **presence only**, and the effective SQLite path `/home/ec2-user/paisa-mart-data/payments.db`. It rejects any configured `DATABASE_URL`, `POSTGRES_URL`, `HOME_LOANS_DATABASE_URL`, `PERSONAL_LOANS_DATABASE_URL`, `BUSINESS_LOANS_DATABASE_URL`, `LIFE_INSURANCE_DATABASE_URL` or `VEHICLE_LOANS_DATABASE_URL`. The Bun probe does not import application code or run migrations. Verify results and current live UI must be reviewed before deployment approval.

Only `verify.py` is documented as installed in the toolkit. These instructions invoke the checksum-verified **packaged** deploy/rollback scripts; they do not claim either is installed in the toolkit. No command here configures a hosting integration.

## 4. Later authorized activation — documentation only, NOT authorized now

After baseline results and the exact final release are separately approved, return to that release's incoming directory. Repeat the read-only checks above immediately before the update. Run commands one at a time and stop on failure.

```bash
python3 -B backend/backend-update.py update --execute
```

The updater acquires the existing process lock and refuses drift/reused backup paths. Before stopping the process, it creates `/home/ec2-user/paisa-mart-data/backups/backend-before-<release_name>` with mode 0700, copies source/package/locks and protected `.env`/PM2 metadata, creates a consistent SQLite backup using SQLite's backup API with a read-only source connection, verifies integrity and hashes, and rehearses candidate migrations against a **separate disposable database/source copy**. Rehearsal checks all original table row counts and integrity. This is performed only by the authorized update command; read-only verification creates no backup/migration.

The migration imports Business/Life/Vehicle stores, initializes the five new service tables and calls the existing admin migration. Changes are additive: nullable Business fields plus Life/Vehicle/five-service tables, and nullable submission-key/hash columns with unique key indexes on Business/Life/Vehicle. Existing rows retain NULL keys; no application is deduplicated or deleted by phone number. No payout calculation is enabled. After a final drift check, the updater stops only the identified PM2 process, atomically writes the 11 files, applies the same migration against SQLite, restarts that same process and checks health. On failure/interruption it attempts verified code restoration and health recovery. An unconfirmed recovery is a hard stop requiring inspection, not permission for a blind retry.

Verify authenticated admin/customer behavior and the four Personal hashes using the recorded manifest before frontend activation. Then, under that same explicit deployment approval:

```bash
python3 -B backend/stage-frontend.py approved-web.tar.gz manifest.json
python3 -B backend/deploy.py '<actual release_name>' --dry-run
python3 -B backend/deploy.py '<actual release_name>'
python3 -B /home/ec2-user/paisa-mart-deployment/verify.py
```

Replace `<actual release_name>` with the value in `verification.json`. Staging is a write to a new `.frontend-releases` directory; it is not read-only. The deploy tool asks for the exact name, locks, verifies, hashes a complete previous `public` backup under `.frontend-backups`, checks for drift, switches the frontend and re-verifies. It preserves the previous directory and reports the backup name. It does not restart the backend. Inspect the actual desktop/mobile UI, real saves/references, admin counts/assignment/history/persistence and existing Personal behavior; HTTP 200 alone is insufficient.

## 5. Rollback — only if separately authorized

Retain the incoming release, its checksums, `backend-before-<release_name>` backup and the exact `.frontend-backups/before-...` name printed by frontend deployment. If frontend activation occurred, restore the verified previous frontend before removing the new backend routes:

```bash
python3 -B backend/rollback.py --backup '<actual before-... backup name>' --dry-run
python3 -B backend/rollback.py --backup '<actual before-... backup name>'
python3 -B backend/backend-update.py rollback --execute
python3 -B /home/ec2-user/paisa-mart-deployment/verify.py
```

If the frontend never changed, omit its rollback. Backend rollback checks backup hashes, PM2 identity and allowed live file hashes, then restores only the 11 affected code paths (removing only files absent from the baseline). It preserves the SQLite database, all new applications, additive tables/columns, audit history, secrets and four Personal files. The database snapshot is recovery evidence; automatically restoring it would lose later submissions and is **not** part of rollback. Never select `FINAL-GOOD-20261006` for this procedure. Verify the live UI and authenticated flows after rollback.

## Review evidence and limitations

The maintained tests in `test_prepare_release.py` exercise source/tree/scope guards, fixture archive/hash verification, no-overwrite behavior, update/rollback failures and interruption recovery, and migration-copy isolation. They simulate PM2/filesystem controls locally; they are not live EC2 verification. The unchanged October deployment tools retain their existing tests. The backend full TypeScript compiler crash also occurs on unchanged main; focused strict checks, isolated SQLite tests and bundling pass. Unverified PostgreSQL is outside this SQLite release and is explicitly rejected by preflight.
