# Paisa Mart — Integration Readiness Plan
## Making the App Enterprise-Grade for Financial Partners

**Date:** June 20, 2026  
**Objective:** Transform the app from MVP to **production-ready, fully-featured fintech platform** capable of supporting integration partners.

---

## Executive Summary

Your integration partners require:
1. **Payout Service** - Distribute earnings to users
2. **Recharge & Bill Payment** - Enable utility payments
3. **Travel Bookings** - Flight/hotel integration
4. **KYC Validation** - Aadhar, PAN, Bank Account verification

This plan details **what the app needs** and **how backend enables each integration**.

---

## Critical Gaps Assessment

### Current State
✅ Basic payment flow (VimoPay integration)  
✅ Mobile app scaffold (Expo Router)  
✅ User authentication foundation  
❌ **No payout engine**  
❌ **No KYC verification pipeline**  
❌ **No recharge/utility integration**  
❌ **No travel provider integration**  
❌ **No user wallet system**  
❌ **No transaction history/analytics**  
❌ **No admin dashboard for operations**  

---

## Integration Architecture

### Backend Structure (What Partners Expect)

```
/api/v1/
├── /auth/                      (JWT + session management)
├── /kyc/                       (Aadhar, PAN, Bank Account)
├── /wallet/                    (Balance, history, transfers)
├── /payouts/                   (Distribute earnings)
├── /recharge/                  (Bill payments)
├── /travel/                    (Flights, hotels, bookings)
├── /transactions/              (Ledger, settlement)
├── /webhooks/                  (Partner callbacks)
└── /admin/                     (Operations, monitoring)
```

---

## Phase 1: Foundation (Weeks 1-2)

### 1.1 User Wallet System
**Why:** Partners need to know balances before payout  
**What to build:**
- Wallet table: `user_id, balance, locked_amount, updated_at`
- Endpoints:
  - `GET /api/v1/wallet/balance` → returns `{balance, locked, available}`
  - `POST /api/v1/wallet/transaction` → logs all earn/debit
  - `GET /api/v1/wallet/history` → transaction ledger

**Backend Integration Points:**
```typescript
// When payment succeeds (from callback):
await creditWallet(userId, amount, 'payment_received', {txnId, merchantRef})

// When payout initiated:
await debitWallet(userId, amount, 'payout_initiated', {payoutId})
```

### 1.2 Enhanced User Profile
**Why:** KYC and payouts need detailed user data  
**Fields to add:**
```typescript
// Core identity
- aadhar_number (encrypted)
- pan_number (encrypted)
- bank_account (encrypted)
- ifsc_code

// KYC status tracking
- aadhar_verified: boolean | timestamp
- pan_verified: boolean | timestamp
- bank_account_verified: boolean | timestamp
- kyc_status: 'pending' | 'in_review' | 'approved' | 'rejected'

// Payout readiness
- can_withdraw: boolean (true if all KYC passed)
- payout_bank_account_id: string (reference to verified account)
```

### 1.3 Database Schema (Prisma)
```prisma
model User {
  id String @id @default(cuid())
  phoneNumber String @unique
  email String?
  name String?
  
  // KYC
  aadharNumber String? @encrypted
  panNumber String? @encrypted
  aadharVerified Boolean @default(false)
  panVerified Boolean @default(false)
  kycStatus String @default("pending") // pending|in_review|approved|rejected
  
  // Bank for payouts
  bankAccountNumber String? @encrypted
  bankIfsc String?
  bankAccountVerified Boolean @default(false)
  
  // Wallet
  walletBalance Decimal @default(0)
  walletLocked Decimal @default(0) // for pending payouts
  
  transactions Transaction[]
  payouts Payout[]
  kycSubmissions KycSubmission[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Transaction {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  
  type String // 'earn'|'payout'|'reversal'|'refund'
  amount Decimal
  reason String // 'payment_received'|'payout_initiated'|etc
  referenceId String? // link to payment/payout
  
  balanceBefore Decimal
  balanceAfter Decimal
  
  createdAt DateTime @default(now())
}

model Payout {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  
  amount Decimal
  bankAccountId String
  status String @default("pending") // pending|processing|success|failed
  
  // Gateway response
  payoutGatewayId String?
  gatewayResponse Json?
  
  initiatedAt DateTime @default(now())
  completedAt DateTime?
  updatedAt DateTime @updatedAt
}

model KycSubmission {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  
  type String // 'aadhar'|'pan'|'bank_account'
  documentUrl String
  extractedData Json // parsed OCR/API response
  
  status String @default("pending") // pending|approved|rejected
  rejectionReason String?
  
  submittedAt DateTime @default(now())
  verifiedAt DateTime?
}
```

