# Fournisseur CG API — Quickstart

This quickstart gives a concise overview of our REST API conventions, the PawaPay integration, and how to test endpoints locally and in production.

## Base URLs

- Local: `http://localhost:3333/v3`
- Production: `https://api.arkelys.cloud/v3`

## What we integrate

- Mobile Money via PawaPay (Deposits, Payouts, Refunds)
- Provider discovery and active configuration

## Design principles

- Use nouns-based URIs (collections/items). HTTP methods express actions.
- Return standard HTTP status codes. Forward PawaPay auth errors (401/403) when present.
- On unknown errors, we return:

```json
{
  "failureReason": {
    "failureCode": "UNKNOWN_ERROR",
    "failureMessage": "Unable to process request due to an unknown problem."
  }
}
```

## Environment

- `PAWAPAY_BASE_URL` (sandbox/live)
- `PAWAPAY_API_TOKEN` (server-side)

You do not send Authorization headers to our API; we proxy to PawaPay using the server token.

## Resources

All paths below are relative to `/v3`.

- Deposits
  - `POST /pawapay/deposits/request` — initiate a deposit
  - `GET /pawapay/deposits/{depositId}/status` — check status
  - Callbacks
    - `POST /pawapay/callbacks/deposits` — PawaPay → us
    - `POST /pawapay/callbacks/resend/deposit/{depositId}` — request resend (final state only)

- Payouts
  - `POST /pawapay/payouts/request`
  - `GET /pawapay/payouts/{payoutId}/status`
  - Callback: `POST /pawapay/callbacks/payouts`

- Refunds
  - `POST /pawapay/refunds/request`
  - `GET /pawapay/refunds/{refundId}/status`
  - Callback: `POST /pawapay/callbacks/refunds`

- Toolkit
  - `GET /pawapay/availability`
  - `GET /pawapay/providers?country=COG&operationType=DEPOSIT|PAYOUT`
  - `GET /pawapay/active-conf?country=COG&operationType=DEPOSIT|PAYOUT`

## Quick tests (cURL)

Replace IDs and fields accordingly.

- Create deposit

```bash
curl -X POST http://localhost:3333/v3/pawapay/deposits/request \
  -H "Content-Type: application/json" \
  -d '{
    "depositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
    "amount": "15",
    "currency": "ZMW",
    "payer": {
      "type": "MMO",
      "accountDetails": {
        "phoneNumber": "260763456789",
        "provider": "MTN_MOMO_ZMB"
      }
    },
    "clientReferenceId": "INV-123456",
    "customerMessage": "Top up"
  }'
```

- Check deposit status

```bash
curl -s "http://localhost:3333/v3/pawapay/deposits/f4401bd2-1568-4140-bf2d-eb77d2b2b639/status"
```

- Resend deposit callback

```bash
curl -X POST "http://localhost:3333/v3/pawapay/callbacks/resend/deposit/f4401bd2-1568-4140-bf2d-eb77d2b2b639"
```

- Create payout

```bash
curl -X POST http://localhost:3333/v3/pawapay/payouts/request \
  -H "Content-Type: application/json" \
  -d '{
    "payoutId": "a9ba0f05-3d4f-4a3a-a343-1b7d70c9c999",
    "amount": "20",
    "currency": "ZMW",
    "recipient": {
      "type": "MSISDN",
      "address": { "value": "260763456789" }
    },
    "clientReferenceId": "PAYOUT-001"
  }'
```

- Check payout status

```bash
curl -s "http://localhost:3333/v3/pawapay/payouts/a9ba0f05-3d4f-4a3a-a343-1b7d70c9c999/status"
```

- Create refund

```bash
curl -X POST http://localhost:3333/v3/pawapay/refunds/request \
  -H "Content-Type: application/json" \
  -d '{
    "refundId": "1f3b9b80-182a-4e97-9f3b-2d3df3b63111",
    "originalDepositId": "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
    "amount": "15",
    "statementDescription": "Customer refund",
    "metadata": [{ "orderId": "ORD-123456789" }]
  }'
```

- Check refund status

```bash
curl -s "http://localhost:3333/v3/pawapay/refunds/1f3b9b80-182a-4e97-9f3b-2d3df3b63111/status"
```

- Providers & configuration

```bash
curl -s "http://localhost:3333/v3/pawapay/providers?country=COG&operationType=DEPOSIT"
curl -s "http://localhost:3333/v3/pawapay/active-conf?country=COG&operationType=PAYOUT"
curl -s "http://localhost:3333/v3/pawapay/availability?country=COG"
```

## Data model & validation (high level)

- IDs are UUIDs: `depositId`, `payoutId`, `refundId`.
- Amounts are strings; currencies use ISO codes (e.g., ZMW, XAF).
- Deposits require `payer.type = "MMO"` with `accountDetails.provider` and `phoneNumber`.
- Payouts support `recipient.type = "MSISDN"` (`address.value`) or `recipient.type = "MMO"` with account details.
- Optional fields include `clientReferenceId`, `customerMessage` (4–22 chars), and `metadata` (array of objects).

## Pagination & filtering (future-proof)

Use `limit` (default 25, max 25) and `offset` (default 0) for listing endpoints and add filters like `country` or `provider`. Keep URIs simple: `GET /resource?limit=25&offset=0&country=COG`.

---

For more details, see the generated OpenAPI in `docs/openapi.json` and `docs/openapi.yaml`, and the routes in `start/routes.ts`.
