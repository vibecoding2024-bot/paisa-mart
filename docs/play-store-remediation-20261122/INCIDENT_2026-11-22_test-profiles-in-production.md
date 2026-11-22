# Incident assessment — synthetic test profiles written to production (22 Nov 2026)

Status: **Production read-only checks AUTHORIZED (22 Nov 2026), PREPARED and DRY-RUN TESTED, NOT YET RUN.**
The agent has no existing authorized EC2 session (no SSH key or Instance Connect session is available to it),
so the owner runs the prepared read-only script in EC2 Instance Connect and returns its masked output. No
production record has been read, changed or deleted so far. Phone numbers are masked (`90XXXXXX01`). Only
synthetic values typed by the agent are described. See "Production read-only check" below.

## What happened

Local Android **test** builds (debug-signed, never distributed) were pointed at a local backend through
`EXPO_PUBLIC_API_URL`. Two clients ignored that variable and used `EXPO_PUBLIC_BACKEND_URL`, which defaults to
`https://paisa-mart.com`:
- `mobile/src/lib/user-profile-api.ts` (profile read and save);
- `mobile/src/lib/kyc-api.ts` (KYC start and status).

All other clients (OTP, applications, payouts, intake forms) honoured `EXPO_PUBLIC_API_URL` and reached only the
local backend. The production profile API had no authentication (A-01), so the requests succeeded.

## Builds involved

| Build (test variant) | Source | Installed (UTC) | Profile traffic went to |
|---|---|---|---|
| `4ed126ce…0b94` | `4d0557e` | 22 Nov 05:22:44 | production (affected) |
| `b9d1bd22…8cfa` | `d7c8a33` | 22 Nov ~09:47:52 | production (affected) |
| `1cc7e31a…c051` | `6d3a072` | 22 Nov 10:17:57 | production (affected) |
| `28a53fbf…6869` | `fcebb6b` | 22 Nov 10:36:34 | production (affected) |
| `97d9d5e3…6431` | `28651cc` (fix) | 22 Nov 11:41:52 | local only, on an emulator with production DNS blocked |

Candidate builds (production API by design) were only launched to the login screen, with no sign-in and therefore no
profile request. The `2616f1c` test build was stopped before installation.

## Per-number assessment

Times are UTC tool-call times from the agent session log. Each request followed within seconds.

| Number | Requests to production | Fields written by the POST | Existed before? | Linked applications or transactions in production |
|---|---|---|---|---|
| 90XXXXXX01 | <ul><li>GET after OTP verify, ~05:26</li><li>POST at Submit Profile, ~05:29:21</li><li>GETs from the Home guard until ~05:47</li></ul> | name (synthetic), email (synthetic `@example.com`), occupation, qualification, annual-income band, pincode, date of birth; CIBIL band probably empty (see note); PAN not entered | **Probably not** (see "Prior existence") | None found (see below) |
| 90XXXXXX03 | <ul><li>GET after verify, ~09:51</li><li>POST ~09:52:17</li><li>Home-guard GETs until 09:54:37</li></ul> | as above (synthetic `@example.test` email, DOB 2004) | Probably not | None found |
| 90XXXXXX02 | <ul><li>GET after verify, ~09:56</li><li>POST ~09:56–09:57</li><li>GETs at sign-ins ~10:18 and ~10:37 (returned the record: the app skipped the profile form)</li><li>Home-guard GETs</li></ul> | as above | Probably not before ~09:56 | None found |
| 90XXXXXX99 | <ul><li>GET after verify, ~09:59</li><li>POST ~09:59:32–10:01</li><li>Home-guard GETs</li></ul> | as above | Probably not | None found |

Notes:
- **Production write semantics** (`backend/src/lib/user-profile-store.ts`, unchanged in production per the release
  records). The POST is an upsert.
  - New phone: it inserts a row with `kycStatus='not_started'` and `createdAt=updatedAt=request time`.
  - Existing phone: it overwrites name, email, occupation, qualification, annualIncome, pincode, panCard, cibilScore and dateOfBirth, and sets `updatedAt`. `createdAt` and `kycStatus` are preserved.
- **GET requests** return only the requested number's own profile.
- **CIBIL band for 90XXXXXX01:** the selector was opened but no option tap was recorded. Probably empty; unconfirmed.

## Confirmed vs assumed

**Confirmed (local evidence)**
- The profile and KYC clients defaulted to production in these test builds (code at the listed commits; fixed in `28651cc`).
- No `/api/users` request reached the local backend from the four affected builds. The local logs `localdb/backend.log` and `localdb2/backend.log` show 0 such requests, while the `28651cc` run shows 15.
- After each Submit Profile, the app continued to MPIN. In code it does that only after an HTTP 2xx with `success:true`, so a server accepted each save.
- The app skipped the profile form for 90XXXXXX02 at ~10:18, meaning a profile GET returned that record.
- No KYC request was made: `kyc-api` was never invoked, there are no KYC taps in the session log, and KYC is disabled in the app.
- OTP, home-loan and business-loan submissions, `customer-applications` and `customer-payouts` all reached the local backend (local logs).

