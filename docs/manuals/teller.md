# Teller Desk manual

## Sign in

- SACCO: **Tsehay Sacco** (seeded). Login code stays `tenant-a`.
- Tenant code: `tenant-a`
- Email: `teller@tenant-a.dev`
- Lands on `/teller/dashboard`, then **Teller Desk** (`/teller/desk`)

## Look up a member

Search by member number, name, or ID. Seed member: `MEM-10001` (Abebe Bikila).

## Deposit / withdrawal / share purchase

1. Select the member's savings (or share) account.
2. Enter the amount as a decimal (`1500.00`), a unique **reference**, and optional narration.
3. Submit. The UI shows the new balance immediately, then confirms against the server.
4. If the server rejects (insufficient available balance, validation, conflict), the
   row rolls back and the error `message` is shown — never a silent success.

**Available balance** is `balance - heldAmount`. Held funds are loan collateral and
cannot be withdrawn.

## Loan repayment

On the desk, record a repayment against a disbursed loan. This posts through the
ledger (principal). Use a unique reference; the same reference with a different
amount is a **sync conflict** (HTTP 409).

## Member directory (`/teller/members`)

Register, search, edit, and change member status in your tenant.

- Use the **status** icon (not trash) to **Set inactive** or **Set active**.
- Inactive members stay on the list; use **Set active** later to restore them.
- **Permanent delete** is tenant-admin only.

## Offline

If the network drops mid-session:

1. The deposit/withdrawal is queued locally (IndexedDB).
2. The feed shows **pending**.
3. On reconnect the queue drains with the same reference (idempotent).
4. A conflict surfaces as **needs review** — do not assume the server "picked a winner".

You cannot approve or disburse loans as teller (403).
