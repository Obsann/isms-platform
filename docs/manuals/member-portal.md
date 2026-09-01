# Member self-service portal

Web only. There is no USSD in MVP.

## Sign in

Seed member for Tenant A (after `npm run seed`):

- Tenant code: `tenant-a`
- Email: `abebe.bikila@tenant-a.dev`
- Password: same shared dev password as staff (`DevPassword!123`)

The portal resolves your member record by email, then calls `/api/members/{your-id}/…`.
You cannot read another member's id (403). Staff register members; there is no
self-registration.

## What you can see

| Page | Source |
|---|---|
| Balance | Live savings and share accounts |
| Statement | Transaction history for your accounts |
| Loans | Your applications and statuses |
| Mobile money | **Mock only** — C2B/B2C stays `pending confirmation`. No money moves. |

## What you cannot do here

- Live Telebirr / M-PESA / CBE Birr (documented in `docs/openapi/`, not connected)
- Register yourself (staff register members)
- Approve loans

Deposit and withdrawal emails (when SMTP is configured) go to the address on your
member profile.