**Assumed / inferred (needs production confirmation)**
- That the accepting server was production `https://paisa-mart.com`. It is the only other configured destination, and DNS was not blocked then.
- That none of the four numbers had a production profile beforehand. At each first sign-in the profile form appeared empty, which is consistent with a 404. A network error would look the same.
- That no production applications, payouts or KYC records link to these numbers.
- That production request logs (PM2/Hono) still exist for these times.

**Unknown**
- Whether any of these numbers belongs to a real subscriber (they are valid-format Indian mobile numbers).
- The production log retention.

## Production read-only check (authorized; prepared; NOT YET RUN)

**Script:** [`incident_readonly_check.py`](incident_readonly_check.py). It uses only the Python standard library, and the four numbers are passed as arguments, so none is stored in Git. The owner pastes it as `python3 - <4 numbers> <<'PYEOF' … PYEOF` in EC2 Instance Connect as `ec2-user`. It runs from standard input, so it creates no file on the server.

**What it does (all read-only):**

0. **Re-verify the target.** Instance ID, Region and public IP come from instance metadata (IMDSv2, read). They should match `i-0e6f35bc4e48cde49` / `ap-southeast-2` / `54.252.33.16`.
1. **Confirm the database before querying.**
   - `pm2 jlist` (read only) must show exactly one `paisa-mart` process, running from `/home/ec2-user/paisa-mart-new/backend`. Environment values are never printed.
   - The profile and lead DB paths are resolved with the same precedence as the code (`USER_DB ?? TXN_DB ?? payments.db`, `LEADS_DB ?? TXN_DB ?? payments.db`). The resolution uses a `bun -e` probe in the app directory, as the guarded updater does, and prints only paths and the *names* of any Postgres URL variables that are set.
   - The resolved profile DB must be one of the files the live process actually holds open (`/proc/<pid>/fd`); otherwise the script STOPs. The recorded baseline path is `/home/ec2-user/paisa-mart-data/payments.db`.
2. **Confirm the schema.**
   - SQLite is opened with `mode=ro`, plus `PRAGMA query_only=ON`. It runs `quick_check` and lists tables with row counts.
   - The `user_profiles` columns must equal the reviewed 13-column store; otherwise the script STOPs.
3. **Live state of the four profiles** (exact match, plus substring match to catch other stored formats). It prints:
   - `createdAt`, `updatedAt`, `kycStatus`;
   - whether each timestamp falls in the incident window;
   - whether the email uses a reserved test domain (`example.com`/`.test`), as a boolean only;
   - which fields are non-empty (by name).

   It also prints the count of all profiles created or updated in the window.
4. **Verified pre-incident backup.**
   - All `payments.db` files under `/home/ec2-user/paisa-mart-data/backups/` are listed, opened `mode=ro&immutable=1`.
   - A backup is the **baseline** only if both the DB file's mtime and its `backup-ready.json` mtime predate 22 Nov 05:20Z, and the SHA-256 in `backup_hashes` matches the file. The newest such backup is used; the expected one is the PR #7 release backup `backend-before-20261121-595e5212-on-pr6-dashboard`.
   - It runs `integrity_check` on the baseline, then gets each number's presence and timestamps in the baseline and in every older backup.
5. **Overwritten-field comparison.** Each of the 9 overwritable fields gets `same` or `DIFFERENT` (live vs baseline). It also reports whether `createdAt` was preserved and whether `kycStatus` is unchanged. Values are never shown.
6. **Linked records.** It scans every column of every table except `user_profiles`, in the live DB and in the baseline, and prints counts of substring matches only. That covers all lead and application tables, `txns.payload`, `admin_*`, workflow history and audit details.
7. **Logs.**
   - PM2 `paisa-mart*` log files, including rotated and `.gz` files.
   - Per file: line count, mtime, and whether lines carry timestamps. It also counts, across all numbers:
     - `POST /api/users/profile` responses;
     - `GET /api/users/profiles` (list-all) lines;
     - KYC `PATCH` lines.
   - For lines mentioning one of the numbers it prints only the timestamp (if present), method, masked path without the query string, and status. Callback bodies and other lines are not shown.
   - Web-server log directories are reported only as present/readable. They are **not** read (that would need `sudo`, which was not authorized).