---

## Phase 2: KYC Verification (Weeks 2-3)

### 2.1 Aadhar Verification
**What partners expect:**
- User submits Aadhar number
- System hits third-party KYC API (e.g., Cashfree, DigiLocker, or custom)
- Returns: Verified ✓ or Rejected with reason
- User data pre-fills from Aadhar (name, DOB)

**API Endpoint:**
```typescript
POST /api/v1/kyc/aadhar/verify
Body: { aadharNumber: string }
Response: {
  status: 'success' | 'failed',
  verified: boolean,
  userData: { name, dob, address }?,
  message: string
}
```

**Backend Flow:**
```typescript
// 1. Validate Aadhar format (12 digits)
// 2. Check if already verified (skip if yes)
// 3. Call KYC provider (Cashfree /kyc/aadhar endpoint)
// 4. Parse response
// 5. If success:
//    - Update user.aadharNumber
//    - Set user.aadharVerified = true
//    - Log in KycSubmission table
// 6. Return verification status
```

### 2.2 PAN Verification
**Similar flow:**
```typescript
POST /api/v1/kyc/pan/verify
Body: { panNumber: string, fullName: string }
Response: { status, verified, userData?, message }
```

### 2.3 Bank Account Verification
**What's needed:**
- IFSC validation (check RBI registry)
- Account holder name matching
- Optional: NACH/Razorpay verification (micro-deposits)

```typescript
POST /api/v1/kyc/bank-account/verify
Body: { accountNumber, ifsc, accountHolderName }
Response: {
  status: 'success' | 'verification_pending' | 'failed',
  verified: boolean,
  bankName: string,
  message: string
}
```

### 2.4 KYC Status Endpoint
**Partners/admins need to check progress:**
```typescript
GET /api/v1/kyc/status
Response: {
  kyc_status: 'pending' | 'in_review' | 'approved' | 'rejected',
  aadhar_verified: boolean,
  pan_verified: boolean,
  bank_account_verified: boolean,
  can_withdraw: boolean
}
```

---

## Phase 3: Payout Engine (Weeks 3-4)

### 3.1 Payout Request
**When user wants to withdraw:**
```typescript
POST /api/v1/payouts/request
Body: {
  amount: number,
  bankAccountId?: string // use default if not provided
}
Response: {
  payoutId: string,
  status: 'pending',
  message: 'Payout initiated'
}
```

**Validation:**
- User must have all KYC approved ✓
- Balance >= amount ✓
- Bank account verified ✓
- Amount within limits (min ₹100, max ₹50k per txn) ✓
- Daily limit checks ✓

### 3.2 Payout Processing
**Backend flow (async worker):**
```typescript
// 1. Fetch pending payouts
// 2. For each payout:
//    - Format bank transfer payload
//    - Call payout gateway (e.g., Razorpay, Cashfree, ICICI-eBO)
//    - Store gateway reference ID
//    - Lock amount in wallet
// 3. Update status to 'processing'
// 4. Listen for webhook callbacks
// 5. On success: unlock, debit wallet, mark complete
// 6. On failure: unlock, keep in pending for retry
```

### 3.3 Payout Status Tracking
```typescript
GET /api/v1/payouts/:payoutId
Response: {
  payoutId,
  amount,
  status: 'pending' | 'processing' | 'success' | 'failed',
  bankAccount: { masked, ifsc },
  initiatedAt,
  completedAt?,
  failureReason?
}

GET /api/v1/payouts/history
Response: {
  payouts: [ {...}, ... ],
  totalEarned: number,
  totalPaidOut: number
}
```

### 3.4 Payout Gateway Selection
**Recommendation:** Use **Razorpay Payouts** (most reliable in India)
```typescript
// .env
PAYOUT_GATEWAY=razorpay
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_ACCOUNT_NUMBER=...

// Usage
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const payout = await razorpay.payouts.create({
  account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
  amount: payoutRecord.amount * 100, // in paise
  currency: 'INR',
  mode: 'NEFT', // or IMPS for faster
  purpose: 'payout',
  recipient: {
    account_number: bankAccount.accountNumber,
    ifsc: bankAccount.ifsc,
    name: user.name
  },
  reference_id: payout.id
});
```

---

## Phase 4: Recharge & Bill Payment (Week 4)

### 4.1 Recharge Provider Integration
**Partners need:** Electricity, water, mobile top-ups

