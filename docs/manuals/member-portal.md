# Member self-service portal

Web only. There is no USSD in MVP.

## Sign in

Seed member for Tenant A (after `npm run migration:run` and `npm run seed` in `backend/`):

- Tenant code: `tenant-a`
- Email: `abebe.bikila@tenant-a.dev`
- Password: same shared dev password as staff (`DevPassword!123`)

Tenant B demo member: `almaz.desta@tenant-b.dev` / `tenant-b`.

The portal resolves your member record by email, then calls `/api/members/{your-id}/…`.
You cannot read another member's id (403). Staff register members; there is no
self-registration.

## What you can see

| Page | Source |
|---|---|
| Balance | Live savings and share accounts |
| Statement | Transaction history for your accounts |
| Loans | Your applications and statuses |
| Mobile money | **Mock only** — pending C2B/B2C rows in `mobile_money_staged_requests` (see below) |

## Mobile money mocks (shared database seed)

After `npm run migration:run` and `npm run seed` in `backend/`, every developer sees
the same pending wallet requests — not browser `sessionStorage`.

| Login | Tenant | What you should see on Mobile money |
|---|---|---|
| `abebe.bikila@tenant-a.dev` | `tenant-a` | C2B 500.00 ETB (Telebirr) + B2C 10,000.00 ETB disbursement |
| `tigist.worku@tenant-a.dev` | `tenant-a` | C2B 750.00 ETB (M-PESA) |
| `almaz.desta@tenant-b.dev` | `tenant-b` | C2B 2,500.00 ETB (CBE Birr) |

New mocks you stage in the app are saved to the database via
`POST /api/member-self/momo/stage`. Status stays **pending confirmation** — no ledger post.

## What you cannot do here

- Live Telebirr / M-PESA / CBE Birr (documented in `docs/openapi/`, not connected)
- Register yourself (staff register members)
- Approve loans

Deposit and withdrawal emails (when SMTP is configured) go to the address on your
member profile.
