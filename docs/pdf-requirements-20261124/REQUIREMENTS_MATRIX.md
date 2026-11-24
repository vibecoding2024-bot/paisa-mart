# PDF requirements — verification matrix (24–25 Nov 2026)

Branch `fix/pdf-requirements-verify-20261124` from `origin/main` `28713f2` (PR #9, the confirmed production frontend). Backend source unchanged from `f4187f2` (Phase 1).

**Summary:**
- Admin requirements are **verified working** on the current code, with no change.
- **Customer application-list privacy fix: tested locally only, not deployed.**
- **Gold Loan dependency: still incomplete.**

| Source | SHA-256 | Pages |
|---|---|---|
| `Admin Portal Updates (1).pdf` (U) | `9a4ce8f7…1cdd` | 1 |
| `Customer_Portal_Only (1).pdf` (P) | `93d33a1f…653c` | 1 |

Both are byte-identical to the copies without "(1)" and to the files PR #7 audited.

## Owner decisions applied (25 Nov)

- **Proceed only with the customer application-list privacy fix.**
- **Unchanged by decision:** current payout visibility, approval order (either order) and the one-way Payout selection.
- **Not implemented by decision:** Gold, Open Plots, WhatsApp, admin-session or logout-navigation changes.

## How this was verified

Old handoff claims and unit tests were **not** taken as proof.

- **Real backend:** an unmodified `backend/src/index.ts` from each commit, on `127.0.0.1:3911` with a fresh scratch SQLite database. Synthetic identities only (`98765000xx`, `@example.test`).
- **Real OTP route** in dev-OTP mode (MSG91 unconfigured; no provider called). Staff and admin passwords are random per run.
- **Outbound traffic blocked:**
  - A Bun preload refuses every non-loopback `fetch`. Its only hit was the Vibecode proxy's start-up call, which was blocked.
  - Dead `HTTP(S)_PROXY`.
  - The browser aborts every non-loopback request (Google Fonts only).
- **Built web app:** a clean WSL clone with a frozen `pnpm` install and `expo export -p web`, served by the backend from `public/` as in production. It is a test build (`EXPO_PUBLIC_TEST_ENV=1`, loopback API), so it refuses production.
- **Harness:**
  - [http-verify.mjs](harness/http-verify.mjs): 216 API checks.
  - [browser-verify.cjs](harness/browser-verify.cjs): 101 Chrome checks at 1440 px and 390 px.
  - [privacy-verify.cjs](harness/privacy-verify.cjs): customer A's list requests are **held in flight** through A's logout; B signs in through the real OTP UI in the **same tab** with **delayed** responses; A's held responses are **released during B's session**; then browser **back ×4 / forward ×4**. A DOM observer records any A reference number that ever renders.

| Commit | API | Browser | Privacy scenario |
|---|---|---|---|
| Baseline `28713f2` | 216 / 0 | 99 / **2** (settled account-switch leak, both screens) | 8 / **3** (in-flight leak, both screens, back/forward) |
| Intermediate `3797179` (`gcTime 0` only) | 216 / 0 | 101 / 0 | 8 / **3** (in-flight leak remained) |
| **Final `7a0ed91`** | **216 / 0** | **101 / 0** | **11 / 0** |

- **Results files:** `evidence/baseline-28713f2/`, `evidence/fix-7a0ed91/` (with screenshots) and `evidence/fix-3797179-privacy/`. The Change Stage modal screenshots in `evidence/admin-ui-3797179/` come from a build with identical admin code.
- **To rerun:** copy `harness/` to a scratch folder, then run `bash wsl-web-export.sh <commit> http://127.0.0.1:3911 <web-dir>` (in WSL), and `bash verify-all.sh <commit> <web-dir> <tag>` plus `bash privacy-run.sh <commit> <web-dir> <tag>` (Git Bash).

## Loan-type inventory (Admin PDF "all loan types")

| Loan type | Persistent source | Change Stage location |
|---|---|---|
| Home | `home_loan_leads` + `home_loan_workflow` (HL) | Home Loan Pipeline, "Pipeline stage" dropdown |
| Business | `business_loan_leads` (BL) | Leads list and lead details modal |
| Personal | `personal_loan_applications` (PL) and legacy `personal_loan_leads` (PL-LEGACY) | Leads list and lead details modal |
| Vehicle | `vehicle_loan_leads` (VL) | Leads list and lead details modal |
| Insta | `insta_loan_applications` (IL) | Leads list and lead details modal |
| **Gold** | **None.** Catalogue entry only: no intake, table, route or admin record | — **dependency, incomplete** |

## Admin Portal Updates (U, page 1) — verified, unchanged

| ID | Requirement (verbatim) | Current screen / persistence | Result | Evidence |
|---|---|---|---|---|
| U1 | "In all loan types, a separate **Payout** column should be added immediately after the *Rejected* stage in the Change Stage section. This should be manually updated." | **Screen:** Change Stage lists `… Disbursed, Rejected / dropped, Payout` (Insta: `… Loan Net Disbursement, Rejected, Payout`); Home shows the same order in its dropdown. **Persistence:** separate `payoutStatus: 'selected'`; stage and provider decision untouched. One-way by owner decision. | **Verified:** HL, BL, PL, PL-LEGACY, VL, IL. **Gold: dependency (incomplete).** | **API (A, 16/16):** save, reload, stage and decision unchanged for 6 sources; non-loans and viewer refused. **UI (A, 14/14):** exact order, persistence after reload, "(current)" marker. **Screenshots:** `admin-ui-3797179/A-change-stage-modal-{desktop,phone}.png`, `fix-7a0ed91/A-home-pipeline-dropdown-desktop.png`. |
| U2 | Business Loan: "the **Sanctioned** button is not working. This functionality needs to be fixed." | Sanctioned = stage `approved`. No provider evidence needed; stage history and audit before/after recorded. | **Verified working** (fixed in PR #7; not broken now) | **API (B, 6/6):** history `new → approved` by ops; audit; decision still unconfirmed; customer sees Sanctioned. **UI (B, 3/3):** saved, badge after reload, Journey entry. **Screenshot:** `B-business-sanctioned-desktop.png`. |
| U3 | Home/Business/Personal/Vehicle: "After the Disbursed stage, a separate Payout box … Customer Eligible Payout, Paisamart Eligible Payout … Edit option" | An "Eligible payout" box on lead details, Payouts and the Home pipeline; editable inputs at Disbursed. Exact decimal strings in `admin_operations.payload.payout`. | **Verified working** | **API (C, 56/56):** refused before Disbursed; 13 invalid inputs refused with no change; non-editors refused; exact persistence (`999999999999.99` / `0.01`); stage not overwritten; Home stage regression requires fresh approvals. **UI (C, 15/15).** |
| U4 | "The Payout box and its details should be visible only after executive level approval and manager level approval." | Customer release gated on both approvals; authorised staff review beforehand (unchanged by owner decision; table below). | **Verified working** | **API (E, 91/91):** one approval insufficient; no duplicate role; stale and post-edit approvals 409; concurrent approvals exactly one 200; either order accepted; editor-turned-approver self-approval 403; admin, ops and viewer cannot approve; every edit clears approvals; applicant gets only `{referenceNumber, productType, customerAmount, currency}`; other customers get nothing; audit for each product. **UI (E, 10/10).** |
| U5 | Bank Account: "After … Account Activation … Customer Eligible Payout, Paisamart Eligible Payout … Edit option" | Stored stage `approved`, labelled "Account Activation"; needs a recorded provider decision and evidence (existing rule). | **Verified working** | **API (D, 14/14):** not eligible at Logins; eligible at Activation. **UI (D, 3/3).** **Screenshot:** `C-bank-account-payout-entry-desktop.png`. |
| U6 | Bank Account: "Payout details should be visible only after executive level approval and manager level approval." | Same as U4 | **Verified working** | E rows for BA |

### Who sees what (unchanged)

| Role | Before both approvals | After both approvals |
|---|---|---|
| Admin / Ops (editors) | API rows include both amounts and approval state; editable inputs; cannot approve (403) | Same; any edit clears approvals |
| Executive / Manager | API includes amounts and approvals; read-only plus "Approve as …"; cannot edit, approve twice or approve their own entry | Same |
| Viewer | No `payout` / `payoutEligible` keys; masked phone; no controls | Same |
| Applicant | Nothing in `/api/customer-payouts`; no payout fields in `/api/customer-applications` | Customer amount only (no Paisamart amount, no staff identity); `no-store` |
| Other customer / no token | Nothing / 401 | Nothing / 401 |

## Customer Portal (P, page 1) — privacy fix tested locally

"Lead profile" here means the **lead/application records the customer submitted**, listed at Profile → "My applications & status" (`/my-applications`, `GET /api/customer-applications`). Home loans also appear on "My home loan applications". Ownership is the OTP-verified token phone only.

| ID | Requirement (verbatim) | Result | Evidence | Correction |
|---|---|---|---|---|
| P1 | "Customers can view their previously created lead profiles in the Customer Portal." | **Listing worked. Privacy defect found and fixed; tested locally, not deployed.** | **API (F, 12/12):** all 11 sources (HL, PL, PL-LEGACY, BL, VL, LI, CC, BA, IL, HI, MI); ownership; 401 for missing, forged, admin and ops tokens; no notes, staff, evidence, CIBIL, DOB, income or payout amounts. **Defect 1 (`28713f2`):** after logout and a new sign-in on the same tab, B's screens rendered all of A's cached reference numbers. **Defect 2 (still present in `3797179`):** if A logged out while A's list request was in flight, B's screen joined A's pending request and rendered A's records, which persisted through back/forward. **Final `7a0ed91`:** browser F 17/17, privacy 11/11. **Screenshots:** `F-customer-D-after-switch-phone.png`, `privacy-B-my-applications-phone.png`. | Both list screens use `gcTime: 0` and a query key scoped to the signed-in customer's phone, and do not run without one (`mobile/src/lib/customer-private-query.ts`). |
| P2 | "Customers can track the current status of their applications." | **Verified working** | Admin stage changes appear after "Refresh status" and after a full reload. The error state hides earlier records. | None |
| P3 | "The lead profile should remain visible in the Customer Portal even after being fetched to the Admin Portal." | **Verified working** | All 11 records remain after admin listing, opening, stage, Payout, assignment, notes and approvals. | None |

**Not built (owner decision):**
- **Gold Loans:** no persistent source; **incomplete**.
- **Open Plots and WhatsApp leads:** device-local storage only.

## Admin regression smoke (built frontend, real routes)

- 14 tabs at 1440 px and 390 px: **28 / 28**, with no runtime errors.
- No `/api/` response was `text/html`; the PR #9 `/api/admin/operations` prefix is preserved (`scripts/admin-operations-api.test.ts` passes).

## Secret-scan findings (classified, not bypassed)

`python scripts/secret-scan.py` reports 2 findings; values are masked. No allowlist entry was added and no code was reshaped to avoid the scanner.

| Finding | Redacted evidence | Classification |
|---|---|---|
| `scripts/admin-operations-api.test.ts:23` `HOME_LOAN_ADMIN_PASSWORD` | The test assigns a 24-character string literal beginning `synt` (masked; sha256 `c4345558…`) to that environment variable. Added in `ed50d03` (PR #9). Found in no other tracked file. The test drives the app in-process with a mocked `fetch` (`http://local.test`). | **Synthetic test fixture, pre-existing on `main`; not a credential.** It was not compared with the production value, because there is no production access. Any change (rename, or a narrow per-file allowlist with reason) is the owner's decision. |
| `docs/pdf-requirements-20261124/harness/http-verify.mjs:110` `token` | The matched “value” is the 9-character identifier `t.viewer1`, passed as the request token option. `t` is filled at run time from `staffToken()` on the local backend (lines 64–65). | **False positive:** a variable reference with no literal value. |

## Recorded, unchanged

- **Payout visibility, either approval order and the one-way Payout selection:** kept as-is by owner decision.
- **Admin page reload returns to sign-in;** customer logout lands on `/basic-info`. Not changed.
- **Backend `tsc`:** not run. No backend file changed; its known baseline (stack-overflow crash) remains.
- **Not in scope, not tested:** "My eligible payouts" (`customer-payouts.tsx`) still uses a shared query key with `gcTime: 0`, the same pattern that had the in-flight gap. It was not exercised by these scenarios and was not changed (owner scope).
