# Paisa Mart requirements review handoff

Updated November 4, 2026 (user timezone Asia/Calcutta). **Draft review candidate. No merge, upload, restart of production, migration of production, or deployment.**

## Source and checkout reconciliation

- Review branch: `feature/loan-requirements-review-20261103`.
- Exact tested implementation commit: `da1cc563980b1f48b37ff1854493c520b447137a`. This handoff is a subsequent documentation-only commit; the PR head includes that documentation commit.
- Review checkout: `.requirements-review` inside the original workspace.
- Fetched `origin/main`: `17eac94b39b708ee9e0979de0bda4efd551e6d24`, the recorded October 21 dashboard release. No intervening main commits were found on the final fetch.
- Existing implementation: `feature/loan-requirements-20261101`, commit `110bda741f3df72e9c59e3b755605a2852b64165`, in sibling checkout `../paisa-mart-requirements-20261101`. It was clean and one commit ahead of current main. The review branch continues that commit; its implementation was not recreated.
- Original workspace: dirty `main` at `facbc4c5b5014937f7b218f9f5eda0b78c908f92`, ahead 1 / behind 46. This is an older, independent checkout, not the implementation described by the November handoff. Root HEAD and hashes of all pre-existing tracked dirty files were checked unchanged; original feature checkout remains clean. No reset, clean, stash, forced checkout, or dirty-main merge.
- Local preview/dependency tooling stays outside the PR. Temporary dependency moves used the existing guarded `try/finally` workflow and were restored. No application dependency or build-configuration change was needed.

## Authoritative requirements and deduplication

The original handoff's claim that the PDFs were missing was incorrect. Both were found in Downloads, extracted, and visually inspected. Sources:

- **A**: `Admin portal.pdf`, 3 pages, SHA256 `ac1d180ab2b9539ae3d557d6b5a3f401078720fd8b7a23eb2ff03090d5bfb49a`.
- **C**: `Customer portal (1).pdf`, 3 pages, SHA256 `58e39b3f5adb1a833927a73c5afb4aa4c1f499571c7d8db174c21a84af479bc1`.
- Available conversation instructions: preserve the UI, verify backend saves, prevent false success, preserve deployed Personal Loan/dashboard work, keep uncertain payout calculations disabled, and do not merge/deploy. Repeated requests are recorded once below.
- No additional recoverable WhatsApp specification beyond the requirements visible in this conversation was available to this audit. `mobile/README.md` is **not** treated as a substitute for the user's WhatsApp instructions. Coverage of any omitted WhatsApp-only text remains unverified; no financial rule was invented from it.

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
| N09 | Credit Card Leads → Logins → Activation | A1 | **Partial**: module and stage labels/options implemented; no connected credit-card application source exists in approved main. Cannot verify saved processing or activation against a real source. No fake applications added. |
| N10 | Bank Account Leads → Logins → Activation | A3 | **Partial**: module/workflow configured; connected application source absent. |
| N11 | Insta Loan Leads → Logins → Net Disbursement | A2 | **Partial**: module/workflow configured; connected application source absent. |
| N12 | Health Insurance Leads → Logins → Policy Issued | A2 | **Partial**: module/workflow configured; connected application source absent. |
| N13 | Motor Insurance Leads → Logins → Policy Issued | A2 | **Partial**: module/workflow configured; connected application source absent. |
| N14 | Life Insurance Leads → Logins → Policy Issued | A2–3 | **Complete** for saved applications: new API source is connected to admin, milestones persist, issuance requires recorded provider evidence. Dedicated navigation opens the existing saved-leads UI instead of the previously blocked local-only demo. |
| N15 | All 15 customer modules reflected in admin | C3 | **Complete**: shared 15-module catalogue, real counts for connected sources, module-specific saved application links, explicit unavailable state for the others. Cash on Credit Card, Recharge & Pay Bills, Travel & Tickets included. This does not claim all 15 provider integrations exist. |
| N16 | Referral box wording | A3 | **Complete**: exact “Earn up to ₹1 Lakh and Reduce Your Expenses”; referral share text no longer promises ₹500. Existing layout/styles retained. |
| N17 | Prevent false success and repeated clicks | Conversation | **Complete** for the three new/updated forms: immediate in-flight guard; only nonempty server references count as success; errors remain on form. Client and browser tests cover rejected/malformed receipts, failed writes and repeat clicks. Cross-session/server idempotency for these legacy-style endpoints is not claimed. Deployed Personal Loan idempotency remains unchanged. |
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

The five partial source integrations above are genuine remaining gaps, not passing results. There is no documented provider API/source contract for them in the approved checkout. New customer intake or provider integrations were not invented merely to populate the admin view. Other unsupported modules retain explicit unavailable states.

## What changed during this review

