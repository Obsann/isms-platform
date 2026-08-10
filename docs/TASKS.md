# ISMS — Build Order & Task Plan

Integrated SACCO Management System, six weeks, six people.

Team: **Obsan**, **Melkamu**, **Jerry**, **Abenezer**, **Biruk**, **Liya**.

Work is organized into full-stack verticals — each person owns a feature area end to
end, backend and frontend both, rather than handing off across a horizontal
backend/frontend split:

| Owner | Vertical |
|---|---|
| **Obsan** | Platform — auth, multi-tenancy/RLS, RBAC framework, ledger engine, offline-sync infrastructure, deployment |
| **Melkamu** | Member Management — registration, profile, search, manual ID fields, legacy data onboarding |
| **Jerry** | Transactions / Teller Desk — savings & shares, deposits/withdrawals, the Teller Desk UI |
| **Abenezer** | Loans & Credit — application, eligibility, guarantors, approval, disbursement |
| **Biruk** | Admin & Reporting — Super Admin console, Tenant Admin dashboard, Document & Reporting engine |
| **Liya** | Member Self-Service — member portal, notifications, mobile money webhook contracts |

Two codebases in one repo: `backend/` (NestJS) and `frontend/` (Next.js). See
[`GIT_WORKFLOW.md`](./GIT_WORKFLOW.md) for branching and review,
[`TEAM_ASSIGNMENTS.md`](./TEAM_ASSIGNMENTS.md) for this same plan organized by
person, and [`CONVENTIONS.md`](./CONVENTIONS.md) / `.cursor/rules/` for coding
rules (Cursor and Antigravity both load the `.mdc` rules).

---

## Week 0 — Before Week 1 starts

- [ ] Repo created, `docs/CONVENTIONS.md` + `.cursor/rules/`, `backend/` and
      `frontend/` folders exist — **Obsan**
- [ ] `.env.example` committed (no real secrets); everyone has local Postgres
      running — **Obsan**, verified by everyone individually
- [x] ~~Fayda National ID sandbox test~~ — **cancelled** (MVP drops live Fayda;
      see [`DECISIONS.md`](./DECISIONS.md) D1).
- [ ] TypeORM confirmed as the ORM/migration tool — **Obsan**

---

## Week 1 — Foundation

### Task 1 — Backend platform scaffold
**Owner: Obsan** · **Depends on:** nothing

> Set up a NestJS (TypeScript) project. Create module folders matching the Clean/
> Multi-Layered Architecture: `members`, `savings-shares`, `loans`,
> `documents-reporting`, `security-audit`, `channel-integration` (notifications +
> mobile-money contracts; no USSD — see DECISIONS.md D1), plus `common/`
> (guards, decorators, filters) and `database/` (TypeORM config + migrations). Each
> module exports typed function signatures with TODO bodies — no module imports
> another directly. Add a health-check route.

**Verify:** server starts locally; folder structure matches `docs/CONVENTIONS.md`;
`.env` is gitignored.

### Task 2 — Database schema v1
**Owner: Obsan** · **Depends on:** Task 1

> Define TypeORM entities for `tenants`, `members`, `staff_accounts`,
> `roles_permissions`, `accounts` (savings/share). Every table carries `tenant_id`.
> Generate the initial migration and an RLS policy stub on each table.

**Verify:** the migration runs clean against a local database; every table has a
`tenant_id` column, indexed.

### Task 3 — Auth & tenant-context middleware
**Owner: Obsan** · **Depends on:** Task 1, 2

> Implement `POST /api/auth/login` issuing a JWT with `staff_id`, `tenant_id`,
> `role` claims. Build a guard that resolves tenant context per request and sets the
> Postgres RLS session variable, plus a `@Roles(...)` decorator skeleton.

**Verify:** a request scoped to tenant A cannot read a row seeded for tenant B.

### Task 4 — Login screen & role-based routing
**Owner: Obsan** · **Depends on:** Task 3, Task 7

> Login screen calling the auth endpoint, JWT storage, redirect to the correct
> portal by role, and the client-side route guard.

**Verify:** logging in with four different seeded roles lands each on its correct
portal and blocks the other three.

