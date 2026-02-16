# Paisa Mart - Financial Products Partner App

A mobile app (GroMo clone) that allows partners to earn money by selling financial products like credit cards, loans, insurance, and more. Includes a comprehensive Admin Dashboard for internal operations.

## Features

### Partner App
- Phone number based authentication with OTP verification
- Basic information collection form with salary range selection
- **Personalized Dashboard Greeting** ⭐ NEW
  - Dynamic greeting with user's first name
  - Time-based greetings: Good Morning/Afternoon/Evening
  - User's initial displayed in avatar circle
  - Fallback to "Welcome to Paisa Mart" if name not available
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
5. **Profile** - User settings, Terms & Conditions, Admin Portal access

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
- Motor Insurance (with Vehicle Insurance Quote flow), Gold Loans, Real Estate

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

### Personalized Dashboard Greeting
When users complete their profile during onboarding (Basic Info screen), their name is saved to local storage. The dashboard then displays a personalized greeting:

**Greeting Logic:**
- **With Name:** Displays time-based greeting + first name
  - 5 AM - 12 PM: "Good Morning, {FirstName}"
  - 12 PM - 5 PM: "Good Afternoon, {FirstName}"
  - 5 PM - 10 PM: "Good Evening, {FirstName}"
  - 10 PM - 5 AM: "Welcome, {FirstName}"
- **Without Name:** Displays "Welcome to Paisa Mart"
- **Avatar Circle:** Shows user's first initial or "P" as default

**Technical Implementation:**
- User profile stored in Zustand with AsyncStorage persistence
- Data saved during Basic Info form submission
- First name extracted from full name (first word)
- Time-based greeting calculated using system time

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

## Open Plots - Real Estate Lead Capture ⭐ NEW

A user-friendly, guided flow for capturing real estate plot leads (Buy/Sell) with step-by-step screens.

### User Flow

**Navigation:** Products → Real Estate → Open Plots

#### Step 1: Intent Selection
- **Question:** "What would you like to do?"
- **Options:**
  - Buy a Plot (with shopping bag icon)
  - Sell a Plot (with tag icon)
- Clean, large button design with icons

#### Step 2: User Type
- **Question:** "Are you a customer or an agent?"
- **Options:**
  - I'm a Customer
  - I'm an Agent
- Helps connect users with the right team

#### Steps 3-7: Guided Questions (Buy Flow)
Each question appears on its own screen with:
- Progress bar showing completion (e.g., Step 3 of 8)
- Single focused question
- Clean input or selection options
- Next button appears when valid input provided

**Buy Flow Questions:**
1. **Location:** "Where are you looking to buy?" (text input)
2. **Area:** "Which area or locality do you prefer?" (text input)
3. **Plot Size:** 100/150/200/300 sq yards or Custom
4. **Budget:** ₹5L-₹10L / ₹10L-₹25L / ₹25L-₹50L / ₹50L+ / Custom
5. **Timeline:** Immediately / Within 1 month / Within 3 months / Just exploring
6. **Contact:** Name + Mobile Number + Optional Site Visit toggle
7. **Success Screen**

**Sell Flow Questions:**
1. **Location:** "Where is your property located?" (text input)
2. **Plot Size:** 100/150/200/300 sq yards or Custom
3. **Expected Price:** ₹5L-₹10L / ₹10L-₹25L / ₹25L-₹50L / ₹50L+ / Custom
4. **Timeline:** Immediately / Within 1 month / Within 3 months / Flexible
5. **Contact:** Name + Mobile Number
6. **Success Screen**

#### Success Screen
- Green theme with checkmark animation
- "Request submitted successfully! 🎉"
- Thank you message with timeline
- Reference ID display
- Site visit badge (if selected)
- Business hours note (if after hours)
- "Back to Home" button

### Design Principles
✅ One question per screen
✅ Large, clear buttons
✅ Minimal text
✅ Soft, friendly colors
✅ Rounded cards and buttons
✅ Progress bar on every step
✅ Smooth animations
✅ No mandatory fields except location and mobile

### Data Captured
- **Lead ID:** Auto-generated (OP-XXXXX format)
- **Intent:** Buy or Sell
- **User Type:** Customer or Agent
- **Location & Area**
- **Plot Size** (if provided)
- **Budget/Expected Price** (if provided)
- **Timeline** (if provided)
- **Name & Mobile** (required)
- **Site Visit Required:** Yes/No (high priority if yes)
- **Status:** New (default)
- **Priority:** High (if site visit) or Normal
- **Timestamps**

### Admin Dashboard

**Open Plots Leads Screen:**
- View all open plots leads
- Filter by intent (Buy/Sell), status, priority, date range
- Search by name, mobile, lead ID, location
- Quick actions: Call, WhatsApp, View Details
- Status colors for visual tracking
- High priority badge for site visit requests
- Export leads to CSV

**Lead Details Screen:**
- Full customer information with contact actions
- Property details (location, area, plot size, budget/price, timeline)
- Site visit requirement indicator
- Status management (New → Contacted → Site Visit Scheduled → Negotiation → Closed/Lost)
- Priority toggle (Normal/High)
- Assignment to team members
- Notes system
- Share lead via WhatsApp

