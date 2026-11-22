# Handoff for the Android publishing team (Paisa Mart, `com.paisamart.app`)

Prepared 22 Nov 2026. No Play Console action has been taken by engineering.

## What to build now (compatible with the Phase 1 backend release)
- **Source:** the head of branch `release/aws-phase1-20261122` (draft PR for Phase 1; after merge, the same tree from `main`). Build exactly the commit named in the PR, never a later one without review.
- **Build location:** build only from `mobile/` with `expo prebuild`. **Do not use the tracked root `android/` project**: it is stale (`com.paisamartroot`, versionCode 1, release signed with the debug keystore).
- **API:** production `https://paisa-mart.com`. Do not set `EXPO_PUBLIC_TEST_ENV`.
- **Signing:**
  - sign with the Play **upload key**, verified against Play Console → App integrity (upload certificate SHA-256);
  - set `versionCode` **higher than the highest versionCode ever uploaded for `com.paisamart.app` on any track** (internal, closed, open, production, including rejected, draft and halted releases). Check Play Console → App bundle explorer / Release history.
  - `mobile/app.json` currently has a provisional `8`; the known rejected upload was 7, but that is not necessarily the highest. Play refuses a versionCode that is not higher than every uploaded one.
- **Contents:** this build carries the Play-rejection fixes:
  - store-icon-matched launcher, adaptive and monochrome icons;
  - honest earnings UI (no fabricated money or notifications);
  - unsupported claims removed;
  - factual welcome copy;
  - the profile/KYC token, needed by the Phase 1 backend.
- **Listing and access:**
  - store text and screenshots: `docs/play-store-remediation-20261122/` (`STORE_LISTING_en-US.md`, `screenshots/`);
  - reviewer access instructions: `APP_ACCESS_INSTRUCTIONS_en.md`.
- **Reviewer login:** works only after the owner enables the Play review account on the server (`REVIEW_ACCOUNT_*`, an owner-chosen phone, **never** one of the incident test numbers). Ask the owner for the code through Play Console App access, never in chat or Git.
- **Sideloaded copies:** also publish the same signed APK at `/download-apk` (web release), so old sideloaded installs can update.

## Why the update matters for existing users
- **After the Phase 1 backend goes live:** older app builds cannot save or sync the profile (the server now requires the sign-in token). New users on an old build cannot finish onboarding until they update.
- **Everything else** in older builds keeps working: OTP sign-in, applications, payouts.

## Phase 2 (later; needs your scheduling)
- **What it is:** a further release adds server sessions and server-side MPIN (branch `fix/play-store-remediation-20261122`).
- **Effect on older builds:** once its backend is live, **any older build, including the Phase 1 build above, loses protected data 15 minutes after OTP sign-in**, because it cannot verify a server MPIN.
- **Sequencing:** the Phase 2 app needs the Phase 2 backend, and Play review needs the live backend. Phase 2 therefore needs a coordinated plan before it is scheduled:
  - a Phase 2 app that also works with the Phase 1 backend (engineering work, not started);
  - or an accepted interruption for older builds until the update is approved;
  - or a backend hold on the 15-minute enforcement until the update is live (owner decision, not implemented).
- **Gate setting:** the server's "please update" gate (`MIN_CLIENT_PROTOCOL`) stays **off** until your Phase 2 build is obtainable from Play and `/download-apk`.

## What we need back from you
- **Upload key:** the upload certificate fingerprint check (pass/fail), and the final `versionCode` used.
- **Live installs:** whether any version is live on any track, with install counts (this sizes the old-build impact).
- **Release dates:** when the Phase 1 build is approved and live, and the APK file's SHA-256 for `/download-apk`.
