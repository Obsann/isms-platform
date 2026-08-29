# backend/

ISMS platform API — NestJS + TypeScript + TypeORM (Postgres).

Read [`.cursor/rules/conventions.mdc`](../.cursor/rules/conventions.mdc) and
[`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) before adding
code here — Cursor applies conventions automatically under `backend/`. The rules
that bite most often are module boundaries, the ledger, and tenant scoping.

## Local setup

Everyone uses the same Postgres 16 via Docker at the repo root — not an embedded
engine, not a per-person install. That keeps RLS and migrations identical across
the team (see [`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc)).

```bash
# from repo root
docker compose up -d

# then in backend/
npm install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
npm run migration:run   # connect as DB_USERNAME=postgres
npm run start:dev
```

From Task 2 on the API needs a reachable database at boot and will refuse to start
without one. Compose creates the `isms_dev` database; the migration creates the
tables. For Task 3 RLS checks, switch `DB_USERNAME` in `.env` to `isms_app` (created
by `docker/postgres/init/`) — the `postgres` superuser bypasses RLS.

Then check the health route:

```bash
curl http://localhost:4000/api/health
```

The API listens on `4000` so it doesn't collide with the Next.js dev server on `3000`.

## Scripts

| Script | What it does |
|---|---|
| `npm run start:dev` | watch mode |
| `npm run start:prod` | run the compiled build from `dist/` |
| `npm run build` | compile to `dist/` |
| `npm run lint` / `npm run format` | ESLint / Prettier |
| `npm test` | Jest |
| `npm run migration:generate -- src/database/migrations/<Name>` | generate a migration from entities |
| `npm run migration:run` / `npm run migration:revert` | apply / roll back |

TypeScript is pinned to `^6` because `ts-jest` does not yet support TypeScript 7.

## Layout

```
src/
├── main.ts                  bootstrap: global prefix, validation, exception filter, CORS
├── app.module.ts            composition root — the only place that names every module
├── common/                  entity base classes, guards, decorators, filters
├── database/                TypeORM data source + migrations
├── health/                  GET /api/health
├── types/                   shared contracts (Task 5 — mirror in frontend/src/types)
├── tenants/                 the platform-global tenants table — Obsan
├── members/                 Member Management — Melkamu
├── savings-shares/          Savings & Shares — Jerry
├── loans/                   Loans & Credit — Abenezer
├── documents-reporting/     Documents & Reporting — Biruk
├── security-audit/          Security & Audit — Obsan
└── channel-integration/     SMTP notifications + mobile-money webhook contracts (no live gateway / no USSD in MVP) — Liya
```

Every vertical module currently exports typed method signatures whose bodies throw
`NotImplementedException`, so an unimplemented endpoint answers `501` with the
standard error body instead of pretending to succeed. The owning vertical replaces
the bodies in its own task.

## Database — schema v1 (Task 2)

| Table | Tenant scoping | Owner from here |
|---|---|---|
| `tenants` | platform-global; its own `id` is the scope key | Obsan, then Biruk (Task 19) |
| `members` | `tenant_id` NOT NULL, indexed | Melkamu (Task 8) |
| `staff_accounts` | `tenant_id` indexed, NULL = platform-level staff | Obsan (Task 3) |
| `roles_permissions` | `tenant_id` indexed, NULL = platform-wide default role | Obsan (Task 22) |
| `accounts` | `tenant_id` NOT NULL, indexed | Jerry (Task 12) |

Choices worth knowing before you extend this:

- Status/type columns are `varchar` with a `CHECK`, not Postgres `enum` types. Adding a
  value later is one migration instead of an `ALTER TYPE` dance.
- Money is `numeric(18,2)`, which `pg` returns as a decimal string — that's why `Amount`
  in `src/types` is a string. `balance` and `held_amount` are written only by the ledger
  (Task 13), and a `CHECK` enforces `0 <= held_amount <= balance`.
- `accounts` has a composite foreign key to `members (tenant_id, id)`, so an account
  cannot reference a member in another tenant even if RLS were misconfigured.
- Every table extends `BaseEntity` (uuid `id`, `created_at`, `updated_at`), and
  tenant-scoped tables extend `TenantScopedEntity`, which is what guarantees the
  `tenant_id` column exists.

### RLS, and the two ways to fool yourself

Each table has RLS enabled with a policy comparing its tenant column to
`app_current_tenant_id()`, which reads the `app.tenant_id` session variable that the
tenant-context guard will set per request (Task 3). Unset resolves to NULL, which matches
no row — an unscoped connection sees nothing rather than everything.

