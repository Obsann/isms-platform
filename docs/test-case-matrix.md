# Task 30 — Test case matrix & structured UAT

**Owners:** Melkamu + Biruk  
**Date of technical dry-run:** 2026-08-28  
**Codebase:** `origin/main` @ `f5d0273`  
**Verify (from `docs/TASKS.md`):** every functional requirement has a row with a recorded pass/fail.

This is the internship UAT pack. Functional requirement (FR) text is taken from
`docs/SACCO_PROPOSAL.md` § Functional Requirements Specification. **MVP truth is
`.cursor/rules/decisions.mdc`**, not the SDS: live Fayda and all USSD are out of
scope (D1); mobile money is contract + mock only (D1); loan ceiling is available
savings × `SAVINGS_LOAN_MULTIPLIER` (D3); seed roles are super-admin / tenant-admin
/ teller / loan-officer (D5). There is no SDS `FR-6.2`.

---

## How to read Result

| Result | Meaning |
|---|---|
| **PASS** | Met for internship MVP. Evidence from code, unit tests, or a live API check. |
| **FAIL** | Still in MVP scope and not met. Logged as a defect for Task 31 (Abenezer). |
| **N/A** | Explicitly out of MVP (D1). Row kept so every SDS FR is traced. |

**Staff UAT** is a separate column. The 2026-08-28 run is a **technical dry-run**.
The team session (roles below) still needs to be executed and signed.

---

## Seed logins (D5)

Same password for all: `DevPassword!123`

| Actor in this UAT | Seed role | Tenant code | Email | Lands on |
|---|---|---|---|---|
| Super Admin | `super-admin` | `platform` | `superadmin@platform.dev` | Super Admin portal |
| Manager / Tenant Admin | `tenant-admin` | `tenant-a` | `admin@tenant-a.dev` | Tenant Admin portal |
| Teller | `teller` | `tenant-a` | `teller@tenant-a.dev` | Teller portal |
| Loan Officer | `loan-officer` | `tenant-a` | `loan-officer@tenant-a.dev` | Tenant Admin portal |
| Cross-tenant check | `teller` | `tenant-b` | `teller@tenant-b.dev` | Teller portal (Almaz only) |

Do **not** test member search as Super Admin: there is no tenant, so RLS returns zero rows.

CSV sample for import: `frontend/public/samples/legacy-members-sample.csv`  
(or `http://localhost:3000/samples/legacy-members-sample.csv` while the frontend is running).

---

## Summary matrix (every SDS FR)

