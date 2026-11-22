# Store listing copy — en-US (default listing)

Status: READY FOR OWNER REVIEW. Every claim below was exercised on the Android test build (versionCode 8,
source `d7c8a33` or later, 22 Nov 2026) against an isolated local backend with synthetic data. See
CHECKLIST.md → Runtime verification.

## Audience: customers AND partners (verified across the app, not one screen)

| Evidence | Points to |
|---|---|
| Home/Business/Personal loan forms: "…options for your client" / "your client's…"; Products: "…for your customer"; share card: "message will be sent to your customer"; web landing: "Help your customers. Build your business"; Payout Structure rate card | Partner/agent (DSA) |
| Requirement PDFs are titled "Customer portal" ("Customer can view previously created lead profiles"); service forms: "Submit your contact details… your application"; Earnings shows the "Customer Eligible Payout" | Customer |
| My applications & status and Earnings list only submissions whose applicant mobile number equals the signed-in number (`customerApplications`, `customerEligiblePayouts`) | Self-applicants only |

Conclusion: the app is used by both. Anyone can browse and submit for themselves or for a client, but
**status tracking and payouts work only for applications submitted with the user's own mobile number**.
A partner cannot track a client's lead yet (audit A-08, ownership decision pending). The copy below
therefore makes no claim about tracking clients' leads. The owner must decide the ownership model; if
partner tracking is built later, the copy can say so.

## App name (max 30)

Paisa Mart: Loans & Insurance

(29 characters. Installed label: "Paisa Mart".)

## Short description (max 80)

Find loans, cards & insurance from partner banks, apply and track your status

(77 characters)

## Full description (max 4000)

Paisa Mart helps you find financial products from banks, NBFCs and insurance partners in India and
submit an application, for yourself or on behalf of a customer you are helping.

WHAT YOU CAN DO
• Browse product categories: credit cards, bank accounts, home loans, personal loans, vehicle loans, business loans, insta loans, and health, life and motor insurance.
• See the partner banks and finance companies available in each category.
• Submit an application through a guided form (for example a home loan: name, mobile number, income, existing EMI, loan amount, loan type and city).
• Get a confirmation number for every submission.
• Track applications made with your registered mobile number under "My applications & status", with the current stage updated by the Paisa Mart team.
• See payout amounts approved for your applications under Earnings (shown only after Paisa Mart approval; an approved amount is not a payment confirmation).
• Sign in with your mobile number and a one-time password (OTP), then protect the app with your own 4-digit MPIN.

HOW IT WORKS
1. Sign in with your Indian mobile number and the OTP sent by SMS.
2. Complete your profile.
3. Choose a product and submit the application.
4. The Paisa Mart team reviews each application and works with the partner bank or insurer. Check its stage in the app at any time.

IMPORTANT
• Paisa Mart is a distribution platform. It does not lend money or issue insurance. Loans, cards, accounts and policies are provided by the partner bank, NBFC or insurer, subject to their own eligibility checks, terms and approval.
• Submitting an application does not guarantee approval. Interest rates, fees and repayment terms are set by the partner and shared by that partner before any offer is accepted.
• The app does not hold money: there is no wallet, balance or in-app withdrawal.
• Support is available in the app under Support.

## Screenshots (phone, 1080×2160, in this order)

From `screenshots/`. Genuine Android captures of the test build, synthetic users only. Only the system
status and gesture bars were cropped, to meet Play's 2:1 limit.

1. `01-home-product-categories.png` — Home with product categories and "Approved eligible payouts" (server value).
2. `02-products-partners.png` — Products: partner banks for credit cards.
3. `03-home-loan-application-form.png` — Home loan application form.
4. `04-application-confirmation.png` — Submission confirmation with confirmation number.
5. `05-my-applications-status.png` — My applications & status.
6. `06-earnings-approved-payouts.png` — Earnings: only payout amounts approved by executive and manager (synthetic account).

Remove the two promotional banners currently uploaded as screenshots. Keep `feature-1024x500.jpg` only as the
Feature graphic.

## Owner decisions before pasting (not verifiable from code)

- Ownership model (A-08): should partners track the leads they submit for clients? Until built, keep the copy as above.
- Products shows "Potential commission — Earn up to ₹2,000" per partner and Profile → Payout Structure shows a
  rate card. These are configured business rates, not user balances. The owner must confirm they are accurate
  and current, or remove them before resubmission.
- Google's India personal-loan rules (Financial features declaration) may require naming the partner lenders.
  The owner must confirm the lender list. UNVERIFIED.
- Privacy policy URL in Play Console → App content.