**Dashboard Widget:**
- Quick access from admin dashboard
- Shows total leads, new leads, and high priority count
- Purple themed with landmark icon

### Status Lifecycle
1. **New** - Just submitted
2. **Contacted** - Initial contact made
3. **Site Visit Scheduled** - Site visit arranged (for buy leads)
4. **Negotiation** - Price/terms discussion
5. **Closed** - Successfully completed
6. **Lost** - Did not convert

### Business Rules
- No documents required
- No payment integration
- Fields are optional except location and mobile
- Site visit assistance marks lead as High Priority
- After-hours submissions get next morning callback message
- Lead reference ID provided for customer tracking

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

## Vehicle Insurance Quote Request ⭐ NEW

A simplified, guided flow for customers to request insurance quotes for any type of vehicle.

### User Flow

**Navigation:** Products → Motor Insurance → Get Vehicle Insurance Quote

#### Step 1: Vehicle Category Selection
- **Question:** "Select Vehicle Category"
- **5 Categories with Large Cards:**
  - 🚙 Four-Wheelers (Light Vehicles) - Blue theme
  - 🚚 Commercial Vehicles - Orange theme
  - 🚌 Passenger Vehicles - Purple theme
  - 🚜 Special Vehicles - Green theme
  - 🛻 Heavy Vehicles - Slate theme
- Each card has icon, title, and distinctive color

#### Step 2: Vehicle Type Selection
Based on selected category, shows specific vehicle types:

**Four-Wheelers:** Car, Jeep, Van

**Commercial Vehicles:**
- Goods Auto (3-wheeler)
- Pickup / Mini Truck (Tata Ace, Bolero Pickup)
- Lorry / Truck
- Trailer / Container Vehicle

**Passenger Vehicles:**
- Auto Rickshaw
- Taxi / Cab
- Bus
- Tempo Traveller

**Special Vehicles:**
- Tractor
- JCB / Earthmover
- Crane
- Ambulance
- Fire Vehicle

**Heavy Vehicles:**
- Heavy Truck
- Tipper
- Lorry
- Tanker
- Multi-axle Vehicles

#### Step 3: Basic Details Form
Clean, single-screen form with 6 fields:
- **Owner Name** (text input)
- **Mobile Number** (10-digit numeric)
- **Vehicle Number** (text input with plate format hint)
- **Registration Year** (dropdown: 2000-2026)
- **Insurance Expiry Date** (date picker)
- **City** (text input)

All fields are required. Form validates on submit.

#### Step 4: Success Screen
- Blue theme with checkmark animation
- "Request submitted successfully! 🎉"
- Thank you message: "Our team from Paisa Mart will contact you within the next few hours with insurance quotes from top providers"
- Reference ID display (VI-XXXXX format)
- Business hours awareness (contacts next morning if after 6 PM)
- Info badges about multiple quotes
- "Back to Home" button

### Design Principles
✅ Clear visual hierarchy with category colors
✅ Large, tappable cards
✅ Simple, focused form (single screen)
✅ No payment integration (quote request only)
✅ Minimal fields - just what's needed for quote
✅ Business hours awareness
✅ Professional, trustworthy design

### Data Captured
- **Lead ID:** Auto-generated (VI-{timestamp}-{random} format)
- **Vehicle Category:** Four-Wheelers/Commercial/Passenger/Special/Heavy
- **Vehicle Type:** Specific type from category list
- **Owner Name** (required)
- **Mobile Number** (required, 10 digits)
- **Vehicle Number** (required)
- **Registration Year** (required)
- **Insurance Expiry Date** (required)
- **City** (required)
- **Status:** New (default)
- **Created At:** Timestamp
- **Updated At:** Timestamp

### Admin Dashboard

**Vehicle Insurance Leads Screen:**
- View all vehicle insurance quote requests
- Filter by status, vehicle category, date range
- Search by owner name, mobile, lead ID, vehicle number
- Quick actions: Call, WhatsApp, View Details
- Status colors for visual tracking
- Export leads to CSV
- Expiry date prominently displayed

**Lead Status Types:**
1. **New** - Just submitted
2. **Contacted** - Initial contact made
3. **Quote Sent** - Insurance quotes provided
4. **Policy Issued** - Customer purchased policy
5. **Closed** - Completed
6. **Lost** - Did not convert

**Dashboard Widget:**
- Quick access from admin dashboard
- Shows total leads and new leads count
- Cyan themed with car icon
- Positioned after Open Plots widget

### Business Rules
- No premium calculation in app
- No payment gateway integration
- Quote request only - admin team provides quotes
- After-hours submissions get next morning callback message
- Lead reference ID provided for customer tracking
- All fields required for accurate quote generation
- Supports all vehicle types from two-wheelers to heavy vehicles

### Technical Implementation
- Zustand store with AsyncStorage persistence
- Lead management with status tracking
- CSV export functionality for admin
- Time-based business hours logic
- Form validation on all required fields
- Haptic feedback for better UX
- Smooth animations with React Native Reanimated

