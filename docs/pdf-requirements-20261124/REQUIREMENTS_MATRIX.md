# PDF requirements — verification matrix (24–25 Nov 2026)

Branch `fix/pdf-requirements-verify-20261124` from `origin/main` `28713f2` (PR #9, the confirmed production frontend). Backend source unchanged from `f4187f2` (Phase 1). Local commits only: no push, merge, upload, restart or deployment.

| Source | SHA-256 | Pages |
|---|---|---|
| `Admin Portal Updates (1).pdf` (U) | `9a4ce8f7…1cdd` | 1 |
| `Customer_Portal_Only (1).pdf` (P) | `93d33a1f…653c` | 1 |

Both are byte-identical to the copies without "(1)" and to the files PR #7 audited.

## How this was verified

Old handoff claims and unit tests were **not** taken as proof. Every result below comes from this run:

- **Real backend:** an unmodified `backend/src/index.ts` from each commit, on `127.0.0.1:3911` with a fresh scratch SQLite database. Synthetic identities only (`98765000xx`, `@example.test`).
- **Real OTP route** in dev-OTP mode (MSG91 unconfigured). No provider was called.
- **Outbound traffic blocked:**
  - A Bun preload refuses every non-loopback `fetch`. Its only hit was the Vibecode proxy's start-up `proxy.vibecodeapp.com/v1/domains` call, which was blocked.
  - Dead `HTTP(S)_PROXY`.
  - The browser aborts every non-loopback request (Google Fonts only).
- **Built web app:** a clean WSL clone with a frozen `pnpm` install and `expo export -p web`. It is a test build: `EXPO_PUBLIC_TEST_ENV=1` and a loopback API URL, so it refuses production. The backend served it the same way production does (from `public/`).
- **Two layers:**
  - [harness/http-verify.mjs](harness/http-verify.mjs): 216 HTTP checks.
  - [harness/browser-verify.cjs](harness/browser-verify.cjs): 101 headless Chrome checks at 1440 px and 390 px.
- **Same harness on both commits:**

| Commit | HTTP | Browser |
|---|---|---|
| Baseline `28713f2` | 216 / 0 | **99 / 2** (the two leaks below) |
| Fix `3797179` | 216 / 0 | **101 / 0** |

- **Results files:** `evidence/baseline-28713f2/*.json`, `evidence/fix-3797179/*.json`; screenshots in `evidence/fix-3797179/`.
- **To rerun:** copy `harness/` to a scratch folder, then run `bash wsl-web-export.sh <commit> http://127.0.0.1:3911 <web-dir>` (in WSL) and `bash verify-all.sh <commit> <web-dir> <tag>` (Git Bash). Staff and admin passwords are random per run.

## Loan-type inventory (Admin PDF "all loan types")

| Loan type | Persistent source | Change Stage location |
|---|---|---|
| Home | `home_loan_leads` + `home_loan_workflow` (HL) | Home Loan Pipeline, "Pipeline stage" dropdown |
| Business | `business_loan_leads` (BL) | Leads list and lead details modal |
| Personal | `personal_loan_applications` (PL) and legacy `personal_loan_leads` (PL-LEGACY) | Leads list and lead details modal |
| Vehicle | `vehicle_loan_leads` (VL) | Leads list and lead details modal |
| Insta | `insta_loan_applications` (IL) | Leads list and lead details modal |
| **Gold** | **None.** Catalogue entry only: no intake form, table, route or admin record | — |

## Matrix: Admin Portal Updates (U, page 1)

| ID | Requirement (verbatim) | Current screen / persistence | Result | Evidence and reproduction | Correction |
|---|---|---|---|---|---|
| U1 | "In all loan types, a separate **Payout** column should be added immediately after the *Rejected* stage in the Change Stage section. This should be manually updated." | **Screen:** Change Stage lists `… Disbursed, Rejected / dropped, Payout` (Insta: `Leads, Logins, Loan Net Disbursement, Rejected, Payout`). Home shows the same order in its pipeline dropdown. **Persistence:** separate `payoutStatus: 'selected'` in `admin_operations`. The stage and the provider decision are untouched. | **Verified working:** HL, BL, PL, PL-LEGACY, VL, IL. **Dependency:** Gold. | **HTTP (A, 16/16):** save, reload, stage and provider decision unchanged for all 6 sources; non-loans (CC, LI, BA) refused; viewer refused. **UI (A, 14/14):** exact option order in the modal for BL/PL/VL/IL and the Home dropdown; selection persists after reload and is marked "(current)" while the stage stays "New leads". **Screenshots:** `A-change-stage-modal-{desktop,phone}.png`, `A-home-pipeline-dropdown-desktop.png`. | None. Gold needs an intake/persistence source first; nothing was fabricated. |
| U2 | "In the Change Stage section, the **Sanctioned** button is not working. This functionality needs to be fixed." (Business Loan) | Business Sanctioned = stage `approved`. Saved without provider evidence (an internal stage), with stage history and an audit before/after. | **Verified working** (fixed earlier in PR #7; not broken now) | **HTTP (B, 6/6):** 200; persists after reload; history `new → approved` by `ops1`; audit `changes.stage` before/after; provider decision still `unconfirmed`; the customer sees Sanctioned. **UI (B, 3/3):** select Sanctioned → Update Stage → reload and sign in again → badge "Sanctioned"; Journey shows "New leads → Sanctioned". **Screenshot:** `B-business-sanctioned-desktop.png`. | None |
| U3 | Home, Business, Personal and Vehicle: "After the Disbursed stage, a separate Payout box … 1. Customer Eligible Payout 2. Paisamart Eligible Payout. Both fields should have an Edit option…" | **Screen:** an "Eligible payout" box on lead details, the Payouts tab and the Home pipeline. Before Disbursed it says "Available after Disbursed."; at Disbursed both inputs are editable, then saved with "Save payout amounts". **Persistence:** `admin_operations.payload.payout` stores exact decimal strings (`1234.50`), a revision and the editor. | **Verified working** | **HTTP (C, 56/56):** refused before Disbursed (including at Sanctioned); 13 invalid inputs refused with no change (`-1`, `1e3`, `NaN`, `Infinity`, `1.234`, `''`, `' 10'`, `10.`, `0x10`, `1,000`, `01`, over 12 digits, a JSON number); executive, manager, viewer and customer cannot edit; exact values persist (`999999999999.99` / `0.01`, `0` / `1200`); stage not overwritten; Home stage regression hides the payout and requires fresh approvals. **UI (C, 15/15):** prerequisite message; Disbursed via UI; negative input disables Save; UI-entered amounts persist after reload. | None |
| U4 | "Visibility Requirement: The Payout box and its details should be visible only after executive level approval and manager level approval." | Applicant release is gated on both approvals; staff review applies before release (table below). | **Verified working** under the settled 21 Nov rules. **Ambiguity A1** below. | **HTTP (E, 91/91):** one approval is not enough; the same role cannot approve twice; stale-version approval refused (409); an approval with the pre-edit version after an edit is refused; concurrent approvals on one version: exactly one 200 + one 409; either order (manager → executive) accepted; an editor later given an approver role cannot approve their own entry (403); admin, ops and viewer cannot approve; every amount edit (including Paisamart-only) clears both approvals; the applicant receives only `{referenceNumber, productType, customerAmount, currency}`; another customer gets nothing; audit `payout_amount_edit` / `payout_approval` for each product. **UI (E, 10/10):** the customer sees nothing → executive approves (read-only amounts) → still hidden → manager approves → the applicant sees only customer amounts → editing hides them again; a viewer sees no amounts or controls. **Screenshots:** `E-executive-payouts-phone.png`, `E-customer-payouts-phone.png`. | None |
| U5 | Bank Account: "After the Bank Account reaches the Account Activation stage, the following two fields should be added: Customer Eligible Payout, Paisamart Eligible Payout. Both fields should have an Edit option…" | The stored stage `approved` is labelled "Account Activation" (`SERVICE_STAGE_LABELS`). Reaching it requires a recorded provider decision and evidence (existing rule). | **Verified working** | **HTTP (D, 14/14):** not eligible at Logins (`submitted`); eligible at Activation; same validation and roles as U3. **UI (D, 3/3):** fields appear only at Account Activation; amounts persist. **Screenshot:** `C-bank-account-payout-entry-desktop.png`. | None |
| U6 | Bank Account visibility: "Payout details should be visible only after executive level approval and manager level approval." | Same mechanism as U4 | **Verified working** (A1 applies) | Covered in the E rows for BA | None |

### Who sees what (traced through the API and UI)

| Role | Before both approvals | After both approvals |
|---|---|---|
| **Admin / Ops** (authorised editors) | API rows include `payout` (both amounts and approval state) and `payoutEligible`. UI: editable inputs. Cannot approve (403). | Same; any edit clears both approvals |
| **Executive / Manager** | API rows include both amounts and approval state. UI: read-only amounts and "Approve as executive/manager". Cannot edit (403), cannot approve twice, cannot approve an entry they edited. | Same |
| **Viewer** | API rows contain no `payout` or `payoutEligible` key; masked phone. UI: "Payout review requires authorized staff access." | Same |
| **Applicant** (OTP token, owner phone) | `/api/customer-payouts` omits the record; `/api/customer-applications` never has payout fields | Customer amount only (no Paisamart amount, no staff identity); `no-store` |
| **Another customer / no token** | Nothing / 401 | Nothing / 401 |

## Matrix: Customer Portal (P, page 1)

"Lead profile" here means the lead/application **records the customer submitted**, not the account profile page. They are listed at Profile → "My applications & status" (`/my-applications`, `GET /api/customer-applications`). Ownership is the OTP-verified token phone only.

| ID | Requirement (verbatim) | Current screen / persistence | Result | Evidence and reproduction | Correction |
|---|---|---|---|---|---|
| P1 | "Customers can view their previously created lead profiles in the Customer Portal." | Lists every submission across the **11 persisted sources**: HL, PL, PL-LEGACY, BL, VL, LI, CC, BA, IL, HI, MI. Shows only customer-entered details. | **Broken (privacy), fixed.** Listing itself worked. | **HTTP (F, 12/12):** customer A sees all 11 own records; B sees only B's 3; missing, forged, admin and ops tokens get 401; `no-store`; fields are limited to reference, product, stage, dates and details; no notes, staff, evidence, CIBIL, DOB, income or payout amounts. **Defect reproduced on `28713f2`:** C opens My applications → logs out → D signs in on the same tab → D's screen rendered **all six of C's reference numbers** until D's list loaded. "My home loan applications" leaked the same way. **After the fix:** neither screen leaks (F 17/17). **Screenshots:** `F-my-applications-phone.png`, `F-customer-D-after-switch-phone.png`. | `gcTime: 0` (the existing My eligible payouts policy) via `CUSTOMER_PRIVATE_QUERY` on both screens |
| P2 | "Customers can track the current status of their applications." | Shows the admin-set stage with product labels (Home pipeline mapped; Sanctioned, Disbursed, Account Activation, Logins). "Refresh status" plus a 15 s poll. | **Verified working** | An admin stage change appears after "Refresh status" and after a full reload. The error state (503) shows the message and hides previously loaded records. | None |
| P3 | "The lead profile should remain visible in the Customer Portal even after being fetched to the Admin Portal." | Source rows are never moved or deleted. Admin metadata lives separately in `admin_operations`. | **Verified working** | After listing, opening, stage changes, Payout, assignment, notes and payout approval in admin, all 11 of A's records are still listed, with current stages. | None |

**Missing persistence, reported separately (not built):**

- **Gold Loans:** catalogue only.
- **Open Plots and WhatsApp leads:** stored only in device-local `zustand`/AsyncStorage. There is no server record, so they never reach another device's admin portal or a customer's server-backed list.
- **Vehicle-insurance leads:** the admin route redirects to the Motor Insurance source (covered).

## Admin regression smoke (built frontend, real routes)

- **Tabs:** Overview, Leads, Home Loan Pipeline, Pipeline, Products, Incentives, Payouts, Tasks, Analytics, Settings, Utility Txns, Health Ins., Motor Ins. and Life Ins. each opened at 1440 px and 390 px. **28 / 28 pass**, with no runtime errors.
- **No HTML for JSON:** no `/api/` response was `text/html`, which preserves PR #9's `/api/admin/operations` prefix fix.

## Ambiguities and dependencies (separate from fixes)

- **A1 – "visible only after executive and manager approval".** This is applied to the **released** display: the applicant's Customer Eligible Payout. The rule that authorised staff (admin/ops/executive/manager) see amounts before approval follows the owner's 21 Nov decision, since they must enter and review them.
  - **Open question:** does the PDF also intend to hide the box from *other* admin/ops staff (for example someone who neither entered nor approved it) until both approvals? Today every admin/ops user sees it. Viewers see nothing.
- **A2 – "Payout column".** This is implemented as a selectable Change Stage action stored separately from the stage. Once selected, it cannot be cleared from the UI.
  - **Open question:** should it be reversible, or is it a one-way marker? Unchanged.
- **A3 – "Edit option".** The fields are always-editable inputs with "Save payout amounts", not a separate Edit button. This meets "manual updating … whenever required"; a visual Edit button would be a design choice. Unchanged.
- **D1 – Approval order.** Either order is accepted (unchanged; settled unless the owner says otherwise).
- **G1 – Gold Loans** has no persistent source. Its Payout action and payout box cannot apply until an intake exists.

## Observations outside the PDFs (not changed)

- An admin browser reload returns to sign-in, because the admin store is in-memory.
- Customer logout lands on `/basic-info` ("Complete Your Profile") rather than sign-in: the tabs guard redirects before the logout handler's `router.replace('/')`. The token is cleared and no data is shown.
- Secret scan (`scripts/secret-scan.py`) shows 2 findings:
  - `scripts/admin-operations-api.test.ts:23`: already on `main` (PR #9) and not touched here.
  - `harness/http-verify.mjs:110` (`token: t.viewer1`): a variable reference, not a value (false positive).
- Backend `tsc`: not run. No backend file changed, and its known baseline (stack-overflow crash) remains as documented.
