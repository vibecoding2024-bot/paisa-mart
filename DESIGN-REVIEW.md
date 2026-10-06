# Paisa Mart visual refresh

Based on GitHub main `53cbfa39feb901d9de560d3a31347df1606f345b`, on local branch `design/fintech-refresh`. The isolated `.design-refresh` worktree preserves the original workspace's uncommitted work. The original main branch is older and must not be reset or overwritten to bring this change in.

## Local preview

Open `artifacts/preview.html` in this worktree. Screenshots show the built application in isolated Edge at mobile and desktop sizes, with a synthetic profile. Review artifacts and generated exports are not source files and are not included in the commit.

## Changes

- Navy, blue, and mint styling with shared typography, buttons, cards, and screen components.
- Bundled, OFL-licensed Plus Jakarta Sans fonts; no new package dependencies.
- Login and OTP screens, home, product discovery, learning, earnings, profile, and tab navigation.
- Responsive desktop content, small-phone layouts, accessible labels and focus states, reduced-motion-aware feedback, and preserved press-out handlers.
- Existing OTP request guards, loan routes, product definitions, feature flags, onboarding checks, and withdrawal validation retained.
- Existing hardcoded earnings figures explicitly labeled as preview data. No live earnings backend was added.

## Validation

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --pretty false` passed in `mobile`.
- Expo production web export to `mobile/dist-refresh`: passed.
- Expo Android export with Hermes bytecode to `mobile/dist-android-refresh`: passed.
- Browser QA: 13 checks passed, with no runtime exceptions. Local report: `artifacts/qa-report.json`.
- Screenshots reviewed at 320px, 390px, and 1440px widths.
- Real OTP delivery, real payouts, iOS, and native device interaction were not tested. Browser tests block external network requests and mock API responses.

## Deployment status

The approved source and verified frontend package are maintained on branch `design/fintech-refresh` in the independent `paisa-mart-approved` checkout. GitHub main and the original working folder are preserved. Production publication is pending execution of the prepared deployment command on EC2. See `deployment/README.md` for backup, verification and rollback details.

The design worktree reused local dependencies through `node_modules` junctions. The independent approved checkout has its own Git history and contains no dependency junctions or environment credentials. A fresh source build should install the existing dependencies with Bun. The packaged release does not require an on-server build.

The frontend deployment script validates the intended Sydney instance, preserves the running API and existing downloads, and performs an automatic rollback if its HTTPS checks fail. Five offline deployment checks passed, including rollback and preservation of backend files. The final package passed 14 browser checks, including full-width desktop rendering with the existing server compatibility marker. Do not run the legacy root deploy.sh for this release.