### Task 5 — Shared type contracts
**Owner: Obsan + Melkamu, together, live**

> Define TypeScript interfaces for `Member`, `Account`, `Loan`, `Transaction`,
> `AuthUser`, `ReportingSummary` — mirrored in `backend/src/types` and
> `frontend/src/types`.

**Verify:** both of you agree on every field out loud before either writes logic
against them.

**Sequencing note:** synchronous, not parallel — don't generate it twice
independently.

### Task 6 — Frontend app scaffold
**Owner: Melkamu** · **Depends on:** nothing (parallel with Task 1)

> Set up a Next.js (App Router, TypeScript) project. Create `/src/app` with route
> groups for four portals — `(super-admin)`, `(tenant-admin)`, `(teller)`,
> `(member)` — `/src/components`, `/src/types`, `/src/lib/api-client`. Add
> placeholder pages per portal.

**Verify:** app builds and runs; hitting each portal route renders a placeholder
without crashing.

### Task 7 — Design system & shared UI kit
**Owner: Liya** · **Depends on:** Task 6

> Set up Tailwind CSS + Shadcn UI. Define design tokens and the shared component
> set every portal will reuse: data table, form field group, status badge, currency
> display (always full, unabbreviated figures), and the base portal shell/nav
> layout.

**Verify:** a throwaway page using five of the shared components renders correctly
without portal-specific overrides.

---

## Week 2 — Member Management, Savings core

### Task 8 — Member Management API
**Owner: Melkamu** · **Depends on:** Task 1–5

> `POST /api/members`, `GET /api/members/{id}`, `GET /api/members?search=`,
> `PATCH /api/members/{id}`.

**Verify:** all four endpoints work against a local Postgres instance, correctly
scoped to a single tenant.

### Task 9 — ~~Fayda National ID verification service~~ **CANCELLED**
**Owner: Melkamu** · **Cancelled:** 2026-08-10 — see [`DECISIONS.md`](./DECISIONS.md) D1.

> Live Fayda verification is out of MVP. Member ID is a stored field pair
> (`nationalId` + `idType`) captured manually at registration — no outbound call,
> no `VerificationResult`, registration not blocked on ID checks.

### Task 10 — Member registration & profile UI
**Owner: Melkamu** · **Depends on:** Task 8, 7

> Registration form and profile/search screen for the Tenant Admin and Teller
> portals. Capture `nationalId` and `idType` (`national_id` | `passport` | `other`)
> as ordinary form fields — no verification status UI.

**Verify:** registering a member end to end works against the real backend.

### Task 11 — Legacy Data Onboarding
**Owner: Melkamu** · **Depends on:** Task 8

> Backend import/mapping endpoint plus the frontend wizard — schema-mapping step,
> staging/validation preview, commit/reconciliation confirmation screen.

**Verify:** uploading a sample CSV walks through all steps with per-row validation
errors shown, not a blanket failure.

### Task 12 — Savings & Shares backend
**Owner: Jerry** · **Depends on:** Task 1–5

> Deposits, withdrawals, share purchases, automatic balance calculation, and the
> savings-multiplier loan-eligibility ceiling. Include the held-balance mechanism
> for funds pledged as loan collateral.

**Verify:** a deposit followed by a withdrawal produces the correct balance; a held
amount is excluded from the balance endpoint.

### Task 13 — Double-entry ledger engine
**Owner: Obsan** · **Depends on:** Task 12

> The `ledger` service — every monetary movement posts as a balanced pair of
> `LedgerEntry` rows in a single atomic transaction, rejected outright if debits ≠
> credits. Route Task 12's deposit/withdrawal through it.

**Verify:** a forced unbalanced posting is rejected, not half-applied.

**Sequencing note:** part of the Platform vertical since Jerry's Transactions
vertical and Abenezer's Loans vertical both post through it — don't branch Task 16
(loans) off `main` until this is merged.

---

## Week 3 — Teller Desk, Loans, offline-sync

### Task 14 — Teller Desk UI
**Owner: Jerry** · **Depends on:** Task 12, 7

> Deposit, withdrawal, and loan repayment flows with optimistic UI updates — show
> the result immediately, reconcile against the server response, roll back visibly
> on rejection.