- Reused and verified the November 1 form/store implementation; added the missing Vehicle condition, exact referral wording, and shared 15-module directory.
- Replaced native-only success alerts with a receipt-backed dialog that works on web and native. Removed legacy local form copies from the submission success path so a local-store issue cannot turn a confirmed backend save into a reported failure.
- Added nonempty receipt validation to all three API clients and synchronous submit locks. Calendar and form appearance retain the existing blue/white styling.
- Added product-specific pipeline filters/labels; reserved space for the mobile filter row, bounded scrolling for tall mobile columns, and label/count separation. Existing slate/orange admin styling retained.
- Replaced two previously blocked browser-local demo routes (Products editor and Life list) with the read-only module directory and real saved Life applications. No local-only editing or fabricated records are exposed as backend functionality.
- Preserved backend evidence checks and viewer redaction. Added Life issuance persistence tests, condition validation/persistence tests, receipt failure tests and payout guard tests.
- Disabled the old potential-commission helper and direct incentive/payout mutations as well as customer withdrawal. Existing customer earnings sample figures remain explicitly labelled preview; they are not a live balance or newly calculated entitlement. Backend finance remains unavailable with no payout-write route.

## Verification

All automated files run in separate Bun processes to isolate database environment and module mocks.

| Check | Result |
|---|---|
| `backend/src/routes/loan-insurance-regression.test.ts` | 5 passed / 105 assertions |
| `backend/src/routes/application-receipts.test.ts` | 3 passed / 33 assertions |
| `backend/src/routes/admin-operations.test.ts` | 11 passed / 81 assertions |
| `backend/src/routes/home-loans.test.ts` | 3 passed / 83 assertions |
| `backend/src/routes/personal-loan-applications.test.ts` | 6 passed / 26 assertions |
| `scripts/dashboard-store.test.ts` | 3 passed / 10 assertions |
| `scripts/dashboard-refresh.test.ts` | 9 passed / 41 assertions |
| `scripts/personal-loan-api.test.ts` | 5 passed / 12 assertions |
| `scripts/payout-guard.test.ts` | 2 passed / 19 assertions |
| Total | **47 passed, 0 failed; 410 assertions** |
| Mobile `tsc --noEmit` | Passed with complete existing dependency tree |
| Focused strict backend TypeScript check | Passed for Business/Life/Vehicle/admin-operations routes and their dependencies |
| Full backend `tsc --noEmit` | **Blocked**: compiler `RangeError: Maximum call stack size exceeded`, reproduced on unchanged main checkout `.dash` as well. Not reported as passing. |
| Expo web export | Passed, localhost-only API configuration |
| Bun backend bundle | Passed, 31 modules, external dependencies retained |
| Browser acceptance | **69 checks passed**, no browser runtime errors; Chromium 1440×1000 desktop and 390×844 mobile emulation; 22 screenshots |
| Diff whitespace / scope | Passed |

Browser coverage includes both calendars; Business/Vehicle/Life failed and successful submissions, repeated clicks and actual saved references; Back to Home; exact referral copy; disabled withdrawal; 15 admin modules and filtered links; saved counts; assignment/stage updates; sign-out/sign-in persistence; previous-stage history; Home save/immediate shared refresh; disabled Payout box; loan/Life pipeline labels. Screenshots were inspected for spacing and form/dialog readability. Native device behaviour, physical mobile hardware and comparison with any unavailable original screenshot are not claimed.

Preview is `http://127.0.0.1:4796/__preview` with synthetic local SQLite data. No request was sent to production during browser tests; external network requests were blocked. Local preview was restarted once to reload final backend source; production was not touched.

Evidence directory (original workspace): `.build-tools/requirements-audit-20261103/`. It contains test/type/build logs, browser results/screenshots, root preservation snapshot and patch, PDF extracts, baseline/archive comparisons and `review-build-manifest.json`. These temporary files and all `.preview` contents are excluded from the PR.

## Review build hashes — not deployment artifacts

Source: `da1cc563980b1f48b37ff1854493c520b447137a`. No guarded production bundle was created or overwritten for this feature. These builds use the local preview API and must not be uploaded.

| Local review artifact | SHA256 |
|---|---|
| `.requirements-review/.preview/export/index.html` | `efc0d6679042f1cb5d3cf1394900aebaf59a2e4c0eb1267acbe7f8c429a4d152` |
| `.requirements-review/.preview/export/_expo/static/js/web/index-9b932315b78bdb84f3246e87ddb7668f.js` | `eb359cc230f7aae5e617db82f9382ba5a37af01323b40d1851ea273baed5cbc8` |
| `.requirements-review/.preview/backend-build/index.js` | `e967dd22293232afd2f971413587c0aa742a489b3b8e35b09994231cd58106f1` |
| `.build-tools/requirements-audit-20261103/review-build-manifest.json` | `27110c1a2f66c80470ccc14a4bf7a4cce908ceeb610c691876b8b4bcdf361788` |

## Deployed baseline and backend scope

Comparison is against the recorded dashboard release/source, **not a fresh EC2 inventory**. Recorded October dashboard archive remains SHA256 `5f149daae3a0a7afa0d4e252e3b5cf80860987b3a93221caa24cae4a0a11bb8a`; it still contains exactly its original three runtime files. Its content matches current main after line-ending normalization. The obsolete seven-file bundle was not used.