| ID | SDS FR | MVP? | Test case (one-line) | UAT actor | Technical result | Staff UAT |
|---|---|---|---|---|---|---|
| TC-1.1 | FR-1.1 Fayda live verify before create | Out (D1, Task 9 cancelled) | Confirm registration does **not** call Fayda and is not blocked on ID | Teller | **N/A** | Not run |
| TC-1.2 | FR-1.2 Reject duplicate Fayda ID | Out as Fayda (D1). Typed `nationalId` is not unique | Register two members with the same `nationalId` | Teller | **N/A** (Fayda). Gap: duplicate typed IDs allowed — D-30-09 | Not run |
| TC-1.3 | FR-1.3 Search / update / retrieve by number, ID, or name | In | Search MEM-10001, Abebe, FIN-1001; GET by id; PATCH name | Teller / Tenant Admin | **PASS** (API). Edit UI missing — D-30-08 | Not run |
| TC-2.1 | FR-2.1 Deposit/withdrawal as balanced ledger pair | In | Deposit then withdraw; postings go through `LedgerService` | Teller | **PASS** | Not run |
| TC-2.2 | FR-2.2 Eligibility = qualifying savings × multiplier | In (D3) | Ceiling = Σ available savings × `SAVINGS_LOAN_MULTIPLIER` (default 3) | Loan Officer | **PASS** | Not run |
| TC-2.3 | FR-2.3 No withdrawal below zero or below held collateral | In | Withdraw more than `availableBalance`; hold then withdraw | Teller | **PASS** | Not run |
| TC-3.1 | FR-3.1 Auto eligibility vs ceiling **plus guarantor** | Partial | Apply within ceiling (pass); over ceiling (reject); guarantor does not raise ceiling | Loan Officer | **FAIL** | Not run |
| TC-3.2 | FR-3.2 High-value → Manager; else Loan Officer | In (SDS) | Apply above/below a threshold; wrong role rejected | Loan Officer / Manager | **FAIL** | Not run |
| TC-3.3 | FR-3.3 Disburse/repay atomic balanced pair; unbalanced rejected | In | Disburse/repay via ledger; unit test rejects unbalanced posting | Loan Officer | **PASS** | Not run |
| TC-4.1 | FR-4.1 Statement, loan agreement, receipt, share cert from **ledger** | In | Generate each document; figures match ledger | Tenant Admin | **FAIL** | Not run |
| TC-4.2 | FR-4.2 Trial balance, savings summary, loan portfolio from ledger | In | Reports aggregate `ledger_entries` for a period | Tenant Admin | **FAIL** | Not run |
| TC-5.1 | FR-5.1 Authenticate staff; authorize each endpoint vs RBAC matrix | In | Login required; SDS matrix enforced on REST | All staff | **FAIL** | Not run |
| TC-5.2 | FR-5.2 Immutable audit log of create/update/approve/disburse | In | After a deposit and an approval, query audit log | Auditor / Tenant Admin | **FAIL** | Not run |
| TC-6.1 | FR-6.1 `*812#` USSD menu | Out (D1: no USSD, not even OpenAPI) | Confirm no USSD session API | — | **N/A** | Not run |
| TC-6.3 | FR-6.3 Live MoMo C2B/B2C; post ledger only after webhook | Out live (D1). Contract in Task 26 | OpenAPI webhook spec exists; no live gateway post | Liya / reviewer | **N/A** (live). Contract **PASS** | Not run |
| TC-6.4 | FR-6.4 Email via Nodemailer (deposit, withdrawal, loan approval, OTP) | In (Task 25) | Deposit queues `deposit-posted`; SMTP skip if unset | Teller | **PASS** (wired). Live inbox needs SMTP env | Not run |
| TC-7.1 | FR-7.1 `tenant_id` + Postgres RLS, not caller `WHERE` | In | Tenant-a teller must not see tenant-b members | Teller A vs B | **PASS** (schema + guard). Isolation **unit test missing** — D-30-07 | Not run |
| TC-7.2 | FR-7.2 Super Admin provisions tenant without restart / standing ops access | In (Task 19) | POST `/api/platform/tenants`; Super Admin has no member list | Super Admin | **PASS** | Not run |

**Dry-run totals:** 8 PASS · 6 FAIL · 4 N/A (FR-1.1, FR-1.2 Fayda, FR-6.1, FR-6.3 live).  
FR-6.3 contract is recorded PASS in the notes, not double-counted as a seventh FAIL.

---

## Detailed cases

### TC-1.1 — FR-1.1 Fayda verification

**Steps:** Open Teller → Members → Register. Enter `nationalId` + `idType`. Submit with no Fayda sandbox.

**Expected (MVP D1):** Profile is created. No outbound Fayda call. No `VerificationResult` field.

**Evidence:** `CreateMemberDto` stores `nationalId` / `idType` only. Task 9 cancelled.

**Result:** **N/A**

### TC-1.2 — FR-1.2 Duplicate ID

**Steps:** Register MEM-A with national ID `FIN-DUP-1`. Register MEM-B with the same ID.

**Expected (SDS):** Second create rejected. **Expected (D1):** ID is a typed field; live Fayda uniqueness is out.

**Evidence:** Unique index is `(tenant_id, member_number)` only (`idx_members_tenant_national_id` is non-unique).

**Result:** **N/A** for Fayda. **Defect D-30-09** if product still wants unique typed IDs.

### TC-1.3 — FR-1.3 Search, update, retrieve

**Steps:**

1. `GET /api/members?search=MEM-10001` and `?search=Abebe` and `?search=FIN-1001`.
2. `GET /api/members/{id}`.
3. `PATCH /api/members/{id}` with a last-name change.
4. UI: Teller Members list + View profile.

**Expected:** Authorized staff can find by number, name, or national ID; retrieve one profile; update via API.

**Evidence:** `MemberService.search` ILIKE includes `memberNumber`, names, `nationalId`. `update` exists. Directory UI is view-only (no edit form).

**Result:** **PASS** (API). **D-30-08** — no edit UI.

### TC-2.1 — FR-2.1 Balanced deposit / withdrawal

**Steps:** Teller Desk: deposit on a savings account, then withdraw a smaller amount.

**Expected:** Each movement posts a debit and a matching credit through `LedgerService`. Account balance matches.

**Evidence:** `SavingsSharesService` calls `ledger.postDeposit` / `postWithdrawal`. `assertBalanced` unit tests pass (2026-08-28, 4/4).

**Result:** **PASS**

### TC-2.2 — FR-2.2 Savings-multiplier ceiling

