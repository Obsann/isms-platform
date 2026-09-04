# ISMS internship MVP — final report

Internship handover for the Integrated SACCO Management System. Task briefs below
follow [`../TASKS.md`](../TASKS.md). Report summaries follow the companion docs in
[`../README.md`](../README.md). MVP scope is [`.cursor/rules/decisions.mdc`](../../.cursor/rules/decisions.mdc),
not the SDS.

---

## 1. Product

ISMS is a **multi-tenant SACCO** platform: one NestJS API (`backend/`) and one
Next.js app (`frontend/`) with four portals on a single Postgres 16 database.

| Portal | Seed role | Who uses it |
|---|---|---|
| Super Admin | `super-admin` | Platform operator — provision / suspend SACCOs |
| Tenant Admin | `tenant-admin`, `loan-officer` | SACCO manager and loan officer |
| Teller | `teller` | Counter staff — cash, shares, repayments |
| Member | `member` | Web self-service only (no USSD) |

Demo SACCOs after `npm run seed`: **Tsehay Sacco** (`tenant-a`) and **Chereka Sacco**
(`tenant-b`). Login still uses those codes, not the display names. Shared local
password: `DevPassword!123` (rotate before real users).

### Team and verticals

Six people, six weeks, full-stack verticals (same person owns backend and UI):

| Owner | Vertical |
|---|---|
| **Obsan** | Platform — auth, RLS, RBAC, ledger, offline-sync, deploy |
| **Melkamu** | Member management — registration, search, CSV onboarding |
| **Jerry** | Transactions / teller desk — savings, shares, counter UI |
| **Abenezer** | Loans & credit — eligibility, guarantors, approval, disbursement |
| **Biruk** | Admin & reporting — Super Admin, Tenant Admin, documents |
| **Liya** | Member self-service — portal, SMTP, mobile-money contracts |

---

## 2. Architecture (what to remember)

- **Ledger is never bypassed.** Balance changes go through `LedgerService` posting.
  Unbalanced debit/credit pairs are rejected, not half-applied.
- **RLS, not caller `WHERE tenant_id`.** Tenant-scoped tables use Postgres RLS with
  `app.current_tenant_id` set per request. Super Admin tenant CRUD is platform-level
  (outside per-tenant RLS) and the UI flags that.
- **Modules talk through NestJS DI.** No `../other-module/internal/...` imports.
- **Frontend portals do not import each other.** Shared pieces live in `components/`.
  All API calls go through `lib/api-client`. Currency is always full figures
  (`45,230.00 ETB`).
- **Secrets stay on the API.** SMTP and Chapa keys are `backend/` env only — never
  Vercel / `frontend/.env`.

---

## 3. Recorded MVP decisions

From [`.cursor/rules/decisions.mdc`](../../.cursor/rules/decisions.mdc):

| ID | Decision |
|---|---|
| **D1** | No live Fayda (or other ID) verification. No USSD. Registration stores `nationalId` + `idType` only. Generic Telebirr / M-PESA / CBE Birr stay **documented + mocked**. |
| **D2** | No tenant-editable chart of accounts. Ledger uses hard-coded posting pairs. |
| **D3** | Loan ceiling = sum of member **available** savings (`balance - heldAmount`) × `SAVINGS_LOAN_MULTIPLIER` (default `3`). Guarantor pledges do **not** raise the borrower's ceiling. |
| **D4** | Task 12 exposes `holdFunds` / `releaseHold`. Task 17 releases when a loan is fully repaid or cancelled. |
| **D5** | `npm run seed` creates one platform `super-admin` and per-tenant `tenant-admin`, `teller`, `loan-officer` (same known password). |
| **D6** | Jest unit tests required for balanced-posting rejection and RLS isolation. No coverage gate yet. |

**Chapa (later opt-in).** D1 originally mocked all mobile money. Member **C2B deposits**
and **B2C withdrawals** can now go through Chapa when `CHAPA_SECRET_KEY` is set on the
API (Render only). Without the key, checkout/payout stays mock: savings move only after
simulate + verify. Teller cash withdrawal remains available. Unsigned callback `status`
is never trusted.

---

## 4. What shipped

