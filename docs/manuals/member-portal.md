# Member self-service portal

Web only. There is no USSD in MVP.

## Sign in

Seed member for **Tsehay Sacco** (after `npm run seed`):

- Tenant code: `tenant-a` (login code; display name is Tsehay Sacco)
- Email: `abebe.bikila@tenant-a.dev`
- Password: same shared dev password as staff (`DevPassword!123`)

The portal resolves your member record via `GET /api/self-service/me` (login
email must match the member profile email), then calls `/api/members/{your-id}/…`.
You cannot read another member's id (403). Staff register members; there is no
self-registration.

## What you can see

| Page | Source |
|---|---|
| Balance | Live savings and share accounts |
| Statement | Transaction history for your accounts |
| Loans | Your applications and statuses |
| Mobile money | **Chapa hosted checkout** — Pay with Chapa opens checkout.chapa.co. Savings credit after verify. Sandbox phone `0900123456` (OTP `12345`). |

## What you cannot do here

- Live Telebirr / M-PESA / CBE Birr webhooks (documented in `docs/openapi/`, not connected)
- Wallet B2C withdrawals (use a teller cash withdrawal)
- Register yourself (staff register members)
- Approve loans

Deposit and withdrawal emails (when SMTP is configured) go to the address on your
member profile.
