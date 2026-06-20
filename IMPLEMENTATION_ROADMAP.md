# Paisa Mart Integration — 6-Week Implementation Roadmap

**Status:** Ready to implement  
**Total effort:** 6 weeks (3 backend engineers, 2 mobile engineers, 1 QA)  
**Budget:** 0 (existing team + APIs)  
**Go-live target:** Week 7

---

## Week-by-Week Breakdown

### **WEEK 1: Foundation & Database**

#### Backend
- [ ] Setup Prisma + PostgreSQL schema
- [ ] Implement encryption for PII (Aadhar, PAN, bank details)
- [ ] Create wallet service (`creditWallet`, `debitWallet`, `getBalance`)
- [ ] Create transaction ledger table
- [ ] Add KYC verification routes (Aadhar, PAN, Bank)
- [ ] Setup error handling middleware
- [ ] Add logging (request/response)

**Deliverables:**
- ✅ Database schema (13 models)
- ✅ Wallet endpoints (`GET /balance`, `GET /history`)
- ✅ KYC status endpoint (`GET /kyc/status`)
- ✅ 3 KYC verification endpoints (`POST /kyc/*/verify`)

**Testing:**
- Unit tests for wallet functions
- Integration tests hitting real DB
- Postman collection for manual testing

---

### **WEEK 2: Payout Engine + Mobile Wallet Screen**

#### Backend
- [ ] Integrate Razorpay Payouts API
- [ ] Implement payout request endpoint (`POST /payouts/request`)
- [ ] Add payout status tracking (`GET /payouts/:id`, `GET /payouts/history`)
- [ ] Setup webhook receiver for Razorpay callbacks
- [ ] Implement balance locking mechanism (prevent double-payout)
- [ ] Add rate limiting (prevent abuse)
- [ ] Error handling for failed payouts (retry logic)

#### Mobile
- [ ] Create Wallet screen (`/wallet`)
  - Display balance (available, locked, total)
  - Show transaction history (earn, payout, refund)
- [ ] Create Withdraw screen (`/withdraw`)
  - Amount input with presets
  - Confirm & submit
  - Success/failure feedback
- [ ] Update Home screen
  - Add balance widget
  - Add "Withdraw" button
  - Show KYC status badge

**Deliverables:**
- ✅ Payout API endpoints (2 new)
- ✅ Razorpay integration tested
- ✅ 2 new mobile screens
- ✅ Real payout flow works

**Partner milestone:** Partners can now request actual payouts

---

### **WEEK 3: KYC Verification (Full Flow)**

#### Backend
- [ ] Integrate KYC provider (Cashfree or DigiLocker)
- [ ] Implement Aadhar verification API call
- [ ] Implement PAN verification API call
- [ ] Implement Bank account verification (IFSC + RBI registry)
- [ ] Auto-update `kycStatus` when all verifications pass
- [ ] Add rejection reason tracking
- [ ] Webhook for partner when KYC approved

#### Mobile
- [ ] Create KYC Verification screen (`/kyc-verification`)
  - Aadhar input & verification
  - PAN input & verification
  - Bank account details & verification
  - Status tracker (shows progress)
- [ ] Update Home screen
  - KYC status indicator (✓ Complete / ⚠ Pending)
  - Link to KYC verification

**Deliverables:**
- ✅ 3 KYC provider integrations
- ✅ Full verification flow tested with real Aadhar/PAN
- ✅ Mobile KYC screen (production-ready)
- ✅ Users can now withdraw (requires KYC approval)

**Partner milestone:** Partners see users completing KYC quickly

---

### **WEEK 4: Recharge & Bill Payment**

#### Backend
- [ ] Integrate BillDesk or Razorpay Invoicing API
- [ ] Implement recharge initiation (`POST /recharge/initiate`)
- [ ] Add biller list endpoint (`GET /recharge/billers?state=AP&type=electricity`)
- [ ] Implement status check (`GET /recharge/status/:txnId`)
- [ ] Add recharge history endpoint
- [ ] Webhook for successful recharge

#### Mobile
- [ ] Create Recharge screen (`/recharge`)
  - Select biller (state → type → specific biller)
  - Enter reference number (bill ID)
  - Enter amount
  - Payment confirmation
- [ ] Add Recharge button to Home screen