- Multi-tenant JWT auth and fail-closed RBAC ([`../rbac-matrix.md`](../rbac-matrix.md))
- Member registration with manual ID fields; CSV onboarding wizard
- Savings/shares deposits, withdrawals, share purchases through the ledger
- Loans: eligibility multiplier, approval threshold, guarantor holds, disbursement, repayment
- Teller desk with optimistic UI and IndexedDB offline outbox + idempotent replay
- Tenant Admin reports and HTML documents from live ledger / loan / member rows
- Super Admin tenant provisioning
- Member portal: live balance, statement, loans; Chapa C2B deposit and B2C withdrawal (live or mock)
- SMTP notifications (Nodemailer) for deposit, withdrawal, loan approval, OTP
- Backup sidecar + restore rehearsal that re-ran the RLS check
- Welcome page, light/dark theme, Google Translate (`en` / `am` / `om`)
- Internship hosting path: Vercel (frontend) + Render (API + Postgres)

---

## 5. Task briefs

Numbered build order from [`../TASKS.md`](../TASKS.md). Same plan by person:
[`../TEAM_ASSIGNMENTS.md`](../TEAM_ASSIGNMENTS.md).

### Week 0 — Before Week 1

Repo layout (`backend/`, `frontend/`, `docs/`), Cursor conventions, `.env.example`
with no real secrets, Docker Compose Postgres, TypeORM as the ORM. Live Fayda
sandbox was **cancelled** with D1.

### Week 1 — Foundation

**Task 1 — Backend platform scaffold** (Obsan)  
NestJS TypeScript API with module folders matching the architecture: `members`,
`savings-shares`, `loans`, `documents-reporting`, `security-audit`,
`channel-integration`, plus `common/` and `database/`. Health-check route. Modules
export services/DTOs only.

**Task 2 — Database schema v1** (Obsan)  
TypeORM entities for `tenants`, `members`, `staff_accounts`, `roles_permissions`,
`accounts`. Every non-platform table has indexed `tenant_id` and an RLS policy stub.
Initial migration runs against local Postgres.

**Task 3 — Auth & tenant-context middleware** (Obsan)  
`POST /api/auth/login` issues a JWT with `staff_id`, `tenant_id`, `role`. Per-request
tenant context sets the Postgres RLS session variable. `@Roles(...)` skeleton.
A tenant-A request cannot read a tenant-B row.

**Task 4 — Login screen & role-based routing** (Obsan)  
Login calls the real auth endpoint, stores the JWT, redirects by role, and blocks
the other three portals. Depends on Task 7’s shell.

**Task 5 — Shared type contracts** (Obsan + Melkamu, together)  
Mirrored TypeScript interfaces: `Member`, `Account`, `Loan`, `Transaction`,
`AuthUser`, `ReportingSummary` in `backend/src/types` and `frontend/src/types`.
Done once, live — not generated twice in parallel.

**Task 6 — Frontend app scaffold** (Melkamu)  
Next.js App Router with route groups `(super-admin)`, `(tenant-admin)`, `(teller)`,
`(member)`, plus `components/`, `types/`, `lib/api-client`. Placeholder pages per
portal.

**Task 7 — Design system & shared UI kit** (Liya)  
Tailwind + shared kit: data table, form field group, status badge, full-figure
currency display, portal shell/nav. Portals reuse these instead of copying UI.

### Week 2 — Members and savings core

**Task 8 — Member Management API** (Melkamu)  
`POST /api/members`, `GET /api/members/{id}`, `GET /api/members?search=`,
`PATCH /api/members/{id}`. Tenant-scoped; staff directory search is not for members.

**Task 9 — Fayda National ID verification** (Melkamu) — **CANCELLED**  
No outbound ID call, no `VerificationResult`. ID is a stored field pair only.

**Task 10 — Member registration & profile UI** (Melkamu)  
Teller and Tenant Admin registration / search / profile. `nationalId` and `idType`
(`national_id` | `passport` | `other`) as ordinary fields — no verification badge.

**Task 11 — Legacy data onboarding** (Melkamu)  
CSV import: schema mapping, staging/validation preview, commit. Per-row errors,
not a blanket failure.

**Task 12 — Savings & Shares backend** (Jerry)  
Deposits, withdrawals, share purchases, balances, loan-eligibility ceiling, and
`holdFunds` / `releaseHold` for collateral. Available balance excludes held amounts.

