# Store listing copy — en-US (default listing)

Status: READY FOR OWNER REVIEW. Every claim below was exercised on the Android test build (versionCode 8,
22 Nov 2026) against an isolated local backend with synthetic data. See CHECKLIST.md → Runtime verification.

The app is a **partner/agent app**: users refer customers to financial products and track the leads they
submit. The copy says so. It doesn't claim earnings, wallet, payouts, recharge or travel. Audit A-07
(confirmed again on this build) found that the Earnings tab and notifications show fabricated figures.

## App name (max 30)

Paisa Mart: Loans & Insurance

(29 characters. Installed label: "Paisa Mart".)

## Short description (max 80)

Refer customers to loans, cards & insurance, submit leads and track their status

(80 characters)

## Full description (max 4000)

Paisa Mart is an app for partners and agents who help customers find financial products from banks, NBFCs and insurance partners in India.

WHAT YOU CAN DO
• Browse product categories: credit cards, bank accounts, home loans, personal loans, vehicle loans, business loans, insta loans, gold loans, and health, life and motor insurance.
• See the partner banks and finance companies available in each category.
• Submit a customer's details through a guided application form for the product they need (for example a home loan: name, mobile number, income, existing EMI, loan amount, loan type and city).
• Get a confirmation number for every submission.
• Track submitted applications under "My applications & status", with the current stage updated by the Paisa Mart team.
• Sign in with your mobile number and a one-time password (OTP), then protect the app with your own 4-digit MPIN.

HOW IT WORKS
1. Sign in with your Indian mobile number and the OTP sent by SMS.
2. Complete your profile.
3. Choose a product and submit your customer's application.
4. The Paisa Mart team reviews each lead and works with the partner bank or insurer. Check the stage of every application in the app at any time.

IMPORTANT
• Paisa Mart is a distribution platform. It does not lend money or issue insurance. Loans, cards, accounts and policies are provided by the partner bank, NBFC or insurer, subject to their own eligibility checks, terms and approval.
• Submitting an application does not guarantee approval. Interest rates, fees and repayment terms are set by the partner and shared by that partner before any offer is accepted.
• Support is available in the app under Support.

## Screenshots (phone, 1080×2160, in this order)

From `screenshots/`. Genuine Android captures of the versionCode 8 test build, synthetic user "Asha Test" /
9000000001. Only the system status and gesture bars were cropped, to meet Play's 2:1 limit.

1. `01-home-product-categories.png` — Home with product categories. Earnings shows ₹0.00, the genuine value for a new account.
2. `02-products-partners.png` — Products: partner banks for credit cards.
3. `03-home-loan-application-form.png` — Home loan application form.
4. `04-application-confirmation.png` — Submission confirmation with confirmation number.
5. `05-my-applications-status.png` — My applications & status.

Remove the two promotional banners currently uploaded as screenshots. Keep `feature-1024x500.jpg` only as the
Feature graphic.

## Owner decisions before pasting (not verifiable from code)

- Screenshot 2 shows "Potential commission — Earn up to ₹2,000" per partner. These are configured product figures,
  not user balances, but the owner must confirm they are accurate and current, or remove them from the app first.
- Google's India personal-loan rules (Financial features declaration) may require naming the partner lenders.
  The owner must confirm the lender list. UNVERIFIED.
- Privacy policy URL in Play Console → App content.
