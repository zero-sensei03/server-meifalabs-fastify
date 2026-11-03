# Server Meifalabs

## Database bootstrap

Apply reviewed Prisma migrations to the intended installation database before running seeds. No seed command applies migrations or activates a subscription/license.

- Module catalog: `pnpm run seed:modules`
- First administrator: `SUPERADMIN_USERNAME=... SUPERADMIN_PASSWORD=... pnpm run seed:superadmin`
- Fresh installation: run module seed, then superadmin seed (`pnpm run seed`). The combined command requires the bootstrap environment variables.

The superadmin seed requires `DATABASE_URL`, a valid `SUPERADMIN_USERNAME`, and a unique `SUPERADMIN_PASSWORD` of 12–128 characters. It creates an active `SUPERADMIN` only when that username is absent; it does not reset existing credentials. Supply the password through your deployment secret manager or a one-off environment injection, never command history or committed files.

For tests, configure a dedicated disposable PostgreSQL database with `NODE_ENV=test` and its own `DATABASE_URL`, apply migrations to that database, and never point test setup at development or production. No test currently applies seed data automatically.

## Authentication

Browser auth uses an opaque random cookie identifier. PostgreSQL stores only its SHA-256 digest, user, expiry, and CSRF-token digest. Login returns the synchronizer CSRF token in its response; after a page reload, use same-origin `POST /api/v1/auth/csrf` to rotate and retrieve a token, then send it as `x-csrf-token` on logout. That issuance request checks the explicit configured Origin allowlist. Production uses a `__Host-` cookie with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`. Session lifetime is controlled by `SESSION_TTL_SECONDS` (default 8 hours).