**Task 13 — Double-entry ledger engine** (Obsan)  
Every monetary movement posts as a balanced pair of `LedgerEntry` rows in one
atomic transaction. Task 12 (and later loans) route through it. Forced unbalanced
posting is rejected.

### Week 3 — Teller desk, loans, offline sync

**Task 14 — Teller Desk UI** (Jerry)  
Deposit, withdrawal, share purchase, loan repayment with optimistic UI: show the
new balance immediately, reconcile with the server, roll back visibly on rejection.

**Task 15 — Offline-sync infrastructure** (Obsan)  
IndexedDB outbox, idempotency keys, background drain on reconnect. Server replay of
the same reference/amount is idempotent; a different amount is `409 SyncConflict`
and shows as `needs_review` on the teller device — never silent overwrite.

**Task 16 — Loan & Credit backend** (Abenezer)  
Apply, eligibility (savings multiplier), approval workflow, disbursement and
repayment — all posted through the ledger. Amounts above the ceiling are rejected.

**Task 17 — Guarantor & collateral logic** (Abenezer)  
Pledge records hold funds on the **guarantor’s** savings via Task 12. That hold
reduces the guarantor’s withdrawable balance; it does not inflate the borrower
ceiling. Holds release on full repayment or cancellation.

**Task 18 — Loan UI** (Abenezer)  
Application, approval, status on Teller and Tenant Admin. Real API statuses only
(offline demo fallbacks removed in defect D-30-03).

### Week 4 — Admin, member portal, security

**Task 19 — Super Admin console** (Biruk)  
Platform tenant CRUD / provisioning. UI flags platform-level actions. Seeded
tenants appear as Tsehay Sacco and Chereka Sacco.

**Task 20 — Document & Reporting engine** (Biruk)  
Member statement, loan agreement, receipts, share certificates from live ledger
rows. Aggregates: loan portfolio, savings summary, trial balance (debits = credits).

**Task 21 — Tenant Admin dashboard & reporting UI** (Biruk)  
KPI cards (members, savings, shares, outstanding loans), pending approvals, report
views. Figures match Task 20 endpoints; amounts unabbreviated.

**Task 22 — Security & Audit framework** (Obsan)  
Full `@Roles(...)` guard against [`../rbac-matrix.md`](../rbac-matrix.md). Audit log
records every state-changing action (actor, tenant, timestamp). Unauthorized roles
are 403 before business logic. GET/HEAD and `@Public()` routes are not audited as
writes.

**Task 23 — Member Self-Service backend** (Liya)  
Thin reads: `GET /api/members/{id}/balance|statement|loans`. Members may only read
their own row (login email matched to `members.email`; JWT `sub` is staff id).
`GET /api/self-service/me` resolves that link.

**Task 24 — Member Self-Service Portal UI** (Liya)  
Balance, statement, loans from the real API. Mobile money: Chapa C2B deposit
(hosted checkout when keys are set; mock confirm otherwise) and Chapa B2C
withdrawal to Telebirr / M-PESA (hold, then debit after transfer verify). Success
is shown only after verify posts the ledger.

**Task 25 — Notification service** (Liya)  
Nodemailer SMTP for deposit, withdrawal, loan approval, and OTP. SMTP failure must
not undo a posted financial transaction. Keys in `backend/` only.

**Task 26 — Mobile money webhook contracts** (Liya)  
OpenAPI shapes for generic C2B/B2C (Telebirr, M-PESA Ethiopia, CBE Birr) in
[`../openapi/`](../openapi/). Live Chapa C2B deposits and B2C withdrawals are a
separate, opt-in path (`POST /api/webhooks/chapa` + member initialize/verify).
No USSD session contract.

### Week 5 — Integration, testing, UAT

**Task 27 — End-to-end integration pass** (whole team, Obsan coordinates)  
Each portal: login → primary action → logout against real API. Checklist:
[`../integration-pass.md`](../integration-pass.md). Local Docker pass recorded
2026-09-01.

**Task 28 — RLS concurrent tenant load check** (Obsan)  
Two tenants with overlapping-looking member data; concurrent reads. No cross-tenant
row. Script: `npm run rls:check`.

**Task 29 — Offline outbox load / edge cases** (Obsan + Jerry)  
Network loss and conflicting offline posts against the same account. Script:
[`../offline-outbox-verification.md`](../offline-outbox-verification.md). Conflict
is reviewable, not silent.

