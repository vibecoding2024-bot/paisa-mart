# Admin payout draft handoff

Base: current origin/main `18ae178` (fetched November 18, 2026).
Branch: `feature/admin-payout-approvals`. AWS EC2 / SQLite target only. No merge or deployment.

## Implemented independent changes

- Business Loan Sanctioned now saves its internal `approved` stage without requiring a separately recorded provider approval. Provider decision/evidence remain unchanged. SQLite version checks, atomic audit, and stage history are reused.
- Manual Payout action immediately follows Rejected in loan Change Stage menus, including the existing Home pipeline. It saves `payoutStatus: selected` in the existing versioned `admin_operations` payload; never replaces Disbursed or changes provider decisions. Existing admin/ops stage permissions apply; viewers cannot write.
- All catalog loan types are covered by the action list. Gold Loans has no backend intake/source in current main; no synthetic workflow or data source was added. Insta Loans gains the Rejected option needed before Payout.
- Failed stage saves now display the existing store error in the stage modal. Existing layout and source data are retained. No schema migration or new database is required for selection.

## Required clarification / incomplete scope

Current main defines only `admin`, `ops`, and `viewer`. Finance mutations are disabled; the finance ledger has no working executive/manager approval workflow. The user has been asked which staff may enter amounts, which staff have executive versus manager approval permission, and who should see payout details after approval (applicant, referring partner, or another audience).

Do not merge this partial draft. Items 3–5 remain pending that answer: editable customer/Paisamart eligible amounts after loan disbursement or bank activation; validated currency persistence; both approvals; backend and UI visibility; invalidation/reapproval after amount edits. No role mapping or customer audience has been invented. No approval, amount, payment or automatic percentage behavior is claimed by this draft.

## Validation

- Admin operations + stage action tests: 14 passed, 160 assertions. Covers Business save/fresh sign-in, stage audit, provider-decision preservation, stale changes, unauthorized viewer writes, manual Payout persistence for Home/Business/Personal/Vehicle/Insta, and preserved Disbursed/history.
- Service application regression suite: 11 passed, 248 assertions. Existing activation evidence, permissions, receipt privacy and persistence remain passing.
- Mobile `bun run typecheck`: passed.
- Focused strict backend TypeScript check (admin operations route and tests): passed.
- Full backend `bun run typecheck`: blocked by the existing TypeScript maximum-call-stack compiler crash documented in the prior handoff; not reported as passing.
- `git diff --check`: passed. Browser visual acceptance has not been run. Approval/prerequisite/amount visibility tests remain pending implementation.

## Changed files

- `backend/src/lib/admin-operations.ts`: separate payout selection, Business stage fix, Insta rejected stage.
- `backend/src/routes/admin-operations.ts`: strict payout selection request validation.
- `backend/src/routes/admin-operations.test.ts`: SQLite persistence, permissions and audit regression tests.
- `mobile/src/lib/admin-store.ts`: translate payout action to separate metadata.
- `mobile/src/lib/loan-product-stages.ts`: separate action list, preserving decision-stage lists.
- `mobile/src/app/admin/(dashboard)/home-loans.tsx`: manual Home payout selection with captured metadata version.
- `mobile/src/app/admin/(dashboard)/lead-details.tsx` and `leads.tsx`: action menus and failure feedback.
- `mobile/src/components/AdminOperationsPanels.tsx`: saved selection indicator.
- `scripts/loan-stage-actions.test.ts`: ordering and separation tests.
- This handoff.
