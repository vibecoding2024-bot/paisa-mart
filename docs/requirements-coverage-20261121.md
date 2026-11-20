# Requirements coverage — four PDFs (November 21, 2026)

Branch `feature/admin-payout-approvals` (PR #7). Compared against main `18ae178` (PR #6 merged) plus PR #7.

## Sources (read completely)

| Key | File | SHA256 | Note |
|---|---|---|---|
| A | `Admin portal (1).pdf`, 3 pp | `ac1d180a…f49a` | Byte-identical to `Admin portal.pdf` audited for PR #6 |
| C | `Customer portal (1) (1).pdf`, 3 pp | `58e39b3f…c49a` | Byte-identical to `Customer portal (1).pdf` audited for PR #6 |
| U | `Admin Portal Updates.pdf`, 1 p | `9a4ce8f7…1cdd` | New since PR #6 |
| P | `Customer_Portal_Only.pdf`, 1 p | `93d33a1f…653c` | New since PR #6 |

Duplicates are merged into one row. The A and C rows N01–N18 and F03–F12 reuse the PR #6 evidence; see the matrix in [HANDOFF.md](../HANDOFF.md) under "PR #6".

## Matrix

| ID | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| L01 | Customer can view previously created lead profiles | P1 | **Complete (this change)** | `GET /api/customer-applications` lists every submission whose stored phone matches the OTP-verified token phone. It covers all 11 connected sources: HL, PL, PL-LEGACY, BL, VL, LI, CC, BA, IL, HI, MI. It returns only fields the customer entered. Screen: Profile → My applications & status (`mobile/src/app/my-applications.tsx`). |
| L02 | Customer can track current status | P1 | **Complete (this change)** | Returns the stage admin sets: the Home pipeline stage, or the `admin_operations` stage for the others. It is shown with the existing product-specific labels (`leadStageLabel`) and refreshes every 15 s. |
| L03 | Lead stays visible after admin picks it up | P1 | **Complete (this change)** | The source rows are never moved or deleted. The test proves the lead stays listed, with the updated stage, after admin changes the Business stage and the Home pipeline stage. |
| U01 | Payout action immediately after Rejected in Change Stage for all loan types, set manually | U1, A1 | **Complete (PR #7)** | `loanStageActions` in `mobile/src/lib/loan-product-stages.ts` provides the action. It is stored as separate `payoutStatus` metadata. |
| U02 | Business Loan Sanctioned button fixed | U1 | **Complete (PR #7)** | Sanction persistence plus stage/audit history; `admin-operations.test.ts`. |
| U03 | Home/Business/Personal/Vehicle: Customer Eligible Payout and Paisamart Eligible Payout after Disbursed, editable | U1 | **Complete (PR #7)** | `updatePayout` plus the Payouts tab/details. |
| U04 | Bank Account: the same two fields after Account Activation, editable | U1 | **Complete (PR #7)** | `payoutEligible('bank-accounts','approved')`. |
| U05 | Payout visible only after executive and manager approval | U1, A1–3 | **Complete (PR #7)**. The approval order is unresolved (D-1). | Two different staff identities are required, and the editor cannot approve their own entry. |
| A-CP | Customer Payout for Credit Cards, Insta Loans, Health, Motor and Life insurance | A1–3 | **Partial: awaiting clarification** | Their milestones are complete (PR #6 N09–N14). PR #7 has no payout amount fields for these products, because the PDFs tie them to automatic calculations (D-2). |
| F02 | Revenue amount and TDS (manual and automatic) | A1–3 | **Awaiting clarification** | Not implemented. See D-2. |
| F03–F12 | Per-product payout examples and percentages | C1–3 | **Awaiting clarification** (unchanged from PR #6) | Not implemented. See D-2. |
| N01–N18 | DOB calendars, Submit fixes, New/Used vehicle, eight loan stages, module milestones, 15 modules, referral copy | A, C | **Complete (PR #6)** | PR #6 matrix. The referral copy was re-verified in `(tabs)/index.tsx` and `profile.tsx`. |
| G-1 | Gold Loans persistence and payout | A1 (all loan types), C3 (15 modules) | **Incomplete** | There is no Gold Loan intake or persistence, no customer status and no payout amounts. Only the catalogue entry and the Payout action exist. Nothing was fabricated. |

## Settled decisions (user, November 21; do not re-ask)

- Admin/ops staff enter and edit the manual payout amounts.
- Executive and Manager must both approve, as different staff members.
- Any amount edit resets both approvals.
- Customers see only their own approved customer amount. Paisamart amounts are always internal.
- Authorized staff may enter and review amounts before approval.

## Unresolved decisions (calculations stay disabled)

- **D-1 Approval order.** Must the Manager approve after the Executive (PDF A), or is either order acceptable (PDF U)? PR #7 currently accepts either order.
- **D-2 Automatic calculations.** Each of these is undecided, and none is implemented:
  - The Revenue/TDS formula, TDS rate and base. PDF A describes "Customer Payout − Our Revenue (after TDS)" but its example is gross − 5% TDS.
  - What "automatic" TDS/Revenue means.
  - The meaning of the percentage deductions in PDF C: whether the deducted share is the customer's or Paisa Mart's, and its base. The examples are Credit Card 1,800 − 400, Bank 1,000 − 250, Insta 2.00% − 0.40%, Vehicle 0.4% / 1%, Motor tiers 5/7/8/10, Health 15% − 5%, and Life 20%.
  - Whether the Home/Personal/Business figures are fixed amounts or rates. The Business example also says "personal loan".
  - Whether Credit Card, Insta, Health, Motor and Life need payout amounts at all.
