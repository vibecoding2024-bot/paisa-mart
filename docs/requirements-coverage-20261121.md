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
| U05 | Payout visible only after executive and manager approval | U1, A1–3 | **Complete (PR #7)**, with clarifications C-1 and C-2 below | Two different staff identities are required, and the editor cannot approve their own entry. |
| A-CP | Customer Payout for Credit Cards, Insta Loans, Health, Motor and Life insurance | A1–3 | **Partial: awaiting clarification** | Their milestones are complete (PR #6 N09–N14). PR #7 has no payout amount fields for these products, because the amounts depend on the conflicting rules below. |
| F02 | Revenue amount and TDS (manual and automatic) | A1–3 | **Awaiting clarification** | Not implemented. See C-3. |
| F03–F12 | Per-product payout examples and percentages | C1–3 | **Awaiting clarification** (unchanged from PR #6) | Not implemented. See C-4. |
| N01–N18 | DOB calendars, Submit fixes, New/Used vehicle, eight loan stages, module milestones, 15 modules, referral copy | A, C | **Complete (PR #6)** | PR #6 matrix. The referral copy was re-verified in `(tabs)/index.tsx` and `profile.tsx`. |
| G-1 | Gold Loans payout | A1 (all loan types) | **Partial** | The Payout action is listed, but there is no persisted Gold Loan intake source. Nothing was fabricated. |

## Conflicting financial rules — need a business decision (nothing guessed)

- **C-1 Approval order.** A says the executive approves, then the manager gives the approval that makes the payout visible. U says visible "after executive level approval and manager level approval". PR #7 requires both approvals in either order. Should the manager approval be required to come last?
- **C-2 Scope of the approval gate.** A says the dual authorization is "only for customer payout, not for our revenue". U says the whole Payout box, including the Paisamart Eligible Payout, is visible only after both approvals. PR #7 shows both amounts to admin, ops, executive and manager staff before approval. It never shows the Paisamart amount to customers. Should staff also be blocked from seeing the amounts until both approvals?
- **C-3 Revenue/TDS formula.** A defines Revenue as "Customer Payout − Our Revenue (after TDS)", but its example is 10,000 − 5% TDS = 9,500, which is gross minus TDS and not a difference of two payouts. Open questions: what the TDS rate and base are, whether "automatic" means calculated at a fixed rate, and how this maps to U's "Paisamart Eligible Payout".
- **C-4 Manual or calculated customer payout.** U requires manually entered amounts. C requires automatic remainders and percentages: 1,800 − 400 = 1,400; Insta 2.00% − 0.40%; Vehicle 0.4% / 1%; Motor tiers of 5/7/8/10; Health 15% − 5%; Life 20%. C also leaves open whether the deduction is the customer's share or Paisa Mart's. The Business example says "personal loan", and Home/Personal/Business give fixed amounts without a rate. PR #7 follows U (manual only).