The November feature has **nine necessary backend runtime source changes** versus that deployed dashboard base:

1. `backend/src/index.ts` — mount Life and actual Vehicle Loan APIs.
2. `backend/src/lib/admin-operations.ts` — read new applications/details and persist product milestones.
3. `backend/src/lib/business-loan-lead-store.ts` — full Business form persistence/additive columns.
4. `backend/src/lib/insurance-lead-store.ts` — Life application persistence.
5. `backend/src/lib/vehicle-loan-lead-store.ts` — Vehicle application persistence, including condition in payload.
6. `backend/src/routes/admin-operations.ts` — admit confirmed loan milestones to validated updates.
7. `backend/src/routes/business-loans.ts` — validate and save Business form fields/DOB.
8. `backend/src/routes/life-insurance.ts` — validated Life submission.
9. `backend/src/routes/vehicle-loans.ts` — validated Vehicle submission/DOB/condition.

This is a new November feature scope, not a repetition of PR #4 or #5 deployment. The old three-file dashboard installer must not be reused to install it, and no new installer/bundle has been prepared.

All four deployed Personal Loan source files are unchanged relative to main and commit `46d07d53bfd48500f07b46c46e0fc681eb3cbd19`: `src/routes/personal-loans.ts`, `src/routes/personal-loan-applications.ts`, `src/lib/personal-loan-application-store.ts`, `src/lib/personal-loan-lead-store.ts`. Content also matches the recorded Personal archive SHA256 `66435ab4231afe50e44e31905511f0c55181b7619756a506faa7715da8dc9e5b`. Two Windows checkout files have different raw line-ending layouts from that archive; normalized content is identical. None is changed in this PR or being packaged for reinstallation.

Schema effects already present in the feature: additive nullable Business form columns, new Life/Vehicle application tables, and existing admin metadata/history writes. Vehicle condition uses the existing payload column, requiring no extra condition migration. SQLite migrations/saves are tested; PostgreSQL paths are inspected/typechecked but **not integration-tested**. Separate service databases still require an adapter and remain unavailable rather than silently returning fabricated data. No live migration was executed. Any later rollback must retain new application rows/columns and restore previously backed-up code; never drop newly collected data to roll back this feature.

## Remaining decisions and release gates

- Business clarification: meaning of deducted share, fixed-versus-rate loan examples, Business example wording, TDS/revenue basis, and executive/manager responsibilities. All financial calculations and mutations remain disabled pending confirmation.
- Five missing application-source integrations (N09–N13) remain partial. Their APIs/data-source contracts are not supplied by the PDFs.
- Resolve or explicitly review the pre-existing full-backend typechecker crash; run PostgreSQL integration tests if that is the intended production database.
- Any WhatsApp-only requirements absent from the available conversation cannot be claimed verified.
- Keep the PR draft for review of this scoped implementation and the disclosed gaps. No merge approval is implied. Live EC2 baseline verification, separately approved merge, final build from merged main, guarded packaging, upload and deployment approvals are still required.
- No Vercel logs were requested; Vercel is not treated as an AWS hosting blocker. Required GitHub checks, if configured, must still be respected.
- `FINAL-GOOD-20261006`, deployed Personal Loan, old release artifacts and dirty root main were not modified.

## Exact changed files versus origin/main

- `HANDOFF.md`
- `backend/.gitignore`
- `backend/src/index.ts`
- `backend/src/lib/admin-operations.ts`
- `backend/src/lib/business-loan-lead-store.ts`
- `backend/src/lib/insurance-lead-store.ts`
- `backend/src/lib/vehicle-loan-lead-store.ts`
- `backend/src/routes/admin-operations.ts`
- `backend/src/routes/application-receipts.test.ts`
- `backend/src/routes/business-loans.ts`
- `backend/src/routes/life-insurance.ts`
- `backend/src/routes/loan-insurance-regression.test.ts`
- `backend/src/routes/vehicle-loans.ts`
- `mobile/src/app/(tabs)/earnings.tsx`
- `mobile/src/app/(tabs)/index.tsx`
- `mobile/src/app/(tabs)/profile.tsx`
- `mobile/src/app/admin/(dashboard)/_layout.tsx`
- `mobile/src/app/admin/(dashboard)/dashboard.tsx`
- `mobile/src/app/admin/(dashboard)/home-loans.tsx`
- `mobile/src/app/admin/(dashboard)/lead-details.tsx`
- `mobile/src/app/admin/(dashboard)/leads.tsx`
- `mobile/src/app/admin/(dashboard)/life-insurance.tsx`
- `mobile/src/app/admin/(dashboard)/pipeline.tsx`
- `mobile/src/app/admin/(dashboard)/products.tsx`
- `mobile/src/app/business-loans-details.tsx`
- `mobile/src/app/life-insurance-details.tsx`
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
- `mobile/src/lib/vehicle-loan-api.ts`
- `scripts/payout-guard.test.ts`