**Recommended providers:**
- **Billdesk** (₹0 - ∞, all billers)
- **Razorpay Invoicing** (₹1 - ₹5L)
- **Custom integration** with state power boards

### 4.2 API Design
```typescript
POST /api/v1/recharge/initiate
Body: {
  type: 'electricity' | 'water' | 'mobile' | 'broadband',
  billerId: string, // e.g., 'AP_GENCO' for Andhra Pradesh
  consumerRef: string, // bill reference number
  amount: number
}
Response: {
  transactionId: string,
  status: 'pending',
  provider: string,
  redirectUrl?: string // if redirect-based
}

GET /api/v1/recharge/status/:transactionId
Response: {
  transactionId,
  status: 'success' | 'failed' | 'pending',
  billDetails: { billAmount, dueDate, lastPayment }?,
  amount: number
}
```

### 4.3 Supported Billers
```typescript
const BILLERS = {
  electricity: [
    { id: 'AP_GENCO', name: 'APGENCO (Andhra Pradesh)', states: ['AP'] },
    { id: 'TN_TNEB', name: 'TNEB (Tamil Nadu)', states: ['TN'] },
    // ... 20+ more states
  ],
  water: [
    { id: 'MUM_MCGM', name: 'MCGM (Mumbai)', states: ['MH'] },
    // ...
  ],
  mobile: [
    { id: 'JIO', name: 'Jio', operators: ['prepaid', 'postpaid'] },
    { id: 'AIRTEL', name: 'Airtel', operators: ['prepaid', 'postpaid'] },
    // ...
  ]
}

GET /api/v1/recharge/billers?type=electricity&state=AP
Response: { billers: [...] }
```

---

## Phase 5: Travel Bookings (Week 5)

### 5.1 Flight Booking
**What partners expect:**
- Search flights (Amadeus, Skyscanner API)
- Book with user's payment
- Real-time seat inventory

**API Design:**
```typescript
GET /api/v1/travel/flights/search
Query: { 
  departure, arrival, date, 
  passengers: number 
}
Response: {
  flights: [
    { 
      id, 
      airline, 
      departure, 
      arrival, 
      duration, 
      price, 
      seats_available 
    }
  ]
}

POST /api/v1/travel/flights/book
Body: {
  flightId: string,
  passengers: [{ name, dob, email }],
  paymentMethod: 'wallet' | 'card'
}
Response: {
  bookingId: string,
  ticketNumber: string,
  status: 'confirmed',
  itinerary: {...}
}
```

**Recommended provider:** **Amadeus API** (most flight data in India)

### 5.2 Hotel Booking
**Similar flow:**
```typescript
GET /api/v1/travel/hotels/search
Query: { city, checkin, checkout, guests }

POST /api/v1/travel/hotels/book
Body: { hotelId, roomId, checkin, checkout, guests }
```

**Recommended provider:** **Booking.com API** or **Agoda API**

---

## Phase 6: Admin Dashboard & Monitoring (Week 5-6)

### 6.1 Admin Panel Requirements
Partners expect visibility into:
- User counts, KYC completion rates
- Daily/weekly/monthly payouts
- Transaction volumes
- Settlement reports

**Endpoints:**
```typescript
GET /api/v1/admin/dashboard
Response: {
  users: { total, active_7d, new_today },
  kyc: { pending, approved, rejected },
  payouts: { today, thisWeek, total, pending_amount },
  recharge: { today, volume },
  travel: { bookings_today, revenue }
}

GET /api/v1/admin/users?status=kyc_pending
Response: {
  users: [ { id, name, phone, kyc_status, joined_date } ]
}

GET /api/v1/admin/payouts?status=pending
Response: {
  payouts: [ { id, userId, amount, initiatedAt } ]
}

GET /api/v1/admin/settlements?period=monthly
Response: {
  period: 'Jun 2026',
  totalEarned: 1000000,
  totalPaidOut: 950000,
  balance: 50000
}
```

### 6.2 Operations Alerts
Backend should send webhook alerts:
```typescript
// When payout fails
POST partners.webhook.url/events
Body: {
  event: 'payout.failed',
  payoutId, 
  reason, 
  timestamp,
  action_required: true
}

// When KYC rejected
POST partners.webhook.url/events
Body: {
  event: 'kyc.rejected',
  userId,
  type: 'aadhar',
  reason,
  timestamp,
  user_action_required: true
}
```

---

## Mobile App Requirements

### Home Screen Checklist
- [ ] User profile card (shows name, balance, KYC status)
- [ ] Quick action buttons:
  - Earn (existing)
  - Withdraw (NEW)
  - Recharge (NEW)
  - Book Travel (NEW)
