# Paisa Mart - Financial Products Partner App

A mobile app (GroMo clone) that allows partners to earn money by selling financial products like credit cards, loans, insurance, and more. Includes a comprehensive Admin Dashboard for internal operations.

## Features

### Partner App
- Phone number based authentication with OTP verification
- Basic information collection form with salary range selection
- Partner dashboard with earnings overview
- Products catalog with 12 categories
- **Share Card Link Feature** (WhatsApp sharing)
  - Branded product banners
  - Pre-written multilingual message preview (English, Hindi, Telugu)
  - WhatsApp share with tracked referral links
  - T&C for Payout modal with eligibility rules
  - Language selector for message customization
- Learning/Training modules
- Earnings & wallet management with withdrawal functionality
- KYC verification flow
- Bank account management for payouts
- Profile management

### Admin Dashboard
- Secure login with role-based access control
- Executive dashboard with real-time metrics
- Live leads management with filters
- Pipeline/Stage tracker view
- **WhatsApp Lead Capture System** ⭐ NEW
  - Automatic lead capture when customers share via WhatsApp
  - Pre-share micro-form: Loan amount, property type, callback time
  - Anti-spam protection (10-minute rule)
  - Lead status tracking: New -> Contacted -> Qualified -> Converted -> Closed
  - Admin dashboard with filtering and assignment
  - WhatsApp Business Group notifications
  - Export leads to CSV
- **Incentive Management Dashboard**
  - Total Incentives Earned/Paid/Pending
  - User Incentive Ledger with approval workflow
  - Incoming vs Outgoing bank partner reconciliation
  - Export to Excel functionality
- **Payout Management**
  - Track withdrawal requests
  - Process payouts (Initiated -> Processing -> Completed/Failed)
  - Configurable payout settings
- Tasks & follow-ups management
- Outcome analytics
- User management & audit logs
- Export capabilities (Admin only)

## Screens

### Partner Auth Flow
1. **Login Screen** - Phone number input with blue/orange theme
2. **OTP Screen** - 6-digit verification
3. **Basic Info Screen** - Profile completion form with salary ranges:
   - 5 Lakhs to 7 Lakhs
   - 7.5 Lakhs to 10 Lakhs
   - 10 Lakhs to 15 Lakhs
   - 15 Lakhs to 20 Lakhs
   - 20 Lakhs to 30 Lakhs
   - 30 Lakhs and Above

### Partner Main App (Tabs)
1. **Home** - Dashboard with earnings, quick actions (12 categories)
2. **Products** - Browse financial products by category
3. **Learn** - Training modules and certification
4. **Earnings** - Wallet, transactions, withdrawals with KYC check
5. **Profile** - User settings + Admin Portal access

### KYC Verification Flow
- Aadhaar Card upload (Front + Back)
- PAN Card upload
- Selfie capture for verification
- Progress bar showing completion status
- Status tracking: Not Started -> Submitted -> Verified/Rejected
- Re-upload option on rejection

### Bank Details Management
- Add multiple bank accounts
- Account validation (Account Number, IFSC Code)
- Set primary account for payouts
- Secure encryption notice

### Admin Dashboard Tabs
1. **Overview** - Executive snapshot with KPIs, funnel, provider stats, WhatsApp leads widget
2. **Leads** - Master leads table with search, filters, quick actions
3. **WhatsApp Leads** ⭐ NEW - WhatsApp share lead management with status tracking
4. **Pipeline** - Kanban-style stage tracker
5. **Incentives** - Incentive calculation and approval dashboard
6. **Payouts** - Payout request management
7. **Tasks** - Follow-ups, stuck leads, overdue items
8. **Analytics** - Approval rates, rejection analysis, provider performance
9. **Settings** - User management, audit logs, config, exports
10. **Products** - Product banner management, multilingual content editor

### Incentive Management (Admin)
- **Dashboard Widgets:**
  - Total Incentives Earned (Overall)
  - Total Incentives Paid Out
  - Pending Incentives
  - Net Balance (Incoming minus Outgoing)

- **User Incentive Ledger:**
  - User Name, User ID, Product Type, Bank Name
  - Incentive Amount, Status (Pending/Approved/Paid), Date
  - Approval workflow with admin actions

- **Incoming vs Outgoing Reconciliation:**
  - Bank Partner, Total Leads, Approved Leads
  - Total Receivable, Total Paid to Users, Margin Retained

### Payout Rules
- Minimum withdrawal: ₹500 (configurable)
- Daily payout limit: ₹50,000 (configurable)
- KYC verification required before first payout
- Admin approval for new bank accounts
- Status tracking: Initiated -> Processing -> Completed/Failed

## Incentive Rates

### Bank Account Opening
| Bank Name                  | Potential Earnings |
| -------------------------- | ------------------ |
| Kotak Mahindra Bank        | Earn up to ₹600    |
| Airtel Payments Bank       | Earn up to ₹600    |
| DBS Bank                   | Earn up to ₹600    |
| Equitas Small Finance Bank | Earn up to ₹600    |
| IDFC First Bank            | Earn up to ₹600    |

