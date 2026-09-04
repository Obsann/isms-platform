# Mobile Money Webhooks — OpenAPI Contract & Mock Server Guide

**Task 26 — Owner: Liya** | **Status: Contract Documented**

This directory contains the canonical OpenAPI 3.0.3 specification for Mobile Money C2B (Member Deposit) and B2C (Loan Disbursement / Member Withdrawal) webhook integration callbacks across Ethiopian mobile money providers (**Telebirr**, **M-PESA Ethiopia**, **CBE Birr**).

---

## 📌 Architecture Notes & Scope Rules

1. **Chapa is opt-in**: Member savings deposits go through live Chapa (`POST /api/webhooks/chapa`) when `CHAPA_*` is set on the API. B2C withdrawals use Chapa Transfer (`POST /api/channel/chapa/withdrawals/initialize`) and debit savings only after transfer verify. Without keys, initialize returns a mock checkout / mock payout and still will not move savings until mock-confirm + verify. The Telebirr / M-PESA / CBE Birr shapes below remain the generic contract.
2. **Web-Only Self-Service (No USSD)**: Per Decision [D1](../../.cursor/rules/decisions.mdc), self-service functions are strictly web-only. USSD channel contracts are excluded.
3. **Decimal Money Formatting**: Amounts in all webhook payloads are formatted as two-decimal strings (e.g., `"1500.00"` ETB), avoiding binary floating-point rounding errors.

---

## 📡 Webhook Endpoints Summary

### 1. `POST /api/webhooks/momo/c2b` — Customer-to-Business (Member Deposit)
Triggered by the mobile money gateway when a SACCO member deposits funds from their mobile wallet into their savings account.

* **Headers Required**:
  * `X-Signature`: HMAC-SHA256 signature (`sha256=<hash>`)
  * `X-Timestamp`: Unix millisecond timestamp string
  * `X-Idempotency-Key`: Unique provider transaction key
* **Payload Example**:
  ```json
  {
    "providerReference": "TLB-C2B-987654321",
    "provider": "telebirr",
    "memberId": "00000000-0000-0000-0000-000000000001",
    "accountNumber": "SAV-123456-7890",
    "msisdn": "+251911234567",
    "amount": "1500.00",
    "currency": "ETB",
    "status": "COMPLETED",
    "failureReason": null,
    "occurredAt": "2026-08-26T10:30:00.000Z"
  }
  ```

---

### 2. `POST /api/webhooks/chapa` — Chapa C2B / B2C (member savings deposit or payout)

HMAC `x-chapa-signature`. Credits or debits the member's savings through the ledger using `tx_ref` / `reference` as the posting reference. Never trust the unsigned `status` field.

`POST /api/webhooks/chapa/transfer-approval` is the Chapa Transfer approval URL (HMAC). 200 approves the payout; 400 rejects it.

### 3. `POST /api/webhooks/momo/b2c` — Business-to-Customer (Disbursement / Withdrawal)
Triggered by the mobile money gateway when a SACCO loan disbursement or wallet withdrawal is processed to a member's mobile wallet.

* **Headers Required**:
  * `X-Signature`: HMAC-SHA256 signature
  * `X-Timestamp`: Unix millisecond timestamp string
  * `X-Idempotency-Key`: Unique provider transaction key
* **Payload Example**:
  ```json
  {
    "providerReference": "TLB-B2C-123456789",
    "provider": "telebirr",
    "memberId": "00000000-0000-0000-0000-000000000001",
    "loanId": "LN-2026-991823",
    "msisdn": "+251911234567",
    "amount": "5000.00",
    "currency": "ETB",
    "status": "ACCEPTED",
    "failureReason": null,
    "occurredAt": "2026-08-26T10:35:00.000Z"
  }
  ```

---

## 🛠️ How to Run a Mock Server Against This Spec

Anyone outside the team can spin up a live mock API server against [`momo-webhooks.yaml`](./momo-webhooks.yaml) without any additional configuration.

### Option A: Using Prism (CLI Mock Server)

```bash
# 1. Install Stoplight Prism globally or via npx
npx @stoplight/prism-cli mock docs/openapi/momo-webhooks.yaml -p 4010

# 2. Test sending a C2B deposit payload to the local mock server
curl -X POST http://127.0.0.1:4010/webhooks/momo/c2b \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=a8f5f167f44f4964e6c998dee827110c" \
  -H "X-Timestamp: 1771929600000" \
  -H "X-Idempotency-Key: IDEM-C2B-001" \
  -d '{
    "providerReference": "TLB-C2B-987654321",
    "provider": "telebirr",
    "memberId": "00000000-0000-0000-0000-000000000001",
    "accountNumber": "SAV-123456-7890",
    "msisdn": "+251911234567",
    "amount": "1500.00",
    "currency": "ETB",
    "status": "COMPLETED",
    "occurredAt": "2026-08-26T10:30:00.000Z"
  }'
```

### Option B: Using Postman / Swagger UI

1. Open Postman or Swagger Editor (`https://editor.swagger.io/`).
2. Import `docs/openapi/momo-webhooks.yaml`.
3. Use Postman Mock Server to generate realistic responses for C2B and B2C webhooks.
