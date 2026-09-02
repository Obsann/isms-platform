# Tenant Admin manual

## Sign in

- SACCO: **Tsehay Sacco** (seeded). The other demo tenant is **Chereka Sacco**.
- Tenant code: `tenant-a` (or the code Super Admin provisioned). Login still uses `tenant-a` / `tenant-b`, not the display name.
- Email: `admin@tenant-a.dev` on the seed
- Lands on `/tenant-admin/dashboard`

## Dashboard

KPI cards (members, savings, shares, outstanding loans, active borrowers, repayment
rate) come from `GET /api/reports/*`. Amounts display in full, e.g. `45,230.00 ETB`.

- **Pending approvals** lists loans in `pending` status.
- **Recent transactions** lists the latest savings postings for this SACCO.

If a card fails, the banner shows the API message. Use **Refresh metrics**.

## Members

Register and search members under **Members**. Capture `nationalId` and `idType`
(`national_id` | `passport` | `other`) as ordinary fields. There is no live Fayda
check in MVP.

CSV onboarding: **Members → Import**. Map columns, review per-row errors, then commit.
A single bad row does not fail the whole file at the preview step.

## Reports

Open **Reports**:

| Tab | What it is |
|---|---|
| Savings summary | Live savings and share totals |
| Loan portfolio | Outstanding principal (disbursed minus repayments) and defaulted count |
| Trial balance | Debits and credits by GL code; must balance |
| Documents | HTML statement, loan agreement, receipt, share certificate from live rows |

For a statement, use member number `MEM-10001` (or the member UUID). For a receipt,
paste the transaction UUID from the teller posting. Print from the preview.

## Loans

Same loan queue as the loan officer, with manager approval for amounts above
`LOAN_APPROVAL_THRESHOLD` (default `50000.00`).

## Audit log

Tenant Admin can read `GET /api/audit-logs`. Every successful POST/PATCH/DELETE is
recorded with actor and timestamp.
