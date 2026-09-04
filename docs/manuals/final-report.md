# ISMS internship MVP — final report (broad handover)

This is the **internship handover report** for the Integrated SACCO Management System
(ISMS). It is written so someone who did not sit in the daily stand-ups can still
explain the product, the team, the architecture, the six-week build, the recorded
scope cuts, how to run it, how it was tested, and what is deliberately **not** in
MVP.

Task numbers follow [`../TASKS.md`](../TASKS.md). The same plan by person is
[`../TEAM_ASSIGNMENTS.md`](../TEAM_ASSIGNMENTS.md). Agent-enforced coding rules live
under [`.cursor/rules/`](../../.cursor/rules/), not as a second copy of this file.
**MVP truth** is [`.cursor/rules/decisions.mdc`](../../.cursor/rules/decisions.mdc),
not the background SDS [`../SACCO_PROPOSAL.md`](../SACCO_PROPOSAL.md).

Operator click-paths are in the portal manuals in this folder. This report is the
**why / what / who / how it hangs together** document.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Problem, context, and why a platform](#2-problem-context-and-why-a-platform)
3. [Product: portals, tenants, seed](#3-product-portals-tenants-seed)
4. [Team, verticals, and ownership](#4-team-verticals-and-ownership)
5. [Software development methodology (SDLC)](#5-software-development-methodology-sdlc)
6. [OOP, clean architecture, modular monolith (not microservices)](#6-oop-clean-architecture-modular-monolith-not-microservices)
7. [Design patterns and SOLID as they appear in the code](#7-design-patterns-and-solid-as-they-appear-in-the-code)
8. [DevSecOps: security in the pipeline](#8-devsecops-security-in-the-pipeline)
9. [Recorded MVP decisions (D1–D6) and later opt-ins](#9-recorded-mvp-decisions-d1d6-and-later-opt-ins)
10. [Architecture deep dive](#10-architecture-deep-dive)
11. [What shipped (feature catalogue)](#11-what-shipped-feature-catalogue)
12. [Week-by-week task briefs (1–35)](#12-week-by-week-task-briefs-135)
13. [Vertical narratives](#13-vertical-narratives)
14. [Companion documents](#14-companion-documents)
15. [How to run locally and verify](#15-how-to-run-locally-and-verify)
16. [Production / internship hosting](#16-production--internship-hosting)
17. [Limitations, post-MVP, residual closeout](#17-limitations-post-mvp-residual-closeout)
18. [Glossary](#18-glossary)

---

## 1. Executive summary

ISMS is a **multi-tenant web platform for Ethiopian SACCOs**: one NestJS API, one
Next.js + Tailwind frontend, one Postgres 16 database, **four portals**, many
SACCOs (tenants) isolated by **Postgres row-level security (RLS)**, not by a
database per SACCO and not by a microservice per SACCO.

Six interns built it in **six weeks** as **full-stack verticals** (the same person
owns backend and UI for their area). **Obsan** owned the **platform** everyone else
stands on: authentication, tenant context / RLS, RBAC, the double-entry **ledger**,
teller **offline sync**, and deployment. Other verticals: members (Melkamu),
teller/savings (Jerry), loans (Abenezer), admin/reporting (Biruk), member
self-service and notifications (Liya).

The internship stack is **TypeScript** (NestJS + Next.js), **not** the course
example of .NET 9. The **methodology** matches a modular monolith + multi-tenant
SACCO product: layered modules, OOP services, SOLID-ish boundaries, secrets and
authorization in the development pipeline (DevSecOps as practiced here).

**Money never moves except through the ledger.** **Tenants never see each other’s
rows** if the API runs as `isms_app` with RLS forced. **Roles fail closed.**
Currency on screen is always a full figure (`45,230.00 ETB`), never `45.2K`.

Demo SACCOs after `npm run seed`: **Tsehay Sacco** (login code `tenant-a`) and
**Chereka Sacco** (`tenant-b`). Shared local password: `DevPassword!123` — rotate
before any real user.

---

## 2. Problem, context, and why a platform

Ethiopian SACCOs (savings and credit cooperatives) typically run member books,
teller cash, share capital, and small loans. Paper or single-SACCO spreadsheets do
not share a **platform operator** who can provision a new SACCO without cloning a
whole server. A naive multi-tenant app that filters `WHERE tenant_id = ?` in every
query **fails closed incorrectly**: one missed `WHERE` leaks another SACCO’s
members and balances.

ISMS answers that with:

- One deployable **modular monolith** (simpler than microservices for a six-week
  internship).
- **RLS** so isolation is enforced in Postgres even if application code is sloppy.
- A **ledger** so savings, shares, and loans cannot invent their own balances.
- Four **portals** so a teller, a manager, a member, and a platform operator do not
  share one “god UI.”

The background SDS (`SACCO_PROPOSAL.md`) describes a larger product (live national
ID, USSD, editable chart of accounts, live Telebirr/M-PESA/CBE). The internship
**explicitly cut** those (section 9). This report always prefers the recorded
decisions over the SDS when they disagree.

---

## 3. Product: portals, tenants, seed

### 3.1 Four portals

| Portal | Seed role(s) | Job |
|---|---|---|
| Super Admin | `super-admin` | Provision / suspend **whole SACCOs**. Platform-level; not day-to-day teller work. |
| Tenant Admin | `tenant-admin`, `loan-officer` | SACCO manager dashboard, reports, member registration (admin), loan approval. Loan officer shares this shell but must not get teller-only or admin-only buttons they are not allowed (RBAC + UI gating). |
| Teller | `teller` | Counter: search member, deposit, withdraw, share purchase, loan repayment; offline outbox when the network drops. |
| Member | `member` | Web self-service: balance, statement, own loans (including apply), Chapa deposit/withdraw. **No USSD.** |

Login is always `{ tenantCode, email, password }`. Super Admin uses the reserved
tenant code `platform` (not a row in `tenants` in the same way; `tenant_id` on that
staff row is NULL).

### 3.2 Seeded tenants and people

After `npm run seed` (database owner role, not `isms_app`):

| Tenant code | Display name | Typical staff |
|---|---|---|
| `platform` | — | `superadmin@platform.dev` |
| `tenant-a` | Tsehay Sacco | `admin@`, `teller@`, `loan-officer@tenant-a.dev` |
| `tenant-b` | Chereka Sacco | same pattern `@tenant-b.dev` |

Seeded member portal users (email must match the `members` row): e.g.
`abebe.bikila@tenant-a.dev` / `tenant-a`. A **teller** email is not a member portal
login.

Password for all seed accounts: `DevPassword!123`.

D5 originally described staff roles; member portal logins are provisioned for seed
members and, later, for newly registered members (welcome email + temporary
password) when that path is enabled.

### 3.3 What a member journey looks like (happy path)

1. Tenant admin or teller **registers** the member (manual `nationalId` + `idType`;
   no Fayda). Member number may be auto-assigned `MEM-#####` if omitted.
2. If the member has an email, the API can create a `staff_accounts` row with role
   `member` and email a temporary password (SMTP).
3. Teller opens a **savings** account and posts a **deposit** through the ledger.
4. Member may **apply for a loan**; ceiling = available savings × 3 (env). Staff
   approve; disbursement and repayment post through the ledger. Guarantor pledges
   **hold** the guarantor’s savings, they do not raise the borrower’s ceiling.
5. Member may **deposit via Chapa** hosted checkout if `CHAPA_SECRET_KEY` is set;
   savings credit only after **verify**. Withdrawals to Telebirr/M-PESA similarly
   hold then debit after transfer verify. Without the key, Pay is disabled and
   withdrawals can be simulated.

---

## 4. Team, verticals, and ownership

Six people, six weeks, **not** a backend team vs frontend team. Each vertical is
end-to-end so there is a single owner for “members are wrong in the UI and the API.”

| Owner | Vertical | Sits on |
|---|---|---|
| **Obsan** | Platform: auth, RLS, RBAC, ledger, offline-sync, deploy | — (foundation) |
| **Melkamu** | Member management: registration, search, CSV, auto member numbers | Tasks 2–4, 7, 22 |
| **Jerry** | Transactions / Teller Desk: savings, shares, counter UI | Ledger (13), members |
| **Abenezer** | Loans & credit: eligibility, guarantors, approval, disbursement | Ledger, holds (12), members |
| **Biruk** | Admin & reporting: Super Admin, Tenant Admin, documents | Ledger, members, loans |
| **Liya** | Member self-service: portal, SMTP, OpenAPI MoMo shapes | Members, savings, loans |

**Merge order (do not ignore in an oral exam):** ledger (13) before more savings
and before loans post money; RBAC (22) before every vertical claims “we secured
the route”; Jerry’s online teller (14) before Obsan’s offline layer (15); Task 5
shared types **once, together**, not two PRs.

**Reviews:** anything touching ledger, JWT, tenant-context/RLS, RBAC, or shared
platform tables needs **Obsan**. Vertical code needs another vertical owner.
Shared types need the consumer’s owner.

---

## 5. Software development methodology (SDLC)

This internship did not run a textbook waterfall with a 200-page spec frozen on
day one. It also did not “everyone codes on `main`.” It was a **planned, iterative,
task-numbered SDLC**:

1. **Requirements / SDS** — problem and FRs in `SACCO_PROPOSAL.md`.
2. **Scope lock** — D1–D6 recorded so the SDS does not silently expand MVP.
3. **Planning** — `TASKS.md`: owner, dependencies, **verify** step per task.
4. **Design** — module map, RBAC matrix, OpenAPI webhook contracts, ledger as the
   only balance API.
5. **Implementation** — branches `task<N>-<name>-<short-desc>`, commits
   `Task <N>: …`.
6. **Integration** — Task 27 walkthrough; Week 5 scripts (RLS, RBAC, audit, outbox).
7. **Test / UAT** — Jest (D6), test-case matrix (Task 30), sign-off sheet (35).
8. **Deploy / operate** — runbook (32), backup rehearsal (33), manuals (34).

**Git:** trunk-based PRs into `main`. No force-push to `main`. Never edit an
already-applied migration. Conflicts in ledger/auth/types are treated as serious;
migration conflicts are regenerated, not hand-merged.

That is the “software development methodology” for this project: **Agile-shaped
delivery with a master task list**, not Scrum theatre and not a single release
after six silent weeks.

---

## 6. OOP, clean architecture, modular monolith (not microservices)

### 6.1 OOP (objects and classes)

The course slide said “object and class.” This codebase is TypeScript classes:

- **Entities** (`MemberEntity`, `TenantEntity`, `ChapaPaymentEntity`) map tables.
- **Services** (`MemberService`, `LedgerService`, `OtpService`, `ChapaService`)
  hold business rules.
- **Controllers** map HTTP to services and DTOs.
- **Guards / interceptors** are classes that implement Nest interfaces.

Nest **dependency injection** constructs **objects** of those classes per
application lifetime (singletons by default). Tests substitute mocks (`useValue`)
for the same constructor tokens.

**Encapsulation:** `LoanModule` calls `LedgerService` / `SavingsSharesService`
through DI. It does not `UPDATE accounts SET balance`. **Inheritance:** tenant
tables extend `TenantScopedEntity` / `BaseEntity`. **Polymorphism (practical):**
one `NotificationService.send()` dispatches templates; one `RolesGuard` reads
`@Roles()` metadata.

### 6.2 Clean / multi-layered architecture

Task 1 asked for module folders matching clean / multi-layered architecture.
The request path is:

```
HTTP → DTO validation → JwtAuthGuard → RolesGuard → TenantContextGuard
    → Controller → Service → TypeORM on the request QueryRunner (RLS)
    → AuditLogInterceptor (writes) → TenantContextInterceptor (commit/rollback)
```

Controllers do not post the ledger. Frontend portals do not import each other;
shared UI lives in `components/`; all HTTP goes through `lib/api-client/`.

### 6.3 Modular monolith, not microservices

There is **one** Nest process, **one** Next app, **one** Postgres. `members`,
`loans`, `ledger` are **modules**, not separately deployed services. That is
intentional: six weeks, six people, one internship demo.

If the product were split later, those module boundaries (exported services only,
no internal imports) are the seams. **We did not split them.**

**Multi-tenant** is the other architecture label: one app, many SACCOs, isolation
by RLS + JWT `tenantId`.

### 6.4 Course stack vs this stack

| Course example (Guba Tech note) | This internship |
|---|---|
| Backend .NET 9 Web API | NestJS (Node/TypeScript) |
| Frontend Next.js + Tailwind | Same idea: Next.js App Router + Tailwind |
| Modular monolith + multi-tenant | Same |
| Microservices | **Not used** |

Say this out loud if they read the .NET slide: methodology matches; implementation
language/framework for the API does not.

---

## 7. Design patterns and SOLID as they appear in the code

Do not claim “we implemented the entire GoF catalogue.” Claim these, with a place
in the repo:

| Pattern | Where |
|---|---|
| Dependency injection | Nest `@Injectable()`, `AppModule` composition root |
| Module / facade | Each vertical exports service + public DTOs |
| Pipeline (middleware, guard, interceptor) | Tenant ALS → JWT → roles → RLS tx → audit → commit |
| Decorator | `@Roles`, `@Public`, `@CurrentUser` |
| Repository (constrained) | `TenantContextService.repo(Entity)` — never an unscoped pool repo for RLS tables |
| Factory | SMTP transport, temporary passwords, Chapa `tx_ref` |
| Template method / strategy | Notification templates; OTP purposes |
| Outbox | Teller IndexedDB queue + idempotent replay |
| Fail-closed authorization | Missing role → 403 before the service |

**SOLID (internship-honest):**

- **S** — Ledger posts money; auth issues JWT; OTP hashes codes; notifications send
  mail. A withdrawal controller does not implement all four.
- **O** — New email template or OTP purpose without rewriting deposit posting.
- **L** — Tests replace `ConfigService` / tenant context with fakes that still
  satisfy the constructor.
- **I** — Modules do not export controllers and internal helpers.
- **D** — Savings depends on `LedgerService`, not on SQL column writes. Login
  depends on `resolve_tenant_by_code`, not on a superuser scan of `tenants`.

---

## 8. DevSecOps: security in the pipeline

Here DevSecOps means: **security and tenancy are part of every task and every PR**,
not a week-6 bolt-on.

| Practice | In ISMS |
|---|---|
| Secrets | `.env` gitignored; only `.env.example` committed; SMTP/Chapa **backend only** |
| App vs owner DB roles | API: `isms_app` (RLS applies). Migrations/seed: `postgres` / owner |
| AuthN | JWT; tenant code at login; bcrypt passwords |
| AuthZ | `RolesGuard` + `docs/rbac-matrix.md`; fail closed |
| Tenant isolation | `FORCE ROW LEVEL SECURITY`; `set_config(..., is_local => true)` |
| Money integrity | Ledger only; unbalanced post rejected |
| Audit | State-changing HTTP logged in the same transaction |
| Git hygiene | PRs, no `.env` on GitHub, migrations additive |
| Deploy | Runbook; CORS exact origin; JWT secret not `dev-local-…` in real hosting |
| Backup | Dump/restore rehearsal; RLS re-check as `isms_app`, not superuser |
| Step-up auth (later) | Email OTP for password reset/change and high-value cash (≥ 100,000 ETB) |

`POST /api/webhooks/chapa` is `@Public()` **and** HMAC-verified. Unsigned query
`status` from a browser return URL is **never** trusted to credit savings.

---

## 9. Recorded MVP decisions (D1–D6) and later opt-ins

From `decisions.mdc` (2026-08-10). Prefer these over the SDS.

| ID | Decision | Consequence |
|---|---|---|
| **D1** | No live Fayda / ID verification. No USSD at all. ID is typed fields. Generic MoMo documented + mocked. | Task 9 cancelled. Member portal is web-only. `channel-integration` kept for SMTP + contracts. |
| **D2** | No tenant-editable chart of accounts. | Ledger hard-codes posting pairs (cash, savings, shares, loan principal). Named CoA is post-MVP. |
| **D3** | Loan ceiling = Σ available savings × multiplier (default 3). | `availableBalance = balance - heldAmount`. Guarantor pledges do **not** raise the borrower ceiling. |
| **D4** | `holdFunds` / `releaseHold` in savings. Loans release on full repay or cancel. | Manual release is for corrections only. |
| **D5** | Seed: platform super-admin + per-tenant admin, teller, loan-officer. Same known password. | Demo logins in section 15. |
| **D6** | Jest. Before Week 5, unit tests for unbalanced ledger rejection **and** RLS isolation. No coverage % gate. | `npm test`, `npm run rls:check`. |

**Later than D1 (opt-in, still internship):** Chapa **C2B deposits** and **B2C
withdrawals** when `CHAPA_SECRET_KEY` is set on the **API**. Empty key → member
wallet stays mock: hosted Pay is disabled; withdrawals can be simulated; **teller
cash** still works. Keys never go in `frontend/.env` or Vercel.

**Later platform UX:** email OTP (forgot password, change password, large
withdrawal/disbursement); welcome email when a member portal login is provisioned.
These sit on Liya’s notification module and Obsan’s auth/tenant stack; they are
not a replacement for Tasks 1–35.

---

## 10. Architecture deep dive

### 10.1 Repo layout

Nothing product-related at repo root except standard git/CI/compose files.
Everything else is `backend/`, `frontend/`, or `docs/`.

### 10.2 Backend modules (Nest)

`AppModule` is the **only** composition root that imports every feature module.
Cross-module calls: exported **service**, never `../loans/internal/...`.

Notable modules: `auth`, `tenants`, `members`, `ledger`, `savings-shares`, `loans`,
`security-audit`, `channel-integration`, `documents-reporting`,
`member-self-service`, `common` (guards, tenant context), `database`.

### 10.3 Tenant context and RLS

Connections come from a **pool**. A session `SET app.tenant_id` without
`SET LOCAL` would leak to the next request. The platform opens a **dedicated
QueryRunner + transaction** per authenticated request, sets
`set_config('app.tenant_id', $1, true)`, and commits or rolls back in an
interceptor.

Policies typically: `tenant_id = app_current_tenant_id()`. The `tenants` table is
special (`id = app_current_tenant_id() OR app_current_tenant_id() IS NULL`) so
Super Admin can list SACCOs when tenant context is null.

Bootstrap: resolving `tenantCode` at login uses `resolve_tenant_by_code` (SECURITY
DEFINER) because RLS would otherwise deadlock “need tenant to read tenant.”

### 10.4 Ledger

Any balance change → `LedgerService` posting function. Debit and credit legs in
one transaction; inequality → reject. Reports (trial balance, statements) **read**
the same books. Seed/migrations after Week 2 must not poke balances.

Hard-coded MVP pairs (D2): cash deposit/withdraw, share purchase, loan disburse,
loan repayment principal. Names like CASH, MEMBER_SAVINGS, SHARE_CAPITAL,
LOANS_RECEIVABLE are implementation labels, not a user-editable CoA.

### 10.5 Frontend

App Router groups: `(super-admin)`, `(tenant-admin)`, `(teller)`, `(member)`. No
cross-portal imports. JWT in the client; **authorization is still the API**.
i18n / Google Translate (`en` / `am` / `om`), light/dark theme, welcome page.

### 10.6 Request you can narrate

Teller posts a deposit: JWT (`teller`, `tenant-a`) → Roles allow deposit → RLS
session is Tsehay’s UUID → savings service calls ledger → two `ledger_entries` →
account balance derived from postings → audit row → commit → optional SMTP
enqueue (failure does not roll back the money).

---

## 11. What shipped (feature catalogue)

- Multi-tenant JWT auth; reserved `platform` code for Super Admin
- Fail-closed RBAC (`docs/rbac-matrix.md`)
- Member CRUD, search, CSV onboarding, optional auto `MEM-#####`
- Manual ID fields only (no Fayda)
- Savings and shares: deposit, withdraw, share purchase, holds
- Loans: apply (staff + member for self), eligibility ×3, approval threshold,
  guarantor holds, disburse, repay — all via ledger
- Teller desk optimistic UI + IndexedDB outbox + SyncConflict
- Super Admin tenant provision/suspend
- Tenant Admin KPIs, reports, HTML documents (statement, agreement, receipt,
  share certificate) from live data
- Member portal: balance, statement, loans, Chapa wallet (live or mock)
- SMTP: deposit, withdrawal, loan approval, OTP, member-welcome
- Backup sidecar + restore rehearsal + RLS re-check
- Hosting path: Vercel frontend + Render API/Postgres
- Forgot-password / OTP step-up on high-value cash and password change (later)

---

## 12. Week-by-week task briefs (1–35)

Numbered build order from `TASKS.md`. Verify steps are the original “done”
criteria.

### Week 0 — Before Week 1

Repo (`backend/`, `frontend/`, `docs/`), Cursor conventions, `.env.example` with
**no real secrets**, Docker Compose Postgres (host port **5532**), TypeORM chosen.
Live Fayda sandbox **cancelled** (D1).

### Week 1 — Foundation

**Task 1 — Backend platform scaffold** (Obsan)  
NestJS TypeScript API, module folders, health-check, modules export services/DTOs
only, no cross-internal imports.

**Task 2 — Database schema v1** (Obsan)  
Entities: `tenants`, `members`, `staff_accounts`, `roles_permissions`, `accounts`.
Indexed `tenant_id`, RLS stubs, first migration.

**Task 3 — Auth and tenant-context middleware** (Obsan)  
`POST /api/auth/login` JWT (`staff_id` / `sub`, `tenant_id`, `role`). Per-request
RLS. `@Roles` skeleton. Tenant A cannot read tenant B.

**Task 4 — Login screen and role-based routing** (Obsan)  
Real login, JWT storage, four portals, client guard. Depends on Task 7 shell.

**Task 5 — Shared type contracts** (Obsan + Melkamu, **together, live**)  
`Member`, `Account`, `Loan`, `Transaction`, `AuthUser`, `ReportingSummary` mirrored
backend/frontend. One agreement, one merge.

**Task 6 — Frontend app scaffold** (Melkamu)  
Next.js App Router groups, `components/`, `types/`, `lib/api-client`, placeholder
pages.

**Task 7 — Design system and shared UI kit** (Liya)  
Tailwind kit: table, form field group, status badge, full-figure currency, portal
shell. Portals reuse; they do not fork CSS.

### Week 2 — Members and savings core

**Task 8 — Member Management API** (Melkamu)  
Create, get, search, patch. Tenant-scoped. Staff directory is not the member list.

**Task 9 — Fayda National ID** (Melkamu) — **CANCELLED (D1)**  
No outbound call, no `VerificationResult`.

**Task 10 — Member registration and profile UI** (Melkamu)  
Teller / Tenant Admin registration, search, profile. Ordinary ID fields. Later:
auto member numbers; loan officers on the admin shell cannot register/delete.

**Task 11 — Legacy data onboarding** (Melkamu)  
CSV: map columns, stage, validate, commit. Per-row errors, not all-or-nothing.

**Task 12 — Savings and Shares backend** (Jerry)  
Deposits, withdrawals, share purchases, balances, eligibility ceiling,
`holdFunds` / `releaseHold`. Available balance excludes holds.

**Task 13 — Double-entry ledger engine** (Obsan)  
Balanced `LedgerEntry` pairs, atomic. Task 12 (and later loans) route through it.
Unbalanced posting rejected. Merge before further money features.

### Week 3 — Teller desk, loans, offline sync

**Task 14 — Teller Desk UI** (Jerry)  
Deposit, withdrawal, share purchase, loan repayment. Optimistic balance; visible
rollback on 4xx/5xx.

**Task 15 — Offline-sync infrastructure** (Obsan)  
IndexedDB outbox, idempotency keys, drain on reconnect. Same reference+amount →
idempotent success. Same reference, different amount → `409 SyncConflict` /
`needs_review`. Depends on online Task 14.

**Task 16 — Loan and Credit backend** (Abenezer)  
Apply, eligibility, approval, disburse, repay — ledger posting. Over-ceiling
rejected.

**Task 17 — Guarantor and collateral** (Abenezer)  
Pledges hold **guarantor** savings. Do not inflate borrower ceiling. Release on
full repay or cancel (D4).

**Task 18 — Loan UI** (Abenezer)  
Application, approval, status on Teller and Tenant Admin. Real API statuses
(offline demo fallbacks removed in defect D-30-03). Members can apply for
**themselves** (email-linked member id).

### Week 4 — Admin, member portal, security

**Task 19 — Super Admin console** (Biruk)  
Platform tenant CRUD. UI flags platform-level actions. Seeded names Tsehay /
Chereka; login codes unchanged.

**Task 20 — Document and Reporting engine** (Biruk)  
Statement, loan agreement, receipts, share certificates from live rows.
Aggregates: loan portfolio, savings summary, **trial balance** (debits = credits).

**Task 21 — Tenant Admin dashboard and reporting UI** (Biruk)  
KPI cards, pending approvals, report views. Figures match Task 20; unabbreviated
money.

**Task 22 — Security and Audit framework** (Obsan)  
Full `@Roles` vs RBAC matrix. Audit: actor, action, entity, timestamp, same
transaction as the write. GET/HEAD and `@Public()` not treated as writes.
Unauthorized → 403 **before** business logic. Vertical owners then decorate their
own routes.

**Task 23 — Member Self-Service backend** (Liya)  
Thin reads: balance, statement, loans. Member may only read **own** row (login
email ↔ `members.email`). `GET /api/self-service/me` (and alias) resolves the link.
JWT `sub` is staff id, not member id.

**Task 24 — Member Self-Service Portal UI** (Liya)  
Balance, statement, loans from the real API. Chapa C2B (hosted checkout when the
API has a real secret; otherwise Pay stays disabled). Chapa B2C to Telebirr /
M-PESA: hold, then ledger after verify. Success only after verify. Generic MoMo
staging UI is not the member wallet.

**Task 25 — Notification service** (Liya)  
Nodemailer: deposit, withdrawal, loan approval, OTP. SMTP failure must **not**
undo a posted financial transaction (`enqueue`). Keys in `backend/` only. Port 465
defaults to TLS unless `SMTP_SECURE` overrides.

**Task 26 — Mobile money webhook contracts** (Liya)  
OpenAPI C2B/B2C shapes (Telebirr, M-PESA Ethiopia, CBE Birr) in `docs/openapi/`.
No USSD session contract. Live Chapa is a **separate** opt-in (`/api/webhooks/chapa`
+ member initialize/verify), not a substitute for those generic contracts.

### Week 5 — Integration, testing, UAT

**Task 27 — End-to-end integration pass** (whole team, Obsan coordinates)  
Each portal: login → primary action → logout against **real** endpoints. Checklist:
[`../integration-pass.md`](../integration-pass.md). Local Docker pass recorded
2026-09-01.

**Task 28 — RLS concurrent tenant load** (Obsan)  
Two+ tenants, overlapping-looking member data, concurrent reads. No cross-tenant
row. `npm run rls:check`.

**Task 29 — Offline outbox edge cases** (Obsan + Jerry)  
Network loss; two conflicting offline posts on the same account. Conflict is
reviewable. [`../offline-outbox-verification.md`](../offline-outbox-verification.md).

**Task 30 — Test case matrix and structured UAT** (Melkamu + Biruk)  
Each in-scope FR → test case: [`../test-case-matrix.md`](../test-case-matrix.md).
FR-1.1–FR-7.2 recorded PASS where in scope (FR-6.3 spec-only per D1).

**Task 31 — Bug triage** (Abenezer)  
D-30-01…04: eligibility vs pledges, approval threshold, leftover loan-UI mocks,
missing `@Roles` on loans. Resolved. Log in the matrix doc.

### Week 6 — Deployment and handover

**Task 32 — Deployment runbook and hardening** (Obsan)  
Postgres + Nest + Next, secrets rotation, rollback.
[`../deployment-runbook.md`](../deployment-runbook.md). Default internship path:
**Vercel** (`frontend/`) + **Render** (API + Postgres). Verify: a **second person**
follows the runbook without asking the author.

**Task 33 — Backup and disaster-recovery rehearsal** (Melkamu)  
Nightly Docker sidecar dumps, 7-day retention, restore into spare
`isms_restore_check`, re-run Task 28 as `isms_app`.
[`../backup-disaster-recovery.md`](../backup-disaster-recovery.md),
[`../backup-rehearsal-log.md`](../backup-rehearsal-log.md) — PASS 2026-08-31.

**Task 34 — Documentation** (whole team; Liya compiles)  
Admin + per-portal manuals + **this report**. Each section followable by someone
who did not build that part.

**Task 35 — Final UAT sign-off** (whole team, Obsan leads)  
Re-run signed-off use cases on the **deployed** system. Sheet:
[`../uat-sign-off.md`](../uat-sign-off.md). Local Docker pass is **not** production
go-live.

---

## 13. Vertical narratives

### 13.1 Platform (Obsan)

Without this vertical there is no trustworthy multi-tenant demo. Narrate in this
order if time is short: **Task 3 (RLS) → 13 (ledger) → 22 (RBAC/audit) → 15
(offline) → 32 (deploy)**. Mention Task 5 with Melkamu, and that you **coordinate**
27 and **lead** 35.

Platform work later in the internship also includes: CLI migrations always as
DB owner (so `isms_app` is not asked to `CREATE TABLE`); tenant lookups for
welcome email on the request QueryRunner; OTP challenges table and auth routes;
Chapa secret treated as live only when non-empty and not a placeholder.

### 13.2 Members (Melkamu)

Staff register people. IDs are data, not a government API. CSV onboarding for
legacy lists. Auto member numbers reduce collisions. Delete/cascade must not 500
if optional tables (Chapa, staged MoMo) are missing on an old DB — still, run
migrations.

### 13.3 Teller / savings (Jerry)

The counter is where cash meets the ledger. Optimistic UI is a UX choice;
**truth** is the API. Offline is Obsan’s library under Jerry’s desk. Large cash
out may require OTP (later).

### 13.4 Loans (Abenezer)

Ceiling from **available** savings × 3. Holds are collateral mechanics, not extra
borrowing power. Approval is role-gated (teller cannot approve). Disbursement and
repayment are ledger events. Members apply only for the member row linked to their
login email.

### 13.5 Admin and reporting (Biruk)

Super Admin is dangerous on purpose (whole tenants). Tenant Admin sees KPIs that
must match Task 20. Trial balance is a **ledger invariant** demo: if it does not
sum to zero, someone bypassed posting.

### 13.6 Member self-service and channels (Liya)

Portal is read-thin plus Chapa initialize/verify. SMTP is best-effort after money
moves. OpenAPI documents gateways you did **not** go live with. Chapa is the
optional live path for this demo.

---

## 14. Companion documents

This report does not replace:

| Document | Use |
|---|---|
| [`../SACCO_PROPOSAL.md`](../SACCO_PROPOSAL.md) | Why SACCOs; **not** MVP truth |
| [`../rbac-matrix.md`](../rbac-matrix.md) | Role × endpoint |
| [`../test-case-matrix.md`](../test-case-matrix.md) | FR → test; defects |
| [`../integration-pass.md`](../integration-pass.md) | Portal walkthrough |
| [`../offline-outbox-verification.md`](../offline-outbox-verification.md) | Idempotency + conflict |
| [`../deployment-runbook.md`](../deployment-runbook.md) | Production steps |
| [`../backup-disaster-recovery.md`](../backup-disaster-recovery.md) | Dump/restore |
| [`../uat-sign-off.md`](../uat-sign-off.md) | Signatures |
| [`../openapi/`](../openapi/) | Generic MoMo contracts |
| [`../TEAM_STATUS.md`](../TEAM_STATUS.md) | Living board; git is truth |
| [Admin](./admin-manual.md), [Tenant Admin](./tenant-admin.md), [Teller](./teller.md), [Loans](./loan-officer.md), [Member](./member-portal.md) | Click-paths |

---

## 15. How to run locally and verify

```bash
docker compose up -d
cd backend && cp .env.example .env && npm install && npm run migration:run && npm run seed && npm run start:dev
cd frontend && npm install && npm run dev
```

Fill `backend/.env`: `JWT_SECRET`, DB (Compose publishes **5532**), optional
`SMTP_*`, optional `CHAPA_SECRET_KEY`. Migrations need a role that can
`CREATE TABLE` (local `postgres` / `DB_ADMIN_*`). `start:dev` should use
`DB_USERNAME=isms_app` so RLS is real.

API: `http://localhost:4000/api` · Web: `http://localhost:3000`

| Tenant code | Email | Portal |
|---|---|---|
| `platform` | `superadmin@platform.dev` | Super Admin |
| `tenant-a` | `admin@tenant-a.dev` | Tenant Admin |
| `tenant-a` | `loan-officer@tenant-a.dev` | Tenant Admin (loans) |
| `tenant-a` | `teller@tenant-a.dev` | Teller |
| `tenant-a` | `abebe.bikila@tenant-a.dev` | Member |

Password: `DevPassword!123`.

**Chapa Pay:** only if `CHAPA_SECRET_KEY` is a real `CHASECK_TEST-…` / `CHASECK-…`
(≥ 20 chars, not a placeholder) **and the API was restarted**. An empty
`CHAPA_SECRET_KEY=` in `.env` keeps the banner *Live checkout needs
CHAPA_SECRET_KEY* and disables Pay. That is correct behaviour, not a frontend bug.

```powershell
cd backend
npm test
npm run rls:check
powershell -ExecutionPolicy Bypass -File scripts/verify-rbac.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-audit-log.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-offline-outbox.ps1
```

---

## 16. Production / internship hosting

Typical pair: frontend `https://isms-platform-red.vercel.app`, API
`https://isms-platform-qsu2.onrender.com/api`. After merge to `main`:

1. Render pre-deploy `npm run release` (migrate + seed). Confirm `/api/health`.
2. Vercel root `frontend`; `NEXT_PUBLIC_API_URL` **includes** `/api`.
3. Render `CORS_ORIGIN` = Vercel origin, **no trailing slash**.
4. Chapa **on Render only**: secret, webhook secret, callback
   `https://<api-host>/api/webhooks/chapa`, `FRONTEND_URL` = Vercel origin.

Rollback: stop writes, restore dump, redeploy previous build, `rls:check` as
`isms_app`.

---

## 17. Limitations, post-MVP, residual closeout

**Out of MVP (by decision or time):** live Fayda; any USSD; tenant-editable CoA;
live Telebirr / M-PESA / CBE Birr as first-class gateways (OpenAPI only); auditor
role; coverage % CI gate; SMS/WhatsApp instead of email.

**Chapa** is opt-in, not a full wallet: no key → no hosted Pay. Merchant wallet
balance and Chapa dashboard transfer approval still matter for live B2C.

**Residual closeout (do not pretend these are done if they are not):**

- Task 35 signatures against a **deployed** URL, not only localhost.
- Task 32: second person follows the runbook without asking Obsan.
- Rotate `DevPassword!123` and `JWT_SECRET` before real members.
- Local UAT 2026-09-01 passed most FRs; FR-3.1 eligibility was unit-tested more
  than re-clicked. Sheet: `uat-sign-off.md`.

---

## 18. Glossary

| Term | Meaning here |
|---|---|
| SACCO | Savings and Credit Cooperative |
| Tenant | One SACCO on the shared platform |
| RLS | Postgres row-level security keyed by `app.tenant_id` |
| Ledger | Only legal path to change balances |
| Available balance | `balance - heldAmount` |
| Hold | Collateral lock on savings (guarantor or in-flight payout) |
| Modular monolith | One API process, many modules, not microservices |
| Outbox | Offline queue of teller operations |
| SyncConflict | 409 when idempotency key reused with a different payload |
| `isms_app` | DB role the API uses so RLS cannot be bypassed |
| `platform` | Login tenant code for Super Admin |

---

*End of broad final report. For day-to-day clicks, use the portal manuals in this
folder. For “is this in MVP?”, use `decisions.mdc`, not the SDS.*
