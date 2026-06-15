# VimoPay Payment Gateway Integration

Server-to-server integration with the **VimoPay** payment gateway (Vidual Communications India Pvt. Ltd.).
The backend (`paisa-mart` Hono/Bun app) holds all secrets, talks to VimoPay, and exposes
app-facing endpoints. **Secrets never go in the mobile app.**

- Spec: *Payment Gateway API Specification v1.0.2*
- Sandbox base URL: `https://gateway.vimopay.in` (use **https**, see gotchas)
- Code: [`src/lib/vimopay.ts`](src/lib/vimopay.ts) (client + crypto), [`src/routes/payment.ts`](src/routes/payment.ts) (routes)

---

## Architecture

```
Android app ──► paisa-mart backend (EC2) ──► VimoPay gateway
  (no keys)        holds keys, encrypts          gateway.vimopay.in
      ▲                   ▲
      │                   └── VimoPay POSTs final txn status to our callback
      └── opens paymentUrl in a WebView/Custom Tab; returns via paisamart:// deep link
```

1. App calls `POST /api/payment/create` → backend authorizes with VimoPay, creates the payment, returns a `paymentUrl`.
2. App opens `paymentUrl`; user pays.
3. VimoPay POSTs the final status to our `POST /api/payment/vimopay-callback` (server-to-server).
4. App returns via deep link and/or polls the backend for the stored status.

---

## Encryption (important — the spec's naming is misleading)

Algorithm: **AES-256-GCM**, output = `base64( ciphertext || 16-byte GCM tag )`.

| Role | Value used | NOT |
|------|-----------|-----|
| AES key (32 bytes, UTF-8) | **`secretKey`** | ~~encryptdecryptKey~~ |
| IV / nonce (32 bytes, UTF-8) | **`saltKey`** | ~~a separate "ivKey"~~ |
| Auth header only | `encryptdecryptKey` | — |

> The spec's code samples hard-code `edKey`/`ivKey` belonging to a *sample* partner. For a real
> account the payload key/IV are the account's **secretKey** and **saltKey**. `encryptdecryptKey`
> is only sent as an auth header, it is **not** the AES key.

- Request payloads we send are encrypted and wrapped as `{ "requestBody": "<base64>" }`.
- Response `data` fields (state list, create-payment) are encrypted and must be decrypted.
- **Exception:** the **auth** response `data` is the **opaque Bearer token** — use it as-is, do **not** decrypt it.

---

## VimoPay endpoints used

| Purpose | Method | Path | Notes |
|---------|--------|------|-------|
| Authorize | POST | `/pgapi/api/signature/authorizeuat` | headers: secretKey, saltKey, encryptdecryptKey, userId; needs a body (`{}`) |
| State list | GET | `/masterapi/api/master/statelistuat` | headers: `Authorization: Bearer <token>`, userId |
| Create payment | POST | `/pgapi/api/payment/paymentgatewayuat` | body `{requestBody: <enc>}`; returns encrypted `paymentUrl`, `txnId`, status |

Status codes (`txnStatusCode`): `000` success · `001` failed · `002` pending/in-progress · `003` validation failed · `004` queued.

---

## Our backend endpoints (`/api/payment`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/config` | GET | sanity check — confirms env keys are loaded (no secrets returned) |
| `/auth` | GET | authorize → returns a token preview (debug) |
| `/states` | GET | decrypted state list `[{description, code}, ...]` for the location dropdown |
| `/create` | POST | create a payment; body: `amount, custName, custMobile, email, location` (+ optional `merchantRefId, lat, long, udf1..3`). Returns `{ merchantRefId, data: { paymentUrl, txnId, txnStatus, ... } }` |
| `/vimopay-callback` | POST | gateway → us. Receives plain-JSON txn status; replies with the required ack |

### Create payment — example
```bash
curl -s -X POST http://<host>/api/payment/create -H 'Content-Type: application/json' \
  -d '{"amount":25,"custName":"Nikith","custMobile":"9827886399","email":"n@test.in","location":"AP"}'
# -> { "merchantRefId":"PM...", "data": { "paymentUrl":"https://api.pg.runpaisa.com/processpayment/...",
#      "txnId":"...", "txnStatus":"InProgress", "txnStatusCode":"002", ... } }
```

### Callback contract
VimoPay POSTs **plain JSON** (NOT encrypted) with: `txnStatus, txnStatusCode, txnId, rrn, merchantRefId,
amount, charges, custMobile, custName, email, location, holderName, cardType, cardCategory, cardNetwork,
cardNumber (last 4), responseMessage, udf1..3`.

Our handler must reply with exactly:
```json
{ "successStatus": true, "message": "Success", "responseCode": "000" }
```
> Currently the callback is **log-only** (acks correctly, logs the body). TODO: persist status by
> `merchantRefId`/`txnId` so the app can query the outcome.

---

## Configuration (env — never commit)

`backend/.env` (gitignored):
```
PORT=3000
VIMOPAY_BASE_URL=https://gateway.vimopay.in
VIMOPAY_SECRET_KEY=<secretKey>     # AES key
VIMOPAY_SALT_KEY=<saltKey>         # AES IV
VIMOPAY_ED_KEY=<encryptdecryptKey> # auth header only
VIMOPAY_USER_ID=<userId>
```

---

## Gotchas discovered during integration

1. **Auth path typo in the spec.** Spec says `/pgapi/signature/authorizeuat` → **404**. Correct path is
   `/pgapi/api/signature/authorizeuat` (extra `/api/`).
2. **411 Length Required.** The gateway runs on IIS and rejects a body-less POST. Always send a body
   (auth uses `{}`), which sets `Content-Length`.
3. **Use HTTPS for the gateway.** The `http://` endpoints `307`-redirect to `https://`, and `fetch`
   **drops the `Authorization` header** across the http→https hop → `401`. Set `VIMOPAY_BASE_URL` to https.
4. **Key/IV** = `secretKey`/`saltKey`, not `encryptdecryptKey` (see Encryption section).
5. **Auth `data` is the token**, not an encrypted payload — don't try to decrypt it.

---

## Production TODO

- [ ] **HTTPS for the callback URL.** A raw EC2 IP / `*.amazonaws.com` host can't get a trusted cert —
      use a real domain + Let's Encrypt, then register `https://<domain>/api/payment/vimopay-callback`
      with VimoPay (confirm whether sandbox accepts `http`).
- [ ] **Persist callback** transaction status (by `merchantRefId`/`txnId`) + a `GET /api/payment/status/:ref`.
- [ ] **Signature/verification** of inbound callbacks if VimoPay provides one.
- [ ] **Production credentials** (shared after audit) — swap the sandbox keys.
- [ ] **Mobile app**: call `/create`, open `paymentUrl` in a WebView/Custom Tab, return via `paisamart://`.

---

## Escalation (per spec)
- L1: Pronoy — pronoy.bhattacharya@vidual.in
- L2: Tekchand — tekchand.sharma@vidual.in
