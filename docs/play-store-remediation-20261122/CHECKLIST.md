# Google Play rejection (version code 7, 21 Nov 2026) — remediation checklist

Branch `fix/play-store-remediation-20261122`, based on `origin/main` `595e521`. Local only: nothing
uploaded, submitted, merged or deployed.

Evidence images from Google's email are not committed. The original is the local .eml in the owner's Downloads
folder, extracted to the session scratchpad.

## Build identity

| Item | Finding | Status |
|---|---|---|
| Rejected artifact | Version code 7, `com.paisamart.app` | From Google email |
| Source of version code 7 | Not reproducible from Git. Git's highest recorded versionCode is 5 (`9594380`, 15 Oct, other developer). Builds use EAS (`eas.json` production = app-bundle, owner `paisamart`, projectId `ee8ea631-…`), and `.easignore` excludes `/android`, so EAS regenerates native code from `app.json`. Versions 6–7 were built from uncommitted or remote-versioned state. | **UNKNOWN — not reproduced** |
| Web release `20261121-595e5212-on-pr6-dashboard` | Built from `595e521` web export. Shares JS source with mobile, but it's a separate artifact. It doesn't show what was packaged in version code 7. | Distinct |
| Root cause of default icon | Baseline prebuild of `595e521` (no `icon`/`adaptiveIcon` in `app.json`) produces the default green Android launcher. It matches Google's LAUNCHER_ICON evidence. | **Reproduced** |
| Candidate versionCode | 8, **provisional**. 7 is the highest code evidenced; Play Console → App bundle explorer must confirm no higher code exists on any track. | UNVERIFIED |

## Signing

- `release/Paisa-Mart-1.0.0-1-arm64-release.aab` (v1, Aug) is signed with the public **Android Debug**
  certificate (SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`), contrary to
  `release/README.md`. Play doesn't accept debug-signed bundles.
- `release/paisa-mart-upload.keystore` (PKCS12, alias `paisa-mart-upload`) exists. Its certificate was not read,
  because that needs the password, which was intentionally not used.
- Expo CLI is not logged in on this machine, so EAS-managed credentials can't be inspected.
- **Expected upload certificate: UNVERIFIED.** Compare Play Console → Test and release → App integrity
  → Upload key certificate (SHA-1/SHA-256) with the EAS credentials (`eas credentials -p android`, as the `paisamart`
  owner) or the local keystore. Don't build a submission artifact until one matches.

## Rejection → fix

| # | Google finding | Fix | Status |
|---|---|---|---|
| 1 | Metadata: title "paisamart", short description "Paisamart" | `STORE_LISTING_en-US.md`: title, 80-character short description, full description limited to features in this build. Excludes Earnings, Wallet, Recharge, Travel and payouts (audit A-07: preview figures). | Drafted. Runtime verification of claims PENDING. Entering it in Play Console is a manual step. |
| 2 | Launcher icon differs from orange P store icon | `mobile/app.json`: `icon` + `android.adaptiveIcon` (foreground, monochrome/themed, background `#FD8702`). Assets derived only from `store-assets/google-play/icon-512.png` by `scripts/generate-android-launcher-icons.py` (glyph inside the 66dp safe zone). Prebuild generates `mipmap-anydpi-v26/ic_launcher{,_round}.xml` with a monochrome layer, plus all density webp files. Label is "Paisa Mart". Package ID is unchanged. Preview: `evidence/launcher-icon-preview-generated.png`. | Resources VERIFIED. On-device icon NOT yet verified (no APK). |
| 3 | Repeated promo banners as screenshots | The rejected screenshot is the 1024×500 feature graphic used twice. It needs genuine phone screenshots of Products, an application form, and My applications & status, taken on the test build against an isolated local backend with synthetic data. | BLOCKED: no APK yet. Remove the two banner screenshots in Play Console (manual). |
| 4 | Login credentials missing | `REVIEWER_ACCESS_DESIGN.md` (single server-configured review identity, not universal, synthetic data, no transaction privileges, server-side `review` claim). `APP_ACCESS_INSTRUCTIONS_en.md` is a template with placeholders. | **DESIGN ONLY.** Backend implementation, tests, and an authorized EC2 release are required. Not resolved. |

## Runtime verification

| Check | Status |
|---|---|
| Emulator Pixel 6 / API 35 boots (`sys.boot_completed=1`) | Done |
| Isolated local backend (`595e521`, scratch SQLite, MSG91 unset, port 3901) `/health` 200 | Done |
| Test APK built | **BLOCKED** (see Build log) |
| Install, icon, label, OTP login (dev OTP, test evidence only), onboarding, products, application submit, My applications | NOT DONE |

## Build log (local test build, debug signed)

1. Path with spaces → "filename, directory name, or volume label syntax is incorrect" (project config).
2. `subst W:` → codegen mixed roots: Node realpath resolves the subst drive back to the `C:` path. Abandoned.
3. Network DNS failure (transient) on one attempt.
4. Copy to `C:\pmbuild\mobile` (identical sources; only `local.properties` differs) → `react-native-screens`
   link failure: C++ runtime symbols undefined, NDK under the space-containing SDK path.
5. SDK junction `C:\pmsdk` → all library `.so` files link (C++ linkage fixed). Then
   `:app:buildCMakeRelWithDebInfo[arm64-v8a]` failed: ninja `Filename longer than 260 characters` (348 characters).
   `LongPathsEnabled=0`; the bundled ninja is 1.10.2 (CMake 3.22.1 and 3.30.5).

## Manual Play Console actions (unverified, need owner access)

- Default listing: new title, short and full description; check every translated and custom listing for the old text and
  banners.
- Replace screenshots. Keep `feature-1024x500.jpg` only as the feature graphic.
- Hi-res icon: keep `icon-512.png`.
- Confirm the highest version code and the upload certificate.
- Financial features declaration / Personal loan requirements for India: add partner lender names.
- App access: only after the review account is live.

## Other resubmission risks (from audit, not fixed here)

- A-07: Earnings tab, notifications and wallet show fabricated money. A reviewer will see them. High risk under
  Misleading Claims / Financial Services. Recommend hiding or replacing them before resubmission.
- A-02 / A-06: OTP binding and dev-OTP fallback. Fix in the same backend release as the review account.
