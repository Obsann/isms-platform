# ISMS — Recorded decisions

Decisions that code or task plans depend on. Prefer appending here over rewriting
the SDS (`SACCO_PROPOSAL.md`), which remains background design reference.

---

## D1 — MVP drops live Fayda verification and all USSD (2026-08-10)

**Context:** Fayda sandbox/production access and USSD short-code access are not
obtainable in the internship timeline.

**Decision:**
- No outbound Fayda (or other live ID) verification call. No `VerificationResult`
  status in API or UI. Registration is not blocked on ID checks.
- Tellers/admins type an ID number (`nationalId`) and an ID type (`idType`:
  `national_id` | `passport` | `other`). Both are stored fields only.
- No USSD channel at all for MVP — not even an OpenAPI session contract.
  Self-service is web-portal-only.
- Mobile money stays **documented + mocked only** (Task 24 UI mocks; Task 26
  OpenAPI webhook shapes). No live gateway.
- `channel-integration` module is kept for SMTP notifications (Task 25) and
  mobile-money webhook contracts (Task 26). It is not deleted.

**Task plan impact:**
- Week 0 Fayda sandbox test — cancelled.
- Task 9 — cancelled.
- Task 10 — depends on Tasks 8 + 7 only; no inline verification UI.
- Task 26 — mobile money C2B/B2C webhook OpenAPI only.

**SDS note:** FR-1.1 / FR-1.2 (live Fayda verify/reject) and FR-6.1 (USSD) are
out of MVP. Task 30 should trace against this file, not stale SDS text alone.
USSD Gateway and Fayda National ID Service remain SDS external actors for
history only — they are not MVP RBAC roles or endpoints.

---

## D2 — Chart of accounts for MVP (2026-08-10)

**Decision:** Internship MVP does **not** ship a tenant-editable chart-of-accounts
table. Task 13’s ledger service hard-codes the minimal posting pairs:

| Movement | Debit | Credit |
|---|---|---|
| Cash deposit | Teller cash (asset) | Member savings (liability) |
| Cash withdrawal | Member savings (liability) | Teller cash (asset) |
| Share purchase | Teller cash (asset) | Member shares (liability) |
| Loan disbursement | Loan portfolio (asset) | Member savings (liability) |
| Loan repayment (principal) | Member savings (liability) | Loan portfolio (asset) |

Named GL codes / a provisioned CoA table are post-MVP. Offline sync’s SDS mention
of “chart of accounts” means these fixed posting keys if anything is cached.

---

## D3 — Loan eligibility multiplier (2026-08-10)

**Decision:**
- Ceiling = sum of member’s **available** savings balances × multiplier
  (`availableBalance` = `balance - heldAmount`, so pledged collateral does not
  inflate eligibility).
- Multiplier from `SAVINGS_LOAN_MULTIPLIER` env, default `3`.
- Documented in `backend/.env.example`.

---

## D4 — Held-balance release (2026-08-10)

**Decision:**
- Task 12 exposes `holdFunds` / `releaseHold` primitives.
- Task 17 owns calling release when a loan is fully repaid or cancelled.
- Each hold should reference the loan (or pledge) id once Loans lands — do not
  leave orphan holds that only a manual admin call can clear.
- Manual `releaseHold` remains for correction paths only.

---

## D5 — Dev seed roles (2026-08-10)

**Decision:** `npm run seed` provisions, with the same known password for all:

- One platform `super-admin` (`tenant_id` NULL). Platform login (no tenant code)
  is still Task 4 / Task 19 work — the row is seeded so RLS and admin tools have
  something to attach to once that path exists.
- Per seeded tenant: `tenant-admin`, `teller`, `loan-officer`.

This unblocks Task 4’s multi-role login verify for tenant-scoped portals.

---

## D6 — Test policy (internship) (2026-08-10)

**Decision:** Jest stays the runner. Before Week 5 integration, require unit tests
at least for ledger balanced-posting rejection and RLS cross-tenant isolation.
No coverage gate / CI fail threshold yet.
