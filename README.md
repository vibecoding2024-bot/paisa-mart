# GroMo Clone - Financial Products Partner App

A mobile app clone of GroMo that allows partners to earn money by selling financial products like credit cards, loans, insurance, and more.

## Features

- Phone number based authentication with OTP verification
- Basic information collection form
- Partner dashboard with earnings overview
- Products catalog with categories
- Learning/Training modules
- Earnings & wallet management
- Profile management

## Screens

### Auth Flow
1. **Login Screen** - Phone number input with GroMo-style blue/orange theme
2. **OTP Screen** - 6-digit verification
3. **Basic Info Screen** - Profile completion form

### Main App (Tabs)
1. **Home** - Dashboard with earnings, quick actions, products
2. **Products** - Browse financial products by category
3. **Learn** - Training modules and certification
4. **Earnings** - Wallet, transactions, withdrawals
5. **Profile** - User settings and account management

## Design
- Primary: Dark Blue (#002561)
- Accent: Orange (#FF8C00)
- Clean white cards with shadows
- GroMo-inspired UI/UX

## Screens

### Login Screen (`src/app/index.tsx`)
- Phone number input with +91 country code
- Beautiful gradient background with emerald accents
- Trust indicators showing partner count
- Animated logo and feature icons

### OTP Screen (`src/app/otp.tsx`)
- 6-digit OTP input with auto-focus
- Resend timer functionality
- Haptic feedback on interactions
- Success animation on verification

## Tech Stack

- Expo SDK 53
- React Native 0.76.7
- NativeWind (TailwindCSS)
- React Native Reanimated for animations
- Expo Router for navigation
