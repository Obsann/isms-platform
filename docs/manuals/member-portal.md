# Member self-service portal

Web only. There is no USSD in MVP.

## Sign in

Seed member for **Tsehay Sacco** (after `npm run seed`):

- Tenant code: `tenant-a` (login code; display name is Tsehay Sacco)
- Email: `abebe.bikila@tenant-a.dev`
- Password: same shared dev password as staff (`DevPassword!123`)

Tenant B demo member: `almaz.desta@tenant-b.dev` / `tenant-b`.

The portal resolves your member record via `GET /api/self-service/me` (login
email must match the member profile email). `GET /api/member-self/me` is an
alias for the same lookup. Then the UI calls `/api/members/{your-id}/…`.
You cannot read another member's id (403). Staff register members; there is no
self-registration.

## What you can see

| Page | Source |
|---|---|
| Balance | Live savings and share accounts |
| Statement | Transaction history for your accounts |
| Loans | Your applications and statuses |
| Mobile money | **Chapa hosted checkout** — Pay with Chapa opens checkout.chapa.co. Savings credit after verify. Sandbox phone `0900123456` (OTP `12345`). |

Optional dev-only staged C2B/B2C webhook shapes (never ledger-posted) remain in
`mobile_money_staged_requests` after seed — see `POST /api/member-self/momo/stage`
in OpenAPI. The member portal UI uses Chapa, not the staging form.

## What you cannot do here

- Live Telebirr / M-PESA / CBE Birr webhooks (documented in `docs/openapi/`, not connected)
- Wallet B2C withdrawals (use a teller cash withdrawal)
- Register yourself (staff register members)
- Approve loans

Deposit and withdrawal emails (when SMTP is configured) go to the address on your
member profile.