### Credit Card Offers
| Bank Name                  | Potential Earnings |
| -------------------------- | ------------------ |
| Axis Bank                  | Earn up to ₹2,000  |
| IDFC First Bank            | Earn up to ₹2,000  |
| Federal Bank               | Earn up to ₹2,000  |
| HDFC Bank                  | Earn up to ₹3,000  |
| Yes Bank                   | Earn up to ₹2,000  |
| Bank of Baroda             | Earn up to ₹1,500  |
| SBI                        | Earn up to ₹3,000  |
| Equitas Small Finance Bank | Earn up to ₹3,000  |
| RBL                        | Earn up to ₹2,000  |
| AU Small Finance Bank      | Earn up to ₹2,000  |
| IndusInd Bank              | Earn up to ₹2,000  |
| HSBC                       | Earn up to ₹4,000  |

## Admin Roles
- **Admin** - Full access to all features including incentive approval
- **Ops** - Can update stages, assign leads, process payouts
- **Viewer** - Read-only access

## Demo Credentials
- Email: admin@paisamart.com
- Password: admin123

## Design
- Primary: Dark Blue (#002561)
- Accent: Orange (#FF8C00)
- Admin: Dark Slate theme

## Tech Stack
- Expo SDK 53
- React Native 0.76.7
- NativeWind (TailwindCSS)
- React Native Reanimated
- Expo Router
- Zustand for state management
- React Query for async state

## Product Categories
- Credit Cards, Bank Accounts, Home Loans
- Personal Loans, Vehicle Loans, Business Loans
- Insta Loans, Health Insurance, Life Insurance
- Motor Insurance, Gold Loans, Real Estate

## App Behavior Rules
- All financial actions are logged for audit trail
- Admin has override permissions for all operations
- Notifications for:
  - Incentive approval
  - Payout success
  - KYC rejection or approval
- Incentive credited only after admin approval
- Incentive flow: Pending -> Approved -> Paid
- Multi-language support: English, Hindi, Telugu

## Share Card Link Feature

When a partner taps on any product (e.g., Axis Bank Credit Card), the app opens a Share Card Link screen:

### Share Card Link Screen
- **Header:** "Share Card Link" with back and close buttons
- **Message Preview:** Light green container showing:
  - Product banner image (branded)
  - Greeting: "Namaste 🙏,"
  - Headline in italics
  - Product description
  - Benefits list with green checkmarks
  - "Why you should apply" reasons
  - Support phone numbers
  - Advisor name and title
- **Language Selector:** English, Hindi, Telugu pills
- **Note:** Bank policy disclaimer
- **Share Buttons:** Generic share + WhatsApp share

### T&C for Payout Modal
- Payout eligibility conditions
- LTF (Life Time Free) payout rules
- Continue button

### WhatsApp Share Behavior
- Composes message with selected language template
- Replaces placeholders: advisor name, support phones, referral link
- Opens WhatsApp share intent
- Tracks analytics: share_clicked with productId and advisorReferralCode

### Admin Product Management
- View all products with banners
- Enable/disable products
- Edit product content in all 3 languages
- Upload banner URLs
- Configure benefits and reasons

## WhatsApp Lead Capture System ⭐ NEW

### Customer Flow
When a customer clicks "Share via WhatsApp" on supported products:
1. **Lead Capture Modal** appears (optional, 10 seconds)
   - Loan Amount Needed (dropdown with custom option)
   - Property Type (for home loans)
   - Preferred Callback Time
2. **WhatsApp Share** opens with pre-filled message
3. **Confirmation Modal** shows success message
   - "Request shared successfully"
   - "Our team will reach out within the next few hours"
   - Business hours note displayed

### Supported Product Categories
Lead capture is enabled for:
- Home Loans
- Personal Loans
- Vehicle Loans
- Business Loans
- Life Insurance
- Health Insurance
- Motor Insurance
- Gold Loans

**NOT enabled for:** Bank Accounts, Credit Cards, Cash on Credit Card

### Anti-Spam Protection
- 10-minute cooldown period per mobile + product + bank combination
- Duplicate requests blocked with friendly message
- User notified: "We already received your request"

### Admin Features
**WhatsApp Leads Dashboard:**
- View all WhatsApp shared leads
- Filter by status, product, date range
- Quick actions: Call, WhatsApp, Change status
- Assign leads to team members
- Add notes and track updates
- Export leads to CSV

**Lead Details Screen:**
- Customer information (name, mobile, WhatsApp)
- Product & bank details
- Requirement details (loan amount, property type, callback time)
- Status management (New/Contacted/Qualified/Converted/Closed)
- Assignment tracking
- Notes system
- Share lead via WhatsApp

**WhatsApp Business Group Notifications:**
- Automatic formatted message sent to business group
- Includes all lead details
- Business numbers: +919908234067, +917416423434
- *(Note: Requires WhatsApp Business API integration for automatic sending)*

### Data Captured
- Lead ID (auto-generated: WL-XXXXX)
- Customer Name & Mobile
- Product Category & Bank Name
- Loan Amount (if provided)
- Property Type (if provided)
- Preferred Callback Time (if provided)
- Lead Source: "WhatsApp Share"
- Status: New (default)
- Timestamp & Created Date