**Verify:** a deposit reflects instantly, reconciles silently on server
confirmation; a rejected transaction rolls back visibly with a clear message.

### Task 15 — Offline-sync infrastructure
**Owner: Obsan** · **Depends on:** Task 14

> IndexedDB-backed local queue, idempotency keys, a background sync worker that
> drains the queue on reconnect, and server-side ingestion that rejects (not
> silently resolves) any conflict requiring server-side judgment, routed back to the
> originating device as a reviewable exception. Provided as a client library that
> Jerry's Teller Desk consumes.

**Verify:** recording a deposit with the network disabled queues it locally and
shows a pending state; reconnecting drains the queue correctly, with a forced
duplicate submission caught by the idempotency key.

**Sequencing note:** part of the Platform vertical since it's consumed by the
Teller Desk directly — don't start until Task 14 has a working online-only version
to build the offline layer under.

### Task 16 — Loan & Credit backend
**Owner: Abenezer** · **Depends on:** Task 13

> Loan application, automated eligibility check (savings multiplier + guarantor
> pledge rules), approval workflow, disbursement and repayment, posted through the
> Task 13 ledger service.

**Verify:** a loan request above the eligibility ceiling is rejected automatically;
a valid disbursement produces balanced ledger entries.

### Task 17 — Guarantor & collateral logic
**Owner: Abenezer** · **Depends on:** Task 16

> Guarantor pledge recording, and marking the pledged amount as held on the
> guarantor's own savings account via Task 12's held-balance mechanism.

**Verify:** pledging a guarantor's savings against a loan correctly reduces that
guarantor's withdrawable balance.

### Task 18 — Loan UI
**Owner: Abenezer** · **Depends on:** Task 16, 7

> Loan application, approval workflow, and status screens across the Teller and
> Admin portals.

**Verify:** a loan submitted through the UI reflects its real approval status end to
end, no mocked state left in place.

---

## Week 4 — Admin/Reporting, Member Portal, Security

### Task 19 — Super Admin console
**Owner: Biruk** · **Depends on:** Task 7, 4

> Backend tenant CRUD/provisioning endpoint plus the frontend tenant list and
> provisioning form. This portal operates outside per-tenant RLS scoping — flag
> clearly in the UI whenever an action is platform-level.

**Verify:** the provisioning form submits, creates a real tenant, and shows a clear
success/error state.

### Task 20 — Document & Reporting Engine
**Owner: Biruk** · **Depends on:** Task 12, 13, 16

> `GET /api/members/{id}/statement`, loan agreement generation, receipts, share
> certificates — template-driven, reads from the ledger. Plus aggregate reports
> (loan portfolio, savings summary, trial balance).

**Verify:** a generated statement matches the ledger exactly; the trial balance
sums to zero across the tenant.

### Task 21 — Tenant Admin dashboard & reporting UI
**Owner: Biruk** · **Depends on:** Task 19, 20, 7

> Dashboard layout — member count, account summary, pending approvals — plus the
> financial/operational report views consuming Task 20's endpoints.

**Verify:** every figure shown matches what the backend report returns, compared
directly.

### Task 22 — Security & Audit framework
**Owner: Obsan** · **Depends on:** Task 3

> Build the full `@Roles(...)` guard against the RBAC matrix, and an `audit-log`
> service recording every state-changing action with timestamp and actor. Each
> vertical owner then applies the decorator to their own endpoints.

**Verify:** an unauthorized-role request is rejected before it reaches business
logic, across every endpoint in the matrix; every state-changing action appears in
the audit log.

### Task 23 — Member Self-Service backend
**Owner: Liya** · **Depends on:** Task 12, 16

> `GET /api/members/{id}/balance`, statement request, loan status — thin
> read-oriented endpoints composing the Member Management, Transactions, and Loans
> verticals rather than owning new business logic.

**Verify:** balance and loan status returned match what Jerry's and Abenezer's
verticals record directly.

### Task 24 — Member Self-Service Portal UI
**Owner: Liya** · **Depends on:** Task 23, 7

> Balance view, statement request, loan status, and mocked deposit (C2B) /
> disbursement (B2C) mobile money flow UI — mocked because live gateway
> integration is out of scope this phase.

