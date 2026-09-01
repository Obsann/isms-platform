# Task 35 — Final UAT sign-off sheet

**Lead:** Obsan  
**Verify:** every use case on the sign-off sheet was re-run against the deployed system and
signed.

Use together with [`test-case-matrix.md`](./test-case-matrix.md) (FR coverage) and
[`integration-pass.md`](./integration-pass.md) (portal wiring).

---

## Build under test

| Field | Value |
|---|---|
| Git commit / tag | `task27-obsan-mvp-finish` |
| Environment URL (web) | http://localhost:3000 |
| Environment URL (API) | http://localhost:4000/api |
| Date of sign-off session | 2026-09-01 (local Docker; production re-run still required) |
| Deployment runbook followed? | Partial — Compose + migrate + seed + API locally, not a public host |

---

## Use-case re-run (production or staging)

Mark each row after executing against the deployed build — not localhost only.

| FR / TC | Description | Pass | Fail | N/A (MVP out of scope) | Tester | Notes |
|---|---|---|---|---|---|---|
| FR-1.1 | Member registration (manual ID fields) | x | | | Obsan | Seed + teller search MEM-10001 |
| FR-2.1 | Deposit / withdrawal via ledger | x | | | Obsan | Audit-log deposit 201; overdraw 422 |
| FR-3.1 | Loan eligibility ceiling | | | | | Unit tests (Task 31); not re-clicked in UI |
| FR-3.2 | Loan approval threshold | x | | | Obsan | Teller cannot approve (403) |
| FR-4.1 | Statement / document generation | x | | | Obsan | Live HTML statement for MEM-10001 |
| FR-5.1 | RBAC enforcement | x | | | Obsan | verify-rbac.ps1 20/20 |
| FR-5.2 | Audit log on state change | x | | | Obsan | verify-audit-log.ps1 |
| FR-6.3 | MoMo webhook spec documented | | | x | | D1 — spec only |
| FR-7.1 | RLS tenant isolation | x | | | Obsan | npm run rls:check |
| Task 15 | Offline teller queue + idempotency | x | | | Obsan | verify-offline-outbox.ps1 5/5 |

---

## Portal smoke (deployed)

| Portal | Login works | Primary action works | Only real API calls | Tester |
|---|---|---|---|---|
| Super Admin | x | API list tenants | x | Obsan |
| Tenant Admin | x | Reports + statement | x | Obsan |
| Teller Desk | x | Search + deposit scripts | x | Obsan |
| Member | x | Own balance; other member 403 | x | Obsan |

---

## Signatures

| Role | Name | Signature | Date |
|---|---|---|---|
| Platform (Obsan) | Obsan | local API/script pass | 2026-09-01 |
| Member Management (Melkamu) | | | |
| Teller / Transactions (Jerry) | | | |
| Loans (Abenezer) | | | |
| Admin / Reporting (Biruk) | | | |
| Member Self-Service (Liya) | | | |
| Product owner / instructor | | | |

**Outcome:** Not approved for production go-live yet.

Blocking items:

1. Follow `docs/deployment-runbook.md` on a real host (Task 32: a second person, without asking Obsan).
2. Re-run this sheet against those URLs and collect the remaining signatures.
3. Team browser click-through of each portal (login → primary action → logout) on localhost or staging.
