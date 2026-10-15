# Home loan pipeline release

This feature changes source code only. It does not deploy itself, alter AWS resources,
restart services, or write to production `backend/public`.

## Required approval and backend dependency

Review and merge the feature PR before production deployment. The frontend needs the
matching backend commit for `GET/PATCH /api/admin/home-loans`, pipeline totals, and
persisted edits. A frontend-only deployment cannot provide these features.

The backend reuses the existing `home_loan_leads` database and adds a separate
`home_loan_workflow` table when the pipeline is used. Existing leads default to New;
existing customer rows are retained. SQLite and PostgreSQL are supported. No database
connection configuration is changed. Back up the existing database before a separately
authorized backend rollout. The frontend toolkit does not deploy backend source.

Server-side admin login uses the existing `HOME_LOAN_ADMIN_PASSWORD` and
`HOME_LOAN_ADMIN_TOKEN_SECRET` settings (and optional `ADMIN_EMAIL`). No password or
secret is included in source or release artifacts. The browser-only demo password is
not accepted. Existing admins must sign in again to obtain a server-issued session.

## Source validation

From backend: `bun test src/routes/home-loans.test.ts`.
From mobile: `bun run typecheck` and `bun run build:web`.

Tests use a separate temporary SQLite database. They cover invalid/leap dates,
submission references, authorization, all eight stages, amount totals, stage history,
and stale update conflicts. PostgreSQL requires separate integration validation.

## Exact build packaging

After producing the web export from the reviewed commit:

```
python deployment/prepare_home_loan_release.py EXPORT_DIRECTORY OUTPUT_DIRECTORY GIT_SHA YYYYMMDD
```

The command creates a uniquely named release directory and matching archive/manifest
outside production. The manifest records the source SHA and each built file's SHA256.
It preserves the approved frontend styling marker used by the existing server.

Upload/extract the named release only after approval under:
`/home/ec2-user/paisa-mart-new/backend/.frontend-releases/`.

Never overwrite `FINAL-GOOD-20261006`. Use the installed verification/deployment toolkit
only after selecting the reviewed new release. Verify the current site first and stop
if verification fails. After deployment, verify Home, Products, Login, Dashboard,
the calendar and submission confirmation, and admin stage edits in an Incognito window.
HTTP 200 alone does not prove the expected design or workflow.
