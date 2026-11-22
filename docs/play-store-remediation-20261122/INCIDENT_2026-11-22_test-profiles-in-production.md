# Incident assessment — synthetic test profiles written to production (22 Nov 2026)

Status: **READ-ONLY ASSESSMENT from local evidence only.** No production command was run for this document,
and no production record was read, changed or deleted. Phone numbers are masked (`90XXXXXX01`). Only
synthetic values typed by the agent are described. Production confirmation steps are listed at the end and
need explicit authorization.

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

## Production confirmation (read-only, NOT run; needs authorization)

Run in the established EC2 Instance Connect session as `ec2-user`. Print only the columns shown, never names or emails.
1. Identify the live SQLite path from the recorded release baseline (`deployment/requirements` verification output). Do not guess it.
2. Read-only query with `sqlite3 -readonly <db>`:
   `SELECT substr(phoneNumber,1,2)||'XXXXXX'||substr(phoneNumber,9,2), createdAt, updatedAt, kycStatus FROM user_profiles WHERE phoneNumber IN (<4 numbers>);`
   - If `createdAt` falls within the request windows above, the row was created by the incident.
   - If it is earlier, the row existed and was overwritten.
3. Prior state: run the same query against the newest backup taken **before** 22 Nov 05:22 UTC, for example the PR #7 release backup under `/home/ec2-user/paisa-mart-data/backups/` (use `-readonly`).
4. Linked records, counts only, read-only. Check these tables (from `admin-operations.ts` and `service-application-store.ts`), filtering each on its phone column for the 4 numbers:
   - leads: `home_loan_leads`, `business_loan_leads`, `personal_loan_leads`, `personal_loan_applications`, `vehicle_loan_leads`, `life_insurance_leads`;
   - service applications: `credit_card_applications`, `bank_account_applications`, `insta_loan_applications`, `health_insurance_applications`, `motor_insurance_applications`;
   - other: `txns` (the phone sits inside the `payload` JSON, so use `instr(payload, <number>) > 0`), and `admin_operations` / `admin_finance_ledger` entries for any matching references.
5. Request evidence: PM2 logs for `/api/users/profile` lines in the windows above, counts and timestamps only.

## Recovery proposal (for review after the assessment; nothing executed)

See "Recovery proposal" in HANDOFF.md. The profiles are not to be deleted, overwritten or repurposed until the assessment is confirmed and the action is approved.
