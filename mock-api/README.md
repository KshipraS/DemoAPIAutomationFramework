# Banking API Mock (Full Replica)

Local replica of every endpoint in the real server's `/v3/api-docs` spec —
Authentication, User Management, Accounts, Transactions, Mock UPI, KYC,
Admin, and Reports.

## Run it
```
npm install
node server.js
```
Server listens on port 8080, same as the real one.

## Swagger UI
```
http://localhost:8080/swagger-ui/
```
(Do NOT add `index.html` to the URL — that's a known swagger-ui-express quirk
that serves the wrong default page.)

## Seeded accounts
| Username | Password    | Role         | Notes                              |
|----------|-------------|--------------|-------------------------------------|
| kshipra  | Kshipra123  | ROLE_USER    | Has account `AC100000001`, balance 50000 |
| admin    | Admin123    | ROLE_ADMIN   | Use this for all `/api/admin/*` endpoints |

All tokens are Bearer tokens obtained from `/api/auth/login`.

## Endpoints implemented

**Authentication**
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/forgot-password` — returns real server's current HTTP 500 by default (see below)
- `POST /api/auth/reset-password`

**User Management** (all require `Authorization: Bearer <token>`)
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PATCH /api/users/profile`
- `DELETE /api/users/profile?confirmationCode=<any-string>`
- `PUT /api/users/change-password`

**Accounts** (auth required)
- `POST /api/accounts` — body `{ "accountType": "SAVINGS|CURRENT|SALARY", "branch": "..." }`
- `GET /api/accounts/user` — all accounts owned by the logged-in user
- `GET /api/accounts/{accountNumber}`

**Transactions** (auth required, must own the account or be admin)
- `POST /api/transactions/deposit`
- `POST /api/transactions/withdraw`
- `POST /api/transactions/transfer` — instant transfer
- `POST /api/transactions/transfer/initiate` — returns a `transactionId`, OTP is always `123456`
- `POST /api/transactions/transfer/complete` — body `{ "transactionId", "otp": "123456" }`
- `GET /api/transactions/history?accountNumber=...&page=0&size=10`

**Mock UPI** (auth required)
- `POST /api/upi/verify`
- `POST /api/upi/qr-code/generate`
- `POST /api/upi/payment/initiate`
- `GET /api/upi/payment/status/{transactionRef}`

**KYC** (auth required)
- `POST /api/kyc/upload?documentType=PAN&documentNumber=ABCDE1234F`
- `GET /api/kyc/status`

**Admin** (auth required, must be the `admin` user)
- `GET /api/admin/users?page=0&size=10`
- `GET /api/admin/users/{userId}`
- `PUT /api/admin/users/{userId}/activate`
- `PUT /api/admin/users/{userId}/deactivate`
- `GET /api/admin/accounts?page=0&size=10`
- `PUT /api/admin/accounts/{accountNumber}/freeze?reason=...`
- `PUT /api/admin/accounts/{accountNumber}/unfreeze?reason=...`
- `GET /api/admin/transactions?page=0&size=10`

**Reports** (auth required, must own the account or be admin) — return **real, openable files**
- `GET /api/reports/statement/pdf?accountNumber=AC100000001`
- `GET /api/reports/statement/excel?accountNumber=AC100000001`

## Forgot-password behavior
The real server currently returns HTTP 500 for this endpoint (confirmed from
a real test run — a bug on their end, not your request). This mock matches
that by default. To get the success path instead (and a working
reset-password flow, since a reset token is only generated on success):
```
set MOCK_FORGOT_PASSWORD_OK=1     (Windows)
export MOCK_FORGOT_PASSWORD_OK=1  (Mac/Linux)
node server.js
```

## Example flow: deposit, transfer, statement
```bash
# 1. Login
curl -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d "{\"username\":\"kshipra\",\"password\":\"Kshipra123\"}"
# copy the token from the response

# 2. Deposit
curl -X POST localhost:8080/api/transactions/deposit -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" -d "{\"accountNumber\":\"AC100000001\",\"amount\":1000,\"description\":\"Test deposit\"}"

# 3. Download statement (opens as a real PDF)
curl -o statement.pdf "localhost:8080/api/reports/statement/pdf?accountNumber=AC100000001" \
  -H "Authorization: Bearer <token>"
```

## Notes / limitations
- Everything is built from the real server's OpenAPI spec (`/v3/api-docs`),
  but the spec only documents request/response *shapes* for most endpoints
  as generic `type: object` — meaning exact field names for things like
  admin pagination or UPI responses are my reasonable best guess, not a
  verified match. If a specific test asserts on an exact field name from
  one of these looser endpoints, cross-check against the real server.
- Data resets every time you restart the server (in-memory only).
- `transfer/complete` OTP is hardcoded to `123456` for testability.
- KYC document upload doesn't actually handle file bytes (the real spec's
  multipart schema is unusual — `application/json` with a binary field) —
  it just records the metadata (`documentType`, `documentNumber`).