**Deliverables:**
- ✅ Recharge API endpoints (3 new)
- ✅ 20+ billers supported (electricity, water, mobile)
- ✅ Mobile recharge screen (production-ready)
- ✅ Real recharge transactions

**Partner milestone:** Partners now have 2nd revenue stream (recharge commissions)

---

### **WEEK 5: Travel Bookings + Admin Dashboard**

#### Backend
- [ ] Integrate Amadeus (flights) or Skyscanner API
- [ ] Integrate Booking.com API (hotels)
- [ ] Implement flight search (`GET /travel/flights/search`)
- [ ] Implement flight booking (`POST /travel/flights/book`)
- [ ] Implement hotel search & booking
- [ ] Admin dashboard endpoints:
  - `GET /admin/dashboard` (KPIs: users, KYC%, payouts, volumes)
  - `GET /admin/users?filter=kyc_pending` (user list)
  - `GET /admin/payouts?status=failed` (failed payouts)
  - `GET /admin/settlements?period=monthly` (settlement reports)
- [ ] Webhooks for partner operations

#### Mobile
- [ ] Create Travel screen (`/travel`)
  - Flight search (departure, arrival, date, passengers)
  - Hotel search (city, dates, guests)
  - Booking confirmation
- [ ] Add Travel button to Home screen

**Deliverables:**
- ✅ Travel API endpoints (4 new)
- ✅ Admin dashboard endpoints (4 new)
- ✅ Mobile travel screen
- ✅ Real flight & hotel bookings

**Partner milestone:** Partners see full platform (payout + recharge + travel)

---

### **WEEK 6: Testing, Documentation, Launch Prep**

#### QA & Testing
- [ ] End-to-end testing (signup → KYC → earn → payout)
- [ ] Load testing (can handle 1000 req/min?)
- [ ] Security testing (no SQL injection, XSS, etc)
- [ ] Compliance audit (PCI-DSS, RBI guidelines)
- [ ] Cross-device testing (iOS + Android, different screen sizes)
- [ ] Error scenario testing (network down, API fails, etc)

#### Documentation
- [ ] OpenAPI/Swagger docs (auto-generate)
- [ ] Postman collection
- [ ] Mobile SDK docs (if white-labeling)
- [ ] Webhook signature verification guide
- [ ] Error codes reference
- [ ] Partner onboarding guide

#### Deployment
- [ ] Setup staging environment (mirror of production)
- [ ] Setup monitoring (Sentry, DataDog, or equivalent)
- [ ] Setup alerts (payout failures, API errors, downtime)
- [ ] Setup status page (uptime dashboard for partners)
- [ ] Prepare runbook (common issues + fixes)
- [ ] Train support team

#### Marketing Prep
- [ ] Record demo video (5 min overview)
- [ ] Create partner FAQ
- [ ] Setup partner portal (API keys, docs, support)
- [ ] Reach out to integration partners

**Deliverables:**
- ✅ Zero critical bugs
- ✅ 99.9% uptime test
- ✅ All documentation ready
- ✅ Partner portal live
- ✅ Support team trained

---

## Phase Completion Milestones

### End of Week 1
```
Partners can: Create account, verify KYC status, view balance
```

### End of Week 2
```
Partners can: Request actual payouts to real bank accounts
```

### End of Week 3
```
Partners can: Onboard users with full KYC verification
```

### End of Week 4
```
Partners can: Enable recharge revenue stream
```

### End of Week 5
```
Partners can: Enable travel revenue stream + monitor operations
```

### End of Week 6
```
Partners can: Go live with full integration
```

---

## Daily Standup Template

Every day at 10am (30 min):

**Each engineer reports:**
1. What did I finish yesterday?
2. What am I working on today?
3. Am I blocked?

**Weekly sync (Friday 4pm):**
1. Are we on track for week's milestone?
2. What blockers need escalation?
3. Next week's priorities?

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Razorpay API delays | Low | High | Have Cashfree as fallback |
| KYC provider downtime | Low | Medium | Implement manual review queue |
| Database corruption | Very low | Critical | Daily backups + replication |
| Partner dissatisfaction | Medium | High | Weekly partner sync calls |
| Security breach | Low | Critical | Third-party penetration test |
| Performance issues | Medium | High | Load testing weekly |

---