**Dry run (local WSL, synthetic replica, 22 Nov 14:40Z).**
- **Set-up:** fake `pm2` and `bun`, a process holding the DB open, a checksum-verified backup dated 21 Nov, plus planted secrets, names, emails, a query-string token and an unrelated real-format number.
- **Classification:** correctly reported one profile created in the window and absent from the baseline; one present in the baseline with `name`/`email` = `DIFFERENT` and `createdAt` preserved; two with no row.
- **Linked records:** found `txns.payload` and `home_loan_leads.phone` matches.
- **Logs:** printed masked GET paths with status codes.
- **Safety:** the leak scan found no secret, token, name, email or unmasked number in the output. The DB and backup SHA-256 were unchanged, and no `-wal`/`-shm`/journal file was created.

### How each profile will be classified

Timestamps alone are not treated as conclusive. `createdAt` is server-generated and preserved on upsert, so it is strong evidence, but it says nothing about state before a request.

| Classification | Required evidence (all) |
|---|---|
| **Newly created by the incident** | <ul><li>A live row exists.</li><li>No row in the checksum-verified pre-incident baseline, or in any older backup.</li><li>Live `createdAt` falls inside that number's request window.</li><li>No linked records in the baseline.</li><li>Reserved test email domain (consistent with the agent's synthetic input).</li></ul> |
| **Pre-existing (overwritten)** | A row is present in the verified baseline. Overwritten fields are those flagged `DIFFERENT`. |
| **Inconclusive** | Any of the following: <ul><li>No verified baseline.</li><li>Not in the baseline, but `createdAt` is before the window: created by someone else between the baseline and the incident, then overwritten, with no restorable prior values.</li><li>No live row.</li><li>Live linked records absent from the baseline.</li><li>A non-reserved email domain.</li><li>Multiple matching rows.</li></ul> |

### Results (production) — PENDING

| Number | Live row / createdAt in window | In baseline | Fields DIFFERENT vs baseline | Linked records (live / baseline) | Log lines | Classification |
|---|---|---|---|---|---|---|
| 90XXXXXX01 | pending | pending | pending | pending | pending | pending |
| 90XXXXXX03 | pending | pending | pending | pending | pending | pending |
| 90XXXXXX02 | pending | pending | pending | pending | pending | pending |
| 90XXXXXX99 | pending | pending | pending | pending | pending | pending |

Expected from local evidence (to be confirmed or refuted, not assumed): all four are **newly created** within their windows, with no linked records.

### Limits of the available evidence

- **Missing local logs prove nothing about other production traffic.**
  - The production profile API was unauthenticated (A-01) for the whole period. Anyone could have read or written these four numbers, or listed every profile through `GET /api/users/profiles`, before, during or after the agent's requests.
  - The list-all count in step 7 shows whether such calls happened. It cannot say who made them.
- **PM2 logs are weak.**
  - Hono's logger writes no timestamps unless PM2 adds them, so the script reports whether they exist.
  - `POST /api/users/profile` carries no phone number, so a save cannot be attributed to a number from the PM2 log.
  - Logs may have been rotated or truncated.
  - No source IPs are recorded there. Web-server access logs (with time and IP) were not read, because that needs separate `sudo` authorization.
- **The baseline is a single point in time** (the 21 Nov release backup). Changes between it and 05:22Z on 22 Nov are visible only through `createdAt`/`updatedAt`.
- **A later legitimate edit would also show `DIFFERENT`.** A recovery must therefore re-check that `updatedAt` still equals the incident value.
- **Substring matches can be false positives** (an ID containing the same digits), so each linked-record hit needs targeted review.
- **Postgres-backed stores, if configured, are not scanned.** The script reports whether any are configured.
- **Whether a number belongs to a real person cannot be established** from this data.

## Proposed action per profile (for owner approval after the results; nothing executed)

None of these is to be run until the results are recorded above and the owner approves the specific action. Each mutation is a separate authorization. It must:
- start with a fresh checksum-verified backup;
- run as a single transaction that re-checks the row's current `updatedAt` and does nothing if it changed;
- touch only that one row;
- have a row-level rollback from the backup. The whole database is never restored.

| Number | If newly created | If pre-existing | If inconclusive, or linked or real-person signs |
|---|---|---|---|
| 90XXXXXX01 | Delete that single `user_profiles` row (it holds only synthetic data). Rollback re-inserts the saved row. | Restore only the `DIFFERENT` fields from the baseline. Keep `createdAt` and `kycStatus`. Rollback writes back the saved incident values. | No change. Escalate to the owner, who also assesses whether notification is needed. |
| 90XXXXXX03 | same | same | same |
| 90XXXXXX02 | same | same | same |
| 90XXXXXX99 | same | same | same |

Also recommended, independent of the per-number outcome: ship the A-01 fix (owner-only profile access) so the exposure cannot recur, and decide separately whether to read web-server access logs (`sudo`, read-only) for timestamps and sources.

See also "Recovery proposal" in HANDOFF.md. The profiles must not be deleted, overwritten or repurposed until this is confirmed and approved.