## Terms & Conditions ⭐ NEW

A comprehensive, scrollable Terms & Conditions page accessible from the Profile tab, displaying all payout terms and policies in an organized accordion format.

### Navigation
**Profile Tab → Terms & Conditions**

### Content Sections

The Terms & Conditions page includes 6 collapsible accordion sections:

#### 1. Loan Payout Terms & Conditions
Applies to: Personal Loan, Business Loan, Home Loan, Vehicle Loan

**Key Points:**
- **Payout Eligibility:** Loan approved, disbursed, KYC verified, documents valid, account active
- **Payout Cycle:** 45 Days from loan disbursement date
- **Payout Calculation:** Based on disbursed loan amount (final value)
- **TDS & Charges:** 5% TDS deduction, PAN mandatory, 2% + GST wallet withdrawal charges
- **Payment Mode:** NEFT, IMPS, RTGS, Wallet Load (to registered bank account only)
- **Cancellation Policy:** Not allowed

#### 2. Vehicle Insurance Payout Terms

**Key Points:**
- **Payout Eligibility:** Policy issued, premium realized, KYC approved, policy active
- **Payout Cycle:** 45 Days
- **Payout Calculation:** Net Premium (excluding GST)
- **TDS & Charges:** 5% TDS, PAN mandatory, 2% + GST wallet charges
- **Payment Mode:** NEFT / IMPS / RTGS / Wallet Load (to registered account)
- **Cancellation Policy:** Not allowed

#### 3. Health & Life Insurance Payout Terms

**Key Points:**
- **Eligibility:** Policy issued, premium realized, KYC approved, policy active
- **Payout Cycle:** 45 Days from issuance/premium realization
- **Payout Calculation:** Net Premium (excluding GST)
- **TDS & Charges:** 5% TDS, PAN mandatory, 2% + GST wallet withdrawal
- **Payment Mode:** NEFT / IMPS / RTGS / Wallet Load
- **Cancellation:** Not allowed

#### 4. Gold Loan Payout Terms

**Key Points:**
- **Eligibility:** Loan approved, disbursed, KYC verified, gold valuation completed, account active for minimum 3 months
- **Payout Cycle:** 4 Months from loan disbursement date
- **Payout Calculation:** Final disbursed loan amount
- **TDS & Charges:** 5% TDS, PAN mandatory, 2% + GST wallet withdrawal
- **Payment Mode:** NEFT / IMPS / RTGS / Wallet Load
- **Cancellation:** Not allowed

#### 5. Real Estate Payout Terms

**Key Points:**
- **Eligibility:** Sale deed initiated, deal confirmed by developer, sale deed active
- **Payout Cycle:** 45 Days from sale deed confirmation/payment realization
- **Payout Calculation:** Net Booking Amount / Net Sale Value (excluding GST), commission on received amount only
- **TDS & Charges:** 5% TDS, PAN mandatory, 2% + GST wallet withdrawal
- **Payment Mode:** NEFT / IMPS / RTGS / Wallet Load
- **Cancellation:** Not allowed

#### 6. Business Types (For Business Loan)

Eligible business types displayed in checklist format:
- Manufacturing Business
- Trading Business
- Service Business
- Retail Business
- Wholesale Business
- Online / E-Commerce Business
- Franchise Business
- Construction / Real Estate Business
- Agriculture & Allied Business
- Import & Export Business
- Logistics / Transport Business
- Financial Services Business

### Design & UX

**Accordion Interaction:**
- Each section is collapsible/expandable
- Tap section header to expand/collapse
- Chevron icon indicates expand/collapse state
- Only expanded sections show full content
- Smooth animations on expand/collapse

**Visual Hierarchy:**
- Section titles in bold, large text
- Subsection numbering (1, 2, 3...)
- Bullet points for list items
- Clean spacing and padding
- White cards with shadow on gray background

**Footer Elements:**
- Orange notice box: "Paisa Mart reserves the right to modify payout terms..."
- Last Updated date display
- Paisa Mart branding consistent throughout

### Features
✅ Scrollable full-page view
✅ Collapsible accordion sections for clean readability
✅ Clear visual hierarchy with bold headings
✅ Bullet points for easy scanning
✅ Professional, trustworthy design
✅ No payment gateway logic (informational only)
✅ Last updated date displayed
✅ Policy modification disclaimer
✅ Mobile-optimized layout

### Business Rules
- Informational display only (no forms or actions)
- No payment processing on this page
- Terms apply to all partners equally
- PAN card mandatory for all payouts
- TDS deduction applicable across all categories
- Wallet withdrawal charges: 2% + GST uniformly
- Cancellation not allowed for any payout

### Technical Implementation
- React Native collapsible accordion components
- State management for expand/collapse
- Reanimated for smooth animations
- Clean component structure (AccordionSection, SectionItem)
- Type-safe props with TypeScript
- Easy to update content (centralized data structure)
- Responsive layout for all screen sizes