**Steps:** Member with known available savings. `GET` eligibility or apply for a loan.

**Expected:** Ceiling = sum of (`balance - heldAmount`) × env multiplier (default `3`).

**Evidence:** `SavingsSharesService.getLoanEligibilityCeiling`; D3.

**Result:** **PASS**

### TC-2.3 — FR-2.3 Withdrawal vs available / holds

**Steps:** Withdraw `availableBalance + 0.01`. Place a hold, then withdraw into the held amount.

**Expected:** `UnprocessableEntityException` / insufficient available funds. Held funds not withdrawable.

**Evidence:** `LedgerService.postMemberMovement` compares amount to `balance - heldAmount`. `holdFunds` same check.

**Result:** **PASS**

### TC-3.1 — FR-3.1 Eligibility including guarantor collateral

**Steps:** Apply at or under savings ceiling (accepted). Apply over ceiling (rejected). Pledge a guarantor and retry over savings ceiling.

**Expected (SDS):** Ceiling + pledged guarantor collateral.

**Evidence:** `LoanService.checkEligibility` uses savings ceiling only. Guarantor pledges hold funds; they do not increase `maxAmount`.

**Result:** **FAIL** — **D-30-01**

### TC-3.2 — FR-3.2 Approval routing by amount / role

**Steps:** Submit a “small” and a “large” loan. Approve as teller, loan-officer, and tenant-admin.

**Expected (SDS):** Above threshold → Manager only; at/below → Loan Officer. Teller cannot approve.

**Evidence:** Seed has no `manager` role (D5). `PATCH /api/loans/:id/approve` has no `@Roles`. Any authenticated tenant user can approve.

**Result:** **FAIL** — **D-30-02**

### TC-3.3 — FR-3.3 Disbursement / repayment balanced; unbalanced rejected

**Steps:** Approve, disburse to savings, record repayment. Force an unbalanced posting in unit test.

**Expected:** Disburse/repay go through the ledger in one transaction. Unbalanced posting rejected, nothing written.

**Evidence:** `LoanService.disburse` / `recordRepayment` use `LedgerService`. `ledger.service.spec.ts` — 4 passed, 2026-08-28.

**Result:** **PASS**

### TC-4.1 — FR-4.1 Documents from current ledger

**Steps:** Request member statement, loan agreement, receipt, share certificate.

**Expected:** Template filled from live ledger / loan / txn rows.

**Evidence:** `DocumentsReportingService.generateMemberStatement` (and agreement/receipt/certificate) emit **hard-coded HTML** (e.g. `ETB 50,000.00`, sample txns). `DocumentsReportingModule` imports `documents-reporting.controller.ts`, which is **not in git** on `main` — API module cannot boot from a clean clone without a local stub.

**Result:** **FAIL** — **D-30-03**, **D-30-04**

### TC-4.2 — FR-4.2 Period reports from ledger aggregates

**Steps:** Trial balance, savings summary, loan portfolio for a date range.

**Expected:** Aggregated from ledger, no manual re-entry. Trial balance debits = credits.

**Evidence:** `getSavingsSummary` / `getLoanPortfolio` return **fixed** figures (`memberCount: 1248`, etc.). `getTrialBalance` may query `ledger_entries` but falls back to a canned snapshot. Same missing controller as TC-4.1.

**Result:** **FAIL** — **D-30-03**, **D-30-04**

### TC-5.1 — FR-5.1 Auth + RBAC matrix on every REST call

**Steps:** Call a protected route without JWT (401). Login. Call deposit as loan-officer vs teller per SDS matrix.

**Expected:** JWT on every staff route. SDS matrix: teller registers/posts cash; loan officer approves standard loans; manager high-value; auditor reports/audit; sysadmin staff; teller cannot approve loans.

**Evidence:** Global `JwtAuthGuard` + `TenantContextGuard`. Login + `PortalGuard` work. `@Roles` exists on savings routes only. `RolesGuard` is **TODO Task 22**. Loan and member controllers have no role decorator. SDS “Manager” / “Auditor” / “Sys. Admin” are not seed roles.

**Result:** **FAIL** — **D-30-05** (auth itself works; matrix not enforced)

### TC-5.2 — FR-5.2 Immutable audit log

**Steps:** Create a member, post a deposit, approve a loan. Query audit log.

**Expected:** Append-only rows with actor + timestamp. No update/delete.

**Evidence:** `AuditLogService.record` / `query` throw `NotImplementedException` (Task 22). No `audit_logs` table in migrations.

**Result:** **FAIL** — **D-30-06**

