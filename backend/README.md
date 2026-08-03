# backend/

ISMS platform API — NestJS + TypeScript + TypeORM (Postgres).

Read `.cursor/rules/conventions.mdc` before adding code here — that file is the
project's conventions, and Cursor applies it automatically to everything under
`backend/`. The rules that bite most often are module boundaries, the ledger, and
tenant scoping.

## Local setup

```bash
npm install
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
npm run start:dev
```

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
├── common/                  guards, decorators, filters shared by every module
├── database/                TypeORM data source + migrations
├── health/                  GET /api/health
├── types/                   shared contracts (Task 5 fills these in)
├── members/                 Member Management — Melkamu
├── savings-shares/          Savings & Shares — Jerry
├── loans/                   Loans & Credit — Abenezer
├── documents-reporting/     Documents & Reporting — Biruk
├── security-audit/          Security & Audit — Obsan
└── channel-integration/     Notifications, mobile money/USSD contracts — Liya
```

Every vertical module currently exports typed method signatures whose bodies throw
`NotImplementedException`, so an unimplemented endpoint answers `501` with the
standard error body instead of pretending to succeed. The owning vertical replaces
the bodies in its own task.

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

## Not wired yet, on purpose

| Piece | Arrives in |
|---|---|
| `TypeOrmModule` connection (no entities yet, and the scaffold must start without Postgres) | Task 2 |
| `TenantContextGuard` — present but fail-closed and unregistered | Task 3 |
| `RolesGuard` enforcing `@Roles(...)` — the decorator is safe to attach now | Task 22 |
| `LedgerModule` | Task 13 |