- [ ] Balance widget
- [ ] Recent transactions

### New Screens Needed
1. **Wallet Screen** (`/wallet`)
   - Current balance
   - Transaction history
   - Payout button

2. **KYC Verification** (`/kyc-verification`)
   - Aadhar upload/verify
   - PAN upload/verify
   - Bank account details
   - Status tracker

3. **Payout Flow** (`/withdraw`)
   - Select bank account
   - Enter amount
   - Confirm
   - Success/failure screen

4. **Recharge** (`/recharge`)
   - Select biller type
   - Enter reference number
   - Amount
   - Payment confirmation

5. **Travel** (`/travel`)
   - Flight search
   - Hotel search
   - Booking confirmation

### Mobile State Management
Update Redux/Context store:
```typescript
{
  user: { 
    balance, 
    kycStatus, 
    bankAccounts, 
    canWithdraw 
  },
  wallet: { 
    transactions, 
    pendingPayouts 
  },
  kyc: { 
    status, 
    verifications 
  }
}
```

---

## Implementation Roadmap

| Week | Deliverable | Backend | Mobile | Testing |
|------|-------------|---------|--------|---------|
| 1-2 | Wallet & KYC | Schema, auth, KYC APIs | Wallet screen, KYC forms | Unit tests |
| 3-4 | Payout Engine | Razorpay integration, webhooks | Withdrawal flow | E2E tests |
| 4 | Recharge | Provider integration | Recharge screen | Partner UAT |
| 5 | Travel | Amadeus/booking APIs | Travel search/book | Partner UAT |
| 5-6 | Admin Dashboard | Admin endpoints, webhooks | Basic monitoring | Security audit |

---

## Critical Success Factors

### Backend Checklist
- [ ] All APIs use `/api/v1/` prefix
- [ ] Zod validation on every endpoint
- [ ] Encrypted storage for PII (Aadhar, PAN, bank details)
- [ ] Comprehensive error handling (no 500 errors to clients)
- [ ] Request/response logging for debugging
- [ ] Rate limiting (prevent abuse)
- [ ] Database indexes on `userId`, `status`, timestamps
- [ ] Health check endpoint (`GET /health` with dependency checks)

### Security Checklist
- [ ] JWT tokens with 1-hour expiry
- [ ] Refresh token rotation
- [ ] No sensitive data in logs
- [ ] HTTPS only in production
- [ ] CORS properly configured (whitelist partner domains)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] Rate limiting on auth endpoints
- [ ] Password hashing (bcrypt, not plain)

### Testing Checklist
- [ ] Unit tests for business logic (wallet, payouts, KYC)
- [ ] Integration tests hitting real DB
- [ ] E2E tests for critical flows (signup → KYC → payout)
- [ ] Load testing (can handle partner traffic spikes?)
- [ ] Security testing (penetration test before launch)

### Partner Onboarding
- [ ] API documentation (Postman/OpenAPI)
- [ ] Sandbox environment with test credentials
- [ ] Sample request/response payloads
- [ ] Webhook signing and verification guide
- [ ] Error code reference
- [ ] SLA documentation (uptime, latency targets)

---

## Success Metrics (For Partners)

Once complete, partners will see:
✅ User accounts with verified identity  
✅ Ready-to-payout balances  
✅ Fast, reliable payout processing  
✅ Additional revenue streams (recharge, travel)  
✅ Operational dashboards  
✅ Professional API documentation  
✅ 99.9% uptime SLA  

---

## Next Steps (Immediate)

1. **Review this plan** with partners (1 day)
2. **Setup Prisma + Database** (1 day)
3. **Implement Phase 1** (Wallet + KYC schema) (2 days)
4. **Implement Phase 2** (KYC verification) (3 days)
5. **Implement Phase 3** (Payout engine) (4 days)
6. **Partner UAT** (5 days)

**Total: 3 weeks to MVP → production-ready**

---

## Questions for Partners

Before final implementation, confirm:
1. Which payout gateway to use? (Razorpay, Cashfree, ICICI?)
2. Which KYC providers? (Cashfree, DigiLocker, custom?)
3. Which recharge billers to support first?
4. Which travel APIs? (Amadeus, Skyscanner, Booking.com?)
5. SLA requirements? (uptime %, latency targets)
6. Compliance: Which regulations? (PCI-DSS, KYC norms, RBI guidelines?)

---

**Document Version:** 1.0  
**Last Updated:** June 20, 2026  
**Status:** Ready for implementation