## Resource Allocation

### Backend (2-3 engineers)
- **Week 1:** Schema + wallet (1 eng), KYC routes (1 eng)
- **Week 2-3:** Payouts + KYC provider (1 eng), Testing (1 eng)
- **Week 4-5:** Recharge + Travel (1 eng), Admin dashboard (1 eng)
- **Week 6:** Testing + deployment (1 eng)

### Mobile (1-2 engineers)
- **Week 1:** Prep environment, setup UI components
- **Week 2-3:** Wallet + KYC screens (1 eng), Testing (1 eng)
- **Week 4-5:** Recharge + Travel screens, Integrations
- **Week 6:** Polish + testing

### QA (1 engineer)
- **Week 1-5:** Daily regression testing, bug reporting
- **Week 6:** Full test cycle, security audit

### DevOps (0.5 engineer)
- **Week 1:** Database setup, backups
- **Week 6:** Deployment, monitoring, alerts

---

## Success Criteria (Week 6)

### Technical
- [ ] All APIs documented (OpenAPI spec)
- [ ] 0 critical bugs
- [ ] 99.9% uptime measured
- [ ] < 500ms latency (p95)
- [ ] All endpoints tested

### Financial
- [ ] Payout success rate > 99%
- [ ] KYC approval rate > 90%
- [ ] Recharge success rate > 95%

### Partner
- [ ] 5+ partners in UAT
- [ ] 0 partner blockers
- [ ] Ready for production launch

---

## Post-Launch Plan (Week 7+)

### Week 7: Partner Onboarding
- [ ] Sign first 3 partners
- [ ] Setup dedicated support channel
- [ ] Monitor metrics closely

### Week 8-12: Scale & Optimize
- [ ] Monitor partner feedback
- [ ] Optimize API performance
- [ ] Add features based on partner requests
- [ ] Scale infrastructure as needed

---

## Critical Dependencies

❌ **Blocker:** Partner API credentials not available
→ **Mitigation:** Get test credentials early (Week 0)

❌ **Blocker:** Database performance degrades
→ **Mitigation:** Add indexes, implement caching

❌ **Blocker:** KYC provider API changes
→ **Mitigation:** Have fallback provider

---

## Budget Estimate

| Item | Cost | Notes |
|------|------|-------|
| Razorpay Payouts | ₹0 | Spread covered by merchant fees |
| Cashfree KYC | ₹50-100/KYC | ~₹10-20L for 1M users |
| BillDesk Integration | ₹0 | Built-in to Razorpay |
| Amadeus API | ₹5-10k/month | Flight data |
| Booking.com API | ₹0 | Commission-based |
| Database | ₹30-50k/month | PostgreSQL on cloud |
| Monitoring | ₹10-20k/month | Sentry, DataDog |
| **Total Monthly** | **₹50-100k** | Scales with volume |

---

## Go-Live Checklist (Final)

### 24 Hours Before Launch
- [ ] Database backup confirmed
- [ ] Monitoring alerts tested
- [ ] Support team on standby
- [ ] Partner portals up
- [ ] Documentation live
- [ ] Status page operational

### Launch Time
- [ ] Announce to partners
- [ ] Monitor error rates (< 1%)
- [ ] Monitor latency (< 500ms p95)
- [ ] Monitor payout success (> 99%)

### 24 Hours After Launch
- [ ] Partner feedback collected
- [ ] Any critical issues resolved
- [ ] Metrics reviewed

### 1 Week After Launch
- [ ] Partner retrospective
- [ ] Performance review
- [ ] Plan next features

---

## Success Looks Like

**For your team:**
✅ Deployed to production with 0 downtime  
✅ Partners testing integrations  
✅ Real money flowing through payouts  
✅ Users withdrawing earnings daily  

**For partners:**
✅ Can integrate in < 2 weeks  
✅ Payouts reliable & fast  
✅ KYC automated & accurate  
✅ Multiple revenue streams  

**For users:**
✅ Can earn, verify identity, withdraw  
✅ Fast & frictionless  
✅ Trusted brand (40L partners already here)  
✅ No surprises (transparent fees)  

---

**Document Status:** Implementation-ready  
**Created:** June 20, 2026  
**Last updated:** June 20, 2026

Next step: Review with team and start Week 1 immediately.
