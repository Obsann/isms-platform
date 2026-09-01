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
| Git commit / tag | |
| Environment URL (web) | |
| Environment URL (API) | |
| Date of sign-off session | |
| Deployment runbook followed? | Yes / No |

---

## Use-case re-run (production or staging)

Mark each row after executing against the deployed build — not localhost only.

| FR / TC | Description | Pass | Fail | N/A (MVP out of scope) | Tester | Notes |
|---|---|---|---|---|---|---|
| FR-1.1 | Member registration (manual ID fields) | | | | | |
| FR-2.1 | Deposit / withdrawal via ledger | | | | | |
| FR-3.1 | Loan eligibility ceiling | | | | | |
| FR-3.2 | Loan approval threshold | | | | | |
| FR-4.1 | Statement / document generation | | | | | |
| FR-5.1 | RBAC enforcement | | | | | |
| FR-5.2 | Audit log on state change | | | | | |
| FR-6.3 | MoMo webhook spec documented | | | | | |
| FR-7.1 | RLS tenant isolation | | | | | |
| Task 15 | Offline teller queue + idempotency | | | | | |

---

## Portal smoke (deployed)

| Portal | Login works | Primary action works | Only real API calls | Tester |
|---|---|---|---|---|
| Super Admin | | | | |
| Tenant Admin | | | | |
| Teller Desk | | | | |
| Member | | | | |

---

## Signatures

| Role | Name | Signature | Date |
|---|---|---|---|
| Platform (Obsan) | | | |
| Member Management (Melkamu) | | | |
| Teller / Transactions (Jerry) | | | |
| Loans (Abenezer) | | | |
| Admin / Reporting (Biruk) | | | |
| Member Self-Service (Liya) | | | |
| Product owner / instructor | | | |

**Outcome:** Go-live approved / Not approved — list blocking items below.

Blocking items:

1.
2.
3.
