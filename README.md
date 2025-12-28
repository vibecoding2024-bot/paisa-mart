# Retire - Financial Products Partner App

A mobile app (GroMo clone) that allows partners to earn money by selling financial products like credit cards, loans, insurance, and more. Includes a comprehensive Admin Dashboard for internal operations.

## Features

### Partner App
- Phone number based authentication with OTP verification
- Basic information collection form
- Partner dashboard with earnings overview
- Products catalog with 12 categories
- Learning/Training modules
- Earnings & wallet management
- Profile management

### Admin Dashboard
- Secure login with role-based access control
- Executive dashboard with real-time metrics
- Live leads management with filters
- Pipeline/Stage tracker view
- Tasks & follow-ups management
- Outcome analytics
- User management & audit logs
- Export capabilities (Admin only)

## Screens

### Partner Auth Flow
1. **Login Screen** - Phone number input with blue/orange theme
2. **OTP Screen** - 6-digit verification
3. **Basic Info Screen** - Profile completion form

### Partner Main App (Tabs)
1. **Home** - Dashboard with earnings, quick actions (12 categories)
2. **Products** - Browse financial products by category
3. **Learn** - Training modules and certification
4. **Earnings** - Wallet, transactions, withdrawals
5. **Profile** - User settings + Admin Portal access

### Admin Dashboard
1. **Overview** - Executive snapshot with KPIs, funnel, provider stats
2. **Leads** - Master leads table with search, filters, quick actions
3. **Pipeline** - Kanban-style stage tracker
4. **Tasks** - Follow-ups, stuck leads, overdue items
5. **Analytics** - Approval rates, rejection analysis, provider performance
6. **Settings** - User management, audit logs, config, exports

### Admin Lead Details
- Complete lead information
- User journey timeline
- Stage change with reason tracking
- Notes and follow-up management

## Admin Roles
- **Admin** - Full access to all features
- **Ops** - Can update stages, assign leads, add notes
- **Viewer** - Read-only access

## Demo Credentials
- Email: admin@retire.com
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

## Product Categories
- Credit Cards, Bank Accounts, Home Loans
- Personal Loans, Vehicle Loans, Business Loans
- Insta Loans, Health Insurance, Life Insurance
- Motor Insurance, Gold Loans, Real Estate
