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
| (member self-service) | `member` | member | per tenant, same email as the `members` row |
| Auditor | — | — | **not a system role in MVP**; tenant-admin views the tenant audit log |

`roles_permissions` remains a schema stub for post-MVP per-tenant overrides. MVP
enforcement is the decorator + guard, not a runtime lookup of that table.

## Endpoint matrix

`Yes` = listed in `@Roles(...)`. Blank = 403. Public routes are not in this table.

| Method | Path | super-admin | tenant-admin | teller | loan-officer | member |
|---|---|---|---|---|---|---|
| GET | `/api/auth/me` | Yes | Yes | Yes | Yes | Yes |
| GET | `/api/self-service/me` | | | | | Yes |
| GET | `/api/channel/chapa/status` | | | | | Yes |
| POST | `/api/channel/chapa/deposits/initialize` | | | | | Yes |
| GET | `/api/channel/chapa/deposits/:txRef` | | | | | Yes |
| POST | `/api/channel/chapa/deposits/:txRef/mock-complete` | | | | | Yes |
| POST | `/api/members` | | Yes | Yes | | |
| GET | `/api/members` | | Yes | Yes | Yes | |
| GET | `/api/members/:id` | | Yes | Yes | Yes | |
| PATCH | `/api/members/:id` | | Yes | Yes | | |
| DELETE | `/api/members/:id` | | Yes | | | |
| POST | `/api/members/import/stage` | | Yes | Yes | | |
| POST | `/api/members/import/commit/:stagingId` | | Yes | Yes | | |
| GET | `/api/members/:id/balance` | | Yes | Yes | Yes | Yes |
| GET | `/api/members/:id/statement` | | Yes | Yes | Yes | Yes |
| GET | `/api/members/:id/loans` | | Yes | Yes | Yes | Yes |
| POST | `/api/accounts` | | Yes | Yes | | |
| GET | `/api/accounts/:id` | | Yes | Yes | Yes | Yes |
| POST | `/api/accounts/:id/deposits` | | Yes | Yes | | |
| POST | `/api/accounts/:id/withdrawals` | | Yes | Yes | | |
| POST | `/api/accounts/:id/share-purchases` | | Yes | Yes | | |
| POST | `/api/loans` | | Yes | Yes | Yes | |
| GET | `/api/loans` | | Yes | Yes | Yes | |
| GET | `/api/loans/member/:memberId` | | Yes | Yes | Yes | |
| GET | `/api/loans/:id` | | Yes | Yes | Yes | |
| GET | `/api/loans/:id/eligibility` | | Yes | Yes | Yes | |
| PATCH | `/api/loans/:id/approve` | | Yes | | Yes | |
| POST | `/api/loans/:id/disburse` | | Yes | | Yes | |
| POST | `/api/loans/:id/repayments` | | Yes | Yes | Yes | |
| POST | `/api/loans/:id/guarantors` | | Yes | | Yes | |
| GET | `/api/loans/:id/guarantors` | | Yes | Yes | Yes | |
| POST | `/api/loans/guarantors/:pledgeId/release` | | Yes | | Yes | |
| GET | `/api/platform/tenants` | Yes | | | | |
| POST | `/api/platform/tenants` | Yes | | | | |
| GET | `/api/platform/tenants/:id` | Yes | | | | |
| PATCH | `/api/platform/tenants/:id` | Yes | | | | |
| DELETE | `/api/platform/tenants/:id` | Yes | | | | |
| GET | `/api/audit-logs` | Yes | Yes | | | |
| GET | `/api/reports/savings-summary` | Yes | Yes | | Yes | |
| GET | `/api/reports/loan-portfolio` | Yes | Yes | | Yes | |
| GET | `/api/reports/trial-balance` | Yes | Yes | | Yes | |
| GET | `/api/reports/recent-transactions` | Yes | Yes | Yes | Yes | |
| GET | `/api/reports/members/:id/statement` | Yes | Yes | Yes | Yes | |
| GET | `/api/reports/loans/:id/agreement` | Yes | Yes | Yes | Yes | |
| GET | `/api/reports/transactions/:id/receipt` | Yes | Yes | Yes | Yes | |
| GET | `/api/reports/members/:id/share-certificate` | Yes | Yes | Yes | Yes | |

High-value vs standard loan approval is a **business rule** inside Loans (Task 16),
not a second role. Both `loan-officer` and `tenant-admin` may call `PATCH .../approve`.

Tenant-admin may post deposits/withdrawals because Task 12 already declared that on
the savings controller and tenant-admin operates the same cash desk in small SACCOs.
The SDS Manager row said No; we keep the shipped decorator.

Super-admin is **not** on day-to-day tenant endpoints, and no tenant role reaches
`/api/platform/tenants` (Task 19). Those routes run outside per-tenant RLS, so the
role check is the only thing standing between a tenant-admin and another SACCO's
provisioning record.

Member self-service (`/api/members/:id/balance|statement|loans`, Task 23) allows
`member` plus staff, since a teller answering a counter question needs the same
read. Object-level auth matches the JWT staff login email to the member row
email — JWT `sub` is `staff_accounts.id`, not `members.id`. Members resolve their
own row with `GET /api/self-service/me` (directory search stays staff-only).
`POST /api/webhooks/chapa` is `@Public()` and authenticated by HMAC, not a role.

## Applying `@Roles` on new endpoints

Task 22 ships the guard. Each vertical owner adds `@Roles(...)` on endpoints they
add after this merges (git-workflow merge-order note). Undecorated authenticated
routes are **denied** (fail closed) so a forgotten decorator cannot ship as
"any authenticated role".

## Re-running the check

The guard and the audit log are runtime behaviour, so unit tests alone do not
prove them. With Postgres up, migrations run, `npm run seed` applied and the API
listening on 4000:

```
powershell -ExecutionPolicy Bypass -File backend/scripts/verify-rbac.ps1
powershell -ExecutionPolicy Bypass -File backend/scripts/verify-audit-log.ps1
```

The first logs in as each seeded role and asserts the allow/deny status codes
above. The second posts a deposit and confirms one audit row appears, that reads
and rejected writes add none. This is the evidence for Task 30's TC-5.1 and
TC-5.2 (defects D-30-05 and D-30-06).

## Audit log

Every successful `POST` / `PUT` / `PATCH` / `DELETE` (except `@Public()`) is
appended to `audit_logs` with actor (JWT `staff_id`) and timestamp, in the same
request transaction as the business write. Entries are never updated or deleted.
`GET /api/audit-logs` is read-only for tenant-admin and super-admin.
