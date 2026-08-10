# ISMS — Individual Assignments

This reorganizes [`TASKS.md`](./TASKS.md) by person instead of by task number.
Each vertical below is full-stack — backend and frontend both owned by the same
person, end to end.

Companion documents: [`TASKS.md`](./TASKS.md) (task-numbered master plan),
[`.cursor/rules/git-workflow.mdc`](../.cursor/rules/git-workflow.mdc) (branching,
review, merge), [`.cursor/rules/conventions.mdc`](../.cursor/rules/conventions.mdc)
(coding rules), [`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc)
(MVP scope).

---

## Obsan — Platform

Auth, multi-tenancy/RLS, RBAC framework, the ledger engine, offline-sync
infrastructure, and deployment. These sit underneath every other vertical, so they
land first and get merged before the verticals that depend on them branch.

### Task 1 — Backend platform scaffold (Week 1)
**Depends on:** nothing.

> Set up a NestJS (TypeScript) project. Create module folders matching the Clean/
> Multi-Layered Architecture: `members`, `savings-shares`, `loans`,
> `documents-reporting`, `security-audit`, `channel-integration`, plus `common/`
> and `database/`. Each module exports typed function signatures with TODO bodies —
> no module imports another directly. Add a health-check route.

**Verify:** server starts locally; folder structure matches `.cursor/rules/conventions.mdc`;
`.env` is gitignored.

### Task 2 — Database schema v1 (Week 1)
**Depends on:** Task 1.

> Define TypeORM entities for `tenants`, `members`, `staff_accounts`,
> `roles_permissions`, `accounts`. Every table carries `tenant_id`. Generate the
> initial migration and an RLS policy stub on each table.

**Verify:** the migration runs clean; every table has a `tenant_id` column, indexed.

### Task 3 — Auth & tenant-context middleware (Week 1)
**Depends on:** Task 1, 2.

> Implement `POST /api/auth/login` issuing a JWT with `staff_id`, `tenant_id`,
> `role` claims. Build a guard resolving tenant context per request and setting the
> RLS session variable, plus a `@Roles(...)` decorator skeleton.

**Verify:** a request scoped to tenant A cannot read a row seeded for tenant B.

### Task 4 — Login screen & role-based routing (Week 1)
**Depends on:** Task 3, Liya's Task 7 (design system).

> Login screen calling the auth endpoint, JWT storage, redirect to the correct
> portal by role, and the client-side route guard.

**Verify:** logging in with four seeded roles lands each on its correct portal and
blocks the other three.

### Task 5 — Shared type contracts (Week 1)
**Shared with:** Melkamu — done together, live, not in parallel.

> Define TypeScript interfaces for `Member`, `Account`, `Loan`, `Transaction`,
> `AuthUser`, `ReportingSummary`, mirrored on both sides.

**Verify:** you and Melkamu agree on every field out loud before either writes logic
against them.

### Task 13 — Double-entry ledger engine (Week 2)
**Depends on:** Jerry's Task 12.

> The `ledger` service — every monetary movement posts as a balanced pair of
> `LedgerEntry` rows in a single atomic transaction, rejected outright if debits ≠
> credits. Route Task 12's deposit/withdrawal through it.

**Verify:** a forced unbalanced posting is rejected, not half-applied.

**Sequencing note:** Jerry's Transactions vertical and Abenezer's Loans vertical
both post through this — merge it before either of their next tasks branches off
`main`.

### Task 15 — Offline-sync infrastructure (Week 3)
**Depends on:** Jerry's Task 14.

> IndexedDB-backed local queue, idempotency keys, a background sync worker that
> drains the queue on reconnect, and server-side ingestion that rejects any conflict
> requiring server-side judgment. Provided as a client library Jerry's Teller Desk
> consumes.

**Verify:** an offline deposit queues, syncs correctly on reconnect, and a forced
duplicate is caught by the idempotency key.

**Sequencing note:** don't start until Jerry's Task 14 has a working online-only
version to build the offline layer under.

### Task 22 — Security & Audit framework (Week 4)
**Depends on:** Task 3.

> Build the full `@Roles(...)` guard against the RBAC matrix, and an `audit-log`
> service recording every state-changing action. Merge before Melkamu, Jerry,
> Abenezer, Biruk, and Liya apply it to their own endpoints.

**Verify:** an unauthorized-role request is rejected before it reaches business
logic, across every endpoint in the matrix.

### Task 27 — End-to-end integration pass (Week 5)
**Coordinates:** whole team.

> Confirm every frontend portal is wired against real endpoints, not leftover
> mocks.

**Verify:** a full walkthrough of each portal touches only real endpoints.

### Task 28 — RLS concurrent tenant load check (Week 5)

> Seed two or three tenants with deliberately overlapping data and confirm RLS
> holds under simultaneous load.

**Verify:** no cross-tenant row appears anywhere, checked against colliding test
data specifically.

### Task 29 — Offline outbox load/edge-case test (Week 5)
**Shared with:** Jerry.

> Simulate repeated mid-session network loss and conflicting offline transactions
> against the same account.

**Verify:** a forced conflict produces a visible reviewable exception, not silent
data loss.

### Task 32 — Deployment runbook & hardening (Week 6)

> Document and rehearse Postgres provisioning, NestJS deploy, Next.js deploy.
> Rotate development credentials.

**Verify:** someone else can follow the runbook without a clarifying question.

### Task 33 — Backup & disaster-recovery rehearsal (Week 6)

> Confirm the backup schedule runs; rehearse a restore before go-live.

**Verify:** a restored backup passes Task 28's RLS check again.

### Task 35 — Final UAT sign-off (Week 6)

> Lead the team through the signed-off use cases one more time against the
> deployed system.

**Verify:** the sign-off sheet is signed and every use case was re-run against
production.

---

## Melkamu — Member Management

Registration, profile, search, manual ID fields (`nationalId` + `idType`), and
legacy data onboarding — backend and frontend, end to end.

### Task 5 — Shared type contracts (Week 1)
**Shared with:** Obsan — done together, live.

*(See Obsan's Task 5 above — same task, run once, together.)*

### Task 6 — Frontend app scaffold (Week 1)
**Depends on:** nothing (parallel with Obsan's Task 1).

> Set up Next.js (App Router, TypeScript). Create route groups for four portals —
> `(super-admin)`, `(tenant-admin)`, `(teller)`, `(member)` — plus
> `/src/components`, `/src/types`, `/src/lib/api-client`. Add placeholder pages.

**Verify:** app builds; each portal route renders a placeholder without crashing.

### Task 8 — Member Management API (Week 2)
**Depends on:** Task 1–5.

> `POST /api/members`, `GET /api/members/{id}`, `GET /api/members?search=`,
> `PATCH /api/members/{id}`.

**Verify:** all four endpoints work, correctly scoped to a single tenant.

### Task 9 — ~~Fayda National ID verification~~ **CANCELLED** (Week 2)
See [`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1. Manual ID capture only — no live verify.

### Task 10 — Member registration & profile UI (Week 2)
**Depends on:** Task 8, Liya's Task 7.

> Registration form and profile/search screen for the Tenant Admin and Teller
> portals. Capture `nationalId` + `idType` as ordinary fields — no verification UI.

**Verify:** registering a member end to end works against the real backend.

### Task 11 — Legacy Data Onboarding (Week 2)
**Depends on:** Task 8.

> Backend import/mapping endpoint plus the frontend wizard — schema-mapping step,
> staging/validation preview, commit/reconciliation confirmation.

**Verify:** uploading a sample CSV walks through all steps with per-row validation
errors, not a blanket failure.

### Task 30 — Test case matrix & UAT session (Week 5)
**Shared with:** Biruk.

> Draft a test case matrix tracing each FR in the SDS to a test case, and run a
> structured UAT session with the team playing SACCO staff roles.

**Verify:** every FR has a row with a recorded pass/fail.

---

## Jerry — Transactions / Teller Desk

Savings & shares, deposits and withdrawals, and the Teller Desk UI — backend and
frontend, end to end.

### Task 12 — Savings & Shares backend (Week 2)
**Depends on:** Task 1–5.

> Deposits, withdrawals, share purchases, automatic balance calculation, and the
> savings-multiplier loan-eligibility ceiling. Include the held-balance mechanism
> for pledged collateral.

**Verify:** a deposit then withdrawal produces the correct balance; held amounts
are excluded from the balance endpoint.

### Task 14 — Teller Desk UI (Week 3)
**Depends on:** Task 12, Liya's Task 7.

> Deposit, withdrawal, and loan repayment flows with optimistic UI updates — show
> the result immediately, reconcile against the server response, roll back visibly
> on rejection.

**Verify:** a deposit reflects instantly, reconciles silently on server
confirmation; a rejected transaction rolls back visibly with a clear message.

### Task 29 — Offline outbox load/edge-case test (Week 5)
**Shared with:** Obsan.

> Help simulate repeated network loss and conflicting offline transactions against
> the Teller Desk.

**Verify:** a forced conflict produces a visible reviewable exception on the
device.

---

## Abenezer — Loans & Credit

Loan application, eligibility, guarantors, approval, and disbursement — backend and
frontend, end to end.

### Task 16 — Loan & Credit backend (Week 3)
**Depends on:** Obsan's Task 13.

> Loan application, automated eligibility check (savings multiplier + guarantor
> pledges), approval workflow, disbursement and repayment, posted through the
> ledger service.

**Verify:** a request above the eligibility ceiling is rejected automatically; a
disbursement produces balanced ledger entries.

### Task 17 — Guarantor & collateral logic (Week 3)
**Depends on:** Task 16.

> Guarantor pledge recording, marking pledged amounts as held on the guarantor's
> own savings account.

**Verify:** pledging reduces the guarantor's own withdrawable balance correctly.

### Task 18 — Loan UI (Week 3)
**Depends on:** Task 16, Liya's Task 7.

> Loan application, approval workflow, and status screens across the Teller and
> Admin portals.

**Verify:** a loan submitted through the UI reflects its real approval status end
to end.

### Task 31 — Bug triage & tracking (Week 5)

> Own the defect list from integration testing and UAT — severity, owner, status
> for each.

**Verify:** every logged defect has an owner and a non-blank status by end of week.

---

## Biruk — Admin & Reporting

Super Admin console, Tenant Admin dashboard, and the Document & Reporting engine —
backend and frontend, end to end.

### Task 19 — Super Admin console (Week 4)
**Depends on:** Liya's Task 7, Obsan's Task 4.

> Backend tenant CRUD/provisioning endpoint plus the frontend tenant list and
> provisioning form. This portal operates outside per-tenant RLS scoping — flag
> clearly in the UI whenever an action is platform-level.

**Verify:** the provisioning form submits, creates a real tenant, and shows a clear
success/error state.

### Task 20 — Document & Reporting Engine (Week 4)
**Depends on:** Task 12, 13, 16.

> Statement, loan agreement, receipt, and share certificate generation —
> template-driven, reading from the ledger. Plus aggregate reports (loan
> portfolio, savings summary, trial balance).

**Verify:** a generated statement matches the ledger exactly; the trial balance
sums to zero.

### Task 21 — Tenant Admin dashboard & reporting UI (Week 4)
**Depends on:** Task 19, 20, Liya's Task 7.

> Dashboard layout — member count, account summary, pending approvals — plus the
> report views consuming Task 20's endpoints.

**Verify:** every figure shown matches the backend report exactly.

### Task 30 — Test case matrix & UAT session (Week 5)
**Shared with:** Melkamu.

> Draft the test case matrix and run a structured UAT session with the team
> playing SACCO staff roles.

**Verify:** every FR has a recorded pass/fail result.

---

## Liya — Member Self-Service

Member portal, notifications, and the mobile money webhook contracts — backend and
frontend, end to end. No USSD for MVP.

### Task 7 — Design system & shared UI kit (Week 1)
**Depends on:** Melkamu's Task 6.

> Tailwind + Shadcn setup, design tokens, shared components (data table, form
> field group, status badge, full-figure currency display), and the base portal
> shell/nav with client-side role-based route guarding.

**Verify:** a throwaway page using five shared components renders correctly with no
portal-specific overrides needed.

### Task 23 — Member Self-Service backend (Week 4)
**Depends on:** Task 12, 16.

> Balance, statement request, and loan status endpoints, composing the Member
> Management, Transactions, and Loans verticals rather than owning new business
> logic.

**Verify:** balance and loan status returned match what those verticals record
directly.

### Task 24 — Member Self-Service Portal UI (Week 4)
**Depends on:** Task 23, Task 7.

> Balance view, statement request, loan status, and mocked deposit (C2B) /
> disbursement (B2C) mobile money flow UI — mocked because live gateway
> integration is out of scope this phase.

**Verify:** portal shows correct real balance/loan data; mocked flows show clearly
as "pending confirmation."

### Task 25 — Notification service (Week 4)
**Depends on:** Task 12, 16.

> Email/SMTP wrapper for deposit, withdrawal, loan-approval, and OTP emails —
> substituting for the SMS/WhatsApp gateway this phase.

**Verify:** a deposit triggers a real email to a test inbox within a few seconds.

### Task 26 — Mobile Money webhook contracts (Week 4)
**Depends on:** Task 12, 16.

> Document the webhook contract for mobile money C2B/B2C in the OpenAPI spec —
> mocked only this phase. No USSD session contract ([`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1).

**Verify:** the MoMo webhook spec is complete enough for someone outside the team
to mock against it without a follow-up question.

### Task 34 — Documentation compilation (Week 6)
**Shared with:** whole team (each person writes their own section).

> Compile the admin manual, per-portal user manuals, and final report from each
> person's section.

**Verify:** each section is followable by someone who didn't build that part.

---

## MVP coverage check

| Area | Status |
|---|---|
| Member Mgmt + manual ID fields + legacy onboarding | Covered — Melkamu |
| Savings/Shares + Teller Desk | Covered — Jerry |
| Loans, eligibility, guarantors | Covered — Abenezer |
| Ledger, offline-sync, auth, RLS, RBAC framework | Covered — Obsan |
| Documents, reporting, admin consoles | Covered — Biruk |
| Member portal, notifications, mobile money webhook spec | Covered — Liya |

Nothing is left without an owner. Task ordering in [`TASKS.md`](./TASKS.md)
reflects dependency order (Platform → Member Management/Transactions → Loans →
Admin/Reporting/Member Portal → Integration → Deployment), not the order of
importance.