1. **Don't connect as a superuser.** Superusers bypass RLS unconditionally, so every
   isolation test passes and proves nothing. `FORCE ROW LEVEL SECURITY` is set so the
   table *owner* is also subject to policies, but that can't save you from a superuser.
   Create a dedicated non-superuser role for `DB_USERNAME` before trusting Task 3's
   verify step, and use it in the deployment runbook (Task 32).
2. **Login has to resolve the tenant before it can read `staff_accounts`.** The policies
   are fail-closed, so there is no "look up the user first, then figure out the tenant"
   path. Task 3's login takes a tenant code alongside the credentials, resolves it, sets
   `app.tenant_id`, and only then queries. Platform-level rows (`tenant_id IS NULL`,
   Super Admin) are invisible to tenant-scoped sessions by design and need a role with
   `BYPASSRLS` — that's Task 19's problem to wire, not something to weaken the policy for.

## Module rules, in short

- A module's `index.ts` is its public surface: the service class plus public types.
  Controllers, repositories, and helpers stay unexported.
- Cross-module calls go through the other module's exported service via DI. Never
  import `../other-module/<internal file>`.
- Balances move only through the ledger service's posting function (Task 13).
- Tenant scoping is the tenant-context guard's job (Task 3), not the caller's. If you
  are writing `WHERE tenant_id = ?` by hand, the guard isn't wired to that route.
- Errors are thrown as NestJS exceptions and shaped by `AllExceptionsFilter` into
  `{ statusCode, message, error }`.

## Ledger (Task 13)

Every monetary movement is a balanced debit/credit pair in `ledger_entries`
(same `posting_id`) plus the member-account `balance` update, all in the request
transaction. Unbalanced postings throw `422` before any write. Collateral holds
change `held_amount` only — they are not GL postings. MVP GL codes are hard-coded
(`CASH`, `MEMBER_SAVINGS`, `SHARE_CAPITAL`, `LOANS_RECEIVABLE`); there is no
chart-of-accounts table.

## Auth & tenant-context (Task 3)

- `POST /api/auth/login` takes `{ tenantCode, email, password }` and returns a JWT
  with `staff_id` (`sub`), `tenant_id`, and `role` claims. Use a real SACCO code
  (`tenant-a` / `tenant-b` from seed) for tenant staff, or the reserved code
  `platform` for the seeded super-admin. `GET /api/auth/me` is the concrete proof
  the tenant pipeline works: it re-reads `staff_accounts` through the tenant
  context resolved from the caller's own token (platform super-admin rows stay
  invisible to that path — Task 19).
- **Every route except `@Public()` ones now requires a valid Bearer token.** Mark a
  route `@Public()` (see `common/decorators/public.decorator.ts`) only for things
  that must work with no tenant context at all — currently just health and login.
- **Every RLS-scoped query must go through `TenantContextService.repo(Entity)` or
  `.getManager()`**, never a plain `@InjectRepository(Entity)`. The latter uses the
  untouched pool connection with no `app.tenant_id` set — under `FORCE ROW LEVEL
  SECURITY` that's zero rows, not an error, so this fails silently instead of loudly
  if you get it wrong. `TenantContextService` is `@Global()`, so it's injectable
  anywhere without importing anything extra.
- `tenants` has the same fail-closed RLS as every other table, which creates a
  bootstrap problem: resolving a login's `tenantCode` has to happen *before* any
  tenant context exists. `resolve_tenant_by_code` (migration `TenantBootstrapLookup`)
  is a narrow `SECURITY DEFINER` function that returns only `id`/`status` for a code,
  bypassing RLS for that one lookup only — `isms_app` has `EXECUTE` on it and nothing
  more. Platform super-admin login uses the same pattern:
  `resolve_platform_staff_by_email` (migration `PlatformStaffBootstrapLookup`).
- `npm run seed` creates two dev tenants plus seeded staff (see
  `src/database/seeds/dev-seed.ts` and decisions D5): one platform `super-admin`,
  and per tenant `tenant-admin`, `teller`, and `loan-officer` (same known password).
  Useful for login, portal routing (Task 4), and cross-tenant isolation checks.

## RBAC & audit log (Task 22)

`RolesGuard` is global, after JWT and before tenant context. `@Roles(...)` on a
route is the allow-list; any other JWT role gets **403** before the handler runs.
Authenticated routes without `@Roles` are also denied (fail closed). Matrix:
[`docs/rbac-matrix.md`](../docs/rbac-matrix.md). New endpoints in other verticals
must add `@Roles` — a forgotten decorator will 403 rather than silently allow.

Successful `POST`/`PUT`/`PATCH`/`DELETE` calls (except `@Public()`) append a row
to `audit_logs` in the same request transaction. `GET /api/audit-logs` is
tenant-admin and super-admin. Entries are never updated or deleted.

## Not wired yet, on purpose

| Piece | Arrives in |
|---|---|
| Refresh tokens | deferred — access token only for now |
