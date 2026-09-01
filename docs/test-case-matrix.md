# ISMS — Test Case Matrix & Defect Triage Log

**Document Version:** 1.0.0  
**Date:** 2026-08-30  
**Authors / Contributors:** Melkamu & Biruk (Task 30 — UAT / Test Matrix), Abenezer (Task 31 — Defect Triage)  
**Scope:** Functional requirements (FR-1.1 through FR-7.2) per `docs/SACCO_PROPOSAL.md` and recorded decisions in `.cursor/rules/decisions.mdc`.

---

## 1. Functional Requirements Test Matrix (Task 30)

| Requirement ID | Module / Area | Test Case Description | Role(s) Tested | Expected Result | Status | Verified In |
|---|---|---|---|---|---|---|
| **FR-1.1** | Member Management | Register member with manual `nationalId` + `idType` (`national_id` / `passport` / `other`) | Teller, Tenant Admin | Profile saved under tenant context; no live Fayda block | **PASS** | `MemberService.create` |
| **FR-1.2** | Member Management | Update member contact information and status | Tenant Admin | Profile updated, RLS scoped | **PASS** | `MemberService.update` |
| **FR-1.3** | Member Management | Search member by member number, name, or National ID | Teller, Loan Officer, Tenant Admin | Scoped search results returned within tenant | **PASS** | `MemberService.search` |
| **FR-2.1** | Savings & Shares | Post deposit and withdrawal as balanced double-entry ledger entries | Teller, Tenant Admin | Exactly 2 balanced `LedgerEntry` rows per txn; debits = credits | **PASS** | `LedgerService.postDeposit` / `postWithdrawal` |
| **FR-2.2** | Savings & Shares | Calculate loan eligibility ceiling as available savings balance × multiplier | System / DI | Ceiling = `(balance - heldAmount) * SAVINGS_LOAN_MULTIPLIER` (default: 3) | **PASS** | `SavingsSharesService.getLoanEligibilityCeiling` |
| **FR-2.3** | Savings & Shares | Prevent withdrawal reducing balance below zero or below held collateral | Teller | Withdrawal exceeding `availableBalance` rejected | **PASS** | `SavingsSharesService.withdraw` |
| **FR-3.1** | Loans & Credit | Preliminary eligibility check compares requested amount against savings-multiplier ceiling | Teller, Loan Officer | If `requestedAmount > ceiling`, application is rejected; guarantor pledges do not raise ceiling | **PASS** | `LoanService.checkEligibility` / `apply` |
| **FR-3.2** | Loans & Credit | Approval threshold routing (high-value loans > threshold to Manager; standard <= threshold to Loan Officer) | Loan Officer, Tenant Admin / Manager | Loans > threshold rejected if attempted by Loan Officer (403); approved when acted on by Manager | **PASS** | `LoanService.decideApproval` |
| **FR-3.3** | Loans & Credit | Atomic balanced ledger posting on loan disbursement and repayment | Loan Officer, Teller | Disbursement credits member account and creates audit record; repayment settles principal | **PASS** | `LoanService.disburse` / `recordRepayment` |
| **FR-4.1** | Documents & Reporting | Generate member statement, loan agreement, receipt from current ledger | Tenant Admin, Teller, Member | Accurate formatted templates populated from ledger data | **PASS** | `DocumentsReportingService` |
| **FR-4.2** | Documents & Reporting | Aggregate financial reports (loan portfolio, savings summary, trial balance) | Tenant Admin, Auditor | Trial balance debits = credits across tenant | **PASS** | `DocumentsReportingService` |
| **FR-5.1** | Security & Audit | REST endpoint authentication via JWT and RBAC matrix enforcement | All Roles | Unauthorized role rejected with 403 Forbidden before business logic executes | **PASS** | `@Roles(...)` / `RolesGuard` |
| **FR-5.2** | Security & Audit | State-changing action logging to audit log | All Staff | Action, actor staffId, tenantId, and timestamp persisted | **PASS** | `AuditLogService` |
| **FR-6.3** | Channel Integration | Mobile money webhook contracts documented for C2B deposits & B2C disbursements | System / Webhook | OpenAPI 3.0 contract and mock server documentation provided | **PASS** | `docs/openapi/momo-webhooks.yaml` |
| **FR-6.4** | Channel Integration | Transactional notifications via Nodemailer SMTP (deposit, withdrawal, loan approval, OTP) | System | Notifications queued; SMTP failure does not alter financial transaction status | **PASS** | `NotificationService` |
| **FR-7.1** | Multi-Tenancy & RLS | PostgreSQL Row-Level Security isolation across all 10 core tables | All Roles | Session variable `app.current_tenant_id` prevents cross-tenant data leakage | **PASS** | `TenantContextGuard` / RLS policies |
| **FR-7.2** | Multi-Tenancy & RLS | Platform Super Admin provisions new SACCO tenant dynamically | Super Admin | Tenant created and initial schema bound without server restart | **PASS** | `TenantsService.create` |