**Task 30 — Test case matrix & structured UAT** (Melkamu + Biruk)  
Each SDS functional requirement mapped to a test case with pass/fail:
[`../test-case-matrix.md`](../test-case-matrix.md). FR-1.1 through FR-7.2 recorded
**PASS** (FR-6.3 is spec-only per D1).

**Task 31 — Bug triage & tracking** (Abenezer)  
Defects D-30-01…04 from integration/UAT: eligibility vs pledges, approval
threshold, leftover loan-UI mocks, missing `@Roles` on loans. All **resolved**.
Log lives in the same matrix document.

### Week 6 — Deployment and handover

**Task 32 — Deployment runbook & hardening** (Obsan)  
Postgres + API + frontend provision, secrets rotation, rollback.
[`../deployment-runbook.md`](../deployment-runbook.md). Internship default is
**Vercel** (`frontend/`) + **Render** (API + Postgres). Verify: a second person
follows the runbook without asking the author.

**Task 33 — Backup & disaster-recovery rehearsal** (Melkamu)  
Nightly Docker sidecar dumps, 7-day retention, restore into spare DB
`isms_restore_check`, then re-run Task 28 RLS. Runbook:
[`../backup-disaster-recovery.md`](../backup-disaster-recovery.md). Log:
[`../backup-rehearsal-log.md`](../backup-rehearsal-log.md) — **PASS** 2026-08-31.

**Task 34 — Documentation** (whole team; Liya compiles)  
Admin + per-portal manuals in this folder, plus this report. Each section should
be followable by someone who did not build that part.

**Task 35 — Final UAT sign-off** (whole team, Obsan leads)  
Re-run signed-off use cases on the **deployed** system and collect signatures.
Sheet: [`../uat-sign-off.md`](../uat-sign-off.md). Local Docker pass is not
production go-live.

---

## 6. Companion reports (broad)

These are the other handover docs. This report does not replace them.

### Software design background — `docs/SACCO_PROPOSAL.md`

Chapter-by-chapter SDS for a multi-tenant Ethiopian SACCO platform (problem,
objectives, modules, FRs). Use it for *why* the product exists. Do **not** treat
it as MVP truth: Fayda, USSD, CoA, role names, and live MoMo differ from
`decisions.mdc` and the RBAC matrix.

### RBAC — `docs/rbac-matrix.md` (Task 22)

Role-to-endpoint table enforced by `RolesGuard`. SDS names map to seed roles:
Sys. Admin → `super-admin`, Manager → `tenant-admin`, plus `teller`,
`loan-officer`, `member`. No auditor login and no Fayda-verifier role. Member
Chapa routes are member-only; `POST /api/webhooks/chapa` is `@Public()` + HMAC.
`roles_permissions` table is a stub for post-MVP overrides.

### Test matrix & defects — `docs/test-case-matrix.md` (Tasks 30–31)

Traces FR-1.1–FR-7.2 to a test case, role, expected result, and code path. All
in-scope FRs **PASS**. Four defects (eligibility pledges, manager threshold,
loan-UI mocks, loan `@Roles`) logged and closed. Verification mixed Jest, seed,
and RBAC scripts.

### Integration pass — `docs/integration-pass.md` (Task 27)

Portal walkthrough against `localhost:4000/api`. Super Admin lists tenants;
Tenant Admin reports/statement for `MEM-10001`; Teller search + deposit; Member
own balance (other member 403). 2026-09-01: RLS, RBAC 20/20, audit log, offline
outbox 5/5, trial balance balanced. Remaining: production URL walkthrough and
team signatures.

### Offline outbox — `docs/offline-outbox-verification.md` (Task 29)

Same `reference` + amount → idempotent 201. Same reference, different amount →
409 `SyncConflict`. Teller UI queues while offline and marks conflicts
`needs_review`. Script: `backend/scripts/verify-offline-outbox.ps1`.

### Deployment — `docs/deployment-runbook.md` (Task 32)

Secrets (`JWT_SECRET`, DB, SMTP, Chapa on API only), migrate as owner, run API as
`isms_app` so RLS is not bypassed, `CORS_ORIGIN` = exact frontend origin (no
trailing slash), frontend `NEXT_PUBLIC_API_URL` including `/api`. Managed path:
Render Blueprint (`render.yaml`) + Vercel root `frontend`. Rollback: stop writes,
restore dump, redeploy previous build, re-run `rls:check`.