### TC-6.1 — FR-6.1 USSD `*812#`

**Expected (MVP D1):** No USSD channel, including no session OpenAPI.

**Evidence:** D1; Task 26 README states web-only self-service.

**Result:** **N/A**

### TC-6.3 — FR-6.3 Mobile money live webhooks

**Expected (MVP D1):** Documented contract + UI mock; no live gateway; no ledger post on request alone.

**Evidence:** `docs/openapi/momo-webhooks.yaml` + `docs/openapi/README.md` (Task 26, merged PR #37).

**Result:** **N/A** (live). Contract documented (**PASS** for internship substitute).

### TC-6.4 — FR-6.4 SMTP notifications

**Steps:** Configure SMTP (or leave empty). Post a deposit. Confirm queue of `deposit-posted` (and withdrawal / loan-approved). OTP template exists.

**Expected:** Nodemailer wrapper; skip with a warning if SMTP unset; no crash.

**Evidence:** `NotificationService` + wiring in `SavingsSharesService` / `LoanService`. Specs present. Empty `SMTP_HOST` logs skip (observed in local boot).

**Result:** **PASS** (implementation). Live Gmail verify still needs App Password + `SMTP_OVERRIDE_TO`.

### TC-7.1 — FR-7.1 RLS isolation

**Steps:** Login tenant-a teller; list members (Abebe / Tigist / Dawit). Login tenant-b; list (Almaz only). Confirm no `WHERE tenant_id = ?` in member service.

**Expected:** FORCE RLS on tenant tables; session `app.tenant_id` from guard.

**Evidence:** Initial + later migrations `ENABLE` / `FORCE ROW LEVEL SECURITY`. `TenantContextService` sets `app.tenant_id`. Member queries use `tenantContext.repo`. D6 asked for an RLS isolation **unit test** — none found (`*.spec.ts` has no RLS case).

**Result:** **PASS** (design). **D-30-07** — missing required isolation unit test.

### TC-7.2 — FR-7.2 Super Admin provisions tenant

**Steps:** Super Admin → tenants → create. Confirm new `tenant_id` without restart. Super Admin must **not** see that tenant’s member directory.

**Expected:** Provision API; Super Admin is platform-scoped (`tenant_id` NULL).

**Evidence:** `POST /api/platform/tenants` (`TenantsController`). Super Admin portal has tenant CRUD, not member registration.

**Result:** **PASS**

---

## Extra UAT scripts (not numbered FRs)

These are SDS **use cases** needed for a staff walkthrough. They do not add FRs.

| ID | Use case | Actor | Path | Notes |
|---|---|---|---|---|
| UC-LOGIN | Login & portal routing (Task 4) | All | `/login` | Four seed roles land on the mapped portal |
| UC-IMPORT | Legacy CSV onboarding (Task 11) | Teller / Tenant Admin | `/teller/members/import` | Sample CSV: 3 valid, 1 bad `dateOfBirth` |
| UC-SHARES | Manage share capital | Teller | Teller Desk share purchase | Through ledger `postSharePurchase` |
| UC-MEMBER-SS | Member web self-service (Task 23) | Member | `/api/members/:id/balance` etc. | Web substitute for USSD (D1) |
| UC-NOTIFY | Email on deposit (Task 25 verify) | Teller | Deposit | Real inbox only if SMTP configured |

---

## Structured UAT session

**Facilitators:** Melkamu (matrix), Biruk (admin/reporting cases)  
**Coordinator:** Obsan (Task 27 integration — use the same build)  
**Length:** ~90 minutes  
**Build:** latest `main`, `docker compose up -d`, `backend` `npm run start:dev`, `frontend` `npm run dev`

### Cast (team plays SACCO staff)

| Person | Plays | Login |
|---|---|---|
| Obsan | Super Admin | `platform` / `superadmin@platform.dev` |
| Biruk | Tenant Admin (Manager stand-in) | `tenant-a` / `admin@tenant-a.dev` |
| Melkamu | Teller (members + import) | `tenant-a` / `teller@tenant-a.dev` |
| Jerry | Teller (desk: deposit / withdraw) | same teller, or second browser |
| Abenezer | Loan Officer | `tenant-a` / `loan-officer@tenant-a.dev` |
| Liya | Member self-service reviewer | API or member portal |

### Agenda

1. **10 min** — Login round-robin (UC-LOGIN). Confirm wrong portal is blocked.
2. **15 min** — Melkamu: register (with DOB), search, view, CSV import (UC-IMPORT).
3. **15 min** — Jerry: deposit, withdraw, over-available withdraw (TC-2.1, TC-2.3).
4. **15 min** — Abenezer: eligibility, apply, approve, disburse (TC-2.2, TC-3.x). Record TC-3.1 / TC-3.2 fails if still present.
5. **10 min** — Biruk: reports / documents (TC-4.x). Expect FAIL until Task 20/21 complete.
6. **10 min** — Obsan: provision a throwaway tenant (TC-7.2); tenant-b isolation (TC-7.1).
7. **10 min** — Liya: notification / MoMo contract walkthrough (TC-6.4, TC-6.3).
8. **5 min** — Sign the sheet. Copy new defects to Abenezer (Task 31).

### Session rules

- Record **Pass / Fail / Blocked** on the Staff UAT column, not a verbal “looks fine”.
- Failures get a defect id (`D-30-xx` or a new `D-UAT-xx`), owner, and severity.
- Do not mark N/A FRs as Fail.
- Currency on screen must be full figures (e.g. `45,230.00 ETB`), never `45.2K`.

---

## Sign-off sheet (fill at the live session)

| FR / TC | Technical dry-run (2026-08-28) | Staff UAT (date: ______) | Tester initials | Notes |
|---|---|---|---|---|
| TC-1.1 | N/A | | | |
| TC-1.2 | N/A | | | |
| TC-1.3 | PASS | | | |
| TC-2.1 | PASS | | | |
| TC-2.2 | PASS | | | |
| TC-2.3 | PASS | | | |
| TC-3.1 | FAIL | | | |
| TC-3.2 | FAIL | | | |
| TC-3.3 | PASS | | | |
| TC-4.1 | FAIL | | | |
| TC-4.2 | FAIL | | | |
| TC-5.1 | FAIL | | | |
| TC-5.2 | FAIL | | | |
| TC-6.1 | N/A | | | |
| TC-6.3 | N/A (live) | | | |
| TC-6.4 | PASS | | | |
| TC-7.1 | PASS | | | |
| TC-7.2 | PASS | | | |

UAT accepted for internship MVP when every **in-scope** row is Pass **or** an accepted defect with owner (Task 31). N/A rows stay N/A.

**Facilitators:** _____________  **Date:** _____________  
**Obsan (Task 27 build):** _____________

---

## Defects for Task 31 (Abenezer)

Opened from the 2026-08-28 dry-run. Status must not stay blank.

| ID | Severity | FR / TC | Summary | Suggested owner | Status |
|---|---|---|---|---|---|
| D-30-01 | Medium | TC-3.1 | Eligibility ignores pledged guarantor collateral | Abenezer | Open |
| D-30-02 | High | TC-3.2 | No amount threshold; no Manager role; any JWT can approve | Abenezer + Obsan (RBAC) | Open |
| D-30-03 | High | TC-4.1 / TC-4.2 | Documents/reports use canned figures, not ledger | Biruk | Open |
| D-30-04 | High | TC-4.1 / TC-4.2 | `DocumentsReportingModule` imports a controller that is not in the repo | Biruk | Open |
| D-30-05 | High | TC-5.1 | `RolesGuard` not implemented (Task 22); SDS matrix not on REST | Obsan | Open |
| D-30-06 | High | TC-5.2 | Audit log service throws NotImplemented; no `audit_logs` table | Obsan | Open |
| D-30-07 | Medium | TC-7.1 | D6 RLS cross-tenant isolation unit test missing | Obsan | Open |
| D-30-08 | Low | TC-1.3 | Member update API exists; directory UI has no edit | Melkamu | Open |
| D-30-09 | Low | TC-1.2 | Duplicate `nationalId` allowed (only member number is unique) | Melkamu | Open |

---

## Evidence index

| Check | Where |
|---|---|
| FR list | `docs/SACCO_PROPOSAL.md` (Member … Multi-Tenancy FRs) |
| MVP deltas | `.cursor/rules/decisions.mdc` D1–D6 |
| Ledger reject unbalanced | `backend/src/ledger/ledger.service.spec.ts` — 4 passed, 2026-08-28 |
| Member API / import | `backend/src/members/` |
| Savings + holds | `backend/src/savings-shares/savings-shares.service.ts`, `ledger.service.ts` |
| Loans | `backend/src/loans/loan.service.ts` |
| Reports | `backend/src/documents-reporting/documents-reporting.service.ts` |
| Audit stub | `backend/src/security-audit/audit-log.service.ts` |
| MoMo contract | `docs/openapi/momo-webhooks.yaml` |
| Notifications | `backend/src/channel-integration/notification.service.ts` |