**Verify:** portal shows correct real balance/loan data; mocked flows show clearly
as "pending confirmation," never a false success.

### Task 25 — Notification service
**Owner: Liya** · **Depends on:** Task 12, 16

> Email/SMTP wrapper (Nodemailer) for deposit, withdrawal, loan-approval, and OTP
> emails — substituting for the SMS/WhatsApp gateway this phase.

**Verify:** a deposit triggers a real email to a test inbox within a few seconds.

### Task 26 — Mobile Money webhook contracts
**Owner: Liya** · **Depends on:** Task 12, 16

> Not implemented against a live gateway this phase. Document the webhook
> contract for mobile money C2B/B2C in the OpenAPI spec, so Task 24's mocked UI
> builds against a documented shape. **No USSD** — self-service is web-only for
> MVP ([`DECISIONS.md`](./DECISIONS.md) D1).

**Verify:** the MoMo webhook spec is complete enough that someone outside the
team could implement a mock server against it without a follow-up question.

---

## Week 5 — Integration, testing, UAT

### Task 27 — End-to-end integration pass
**Owner: whole team, coordinated by Obsan**

> Every frontend portal wired against real (non-mocked) backend endpoints where a
> real endpoint exists.

**Verify:** a full walkthrough of each portal — login → primary action → logout —
touches only real endpoints, checked in the network tab.

### Task 28 — RLS-scoped concurrent tenant load check
**Owner: Obsan**

> Seed two or three test tenants with overlapping data and run concurrent requests
> across them.

**Verify:** no cross-tenant row appears in any response, checked with tenants
seeded to have colliding member data specifically.

### Task 29 — Offline outbox load/edge-case test
**Owner: Obsan + Jerry**

> Simulate repeated mid-session network loss on the Teller Desk, including two
> conflicting offline transactions against the same account.

**Verify:** the forced conflict produces a visible reviewable exception on the
teller's device, not a silent data loss or silent wrong resolution.

### Task 30 — Test case matrix & structured UAT session
**Owner: Melkamu + Biruk**

> Draft a test case matrix tracing each functional requirement in the SDS to a
> test case, and run a structured UAT session with the team playing SACCO staff
> roles.

**Verify:** every functional requirement has a row with a recorded pass/fail.

### Task 31 — Bug triage & tracking
**Owner: Abenezer**

> Own the defect list coming out of Task 27/30 — severity, owner, status.

**Verify:** every logged defect has an owner and a status other than blank by end
of week.

---

## Week 6 — Deployment & handover

### Task 32 — Deployment runbook & production hardening
**Owner: Obsan**

> Document and rehearse provisioning Postgres, deploying the NestJS API, and
> deploying the Next.js app to production. Rotate development credentials.

**Verify:** someone other than Obsan can follow the runbook and get a working
deployment without a clarifying question.

### Task 33 — Backup & disaster-recovery rehearsal
**Owner: Obsan**

> Confirm the backup schedule runs, and rehearse a restore before go-live.

**Verify:** a restored backup passes Task 28's RLS check again.

### Task 34 — Documentation
**Owner: whole team — each person writes the section for their own vertical; Liya compiles**

> Admin manual, end-user manual per portal, final report.

**Verify:** each section can be followed by someone who didn't build that part.

### Task 35 — Final UAT sign-off
**Owner: whole team, led by Obsan**

> Walk through the signed-off use cases one more time against the deployed system,
> and get the sign-off sheet signed.

**Verify:** the sign-off sheet is signed and every use case was re-run against
production.

---

## After every task, before opening a PR (30 seconds, every time)

- [ ] Does the generated code match the interface/contract in this file?
- [ ] Does it violate `docs/CONVENTIONS.md` (module-to-module direct imports,
      provider keys outside `backend/`, a ledger write that bypasses Task 13's
      posting service)?
- [ ] Did your editor "helpfully" refactor something outside this task's scope? If
      yes, revert that part.
- [ ] If this task depended on someone else's output — did you pull `main` and
      confirm it's actually there before building against it, per
      `docs/GIT_WORKFLOW.md`'s sequencing notes?
