# HANDOFF — Customer privacy fixes: application lists + "My eligible payouts" (25 Nov 2026) — CURRENT STATE

**Scope (owner decisions, 25 Nov):** the customer application-list privacy fix, then a narrow extension to verify "My eligible payouts" cache isolation and fix it only if it leaks. Matrix: [docs/pdf-requirements-20261124/REQUIREMENTS_MATRIX.md](docs/pdf-requirements-20261124/REQUIREMENTS_MATRIX.md).

- **Branch:** `fix/pdf-requirements-verify-20261124` in worktree `.pdf-requirements-verify`, based on `origin/main` `28713f2` (PR #9).
- **PR:** draft [#10](https://github.com/vibecoding2024-bot/paisa-mart/pull/10). No merge, upload, restart or deployment. No production access or data. Phase 2 session/MPIN work is not included.
- **Code tested: `f434e77`.** The final head is the docs commit after it (it adds this section, the matrix update and evidence); the exact head is reported in PR #10.
- **Last confirmed production (unchanged):** backend Phase 1 `f4187f2`; frontend `28713f27`, release `20261123-28713f27-admin-ops-hotfix`, live index `36a657a9…76e1`. **Production is not fixed** until an approved release is deployed and its UI is verified.
- **Local `main` is stale:** it is at `facbc4c` with dirty changes and has diverged from `origin/main`. It was not touched.

### Result
- **Admin PDF:** verified working on current code; unchanged. Payout visibility, approval order and one-way Payout selection kept by owner decision.
- **Gold Loans:** no persistent source; **still incomplete**.
- **Application lists, two leaks fixed (tested locally):**
  1. **Settled account switch:** fixed in `3797179` with `gcTime: 0`.
  2. **Logout while the list request was in flight:** the next customer joined the pending request and saw the previous customer's records. Fixed in `7a0ed91` with a query key scoped to the signed-in customer's phone, not run without one.
- **"My eligible payouts" (shares its cache with the Home total and the Earnings tab):**
  - **Normal switch:** no visible leak on `7a0ed91`.
  - **Logout mid-request:** **leaked on `7a0ed91`.** B's Home showed A's approved total ₹4,321.09; the signed-out payout screen joined A's pending request.
  - **Fixed in `f434e77`:** the same customer-scoped key and options in `useApprovedPayouts`; the payout screen uses that hook. Amounts, approvals, visibility rules, backend and admin tabs unchanged.

### Changed runtime files (vs `28713f2`)
| File | Why |
|---|---|
| `mobile/src/lib/customer-private-query.ts` | `CUSTOMER_PRIVATE_QUERY` (`gcTime 0` etc.) and `customerQueryKey(list, phone)` |
| `mobile/src/app/my-applications.tsx` | Identity-scoped key, `enabled: !!phone`, private options |
| `mobile/src/app/home-loan-applications.tsx` | Same leak path, same change |
| `mobile/src/lib/customer-payout-api.ts` | `useApprovedPayouts` (Home, Earnings, My eligible payouts): identity-scoped key, `enabled: !!phone`, private options; 15 s refresh kept |
| `mobile/src/app/customer-payouts.tsx` | Uses `useApprovedPayouts` instead of its own query copy; existing sign-in message when signed out |
| `scripts/customer-private-query.test.ts` | Real React Query observers for settled and in-flight logout (lists and payouts), with controls proving the old keys leak; source guards |

No backend file changed. Docs: `docs/pdf-requirements-20261124/` (matrix, harness, evidence) and this section.

**Behaviour note:** signed out, the Home and Earnings payout totals now show their loading placeholder instead of "Unavailable" (the query no longer runs without a signed-in customer).

### Tests (code tested: `f434e77`)
- **`bun test`, each file separately:** **129 pass / 0 fail across 28 files**, including the PR #9 prefix test (`7a0ed91`: 128 / 0; baseline `28713f2`: 125 / 0 across 27).
- **Other checks:** `check-api-isolation` passes. Mobile `tsc` passes (clean WSL clone of `f434e77`, TypeScript 5.9.3). Backend `tsc` was not run (no backend change; known crash baseline).
- **Real local backend plus built test web export** (`f434e77` export index `3be7cad3…8dc4`; synthetic identities; scratch SQLite; outbound blocked, the only attempt being the Vibecode proxy start-up):

| Commit | API | Browser | List privacy | Payout privacy |
|---|---|---|---|---|
| `28713f2` | 216 / 0 | 99 / 2 | 8 / 3 | not run |
| `3797179` | 216 / 0 | 101 / 0 | 8 / 3 | not run |
| `7a0ed91` | 216 / 0 | 101 / 0 | 11 / 0 | **24 / 5** |
| `f434e77` | **216 / 0** | **101 / 0** | **11 / 0** | **29 / 0** |

- **Payout scenarios:** normal switch; logout with A's requests held in flight and released during B's session; delayed B responses; signed-out `/customer-payouts`; back ×4 / forward ×4. Only on-screen renders count as leaks.
- **Browser coverage:** the 14 admin tabs at desktop and phone width; no `/api/` response returned `index.html`.
- **Evidence:** `evidence/payout-baseline-7a0ed91/`, `evidence/payout-fix-f434e77/` (with `regression/`).
- **Secret scan:** the same 2 findings, classified with redacted evidence; nothing bypassed or allowlisted. One synthetic fixture already on `main` (`scripts/admin-operations-api.test.ts:23`), one false positive (harness variable `t.viewer1`).

### Next action
The owner reviews draft PR #10. After approval: merge, build a new uniquely named frontend-only release from the merged commit and deploy it separately under authorization. Then verify customer sign-out → sign-in in the real UI, including the Home payout total.

---

# HANDOFF — Google Play remediation (22 Nov 2026) — previous state

**Play submission and production rollout are PAUSED** (owner instruction).
- Branch `fix/play-store-remediation-20261122`, worktree `.play-remediation`, base `origin/main` `595e521`.
- Local commits only: no push, PR, merge, deploy, AWS change, production deletion, reviewer-account creation, Play upload or reviewer-phone selection. The agent has run no production command.
- Earlier HEADs `09ffbdc` and `6d874d8` are preserved in history.
- PR description: [PR_DESCRIPTION.md](docs/play-store-remediation-20261122/PR_DESCRIPTION.md).
- Incident: [INCIDENT_2026-11-22_test-profiles-in-production.md](docs/play-store-remediation-20261122/INCIDENT_2026-11-22_test-profiles-in-production.md).

## Tested commits

| Code | Commit | Evidence |
|---|---|---|
| Backend runtime | `e1e362d` (A-01, A-02, A-06, review account, A-03) | `bun test`, every file run separately: **106 pass / 0 fail across 22 files** (13 backend, 9 repo-root). `node scripts/check-api-isolation.mjs` passes. The backend `tsc` crashes (stack overflow) at HEAD with or without these changes; with `node --stack-size=30000` it lists 119 pre-existing errors, none in changed code. Live local API at `e61fa03`: unauthenticated profile GET/POST/list/KYC-PATCH all return 401. |
| Mobile runtime | `e61fa03` + welcome copy `48226fb` | `tsc` 0 errors. WSL release builds of `e61fa03` pass the bundle isolation check: test `5d4595f4…e52b`, candidate `3b7fd209…f842` (production API, debug-signed, versionCode 8). `48226fb` changes only welcome-page wording. It was checked in a local web export at 1440, 390 and 360 px (`evidence/WELCOME-*.png`); no Android rebuild was made for wording alone. |
| Device run, `e61fa03` test variant | Emulator with production DNS blocked, local backend | <ul><li>Fresh account: profile GET 404 → POST 200 → GET 200, with the token.</li><li>Synthetic account: ₹1,500.00 and both applications.</li><li>Review account: only its own records.</li><li>Admin stage change → "Sanctioned" shown in the app.</li></ul> |
| Cleanup script | `incident_cleanup.py`, SHA-256 `46ddc713e59285a336553dd9b29aec61a582377cacd98a9a2658b05af454f089` (LF) | WSL replica: all abort, apply, rollback and leak scenarios pass (incident file). The Desktop paste file was tested as pasted: checksum OK → plan OK; a one-byte change → checksum FAILED, nothing ran; no temp file left; DB unchanged. |

## Done (latest round)
1. **Incident evidence recorded** as the owner's EC2 summary from the conversation (not raw output inspected by the agent). The four profiles are **strongly supported incident-created records**; phone-number ownership is unknown. Preserve `LIVE-BEFORE-REMEDIATION-20261122T145011Z`.
2. **Cleanup script reviewed again:**
   - `plan` is read-only (live DB `mode=ro` plus `query_only`; preserved backup immutable).
   - `apply` compares full-row fingerprints inside the same `BEGIN IMMEDIATE` transaction as the linked-record scan and the delete.
   - The row backup is private (0700/0600, `O_EXCL`), fsynced and verified by read-back before the delete. **Added:** an fsync of the parent directory, so the new backup directory entry is durable.
   - `rollback` refuses to overwrite a profile created after the cleanup.
3. **Read-only plan command** on the owner's Desktop: `C:\Users\Swetha Anusha\Desktop\paisa-mart-incident-cleanup-PLAN-readonly.txt`.
   - Uses the script's own CLI: `plan <n1> <n2> <n3> <n4>`.
   - Includes the SHA-256 check and instructions.
   - Contains the four numbers, so it is not in Git.
4. **Welcome page** (`48226fb`):
   - New factual copy: eyebrow, heading, paragraph, "Find what you need" card, right-hand supporting text.
   - Removed the repeated discovery line and the Discover/Grow promotional rows.
   - Form, +91, placeholder, validation, button, OTP flow, and the Terms/About/help links are unchanged.
5. **A-03 described accurately:** untrusted callbacks no longer change payment records, but authenticated payment reconciliation is **not** implemented (see below).

## A-03 — payment callbacks (fixed locally `e1e362d`; reconciliation still incomplete)
- **Done:**
  - The unauthenticated `*callback*` catch-all that created or rewrote `txns` (status, amount, ID, payload) from any request is removed, along with `applyCallback`.
  - Gateway callbacks are acknowledged only, and their bodies (name, phone) are not logged.
  - The fallback acknowledgement runs after the routers, so the KYC callback routes are reached.
  - Tests: `gateway-callback.test.ts` drives the real app and fails on the old code (4 of 5).
- **Not done (do not claim):**
  - There is **no authenticated payment reconciliation**. A transaction stays at the status recorded when it was created (normally Pending). Nothing marks a payment successful, from a callback or from a browser redirect.
  - End-to-end payment processing is **not** fixed or verified. The VimoPay integration uses UAT endpoints.
  - **Needed:** VimoPay's server-to-server transaction-status API (or a verifiable callback signature), then a reconciliation step that checks amount and reference.
- **Other payment-route findings remain** from the audit (e.g. A-42 checkout script injection; the `/api/payment/auth` and `/config` diagnostics).

## Incident (summary — details in the incident file)
- **Owner's EC2 findings (22 Nov):**
  - Live process `paisa-mart` (PM2 0, online) on `i-0e6f35bc4e48cde49`, `ap-southeast-2`. DB `/home/ec2-user/paisa-mart-data/payments.db`; `quick_check` passed.
  - All four profiles are absent from the verified baseline `backend-before-20261121-595e5212-on-pr6-dashboard/payments.db`.
  - GET responses went from 404 to 200 for each number.
  - Every creation and update time falls in the incident window, and every email uses the reserved test domain.
  - No linked matches across 170 scanned columns.
  - The logs have no timestamps; nginx logs were not inspected.
- **Classification:** strongly supported incident-created profiles. Phone-number ownership remains unknown.
- **Do not** delete, overwrite or repurpose them except through the reviewed cleanup, and never use these numbers as the review phone.

## Release dependency: authenticated web client ↔ backend profile enforcement (A-01)
- **The new backend refuses unauthenticated profile calls** (`/api/users/profile*` → 401, other phone → 403, KYC-status PATCH staff only). So any client that does not send the customer token breaks on profile load and save once that backend is live.
- **Order (each step separately authorized; currently PAUSED):**
  1. Merge.
  2. **New web release first.** The new web client sends the token, and the current backend ignores the header, so web keeps working on the old backend. Verify sign-in, profile load and save in the real UI.
  3. **Backend second** (`backend-update.py verify` → `update --execute`). This enforces A-01 and includes A-02, A-06, the review account and A-03. Do not set `ALLOW_DEV_OTP`; check the MSG91 variable names.
  4. **New Android build** (upload certificate verified, versionCode confirmed). It works with both backends.
- **Web caveat:** browser tabs still running the old web bundle behave like old clients until they reload.
- **Older Android installs** (the current app, including any APK served at `/download-apk` and any distributed build) send no token:
  - **Signed-in users with a saved profile:** the profile GET returns 401, which the old app logs and falls back to the locally saved profile. They can continue, but server profile changes no longer sync.
  - **New sign-ins and users still completing their profile:** the profile POST returns 401, so the old app shows "Profile save failed" and **cannot complete onboarding** until it updates.
  - **KYC start:** returns 401 (KYC is disabled in the app UI).
  - **Mitigation:** release the new Android build before or with step 3. Replace the `/download-apk` APK with the new build. Monitor 401 counts on `/api/users`. Consider an in-app update prompt. Leaving the profile API public to keep old installs working is **not** an option (owner decision).
- **Rollback:** backend `backend-update.py rollback --execute`; web via the guarded frontend rollback. The new web client stays compatible with the rolled-back backend.

## Remaining release blockers
1. **Production profile cleanup:**
   1. Owner runs the read-only `plan` (Desktop file) and returns its output.
   2. Owner approves the 4 fingerprints.
   3. `apply` is separately authorized.
2. **Owner approval, then push, PR, review and merge.**
3. **Rollout as above** (web → backend → Android), each step authorized. The Android build must be ready by the backend step.
4. **Android signing:** the upload certificate is unverified; versionCode 8 is provisional; the source of versionCode 7 is unknown. A signed build of the final commit is needed (the last builds are of `e61fa03`; `48226fb` changes only wording).
5. **Payments:** authenticated reconciliation (VimoPay status API) before any payment is shown or treated as successful.
6. **Reviewer access:** reviewer phone not selected; production `REVIEW_ACCOUNT_*` not set (paused). Never use an incident number.
7. **Unresolved owner decisions:**
   - commission and rate-card figures;
   - lender list;
   - privacy-policy URL;
   - A-08 ownership model (unchanged);
   - "Pan India Reach" copy.

## How to resume (environment outside Git)
- **Builds:** from PowerShell, run `wsl -d Ubuntu-22.04 -- [env EXPO_PUBLIC_API_URL=http://127.0.0.1:3901 CLEARTEXT_LOCAL=1] bash <docs/.../wsl-build.sh>`. The test variant sets `EXPO_PUBLIC_TEST_ENV=1` and runs the bundle check.
- **Web check:** export inside the WSL clone `~/pm-play/src/mobile`, because the Windows `node_modules` has an incompatible `expo-router`. Use test API variables and serve on 127.0.0.1. For phone widths, use an iframe, because headless Chrome enforces a minimum window width.
- **Emulator:** AVD `pm_review` with **`-dns-server 127.0.0.1`**, then `adb reverse tcp:3901 tcp:3901`.
- **Local backend:** Bun at `.build-tools/bun-runtime/bun-windows-x64/bun.exe`, `PORT=3901`, a scratch SQLite and random secrets. `ALLOW_DEV_OTP=true` locally only; `REVIEW_ACCOUNT_*` values are never committed.
- **Tests:** `bun test <file>`, one file at a time (backend files from `backend/`, repo-root files from the root). Also run `node scripts/check-api-isolation.mjs`.

## INCIDENT RESOLVED (owner-confirmed, 22 Nov 2026) — do not repeat the cleanup
- Exactly **4** incident test profiles deleted; total profiles **9 → 5**.
- Post-checks passed; the preserved full backup is unchanged.
- **Row backup:** `/home/ec2-user/paisa-mart-data/backups/incident-cleanup-20261122T154044Z-3204996`.
- **Full backup:** `/home/ec2-user/paisa-mart-data/backups/LIVE-BEFORE-REMEDIATION-20261122T145011Z`.
- Keep both until the owner releases them. Rollback (only if ever required, separately authorized) is described in the incident file.

## Final review and draft PR (22 Nov) — NOT release-ready
- **VimoPay paused:** the owner paused VimoPay integration, reconciliation and the fingerprint check. That paste file was **not** created, and no payment configuration was touched. Do not resume without instruction.
- **Final diff review** (`595e521..db05364`, 107 files): no issues. No runtime change since the last full validation (`e9ffd09`, 120 / 0), so no checks were outstanding.
- **New finding recorded:** the tracked root `android/` project is stale (`com.paisamartroot`, debug-signed release). Release builds come only from `mobile/` via prebuild (A-49).
- **Draft PR:** [PR_DESCRIPTION.md](docs/play-store-remediation-20261122/PR_DESCRIPTION.md), covering exact scope, test evidence, blockers and the rollout table. Readiness: [READINESS_REPORT.md](docs/play-store-remediation-20261122/READINESS_REPORT.md).
- **Next action:** the owner revokes the 5 exposed AI provider keys (section 3 of `docs/security/KEY_ROTATION_2026-11-22.md`). It needs no code or configuration change, because nothing uses them.

## A-05 secret cleanup, local (`e9ffd09`, 22 Nov) — ROTATION PENDING (owner)
- **Inventory** (masked; details in [KEY_ROTATION_2026-11-22.md](docs/security/KEY_ROTATION_2026-11-22.md)):
  - **5 AI provider keys:** OpenAI, Anthropic, xAI, Google and ElevenLabs. They were in the archive and in historical `.env` files, and current code does not use them.
  - **3 VimoPay gateway keys:** secret, salt and ED. They are in a historical `backend/.env` (f423e2c), and `lib/vimopay.ts` still reads these variables.
  - **Demo admin credentials** in the README.
  - All of these commits are on GitHub `origin/main` and other branches. Repository visibility is unverified.
- **Done:**
  - `backend/paisa-mart-mvp.zip` and `backend/payments.db` are untracked and preserved outside Git in an owner-only folder (`%USERPROFILE%\paisa-mart-secure\2026-11-22-removed-from-git\`).
  - The public `/download` route is removed.
  - The README credentials are redacted.
  - New ignore rules, plus `backend/.env.example` and `mobile/.env.example`.
  - New `scripts/secret-scan.py` (masked output), its allowlist, and `scripts/no-secret-files.test.ts`.
- **Kept:** the standard `android/app/debug.keystore`. There is no upload keystore or `keystore.properties` in Git, and signing is unchanged.
- **History is not rewritten:** the exposure remains until the keys are rotated and revoked.
- **Checks:**
  - redacted scan: 0 findings needing action (23 allowlisted test/doc values); it still detects all keys in the preserved archive;
  - **120 tests pass / 0 fail / 0 skipped across 25 files**;
  - the isolation check passes.
- **Next (owner):** revoke the 5 AI keys. Run the read-only VimoPay fingerprint check in the rotation doc, then request new VimoPay keys. Check GitHub visibility and secret-scanning alerts.

## A-42 FIXED locally (`ede1a10`, 22 Nov)
- **Fix:**
  - The checkout page renders every value (URL parameters, the stored last reference, status/create/state responses) as text; there is no HTML insertion.
  - The payment link must be `https`, and the server allowlists its host (`lib/payment-url.ts`: `vimopay.in`, the `VIMOPAY_BASE_URL` host, `VIMOPAY_PAYMENT_URL_HOSTS`).
  - Strict hash-pinned CSP; `Cache-Control: no-store`.
  - `/status` no longer echoes unknown references; `/create` rejects non-identifier `merchantRefId` values before any gateway call. The A-03 protection is unchanged.
- **Tests:**
  - `checkout-page.test.ts` (6) and `checkout-page.browser.test.ts` (5). The browser test needs Chrome or Edge (set `CHROME_PATH` to choose one); it is skipped with a message if neither is found, and it is loopback-only.
  - On the old code the browser payloads executed and redirected; 4 of the 6 unit tests and all 5 browser tests fail there.
  - Full suite: **117 pass / 0 fail / 0 skipped, 24 files**. The isolation check passes. Backend `tsc` errors are still at the 119 baseline, none in changed files.
- **Release check:** create one UAT payment after the backend update. If the link host is not under `vimopay.in`, the log shows `gateway paymentUrl rejected` with the host.

## Readiness (final review, 22 Nov)
- See [READINESS_REPORT.md](docs/play-store-remediation-20261122/READINESS_REPORT.md) and the final [PR_DESCRIPTION.md](docs/play-store-remediation-20261122/PR_DESCRIPTION.md).
- **Review result:** the only runtime change since the validated commits is the welcome wording, which is already validated. The isolation check passes at HEAD. The secret scan of the branch diff is clean. Incident numbers in `CHECKLIST.md` are now masked.
- **A-42:** fixed locally, see above.
- **Also open:**
  - A-04 (payment API public, UAT);
  - A-05 (secrets and signing material tracked in Git: `backend/paisa-mart-mvp.zip`, `backend/payments.db`, `android/app/debug.keystore`; keys need rotation);
  - A-09 / A-52 (sessions);
  - Android signing.
- **Next action:** the owner revokes or rotates the A-05 credentials following `docs/security/KEY_ROTATION_2026-11-22.md`. The local cleanup is done (`e9ffd09`).

## Previous step (done)
- **The EC2 read-only `plan` passed** (owner, 22 Nov).
- **The owner approved deleting only the four incident profiles,** guarded by these fingerprints, in plan order (01, 03, 02, 99): `d83914834dbd120f00e5, 32258238dc8d19e72ab3, 5db9ffcb75c137d9d2c4, 77dbce08a355552f92ef`.
- **APPLY paste file:** `C:\Users\Swetha Anusha\Desktop\paisa-mart-incident-cleanup-APPLY.txt`.
  - It runs the same reviewed script (SHA-256 `46ddc713…f089`), checksum-verified, using its own CLI: `apply <n1..n4> --expect <fps> --confirm DELETE-4-INCIDENT-PROFILES`.
  - All checks stay enabled.
- **Tested on the WSL replica:**
  - the real file STOPs there, because the fingerprints differ, and nothing is deleted;
  - an identical file with the replica's fingerprints deletes exactly 4 rows, keeps the preserved backup unchanged, leaves no temp file, and leaks nothing.
- **Not executed by the agent.** The owner runs it, then returns the output, which includes the `incident-cleanup-*` row-backup folder needed for any rollback.
- Keep that folder and `LIVE-BEFORE-REMEDIATION-20261122T145011Z`.
- Then record the result in the incident file.

---

# Current status — PR #7 (updated November 21, 2026, fourth session; code unchanged since `109d514`)

**Read this section first. The PR #6 handoff below is historical (PR #6 is merged as `18ae178`).**

- Shared checkout: `C:/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart`. PR #7 lives in its worktree `.admin-payout-update`, branch `feature/admin-payout-approvals`. The dirty main checkout (`facbc4c`) is preserved untouched.
- PR: https://github.com/vibecoding2024-bot/paisa-mart/pull/7. It is open and draft, base `main` = `18ae178`. Not merged, not deployed.
- Coverage, settled decisions and unresolved decisions: [docs/requirements-coverage-20261121.md](docs/requirements-coverage-20261121.md). Payout feature details: [docs/admin-payout-handoff.md](docs/admin-payout-handoff.md).

## What PR #7 contains

1. **Business Sanctioned fix, the manual Payout action, and dual-approval payout amounts** for Home/Business/Personal/Vehicle loans and Bank Accounts. Commit `1a7708c`.
2. **Customer "My applications & status"** (`GET /api/customer-applications`, `mobile/src/app/my-applications.tsx`). Commit `534cffe`.
   - It lists the signed-in customer's own submissions from all 11 connected sources, with the current admin stage and the details the customer entered.
   - Ownership comes only from the OTP-verified token phone.
   - It returns no internal fields.
3. **Friendly network-error message on that screen.** This was found during the browser check, which first showed a raw "Failed to fetch". It is in the final commit.

## Settled decisions (do not re-ask)

- Admin/ops staff edit the manual payout amounts.
- Executive and Manager must both approve, as different staff members.
- Any amount edit resets both approvals.
- Customers see only their own approved customer amount. Paisamart amounts stay internal.
- Authorized staff may enter and review amounts before approval.

## Unresolved decisions (calculations stay disabled)

- **D-1 Approval order.** Current behavior is recorded here explicitly: PR #7 accepts Executive and Manager approvals **in either order**, as long as they come from two different staff members. Whether the Manager must approve last is still unconfirmed.
- **D-2 Calculation rules.** Payouts for Credit Cards, Insta Loans, Health, Motor and Life insurance are **requested requirements**. What remains unresolved is their calculation rules, not whether they are needed. Open points: the Revenue/TDS formula, the TDS rate and base, what the percentage deductions in PDF C mean, and whether the Home/Personal/Business figures are fixed amounts or rates. No payout fields or calculations exist for those five products yet; all automatic calculations stay disabled.

## Incomplete coverage

- **Gold Loans**: persistence (intake/saving), customer status tracking and payout all remain **incomplete**. Only the catalogue entry and the Payout action exist.

## Tests and builds (bundled Bun `.build-tools/bun-runtime/bun-windows-x64/bun.exe`)

- **Backend tests, all passing.** Reused from `534cffe`; the only code change since then is in the mobile API helper.
  - `customer-applications`: 2 tests, 25 assertions.
  - `admin-payouts`: 6 tests, 279 assertions.
  - `admin-operations`: 13 tests, 141 assertions.
  - `home-loans`: 3 tests, 83 assertions.
  - `service-applications`: 11 tests, 248 assertions.
- **Browser check: 20 of 20 passed, with zero runtime errors.** Script: `.preview/myapps-browser.cjs`, run against a synthetic local SQLite server (`.preview/myapps-server.ts`, port 4808). The server was stopped afterwards. Checks:
  - Desktop (1440 px) and phone (390 px) show all saved submissions, with product names, stage labels and customer-entered details, and no horizontal overflow.
  - After an admin stage change, both Refresh and a full page reload show "Underwriting", and the lead is still listed.
  - A second customer sees only their own record. The API returns only the allowed keys, and owner, notes, history, provider evidence, payout, CIBIL, DOB and income are absent.
  - Empty, signed-out, forged-token, 503 and network-failure states all show correct messages and no stale data.
  - Evidence: `.preview/myapps-browser-results.json` and screenshots `.preview/myapps-{desktop,mobile,empty-mobile,error-mobile}.png`, all visually inspected. These are local only; `.preview/` is gitignored.
- **Builds and type checks, all passing:** mobile `tsc` after the fix, Expo web export (cleared cache, synthetic API URL, local only), Bun backend bundle, focused strict backend `tsc`, and `git diff --check`.
- The known full-backend `tsc` crash from generated `backend/public` JS is unchanged and not a regression.
- Small cosmetic note: the loan amount on this screen shows unformatted (`250000`).

## PR readiness

PR #7 is **ready for user review** within its confirmed scope. Before production use:

- the user must approve the merge;
- an admin must assign separate Executive and Manager staff;
- deployment needs separate authorization and a new uniquely named release through the guarded EC2 workflow.

The open items (D-1 approval order, D-2 calculation rules for the five requested products, and Gold Loans) are not delivered by this PR.

**Exact next action:** the user reviews PR #7 and answers D-1 and D-2. Do not merge or deploy without explicit authorization.

---

# Paisa Mart PR #6 — AWS EC2 handoff

Updated November 6, 2026 (Asia/Calcutta). **Conditional merge checks passed, including the required retry-risk fix and fresh frozen-dependency build. User authorization covers marking ready, merging PR #6 and local packaging from merged main only. No upload, production migration, restart or deployment is authorized.**

## Exact source and preserved checkouts

- PR: https://github.com/vibecoding2024-bot/paisa-mart/pull/6 — remains draft.
- Branch: `feature/loan-requirements-review-20261103`; isolated checkout: `.requirements-review`.
- Final tested application/lock commit: `5255a85958f811aacfbf744ae8219137fb6e8a0f`. Installer corrections and final handoff follow this runtime commit; their passing checks are recorded below. This handoff is a subsequent documentation-only commit; use the final PR head for merge approval and pass that full approved head to the post-merge packager. The runtime/build source is this exact implementation commit.
- Final review started at the requested clean PR head `66ca4e3320d2bc00fbc508a65ccbc55b4f315471`; earlier implementation evidence from `7ed7f3f` was reused. Existing work was inspected before editing; no partial changes were overwritten.
- Fetched `origin/main` remains `17eac94b39b708ee9e0979de0bda4efd551e6d24`, matching the user-confirmed dashboard release `20261021-17eac94b-dashboard`.
- Original dirty main remains `facbc4c5b5014937f7b218f9f5eda0b78c908f92` (ahead 1 / behind 46). Its HEAD and hashes of every previously tracked dirty file are unchanged. No reset, clean, stash, forced checkout or dirty-main merge.
- The original sibling implementation `../paisa-mart-requirements-20261101`, branch `feature/loan-requirements-20261101` at `110bda741f3df72e9c59e3b755605a2852b64165`, and detached `.dash` baseline were preserved.
- Dependencies were reused and restored by the existing guarded try/finally build helper. Temporary investigations, browser harnesses, screenshots, synthetic databases and local preview exports stay outside the PR.
- GitHub metadata was checked before this update: PR open/draft/unmerged, exact expected prior head and main base, no returned main branch rules. No hosting check, hosting configuration or hosting deployment was investigated or changed in this resumed work. Netlify/Vercel preview results are excluded from AWS readiness.
- GitHub briefly continued reporting PR head `66ca4e3` after branch pushes. A subsequent remote check confirmed that PR #6 and its source branch both resolved to `9cfc506cd47ce5e3778fe51c94ed8b230fef79cf`; the mismatch resolved without force push, close/reopen, merge or bypass. This follow-up changes only documentation. **Before merge approval, recheck that PR #6 matches the latest published feature-branch head, including this handoff update.** The draft description links the tested implementation and review evidence.
- Non-hosting check runs/statuses for the published review commit: none returned. Main rules: empty; classic branch-protection endpoint: 404 (none returned). GitHub reported mergeable but an overall `unstable` state; ignored hosting preview results are not used to establish AWS readiness. Missing remote checks do not replace the recorded local verification.

## Conditional merge approval — final checks

- Initially verified the exact user-approved PR head `ca9a09123b89bd2fd91b9706489997b9cb81f370`. GitHub returned no unresolved review threads/reviews, no required rules/checks, and supports merge commits. Hosting previews are excluded from AWS readiness.
- **Corrected the prior retry classification:** Life/Vehicle server submissions are introduced by this PR, so their lost-response retry duplication was a merge blocker, not merely inherited behavior. Business's changed client had the same exposure. All three changed clients now persist submission keys/fingerprints across reloads and reject changed uncertain payloads. Atomic unique keys return the original saved ID/time on retries; conflicting payloads receive 409 without overwriting records. New Life/Vehicle APIs require a key; the already-deployed unkeyed Business API remains compatible. No global deduplication by phone number is claimed.
- Runtime/lock correction commit: `5255a85958f811aacfbf744ae8219137fb6e8a0f`. Windows installer fix: `1936fc118d6b28783359eda3a94b65c0e4243431`. This handoff is a documentation-only follow-up. The user's explicit fix-before-merge approval covers these necessary corrections; merge must use the resulting exact PR head after fresh remote validation.
- **51 application tests / 695 assertions passed** for the affected APIs, durable clients, SQLite upgrade, admin, Personal behavior and disabled financial actions. Valid passing application evidence was reused, not repeatedly rerun. Guarded packaging tests: 29 existing safety tests plus 3 dependency-install tests passed (32 total).
- **Fresh locked build passed:** mobile types, focused backend types, Bun bundle and Expo web export. **106 fresh-dependency desktop/mobile browser checks passed**, no runtime errors: lost-response/reload recovery, confirmations, calendars, navigation, admin lists/counts/assignment/Home refresh and disabled finance. The earlier 37 retry checks also passed on the old available dependency tree; earlier unchanged service evidence is retained, not double-counted.
- Exact dependency failure: root `npm ci` fails with `Invalid Version` because its lockfile contains empty entries; mobile Bun lock lagged the committed manifest. Its minimal reconciliation locks Router 6.0.24, MSG91 2.1.0 and Local Authentication 17.0.9 plus corresponding transitive entries, without changing package.json. A successful frozen mobile install was reused after the copy failed with WinError 3 on native package paths exceeding 260 characters. The installer now uses extended Windows paths, tested with a long-path fixture, without changing OS settings. The failed copy was preserved separately. Fresh frozen mobile/backend installation and input hashes are recorded in `dependency-install.json`.
- Exactly **11 backend runtime files** remain changed. Four deployed Personal files are unchanged. SQLite adds nullable submission-key/hash columns and unique indexes on Business/Life/Vehicle; existing rows retain NULL keys, and migration tests preserve old rows/constraints/history. Unapproved payout calculations, revenue/TDS actions, payout mutations and withdrawal remain disabled.
- Original dirty main and other checkouts are preserved. No live EC2 access, upload, migration, restart or deployment occurred. The pre-existing full-backend compiler limitation remains documented; PostgreSQL is excluded from the confirmed SQLite release target.

Evidence: `.build-tools/pr6-merge-20261105/`, its `locked/` build/browser results, and `.build-tools/pr6-locked-dependencies/dependency-install.json`. Temporary files stay outside the PR. Follow `deployment/requirements/README.md` for guarded packaging from the merged commit. The final release's local `HANDOFF.md` will record merge SHA, exact upload folder and artifact hashes after packaging.

## Requirements, deduplicated against both PDFs

Sources already extracted and visually inspected:

- **A**: `Admin portal.pdf`, 3 pages; SHA256 `ac1d180ab2b9539ae3d557d6b5a3f401078720fd8b7a23eb2ff03090d5bfb49a`.
- **C**: `Customer portal (1).pdf`, 3 pages; SHA256 `58e39b3f5adb1a833927a73c5afb4aa4c1f499571c7d8db174c21a84af479bc1`.
- Available conversation/WhatsApp instructions: preserve UI and deployed work, real backend saves/references, failure and duplicate protection, verification, no unconfirmed payout calculations, no merge/deploy. Repeated requirements appear once below. Any WhatsApp-only wording absent from the available conversation remains unverified; no financial policy was inferred from it.

| ID | Deduplicated requirement | Source | Status and evidence |
|---|---|---|---|
| N01 | Business Loan calendar DOB | C1 | **Complete**: existing shared Home calendar; real-date validation; desktop/mobile selection and backend persistence tested. |
| N02 | Business Loan Submit saves full form; contact-shortly success | C1, conversation | **Complete**: actual API receipt, all form fields persisted, visible web/native confirmation; invalid receipt/failed write cannot display success. |
| N03 | Life Insurance Submit saves; contact-shortly success | C1 | **Complete**: insurer, policy and premium saved; numeric custom premium validation; actual reference and confirmed success dialog. |
| N04 | New/Used Vehicle before Vehicle Type | C2 | **Complete**: required selector precedes type; validated enum is retained in SQLite/PostgreSQL JSON payload and admin details. Existing rows without a condition remain readable. |
| N05 | Vehicle Loan calendar DOB | C2 | **Complete**: same picker and strict real-date checks as Business/Home. |
| N06 | Vehicle Loan Submit saves full form; contact-shortly success | C2 | **Complete**: saved reference, errors, duplicate-click guard and Home button tested at both viewports. This is Vehicle Loan, not Vehicle Insurance. |
| N07 | Personal, Business and Vehicle eight loan stages | A1, C1 | **Complete**: New leads, Contacted, Documents pending, Login/application submitted, Underwriting, Sanctioned, Disbursed, Rejected/dropped; stored stages, optimistic versions, history, permissions and refresh tested. Sanctioned requires recorded provider approval/evidence. |
| N08 | Separate Home Payout box after Rejected | A1 | **Complete for layout**: box follows the existing eight stages; clearly disabled awaiting financial confirmation. It is not a ninth application stage. |
| N09 | Credit Card Leads → Logins → Activation | A1 | **Complete (non-financial)**: persisted Credit Card intake and Leads → Logins → Credit Card Activation, with recorded provider approval/evidence, assignments and audit history. |
| N10 | Bank Account Leads → Logins → Activation | A3 | **Complete (non-financial)**: persisted Bank Account intake and Leads → Logins → Account Activation, with recorded provider approval/evidence. |
| N11 | Insta Loan Leads → Logins → Net Disbursement | A2 | **Complete (non-financial)**: persisted Insta Loan intake and Leads → Logins → Loan Net Disbursement. Final milestone requires recorded provider disbursement/evidence; approval alone is rejected. |
| N12 | Health Insurance Leads → Logins → Policy Issued | A2 | **Complete (non-financial)**: existing Health form submits all fields to the backend; Leads → Logins → Policy Issued, with recorded provider approval/evidence. |
| N13 | Motor Insurance Leads → Logins → Policy Issued | A2 | **Complete (non-financial)**: both existing Motor policy and Vehicle Insurance quote forms save to the backend; Leads → Logins → Policy Issued, with recorded provider approval/evidence. |
| N14 | Life Insurance Leads → Logins → Policy Issued | A2–3 | **Complete** for saved applications: new API source is connected to admin, milestones persist, issuance requires recorded provider evidence. Dedicated navigation opens the existing saved-leads UI instead of the previously blocked local-only demo. |
| N15 | All 15 customer modules reflected in admin | C3 | **Complete**: all 15 catalogue modules appear in admin. Ten now have connected application sources; the other five show unavailable processing, without fabricated counts or success. |
| N16 | Referral box wording | A3 | **Complete**: exact “Earn up to ₹1 Lakh and Reduce Your Expenses”; referral share text no longer promises ₹500. Existing layout/styles retained. |
| N17 | Prevent false success and repeated clicks | Conversation | **Complete for confirmed receipt/repeat-click requirements**: all implemented forms await server receipts and use immediate submit locks. The five new service APIs also use atomic keys, persisted across reloads; uncertain changed-payload retries are blocked and same-payload retries return the original reference. Business/Life/Vehicle changed flows now also persist retry keys and use atomic server replay protection; their lost-response gap is fixed under the conditional merge approval. Different devices or deliberately cleared storage are not globally deduplicated by phone number. |
| N18 | Dashboard counts, assignments, Home refresh, history, persistence | Conversation | **Complete** in isolated SQLite preview: automated regressions and browser changes/sign-out/sign-in pass. Original Overview spacing remains intact. |
| F01 | Executive review then manager approval; customer payout visible only afterward | A1–3 | **Awaiting business decision**: financial workflow remains disabled; responsibilities/role mapping and payout policy require approval before implementing financial state transitions. |
| F02 | Manual revenue; manual/automatic TDS and revenue; authorization only on customer payout | A1–3 | **Awaiting business decision**: no revenue/TDS calculation or write path enabled. The ₹10,000 / 5% / ₹9,500 example is not treated as a universal rule or tax basis. |
| F03 | Credit Card example ₹1,800 minus ₹400 → customer ₹1,400; admin ₹400 | C1 | **Awaiting business decision**: deducted-share meaning not assumed; no calculation enabled. |
| F04 | Bank example ₹1,000 minus ₹250 → customer ₹750; admin ₹250 | C1 | **Awaiting business decision**: same unresolved deducted-share definition. |
| F05 | Home ₹1 lakh / ₹300 example | C1 | **Awaiting business decision**: fixed amount versus rate unconfirmed. |
| F06 | Personal ₹1 lakh / ₹1,500 example | C2 | **Awaiting business decision**: fixed amount versus rate unconfirmed. |
| F07 | Business ₹1 lakh / ₹1,500 example | C2 | **Awaiting business decision**: PDF body says “personal loan” under the Business heading; not silently interpreted. |
| F08 | Insta 2.00% minus 0.40% / customer 1.60% example | C2 | **Awaiting business decision**: deducted-share meaning/base and financial policy unconfirmed. |
| F09 | Vehicle new 0.4%, used 1% on disbursed amount | C2 | **Awaiting business decision for financial activation**: selection/data are implemented, calculation remains disabled under the user's explicit non-financial-only instruction. |
| F10 | Motor net premium excluding GST; tiered deductions 5/7/8/10 points | C2 | **Awaiting business decision**: thresholds retained in source PDF, not coded into payable amounts; deduction meaning/basis require confirmation. |
| F11 | Health net premium excluding GST; 15% minus 5% example | C2–3 | **Awaiting business decision**: no assumed universal rate or deduction meaning. |
| F12 | Life ₹1 lakh / 20% customer payout; separate admin payout | C3 | **Awaiting business decision**: admin share/basis and complete policy unconfirmed. |

All five previously missing sources — **Credit Cards, Bank Accounts, Insta Loans, Health Insurance and Motor Insurance** — are required by the PDFs and now connected. None has been dismissed as out of scope. These are Paisa Mart intake records and staff-managed processing milestones, not automated bank/insurer issuance or disbursement integrations. Provider outcomes require staff to record the provider and supporting evidence; an application save does not assert provider acceptance.

Gold Loans, Real Estate, Cash on Credit Card, Recharge & Pay Bills, and Travel & Tickets remain in the 15-module catalogue. The PDFs require their visibility but do not specify their processing integrations in this PR. Unsupported processing remains explicitly unavailable.

## Changes completed in this continuation

- Added validated `POST /api/services/:product/applications` for the five required service types. Saved full existing Health/Motor form fields, contact details, selected provider/product and the separate Vehicle Insurance quote fields.
- Added five persistent source tables with UUID IDs, actual `CC-`, `BA-`, `IL-`, `HI-`, `MI-` references, timestamps, unique submission keys and request hashes. Same-key concurrent/retry requests return one original receipt; changed payload with an existing key returns conflict. Failed database writes return an error, never a receipt.
- Replaced Health/Motor/Vehicle Insurance local-store success paths with awaited server saves. Existing form design, choices and styles remain. Success dialogs show the actual saved reference. Motor's separate confirmation route re-verifies its server receipt, including after reload; fabricated/missing references cannot display success. Receipt responses contain no applicant/contact/health data.
- Connected Credit Card, Bank Account and Insta Loan application buttons to contact-detail intake in the existing visual style. Existing product pages remain; a provider URL is no longer treated as a saved Paisa Mart application. Removed the new route's duplicate default header after visual review.
- Connected all five sources to existing admin lists, real counts, filtering, assignments, permissions, optimistic versions, stage history and transactional audit writes. Replaced the three previously blocked local-only insurance admin pages with redirects to their saved application lists.
- Completed Leads → Logins → Activation/Policy Issued/Net Disbursement. Activation/issuance require recorded approval evidence. Insta Loan net disbursement requires recorded **disbursed** evidence, not just an approval. Viewer contact masking and sensitive-field/history restrictions are preserved.
- Existing customer/admin authentication contracts are unchanged. Admin page reload retains the existing requirement to sign in again; saved applications and processing history survive that sign-in. No silent-login behaviour was added.
- Unapproved payout/TDS/revenue calculations, incentive/payout mutations and customer withdrawal remain disabled. Provider processing milestones do not enable financial payouts.

## Final implementation review of the 11 runtime files

Reviewed authentication, customer data exposure, administrator/operations/viewer permissions, additive SQLite migrations, duplicate handling, audit atomicity and disabled financial actions against the deployed dashboard source.

Four review findings were corrected:

1. **Uncertain service submissions:** the five-service client previously minted another key when details changed after an uncertain response. It now persists a SHA256 fingerprint and random key (no duplicate contact/medical payload), retains that key across reloads, blocks changed details until the earlier submission is resolved, and permits correction after a definite validation rejection. Immediate concurrent submissions remain locked.
2. **Receipt isolation:** a UUID alone previously revealed receipt metadata. Receipt reads now require the submitting device's separate private key; missing keys receive 401 and mismatches 404. Responses contain only ID/reference/time, never customer/medical details, and are not cacheable. Copied confirmation links on another device cannot show success.
3. **Provider evidence:** a completed service milestone could retain its final stage after evidence was cleared in a later edit. All edits now preserve required provider/evidence/decision invariants, or explicitly move back to a processing stage. Existing Personal/loan transition behavior remains.
4. **Audit reconstruction:** updates now record exact before/after metadata values in the admin-only audit log. Regression coverage proves an audit-write failure rolls back both application changes and optimistic version; previous-stage history is preserved.

The existing customer forms use public guest intake by design; a submitted phone number is contact data, not proof of authenticated account ownership. No customer list/detail/update/delete API is added. Service receipt access is possession-based and device-bound; it does not introduce a new customer account authorization model. Admin APIs verify signed tokens and current active staff roles on each request; viewer writes, privileged staff/export/audit operations and finance mutation attempts remain denied. Viewer projections omit sensitive medical/policy fields, evidence and history, and mask contact numbers. Personal authenticated receipt/status ownership checks are unchanged.

SQLite upgrades were run twice against a populated October-schema fixture. Existing Business values, its NOT NULL amount constraint, Personal data and audit rows survived; seven new intake tables were empty and integrity remained `ok`. No production database was opened. Migration and code rollback preserve additive schema and later submissions.

No merge blocker remains in the reviewed non-financial SQLite scope. The earlier classification of the Business/Life/Vehicle retry gap was corrected during the conditional merge check above; those changed submission flows now have durable client keys and atomic server replay protection. Provider automation, cross-device identity/deduplication and unapproved payout rules are not fabricated. These intake limitations do not enable financial actions.

## Verification results

The earlier 59-test / 212-browser-check evidence below is retained from implementation `7ed7f3f`; it was **not all rerun** during final review. Unchanged coverage was reused as requested. Affected regression files ran in separate Bun processes against isolated SQLite databases.

| Check | Result |
|---|---|
| New service backend regressions | 9 passed / 203 assertions |
| New service API receipt regressions | 3 passed / 28 assertions |
| Existing Business/Life/Vehicle, Home, Personal, admin, dashboard refresh/count/history and payout-guard regressions | 47 passed / 410 assertions |
| **Total** | **59 passed, 0 failed; 641 assertions** |
| Mobile `tsc --noEmit` | Passed |
| Focused strict backend TypeScript check | Passed for all changed routes and dependencies, including the five new services |
| Expo web export | Passed; explicitly localhost-only API configuration |
| Bun backend bundle | Passed; 33 modules, dependencies external |
| Existing browser acceptance | 69 passed, 0 runtime errors |
| Five-service browser acceptance | 143 passed, 0 runtime errors |
| **Browser total** | **212 passed**; desktop 1440×1000 and mobile emulation 390×844; 56 screenshots |
| Source scope / whitespace / preservation | Passed |

Browser coverage: original calendars/forms, actual references, failed submissions, repeat clicks, Home refresh, existing dashboard counts/history, all 15 modules, disabled payouts; plus all five new intakes, both Motor entry points, errors/retry keys, Back to Home, forged confirmation rejection, Motor receipt after reload, saved lists/counts, assignment, Logins, provider evidence, final milestones, sign-out/sign-in persistence and insurance admin navigation. Screenshots were inspected for form/dialog/pipeline spacing. Test-harness locator corrections were rerun; only final passing runs are counted. Physical devices/native binaries and live EC2 UI are not claimed tested.

Local preview: `http://127.0.0.1:4796/__preview`, synthetic database `.preview/services-review-20261104.sqlite`. The prior preview database was preserved. Browser requests outside localhost were blocked. The local preview process was restarted to load source; production services were not touched.

Evidence: `.build-tools/pr6-services-20261104/` contains logs, browser results/screenshots, compiler comparison, preservation checks, runtime-file list and build manifest. Earlier PDF and preservation evidence remains in `.build-tools/requirements-audit-20261103/`; compiler root-cause evidence remains in `.build-tools/pr6-final-review-20261104/`.

## Final review verification (affected checks only)

- **39 application regression tests passed, 522 assertions**: services 11, SQLite upgrade 1, durable client 2, receipt API 3, admin operations 11, Business/Life/Vehicle 5, deployed Personal application behavior 6. These overlap earlier evidence and are not added to 59 as if all were distinct.
- **29 maintained packaging/installer fixture tests passed**: dirty/feature/unreviewed-tree/scope refusal, exact archive members/checksums, no overwrite, verified backups, update/rollback failure/interruption recovery and isolated migration rehearsal. PM2 and builds are simulated in these tests; this is not live EC2 validation.
- **25 additional browser checks passed**, zero runtime errors, at 1440×1000 and 390×844: saved-but-lost response, changed uncertain retry refusal, same key/reference after reload and repeated clicks, no local contact/medical payload, private receipt reload, copied-link rejection, missing-key API rejection and Back to Home. Eight screenshots captured; affected desktop/mobile form/error/confirmation spacing inspected. A screenshot-animation timing assertion in the harness was corrected and the final complete run passed; no UI implementation was changed for it.
- Mobile TypeScript, focused strict backend types, fresh localhost Expo web export and Bun backend bundle passed. The baseline full-backend compiler limitation below is unchanged; it was not needlessly rerun.
- Actual recorded October dashboard/Personal archives were read and verified; 37 baseline source entries and exactly four Personal files matched. The actual clean feature checkout was rejected by the production source guard before creating output. Exactly **11 runtime backend files** remain in scope.
- Final review preview: `http://127.0.0.1:4797/__preview`, new synthetic `.preview/final-review-20261104.sqlite`. The older previews/databases remain intact. No existing production service was restarted.

Evidence: `.build-tools/pr6-final-implementation/verification.json`, `checks.json`, per-suite logs, `browser/results.json`, eight screenshots and `review-build-manifest.json`. Harnesses, local previews and generated artifacts remain outside the PR. Only maintained regression tests and release tooling are tracked.

## Backend compiler crash — baseline comparison

Using the **same Node v24.17.0, TypeScript 5.9.3 binary and existing dependency trees**, standard `tsc --noEmit` exits 1 with `RangeError: Maximum call stack size exceeded` on both unchanged `.dash` at main `17eac94b` and this PR. Compiler SHA256: `8d5fa5bd883fec0979fc2004f1fe1d99aef40570155d550eadc0b03b55513bf0`. Backend package declares TypeScript 5.8.3; the actual available compiler used for both comparisons was 5.9.3.

Cause isolated: backend tsconfig enables `allowJs` without excluding generated public files. The unchanged 5,000,926-byte `backend/public/_expo/static/js/web/index-7e06d781bdebf292c78e296aead591a3.js` alone reproduces the crash (SHA256 `4e4b185350b4eb5d0c2b49851f1a1686bd45a8ce89e0df5cf42c7c872475a699`). No baseline file was edited to obtain that result.

Checking runtime TypeScript source while excluding generated output/tests completes: baseline has seven diagnostics; PR has five, all inherited (`HeadersInit` in index; two nullable-config diagnostics in auth; two optional-value diagnostics in kyc). The two Business diagnostics are fixed by this PR. The focused strict check of changed code is green.

**Effect on readiness:** the crash is pre-existing and does not prevent validating these changes with focused types, SQLite regressions, builds and browser tests. The repository-wide backend typecheck is still not green and must not be represented as passing. Its baseline cleanup/acceptance remains a disclosed review limitation, not a newly introduced compiler regression.

## AWS EC2 production baseline and database

Production is **AWS EC2 only**. User-confirmed baseline:

- App: `/home/ec2-user/paisa-mart-new`
- Toolkit: `/home/ec2-user/paisa-mart-deployment`
- Database: `/home/ec2-user/paisa-mart-data/payments.db` (**SQLite**)
- Last dashboard release: `20261021-17eac94b-dashboard`
- Personal Loan already deployed October 18; do not repeat it or the dashboard deployment.
- Recovery master `FINAL-GOOD-20261006` is untouched and recovery-only.

Local deployment evidence agrees: `release/dash-final/HANDOFF.md`, `EC2-READONLY-VERIFY.txt`, and `deployment/dashboard/backend-update.py` guard the exact SQLite path and established Bun/PM2 process. This is a user-confirmed/recorded baseline, **not a fresh live process/environment inspection**.

The five new sources use the dashboard database configuration (`HOME_LOANS_DATABASE_URL ?? DATABASE_URL ?? POSTGRES_URL`, otherwise `LEADS_DB ?? TXN_DB ?? payments.db`). For the confirmed production configuration, they use the existing SQLite file. **Unverified PostgreSQL does not block this SQLite release scope.** PostgreSQL paths are typechecked but not integration-tested. Any live PostgreSQL override or separate-service database discovered later must stop release preparation for investigation/testing, not silently switch production.

## Backend scope, schema and preservation

There are exactly **11 backend runtime files changed versus the deployed dashboard main**, not an old three-file/seven-file dashboard bundle:

- `backend/src/index.ts`
- `backend/src/lib/admin-operations.ts`
- `backend/src/lib/business-loan-lead-store.ts`
- `backend/src/lib/insurance-lead-store.ts`
- `backend/src/lib/service-application-store.ts`
- `backend/src/lib/vehicle-loan-lead-store.ts`
- `backend/src/routes/admin-operations.ts`
- `backend/src/routes/business-loans.ts`
- `backend/src/routes/life-insurance.ts`
- `backend/src/routes/service-applications.ts`
- `backend/src/routes/vehicle-loans.ts`

The continuation adds only the shared service store/router to the prior nine-file November feature scope; index and admin aggregation connect them. No dependency or authentication implementation was changed.

Additive schema effects: nullable Business form columns; Life and Vehicle Loan tables from the earlier implementation; and five new service tables: `credit_card_applications`, `bank_account_applications`, `insta_loan_applications`, `health_insurance_applications`, `motor_insurance_applications`. New tables are initialized with `CREATE TABLE IF NOT EXISTS` by the corresponding stores; admin stage/assignment/history continues in existing `admin_operations`/`admin_audit`. No existing rows/tables are dropped or converted. No live migration ran.

All four deployed Personal Loan files remain unchanged versus current main and recorded October Personal source/archive:

- `backend/src/routes/personal-loans.ts`
- `backend/src/routes/personal-loan-applications.ts`
- `backend/src/lib/personal-loan-application-store.ts`
- `backend/src/lib/personal-loan-lead-store.ts`

Personal archive SHA256 remains `66435ab4231afe50e44e31905511f0c55181b7619756a506faa7715da8dc9e5b`; dashboard archive remains `5f149daae3a0a7afa0d4e252e3b5cf80860987b3a93221caa24cae4a0a11bb8a`. No old artifacts were overwritten. Windows line-ending differences are distinguished from normalized source equivalence; future live byte mismatches must stop for review.

Rollback must restore only the affected code from a separately verified backup, preserving existing and newly collected application rows, audit history and additive schema. Do not roll back this feature by restoring an older database or deleting new application tables.

## Review build checksums — DO NOT UPLOAD

Source `fe7123f9a7ccf694106d2655a4a531b7d9242495`. These new local review builds use `http://127.0.0.1:4797`, **not production release configuration**. They supersede the review hashes above/prior handoffs for the changed runtime source. The previous 4796 export remains intact; the ignored local backend review bundle was rebuilt.

| Local review file | SHA256 |
|---|---|
| `.requirements-review/.preview/final-review-export/index.html` | `d77d5d4cb17af0f7fb4befd60d7002981c7b1df2079135a35344e1a852d4711e` |
| `.requirements-review/.preview/final-review-export/_expo/static/js/web/index-63c28e1c48ddcf95ca56c2564b6a8ea7.js` | `5bf2600cdd28115160b4370e51e4e8b4a7220cff2047907e6a3a2008a3b01716` |
| `.requirements-review/.preview/backend-build/index.js` | `65fa7fdbd4717072667482f34ba58017e96f33849de6096938a221ec0cbe307c` |
| `.build-tools/pr6-final-implementation/review-build-manifest.json` | `d605b5c1133a71eedb67d1cc6fef21e918f99e0bcf7bbf6395e3f75d5a32b4e5` |

## Guarded FileZilla → EC2 release preparation

The exact post-merge commands are maintained in **[deployment/requirements/README.md](deployment/requirements/README.md)**. New maintained `prepare_release.py` and `backend-update.py` adapt the existing guarded process to the 11-file delta and October 21 baseline, with 29 safety tests. Existing October scripts/artifacts remain unchanged.

The packager requires clean fetched merged main, reviewed ancestry and an identical reviewed tree; verifies both retained October archives and all four Personal files; builds fresh production-configured frontend output; emits exactly 11 LF backend source files; verifies archive contents and SHA256 checksums; and refuses existing output. The updater verifies current process identity, secret presence and all seven database override variables without printing secrets. Its later authorized update creates verified source/config/PM2/SQLite backups and rehearses migrations on a disposable copy before stopping or changing live code.

The README separates local preparation, separately approved FileZilla upload, read-only live baseline verification, later authorized activation and rollback. It includes the recorded October 21 frontend index checksum, checksum-root verification, exact actual script flags and backup locations. Rollback preserves all application/audit rows, additive schema, Personal files and secrets. Installed `verify.py` is documented; installation of deploy/rollback tools is not assumed, and the procedure uses checksum-verified packaged tools. `FINAL-GOOD-20261006` is never selected or modified.

**No final production archive/upload directory was built from this feature branch.** Final release paths and hashes must be generated after an approved merge; current review hashes cannot substitute for them. No live baseline verification, upload, restart, migration or deployment has occurred.

## Remaining blockers and business decisions

**Implementation:** all confirmed non-financial requirements represented above are complete in the tested SQLite preview. External provider automation was not specified and is not fabricated. No payout calculation is enabled.

**Verdict: ready for user merge review in the confirmed SQLite scope**, with the documented pre-existing full-backend compiler limitation. The changed-flow retry blocker is fixed. The transient remote-head mismatch resolved; matching the latest published head remains a required final pre-merge check. The user has authorized marking PR #6 ready and merging after these conditions pass; no production activation is authorized. Release gates are separate merge approval, clean merged-main build/verification, fresh live EC2 baseline checks, then separate upload/deployment authorization. PostgreSQL is unverified and excluded; any live override stops this SQLite release. No readiness claim relies on hosting previews.

**Business confirmation only:** meaning of deducted share; whether Home/Personal/Business examples are fixed payouts or rates; the Business example's Personal wording; revenue/TDS basis and manual/automatic rules; insurance percentage bases/tiers and Life admin share; executive/manager role mapping and authorization policy. F01–F12 remain disabled pending that confirmation.

## Exact PR file changes versus origin/main

67 tracked files, exactly 11 backend runtime files.

- `HANDOFF.md`
- `backend/.gitignore`
- `backend/src/index.ts`
- `backend/src/lib/admin-operations.ts`
- `backend/src/lib/business-loan-lead-store.ts`
- `backend/src/lib/insurance-lead-store.ts`
- `backend/src/lib/service-application-store.ts`
- `backend/src/lib/vehicle-loan-lead-store.ts`
- `backend/src/routes/admin-operations.ts`
- `backend/src/routes/application-receipts.test.ts`
- `backend/src/routes/business-loans.ts`
- `backend/src/routes/lead-idempotency.test.ts`
- `backend/src/routes/life-insurance.ts`
- `backend/src/routes/loan-insurance-regression.test.ts`
- `backend/src/routes/service-applications.test.ts`
- `backend/src/routes/service-applications.ts`
- `backend/src/routes/sqlite-upgrade.test.ts`
- `backend/src/routes/vehicle-loans.ts`
- `deployment/requirements/README.md`
- `deployment/requirements/backend-update.py`
- `deployment/requirements/install_dependencies.py`
- `deployment/requirements/prepare_release.py`
- `deployment/requirements/test_install_dependencies.py`
- `deployment/requirements/test_prepare_release.py`
- `mobile/bun.lock`
- `mobile/src/app/(tabs)/earnings.tsx`
- `mobile/src/app/(tabs)/index.tsx`
- `mobile/src/app/(tabs)/products.tsx`
- `mobile/src/app/(tabs)/profile.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/admin/(dashboard)/_layout.tsx`
- `mobile/src/app/admin/(dashboard)/dashboard.tsx`
- `mobile/src/app/admin/(dashboard)/health-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/home-loans.tsx`
- `mobile/src/app/admin/(dashboard)/lead-details.tsx`
- `mobile/src/app/admin/(dashboard)/leads.tsx`
- `mobile/src/app/admin/(dashboard)/life-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/motor-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/pipeline.tsx`
- `mobile/src/app/admin/(dashboard)/products.tsx`
- `mobile/src/app/admin/(dashboard)/vehicle-insurance-leads.tsx`
- `mobile/src/app/business-loans-details.tsx`
- `mobile/src/app/health-insurance-details.tsx`
- `mobile/src/app/life-insurance-details.tsx`
- `mobile/src/app/motor-insurance-details.tsx`
- `mobile/src/app/service-application.tsx`
- `mobile/src/app/share-card.tsx`
- `mobile/src/app/vehicle-insurance/details.tsx`
- `mobile/src/app/vehicle-insurance/success.tsx`
- `mobile/src/app/vehicle-loans-details.tsx`
- `mobile/src/components/AdminDataBoundary.tsx`
- `mobile/src/components/AdminProductModules.tsx`
- `mobile/src/components/ApplicationSaved.tsx`
- `mobile/src/lib/admin-store.ts`
- `mobile/src/lib/business-loan-api.ts`
- `mobile/src/lib/incentive-store.ts`
- `mobile/src/lib/life-insurance-api.ts`
- `mobile/src/lib/loan-product-stages.ts`
- `mobile/src/lib/product-catalog.ts`
- `mobile/src/lib/service-application-api.ts`
- `mobile/src/lib/service-submission.ts`
- `mobile/src/lib/use-service-submission.ts`
- `mobile/src/lib/vehicle-loan-api.ts`
- `scripts/lead-submission-retry.test.ts`
- `scripts/payout-guard.test.ts`
- `scripts/service-application-api.test.ts`
- `scripts/service-submission.test.ts`