### Backup / DR — `docs/backup-disaster-recovery.md` + `backup-rehearsal-log.md` (Task 33)

Sidecar dump of `isms_dev` on start then every 24h; keep 7 dumps in gitignored
`backups/`. Rehearse restore into `isms_restore_check` (does not wipe live).
Connect as `isms_app` for RLS checks — `postgres` superuser would make the check
meaningless. Recorded pass: 2026-08-31 (Melkamu).

### UAT sign-off — `docs/uat-sign-off.md` (Task 35)

Use-case re-run sheet (registration, ledger deposit/withdraw, loan threshold,
statements, RBAC, audit, RLS, offline outbox). Local session 2026-09-01 passed
most FRs; FR-3.1 (eligibility) was unit-tested, not re-clicked in UI. **Not
approved for production go-live** until: second person follows the runbook on a
real host; sheet re-run against those URLs; remaining teammate + instructor
signatures.

### OpenAPI / channel — `docs/openapi/` (Task 26)

Generic MoMo C2B/B2C webhook shapes + Prism mock notes. Chapa C2B is the live
opt-in implementation: initialize checkout, HMAC webhook, verify-then-ledger.
B2C remains teller cash for this release.

### Team process — `docs/TEAM_STATUS.md`

Living branch/PR board (last snapshot 2026-09-01). Treat git/`main` as source of
truth for what is deployed. Closeout still called out Task 32 second-person
rehearsal and Task 35 signatures.

### Operator manuals — `docs/manuals/`

| Manual | Audience |
|---|---|
| [Admin / platform](./admin-manual.md) | Super Admin, deploy operators |
| [Tenant Admin](./tenant-admin.md) | SACCO manager |
| [Teller desk](./teller.md) | Counter staff |
| [Loans](./loan-officer.md) | Loan officer and approving manager |
| [Member portal](./member-portal.md) | Members on the web portal |

---

## 7. How to run locally

```bash
docker compose up -d
cd backend && cp .env.example .env && npm install && npm run migration:run && npm run seed && npm run start:dev
cd frontend && npm install && npm run dev
```

API: `http://localhost:4000/api` · Web: `http://localhost:3000`

Seed logins (password `DevPassword!123`):

| Tenant code | Email | Portal |
|---|---|---|
| `platform` | `superadmin@platform.dev` | Super Admin |
| `tenant-a` | `admin@tenant-a.dev` | Tenant Admin |
| `tenant-a` | `loan-officer@tenant-a.dev` | Tenant Admin (loans) |
| `tenant-a` | `teller@tenant-a.dev` | Teller |
| `tenant-a` | `abebe.bikila@tenant-a.dev` | Member (must be this email, not teller) |

### Verify

```powershell
cd backend
npm test
npm run rls:check
powershell -ExecutionPolicy Bypass -File scripts/verify-rbac.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-audit-log.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-offline-outbox.ps1
```

Portal walkthrough: [`../integration-pass.md`](../integration-pass.md).  
Production: [`../deployment-runbook.md`](../deployment-runbook.md).

---

## 8. Production notes (internship hosting)

Typical live pair: frontend `https://isms-platform-red.vercel.app`, API
`https://isms-platform-qsu2.onrender.com/api`. After merging work to `main`:

1. Render pre-deploy runs `npm run release` (migrate + seed). Confirm `/api/health`.
2. Vercel root directory `frontend`; `NEXT_PUBLIC_API_URL` must include `/api`.
3. Render `CORS_ORIGIN` = Vercel origin **with no trailing slash**.
4. Optional live Chapa on **Render only**: `CHAPA_SECRET_KEY`, `CHAPA_WEBHOOK_SECRET`,
   `CHAPA_CALLBACK_URL=https://<api-host>/api/webhooks/chapa`, `FRONTEND_URL` = Vercel
   origin. Leave the secret empty to keep mock checkout.

---

## 9. Residual closeout

- Task 35 sign-off must be completed against a **deployed** URL, not only localhost.
- Task 32 requires a second person to follow the runbook without asking the original author.
- Rotate `DevPassword!123` before any real member or staff use.
- Fayda, USSD, tenant-editable CoA, and live Telebirr / M-PESA / CBE Birr remain
  post-MVP. Chapa C2B is opt-in and still not a full wallet (no member B2C).
