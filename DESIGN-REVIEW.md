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

Nothing has been pushed to GitHub or deployed to AWS. Backend code, SSL, DNS, and server settings are unchanged.

Local dependencies are reused through `node_modules` junctions, which are not source changes. A fresh checkout should install the existing dependencies with Bun.

For a later deployment, use this branch as the base, preserve production environment configuration and the existing API/database, and verify authenticated access to the intended Sydney EC2 instance before publishing. Do not deploy the older original working directory or replace its unrelated edits.