---

## 2. Defect Triage & Tracking Log (Task 31 — Owner: Abenezer)

| Defect ID | Title & Description | Related FR | Severity | Owner | Status | Root Cause & Resolution |
|---|---|---|---|---|---|---|
| **D-30-01** | Eligibility ceiling calculation does not correctly handle ceiling with guarantor pledges | FR-3.1, FR-2.2 | **High** | Abenezer | **Resolved** | **Root Cause:** Ambiguity in preliminary eligibility documentation suggested pledges could add to ceiling. <br/>**Fix:** Confirmed and enforced in `LoanService.checkEligibility` and `apply` that the maximum loan ceiling is strictly calculated as `available savings * multiplier`. Guarantor pledges provide collateral security holds on guarantor accounts (`holdFunds`), but never inflate or raise the borrower's eligibility ceiling. |
| **D-30-02** | Approval threshold rule not enforced; high-value loans not restricted to Manager role | FR-3.2, FR-5.1 | **High** | Abenezer | **Resolved** | **Root Cause:** `LoanService.decideApproval` did not inspect the approver's role against `LOAN_APPROVAL_THRESHOLD`. <br/>**Fix:** Added threshold evaluation (`ConfigService.get('LOAN_APPROVAL_THRESHOLD', '50000.00')`) in `LoanService.decideApproval`. Applications > threshold require Manager (`tenant-admin` / `super-admin`) approval and reject `loan-officer` with `403 Forbidden`. Standard loans (<= threshold) are routed to `loan-officer` or Manager. |
| **D-30-03** | `task18-abenezer-loan-ui` branch contained 7 unmerged commits with offline demo fallbacks | Task 18, Task 27 | **Medium** | Abenezer | **Resolved** | **Root Cause:** Branch had added mock catch fallbacks in `api-client` and `loanApi.ts` for offline testing. <br/>**Fix:** Stripped offline demo fallbacks, rebased cleanly onto latest `main`, and ensured frontend wires directly to real backend API endpoints. |
| **D-30-04** | Missing `@Roles(...)` RBAC decorators across Loan & Credit controller endpoints | FR-5.1, Task 22 | **Medium** | Abenezer | **Resolved** | **Root Cause:** Task 16/17 loan controller endpoints lacked `@Roles` annotations pending Task 22 integration. <br/>**Fix:** Attached `@Roles(...)` across all 11 routes in `LoanController` according to the SACCO RBAC security matrix (`teller`, `loan-officer`, `tenant-admin`, `member`, `super-admin`). |

---

## 3. Summary of Defect Resolutions

* **Total Defects Logged:** 4
* **Total Resolved:** 4
* **Open / Blocked:** 0
* **Verification Method:** Jest automated unit test suites (`loan.service.spec.ts`, `tenants.service.spec.ts`, `ledger.service.spec.ts`, `notification.service.spec.ts`), TypeORM migrations & seeds, and RBAC matrix verification.
