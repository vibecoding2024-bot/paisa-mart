# Dashboard operations candidate

Production has not been accessed. No merge, service restart or deployment is authorized by this candidate.
Based on Personal Loan PR #4 (46d07d53), on top of main 9ec235ad. PR #4 remains a dependency.

## Requirements trace

The attachment contains the ten-part written request. No PDF or comparison screenshots were available; PDF-specific roles and visual comparison remain unverified.

| Requirement | Result and evidence |
|---|---|
| Customer submissions reach admin | Working in isolated SQLite tests: Home, new Personal, legacy Personal, Business source tables -> operations API -> existing Overview/Leads/Pipeline/details. Source-qualified IDs retain distinct records, including same-phone applications. |
| Persist ownership, notes, history, follow-ups | Working: versioned admin_operations rows, transactional audit, stale writes return 409; UI waits for saved results. |
| Customer status | Working: new Personal status saved in the same transaction; existing Home workflow/customer status retained with its eight stages. Legacy Personal/Business have no existing customer-status endpoint. |
| Overview/reports | Working for connected sources: totals and filters share saved rows; India calendar periods; snapshot fingerprint detects changes across pages; no invented trend figures. Analytics explicitly all-time. |
| Provider confirmation | Separate recorded provider/evidence/decision; internal processing changes never imply provider approval. |
| Staff access | Existing environment admin preserved; hashed staff passwords; live role/deactivation checks on every API call; ops can process records, viewers read masked records; admin-only permissions/export/audit/partners. Home pipeline keeps existing admin-only policy. |
| Customer/partner/support | Foundation: sanitized saved customer and transaction directories, versioned partner directory, owned tickets/complaints, escalation reasons and retained history. No notifications sent. |
| Finance | Blocked business behavior, independent schema delivered: effective-dated commission rule records, ledger states estimated/earned/approved/payable/paid/reversed/disputed, unique idempotency key and actor/approval/reason fields. No rates, money amounts, rule activation, reconciliation or payment APIs invented. |
| Unsupported services/products | Unavailable with explicit message instead of presenting browser-local examples as production records. No connected product-publishing backend exists in this source. |
| Database | Additive CREATE TABLE IF NOT EXISTS; configured SQLite paths preserved. Shared PostgreSQL query adapter retained, but PostgreSQL integration not run. Differently configured service databases are explicitly unavailable (cross-database writes are not attempted). |
| Visual preservation | Existing shell/navigation, cards, colors and responsive JSX retained with small operations panels. Browser unavailable: no visual pass claimed. |

## Definitions and permissions

Reporting timezone Asia/Kolkata. Today starts 00:00 IST; seven/thirty days include today and previous six/twenty-nine calendar days. No denominator means unavailable. Approval rates use recorded approved/disbursed versus approved/disbursed/rejected decisions. Stuck indicator is 48 elapsed hours since update; it is not a promised provider SLA. Follow-ups are overdue after their scheduled timestamp.

Viewer cannot mutate, export, inspect audit, or access Home pipeline. Viewer contacts are masked; notes/history/provider evidence are withheld. Ops cannot manage staff/partners/export/audit. Root environment admin identity remains reserved. Staff tokens are invalid after deactivation; role changes apply without waiting for token expiry.

## Backend delta and migration

Dashboard: src/routes/admin.ts (existing login + mount), src/routes/admin-operations.ts (new guarded API), src/lib/admin-operations.ts (new persistence/read models). Tests: src/routes/admin-operations.test.ts.

PR #4 prerequisite runtime delta: src/routes/personal-loans.ts, src/routes/personal-loan-applications.ts, src/lib/personal-loan-application-store.ts, src/lib/personal-loan-lead-store.ts. No dependency/lockfile changes.

New tables: admin_operations, admin_audit, admin_staff, admin_records, admin_commission_rules, admin_finance_ledger. PR #4 additionally creates personal_loan_applications with unique request_key. No table drops, destructive migrations or automatic old-database restores. Migration repeats safely; the updater runs it after verified backups and before restart.

Rollback is code-only using the verified v2 backup; new applications, operations, staff and financial tables remain. Restoring old database snapshots would lose new records and is never automatic. Earlier frontend may not show retained data; do not delete it.

## Verification and manual preview

Run isolated Bun tests separately (they configure their own database before importing modules): admin-operations.test.ts, home-loans.test.ts, personal-loan-applications.test.ts. Run mobile typecheck and focused backend typecheck. Run deployment/dashboard/test_backend_update.py and test_release_preparation.py with Python unittest. Packaging checks clean SHA, explicit production URLs, no localhost, approved paisa-web-polish shell, assets and hashes.

Local preview: http://127.0.0.1:4795/__preview . It uses an isolated synthetic SQLite database and local-only login displayed on that page. Refresh may require signing in again; saved changes persist. Preview credentials are never in production bundles.

Manual acceptance: desktop and narrow mobile navigation/layout; submit Personal with calendar, verify reference and all three confirmation buttons; locate in admin list/search; assign and add note/follow-up; refresh/re-login; change processing stage then read customer status; preserve Home pipeline stages; test viewer/ops/admin permissions; compare list totals and reports; stale two-tab edit must fail; unavailable services/finance must not claim success. Capture before/after screenshots and approve before merging.

## Outstanding inputs / release gates

PDF-specific staff responsibilities; provider agreements, effective rates/dates, earning/reversal criteria, settlement/reconciliation feed and separate approvers; any service data integrations not present in approved source. PostgreSQL and separately configured service databases require integration validation. Browser/manual visual acceptance remains pending. The bundle baseline is a Git source expectation, NOT a newly observed EC2 inventory; any live mismatch must stop and be reviewed. Do not bypass drift guards.

Release artifacts and exact future EC2 commands are recorded alongside the candidate in release/dash. They are review material until separate approval. FileZilla upload -> checksum/stage -> guarded matching backend -> frontend dry-run -> separately authorized activation -> Incognito checks. FINAL-GOOD-20261006 is never used for normal release work.
