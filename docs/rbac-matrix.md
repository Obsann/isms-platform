# RBAC matrix (Task 22)

Enforced by `RolesGuard` reading `@Roles(...)` on each route. A request whose JWT
`role` is not listed is rejected with **403** before the handler runs. `@Public()`
routes (health, login) skip the guard.

This is MVP truth. The SDS table in `SACCO_PROPOSAL.md` (Teller / Loan Officer /
Manager / Sys. Admin / Auditor) is the background source; role names and a few
capabilities differ because of seed roles (D5), Task 10 (tenant-admin registers
members), and Task 14 (teller records loan repayments). No USSD operator and no
Fayda-verifier roles ([`.cursor/rules/decisions.mdc`](../.cursor/rules/decisions.mdc) D1).

## Role map

| SDS name | `RoleName` | Portal | Seeded (D5) |
|---|---|---|---|
| Sys. Admin | `super-admin` | super-admin | platform only (`tenant_id` NULL) |
| Manager | `tenant-admin` | tenant-admin | per tenant |
| Teller | `teller` | teller | per tenant |
| Loan Officer | `loan-officer` | tenant-admin | per tenant |
| (member self-service) | `member` | member | not seeded — Liya Tasks 23–24 |
| Auditor | — | — | **not a system role in MVP**; tenant-admin views the tenant audit log |

`roles_permissions` remains a schema stub for post-MVP per-tenant overrides. MVP
enforcement is the decorator + guard, not a runtime lookup of that table.

## Endpoint matrix

`Yes` = listed in `@Roles(...)`. Blank = 403. Public routes are not in this table.

| Method | Path | super-admin | tenant-admin | teller | loan-officer | member |
|---|---|---|---|---|---|---|
| GET | `/api/auth/me` | Yes | Yes | Yes | Yes | |
| POST | `/api/members` | | Yes | Yes | | |
| GET | `/api/members` | | Yes | Yes | Yes | |
| GET | `/api/members/:id` | | Yes | Yes | Yes | |
| PATCH | `/api/members/:id` | | Yes | Yes | | |
| POST | `/api/members/import/stage` | | Yes | Yes | | |
| POST | `/api/members/import/commit/:stagingId` | | Yes | Yes | | |
| POST | `/api/accounts` | | Yes | Yes | | |
| GET | `/api/accounts/:id` | | Yes | Yes | Yes | Yes |
| POST | `/api/accounts/:id/deposits` | | Yes | Yes | | |
| POST | `/api/accounts/:id/withdrawals` | | Yes | Yes | | |
| POST | `/api/accounts/:id/share-purchases` | | Yes | Yes | | |
| POST | `/api/loans` | | Yes | Yes | Yes | |
| GET | `/api/loans/member/:memberId` | | Yes | Yes | Yes | |
| GET | `/api/loans/:id` | | Yes | Yes | Yes | |
| GET | `/api/loans/:id/eligibility` | | Yes | Yes | Yes | |
| PATCH | `/api/loans/:id/approve` | | Yes | | Yes | |
| POST | `/api/loans/:id/disburse` | | Yes | | Yes | |
| POST | `/api/loans/:id/repayments` | | Yes | Yes | Yes | |
| POST | `/api/loans/:id/guarantors` | | Yes | | Yes | |
| GET | `/api/loans/:id/guarantors` | | Yes | Yes | Yes | |
| POST | `/api/loans/guarantors/:pledgeId/release` | | Yes | | Yes | |
| GET | `/api/audit-logs` | Yes | Yes | | | |

High-value vs standard loan approval is a **business rule** inside Loans (Task 16),
not a second role. Both `loan-officer` and `tenant-admin` may call `PATCH .../approve`.

Tenant-admin may post deposits/withdrawals because Task 12 already declared that on
the savings controller and tenant-admin operates the same cash desk in small SACCOs.
The SDS Manager row said No; we keep the shipped decorator.

Super-admin is **not** on day-to-day tenant endpoints. Platform provisioning is
Task 19; RLS already hides other tenants' rows from a `tenant_id` NULL session.

## Applying `@Roles` on new endpoints

Task 22 ships the guard. Each vertical owner adds `@Roles(...)` on endpoints they
add after this merges (git-workflow merge-order note). Undecorated authenticated
routes are **denied** (fail closed) so a forgotten decorator cannot ship as
"any authenticated role".

## Audit log

Every successful `POST` / `PUT` / `PATCH` / `DELETE` (except `@Public()`) is
appended to `audit_logs` with actor (JWT `staff_id`) and timestamp, in the same
request transaction as the business write. Entries are never updated or deleted.
`GET /api/audit-logs` is read-only for tenant-admin and super-admin.
