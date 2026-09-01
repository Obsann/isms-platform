# ISMS internship MVP — final report

## Product

Integrated SACCO Management System: NestJS API + Next.js portals (Super Admin,
Tenant Admin, Teller, Member) on one Postgres database with tenant RLS.

## What shipped

- Multi-tenant auth (JWT) and fail-closed RBAC (`docs/rbac-matrix.md`)
- Member registration with manual ID fields; CSV onboarding
- Savings/shares deposits and withdrawals through a balanced double-entry ledger
- Loans: eligibility multiplier, approval threshold, guarantor holds, disbursement, repayment
- Teller desk with optimistic UI and an IndexedDB offline outbox + idempotent replay
- Tenant Admin reports and HTML documents generated from live ledger/loan/member rows
- Super Admin tenant provisioning
- Member portal reads (balance, statement, loans) plus mocked mobile-money UI
- SMTP notifications (Nodemailer) for deposit, withdrawal, loan approval, OTP
- Backup sidecar + restore rehearsal that re-ran the RLS check

## Explicitly out of MVP

Recorded in `.cursor/rules/decisions.mdc`:

- No live Fayda (or other ID) verification
- No USSD
- No live mobile-money gateway
- No tenant-editable chart of accounts

## How to run locally

```bash
docker compose up -d
cd backend && cp .env.example .env && npm install && npm run migration:run && npm run seed && npm run start:dev
cd frontend && npm install && npm run dev
```

API: `http://localhost:4000/api` · Web: `http://localhost:3000`

## Verify

```powershell
cd backend
npm test
npm run rls:check
powershell -ExecutionPolicy Bypass -File scripts/verify-rbac.ps1
powershell -ExecutionPolicy Bypass -File scripts/verify-offline-outbox.ps1
```

Portal walkthrough: `docs/integration-pass.md`. Production deploy: `docs/deployment-runbook.md`.

## Residual closeout

Task 35 sign-off must be completed against a **deployed** URL, not only localhost.
Task 32 requires a second person to follow the runbook without asking the original author.
