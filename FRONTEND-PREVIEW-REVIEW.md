# Local frontend review — 6 October 2026

Base: merged main 24f9f8a7ba81fea8f43f4d5c29631fffd152db1b.
No AWS, EC2, PM2, production database, backend/public or FINAL-GOOD-20261006 access or changes.

## Diagnosis and limits

The local reference `.design-refresh/artifacts/deployment/web/index.html` has exactly the user-provided approved SHA256 `12ade36e0f27ffe256d7e466ef062204db0477520ac12c14dfcf319085d41c9a`. This is a separate local artifact, not the emergency production directory.
The approved design's core customer screens are already in main; reverting the design refresh would be incorrect.

The Expo single-page export ignores `src/app/+html.tsx`. Its raw HTML has no `paisa-web-polish` marker. In backend/src/index.ts, serveHtml injects INJECTED_HEAD, BRAND_HEADER and BRAND_FOOTER if that marker is absent. The injected CSS puts the responsive desktop design inside a narrow legacy phone frame, clipping text and altering layout. Locally applying that exact injection to the raw export reproduces the regression and fails the 1440px root-width check. Packaging with deployment/prepare_web.py preserves the approved marker and full-width shell.

The exact bad artifact with index hash `fddb941d5d9a23b382ac2ca39e0fd874db03cab766c1ec9fd61f45d695b19c4b` was not available locally. Therefore the injection mechanism is proven, but attributing that particular release to it remains unconfirmed. Do not claim a full production root-cause diagnosis until its HTML/assets are inspected. Never redeploy that artifact.

## Changes

- Retain approved core screens and navigation, with full-size browser root styles.
- Reproducible local export/packaging and restricted preview server.
- Customer application-status page linked from Profile and successful submission.
- New customer applications endpoint verifies existing OTP-issued AUTH_TOKEN_SECRET signatures and matches the verified phone; it exposes no private admin notes. This is a LOCAL backend change that would require separate review and future deployment. It is not on production.
- Existing submit, calendar, admin pipeline, all eight stages, totals and optimistic updates retained.

## Local preview

From this fix worktree, with existing dependencies and Bun available:

    bun scripts/preview.ts

Open http://127.0.0.1:4790/__preview first to seed the sample customer session. Use 9000000000 in sample applications. Admin credentials: admin@paisamart.com / preview-only. Credentials and synthetic session injection exist only in the local server. The database is .preview/preview-only.db, separate from production. The server binds only 127.0.0.1, imports only the loan/admin routes, and CSP blocks external API calls, images, frames and OTP scripts. Other service operations are deliberately disabled; their page designs remain browsable.

Optional reference view: `bun scripts/preview.ts --reference`, then http://127.0.0.1:4791/__preview. It serves the separate hash-matched local artifact.

Rebuild with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-preview.ps1` from a checkout with installed local dependencies. The existing Windows workspace uses dependency junctions; its validated build was performed with dependencies physically in this worktree, then restored. Local API URLs are baked into this PREVIEW build. It is NOT a production release.

## Validation

- Expo production-mode web export: passed, API configured to localhost.
- Frontend TypeScript: passed.
- Isolated Bun SQLite tests: 3 passed, 83 assertions (dates, submit, all stages/totals, concurrency, auth, customer ownership, private-note exclusion).
- Approved artifact and corrected build: 14 browser checks each passed, no runtime exceptions.
- Ten screenshot views match the approved reference with no pixel differences above a 10/255 channel threshold: login desktop/mobile/320px, OTP 320px, home desktop/mobile, products, bank products, learning, earnings. Profile differs due to the requested new application link. Screenshots cover these views, not every scroll position or every application page.
- Real isolated browser flow: calendar selection -> saved submission -> confirmation -> customer status -> admin login/update -> customer sees Sanctioned. Passed with no runtime exceptions.
- Local legacy-injection reproduction fails the full-width design check as expected.
- No real OTP, production API, external payment service, native device or PostgreSQL integration tests performed.

Artifacts: .preview/screenshots, .preview/reference-screenshots, .preview/flow-screenshots, .preview/legacy-screenshots, .preview/visual-comparison.json. Build artifacts and sample data are ignored by Git.

Stop at local preview. No merge, push or deployment is authorized by this review.
