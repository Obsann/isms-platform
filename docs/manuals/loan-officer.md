# Loans & Credit manual

## Roles

| Role | Can |
|---|---|
| Teller, loan officer, tenant admin | Apply for a loan on behalf of a member |
| Loan officer, tenant admin | Approve **standard** loans (at or below threshold) |
| Tenant admin (manager) | Approve **high-value** loans above `LOAN_APPROVAL_THRESHOLD` (default 50,000.00 ETB) |
| Loan officer, tenant admin | Disburse to a savings account; record guarantor pledges |
| Teller | Record repayments only |

A loan officer who tries to approve a high-value application gets **403**.

## Eligibility

Ceiling = sum of the member's **available** savings (`balance - heldAmount`) ×
`SAVINGS_LOAN_MULTIPLIER` (default 3). Guarantor pledges **do not** raise the
borrower's ceiling. They hold funds on the guarantor's own savings account.

## Flow

1. **Apply** — member, amount, term (months), purpose. Status starts `pending`.
2. **Guarantors** (optional) — pledge amount on a guarantor's savings account; that
   amount becomes held.
3. **Approve or reject** — note is stored and can be shown to the member.
4. **Disburse** — pick the member's savings account. Posts a balanced ledger pair.
5. **Repay** — teller or officer records principal. When fully paid, status becomes
   `repaid`. Held collateral is released when the loan is fully repaid or cancelled
   (Task 17/12 hold primitives).

## Screens

Teller and Tenant Admin **Loans** pages use the real `/api/loans` endpoints. Toasts
confirm success or show the API error. There is no offline demo fallback.
