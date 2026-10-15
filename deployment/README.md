# Approved frontend release

Design source: `4e19e00`, based on the then-current GitHub main `53cbfa3`.
The included archive is the approved, production-mode Expo web export. It is
deliberately committed so the existing EC2 instance does not have to install
dependencies or rebuild the app during deployment.

## Publishing

Run `python3 deployment/deploy_frontend.py` from this independent checkout,
as `ec2-user` on EC2 instance `i-0e6f35bc4e48cde49` in `ap-southeast-2`.
The script locates the online `paisa-mart` PM2 process and verifies its static
directory before making changes. No AWS CLI login is required.

It verifies the archive, saves a complete copy of the existing `backend/public`
directory under `backend/.frontend-backups/`, publishes assets first and swaps
`index.html` atomically last. Existing APK downloads and old content-hashed
assets are preserved. Backend source, environment files, customer data, PM2,
nginx, DNS and certificates are not changed or restarted.

The script checks backend health and both HTTPS hostnames through the local
nginx server with certificate validation enabled. It restores the previous
frontend automatically if publishing or verification fails. It prints the
exact backup path and a manual rollback command when successful. Keep that
backup until the release has been used successfully.

The HTML marker `paisa-web-polish` is intentional: the existing backend uses it
to skip its older injected desktop phone-frame style. `paisa-design-version`
identifies this release without changing backend code.

## Rebuilding after future source changes

Install the existing mobile dependencies, run TypeScript and Expo production
export, then package the verified export:

```sh
python3 deployment/prepare_web.py mobile/dist-refresh deployment
python3 deployment/test_deploy.py
```

Update the design version in both scripts for a new release. Review the
export in the browser, including login/OTP, mobile and desktop layouts, before
publishing. The tests use temporary files and mocks; they do not send real OTPs.

The current release passed TypeScript, web export, Android export, and 13 browser
checks. Actual OTP delivery and payouts were not tested by these checks.
