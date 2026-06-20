# Backend Implementation Guide — Step-by-Step

## Overview
This guide shows **exactly what code to write** for each integration phase, with copy-paste examples for your Hono + Bun + Prisma stack.

---

## Part 1: Database Schema (Prisma)

### Step 1.1: Create Prisma Schema File

**File:** `backend/prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                    String    @id @default(cuid())
  phoneNumber          String    @unique
  email                String?   @unique
  name                 String?
  
  // KYC - Personal ID
  aadharNumber         String?   @db.String(255)   // Encrypted
  aadharVerified       Boolean   @default(false)
  aadharVerifiedAt     DateTime?
  
  panNumber            String?   @db.String(255)   // Encrypted
  panVerified          Boolean   @default(false)
  panVerifiedAt        DateTime?
  
  // Bank Account for Payouts
  bankAccountNumber    String?   @db.String(255)   // Encrypted
  bankIfsc             String?   @db.String(10)
  bankAccountHolder    String?   // For verification
  bankAccountVerified  Boolean   @default(false)
  bankAccountVerifiedAt DateTime?
  
  // KYC Status
  kycStatus            String    @default("pending")  // pending|in_review|approved|rejected
  kycRejectionReason   String?
  kycApprovedAt        DateTime?
  
  // Wallet
  walletBalance        Decimal   @default(0) @db.Decimal(18, 2)
  walletLocked         Decimal   @default(0) @db.Decimal(18, 2)  // for pending payouts
  
  // Account Status
  isActive             Boolean   @default(true)
  isBlocked            Boolean   @default(false)
  
  // Relations
  transactions         Transaction[]
  payouts             Payout[]
  kycSubmissions      KycSubmission[]
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@index([phoneNumber])
  @@index([kycStatus])
}

model Transaction {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type                String    // 'earn'|'payout'|'reversal'|'refund'|'recharge'
  subType             String?   // 'payment'|'commission'|'bonus'
  amount              Decimal   @db.Decimal(18, 2)
  reason              String    // 'payment_received', 'payout_initiated', etc
  referenceId         String?   // link to payment/payout txn ID
  
  // Ledger trail
  balanceBefore       Decimal   @db.Decimal(18, 2)
  balanceAfter        Decimal   @db.Decimal(18, 2)
  
  // For partner reference
  partnerRef          String?   // partner's transaction ID
  metadata            Json?     // store extra context
  
  status              String    @default("completed")  // completed|pending|failed
  
  createdAt           DateTime  @default(now())
  
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
}

model Payout {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  amount              Decimal   @db.Decimal(18, 2)
  bankAccountId       String    // ref to User.bankAccountNumber
  bankIfsc            String    @db.String(10)
  
  status              String    @default("pending")  // pending|processing|success|failed|cancelled
  failureReason       String?
  
  // Gateway details
  payoutGatewayId     String?   @unique  // Razorpay payout ID
  gatewayResponse     Json?     // Raw API response
  gatewayAttempts     Int       @default(0)
  lastAttemptAt       DateTime?
  
  // Verification
  balanceLocked       Decimal   @db.Decimal(18, 2)   // Amount deducted from wallet
  
  initiatedAt         DateTime  @default(now())
  processedAt         DateTime?
  completedAt         DateTime?
  updatedAt           DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model KycSubmission {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type                String    // 'aadhar'|'pan'|'bank_account'|'selfie'
  documentUrl         String?   // S3 path or document URL
  extractedData       Json?     // OCR/API response data
  
  // Verification status
  status              String    @default("pending")  // pending|approved|rejected|resubmit_required
  rejectionReason     String?
  reviewedBy          String?   // Admin ID
  
  // Evidence
  verificationMethod  String?   // 'api'|'manual'|'digilocker'
  verificationProof   Json?     // Store proof of verification
  
  submittedAt         DateTime  @default(now())
  verifiedAt          DateTime?
  expiresAt           DateTime? // For re-verification
  
  @@unique([userId, type])  // One of each type
  @@index([userId])
  @@index([status])
}

model PartnerWebhook {
  id                  String    @id @default(cuid())
  partnerId           String
  
  url                 String
  secret              String    @db.String(255)  // For HMAC signing
  
  events              String[]  // ['payout.success', 'kyc.approved']
  isActive            Boolean   @default(true)
  
  lastTriggeredAt     DateTime?
  failureCount        Int       @default(0)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([partnerId])
}

model WebhookLog {
  id                  String    @id @default(cuid())
  webhookId           String
  
  event               String
  payload             Json
  
  httpStatus          Int?
  response            String?
  
  attempt             Int       @default(1)
  nextRetryAt         DateTime?
  
  createdAt           DateTime  @default(now())
}
```

### Step 1.2: Run Migrations

```bash
# Install Prisma
cd backend
bun add --dev @prisma/cli

# Initialize & push schema
bunx prisma migrate dev --name init
bunx prisma generate

# Commit
git add prisma/ package.json bun.lock
git commit -m "feat: add wallet, payout, kyc schema"
```

---

## Part 2: Utility Libraries

### Step 2.1: Encryption Helper (for PII)

**File:** `backend/src/lib/encryption.ts`

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 
  crypto.randomBytes(32).toString('hex');

if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY must be set in production');
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Step 2.2: Wallet Service

**File:** `backend/src/lib/wallet.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface WalletTransaction {
  userId: string;
  type: 'earn' | 'payout' | 'reversal' | 'refund' | 'recharge';
  amount: number;
  reason: string;
  referenceId?: string;
  partnerRef?: string;
  metadata?: Record<string, any>;
}

export async function creditWallet(txn: WalletTransaction) {
  return prisma.$transaction(async (tx) => {
    // Fetch current balance
    const user = await tx.user.findUnique({
      where: { id: txn.userId },
      select: { walletBalance: true },
    });
    if (!user) throw new Error('User not found');

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore.plus(new Decimal(txn.amount));

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: txn.userId,
        type: txn.type,
        amount: new Decimal(txn.amount),
        reason: txn.reason,
        referenceId: txn.referenceId,
        partnerRef: txn.partnerRef,
        metadata: txn.metadata,
        balanceBefore,
        balanceAfter,
        status: 'completed',
      },
    });

    // Update balance
    await tx.user.update({
      where: { id: txn.userId },
      data: { walletBalance: balanceAfter },
    });

    return transaction;
  });
}

export async function debitWallet(txn: WalletTransaction) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: txn.userId },
      select: { walletBalance: true, walletLocked: true },
    });
    if (!user) throw new Error('User not found');

    const available = user.walletBalance.minus(user.walletLocked);
    if (available.lessThan(new Decimal(txn.amount))) {
      throw new Error('Insufficient balance');
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore.minus(new Decimal(txn.amount));

    const transaction = await tx.transaction.create({
      data: {
        userId: txn.userId,
        type: txn.type,
        amount: new Decimal(txn.amount),
        reason: txn.reason,
        referenceId: txn.referenceId,
        partnerRef: txn.partnerRef,
        metadata: txn.metadata,
        balanceBefore,
        balanceAfter,
        status: 'completed',
      },
    });

    await tx.user.update({
      where: { id: txn.userId },
      data: { walletBalance: balanceAfter },
    });

    return transaction;
  });
}

export async function lockBalance(userId: string, amount: number) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      walletLocked: {
        increment: new Decimal(amount),
      },
    },
  });
}

export async function unlockBalance(userId: string, amount: number) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      walletLocked: {
        decrement: new Decimal(amount),
      },
    },
  });
}

export async function getWalletBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      walletBalance: true,
      walletLocked: true,
    },
  });
  if (!user) return null;

  return {
    balance: user.walletBalance.toNumber(),
    locked: user.walletLocked.toNumber(),
    available: user.walletBalance.minus(user.walletLocked).toNumber(),
  };
}

export async function getTransactionHistory(userId: string, limit = 50) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      amount: true,
      reason: true,
      status: true,
      balanceBefore: true,
      balanceAfter: true,
      createdAt: true,
    },
  });
}
```

### Step 2.3: Validation Schemas (Zod)

**File:** `backend/src/lib/schemas.ts`

```typescript
import { z } from 'zod';

// KYC
export const AadharSchema = z.object({
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits'),
});

export const PANSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  fullName: z.string().min(3),
});

export const BankAccountSchema = z.object({
  accountNumber: z.string().regex(/^\d{9,18}$/, 'Invalid account number'),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC'),
  accountHolderName: z.string().min(3),
});

// Payout
export const PayoutRequestSchema = z.object({
  amount: z.number().min(100).max(50000),
  bankAccountId: z.string().optional(),
});

// Recharge
export const RechargeSchema = z.object({
  type: z.enum(['electricity', 'water', 'mobile', 'broadband']),
  billerId: z.string(),
  consumerRef: z.string(),
  amount: z.number().min(1).max(100000),
});

// Travel
export const FlightSearchSchema = z.object({
  departure: z.string().regex(/^[A-Z]{3}$/), // IATA code
  arrival: z.string().regex(/^[A-Z]{3}$/),
  date: z.string().datetime(),
  passengers: z.number().min(1).max(9),
});
```

---

## Part 3: KYC API Routes

### Step 3.1: Create KYC Router

**File:** `backend/src/routes/kyc.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getAuth } from '../lib/auth';
import { PrismaClient } from '@prisma/client';
import { AadharSchema, PANSchema, BankAccountSchema } from '../lib/schemas';

const prisma = new PrismaClient();
const kycRouter = new Hono();

// Middleware: Require auth
kycRouter.use('*', async (c, next) => {
  const auth = await getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', auth.userId);
  await next();
});

// GET /api/v1/kyc/status
kycRouter.get('/status', async (c) => {
  const userId = c.get('userId');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      kycStatus: true,
      aadharVerified: true,
      panVerified: true,
      bankAccountVerified: true,
    },
  });

  if (!user) return c.json({ error: 'User not found' }, 404);

  const canWithdraw = 
    user.kycStatus === 'approved' && 
    user.aadharVerified && 
    user.panVerified && 
    user.bankAccountVerified;

  return c.json({
    kycStatus: user.kycStatus,
    aadharVerified: user.aadharVerified,
    panVerified: user.panVerified,
    bankAccountVerified: user.bankAccountVerified,
    canWithdraw,
  });
});

// POST /api/v1/kyc/aadhar/verify
kycRouter.post(
  '/aadhar/verify',
  zValidator('json', AadharSchema),
  async (c) => {
    const userId = c.get('userId');
    const { aadharNumber } = c.req.valid('json');

    try {
      // Check if already verified
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aadharVerified: true },
      });

      if (user?.aadharVerified) {
        return c.json({ status: 'success', verified: true, message: 'Already verified' });
      }

      // Call KYC provider (example: Cashfree API)
      // This is a placeholder; integrate with your actual provider
      const kycResult = await verifyAadharWithProvider(aadharNumber);

      if (kycResult.success) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            aadharNumber: aadharNumber, // In production, encrypt this
            aadharVerified: true,
            aadharVerifiedAt: new Date(),
          },
        });

        await prisma.kycSubmission.create({
          data: {
            userId,
            type: 'aadhar',
            status: 'approved',
            extractedData: kycResult.userData || {},
            verifiedAt: new Date(),
          },
        });

        return c.json({
          status: 'success',
          verified: true,
          userData: kycResult.userData,
        });
      } else {
        return c.json({
          status: 'failed',
          verified: false,
          message: kycResult.message || 'Aadhar verification failed',
        }, 400);
      }
    } catch (error) {
      console.error('[KYC]', error);
      return c.json({ status: 'error', message: 'Internal server error' }, 500);
    }
  }
);

// POST /api/v1/kyc/pan/verify
kycRouter.post(
  '/pan/verify',
  zValidator('json', PANSchema),
  async (c) => {
    const userId = c.get('userId');
    const { panNumber, fullName } = c.req.valid('json');

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { panVerified: true },
      });

      if (user?.panVerified) {
        return c.json({ status: 'success', verified: true, message: 'Already verified' });
      }

      // Call KYC provider
      const kycResult = await verifyPANWithProvider(panNumber, fullName);

      if (kycResult.success) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            panNumber, // Encrypt in production
            panVerified: true,
            panVerifiedAt: new Date(),
          },
        });

        await prisma.kycSubmission.create({
          data: {
            userId,
            type: 'pan',
            status: 'approved',
            extractedData: kycResult.userData || {},
            verifiedAt: new Date(),
          },
        });

        return c.json({
          status: 'success',
          verified: true,
          userData: kycResult.userData,
        });
      } else {
        return c.json({
          status: 'failed',
          verified: false,
          message: kycResult.message || 'PAN verification failed',
        }, 400);
      }
    } catch (error) {
      console.error('[KYC]', error);
      return c.json({ status: 'error', message: 'Internal server error' }, 500);
    }
  }
);

// POST /api/v1/kyc/bank-account/verify
kycRouter.post(
  '/bank-account/verify',
  zValidator('json', BankAccountSchema),
  async (c) => {
    const userId = c.get('userId');
    const { accountNumber, ifsc, accountHolderName } = c.req.valid('json');

    try {
      // Validate IFSC against RBI registry (simplified)
      const ifscValid = await validateIFSC(ifsc);
      if (!ifscValid) {
        return c.json({ status: 'failed', verified: false, message: 'Invalid IFSC code' }, 400);
      }

      // In production, use Razorpay or Cashfree for account verification
      const verificationResult = await verifyBankAccountWithProvider(
        accountNumber,
        ifsc,
        accountHolderName
      );

      if (verificationResult.success) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            bankAccountNumber: accountNumber, // Encrypt
            bankIfsc: ifsc,
            bankAccountHolder: accountHolderName,
            bankAccountVerified: true,
            bankAccountVerifiedAt: new Date(),
          },
        });

        await prisma.kycSubmission.create({
          data: {
            userId,
            type: 'bank_account',
            status: 'approved',
            extractedData: { ifsc, bankName: verificationResult.bankName },
            verifiedAt: new Date(),
          },
        });

        return c.json({
          status: 'success',
          verified: true,
          bankName: verificationResult.bankName,
          message: 'Bank account verified',
        });
      } else {
        return c.json({
          status: verificationResult.pendingVerification ? 'verification_pending' : 'failed',
          verified: false,
          message: verificationResult.message,
        }, 400);
      }
    } catch (error) {
      console.error('[KYC]', error);
      return c.json({ status: 'error', message: 'Internal server error' }, 500);
    }
  }
);

// Placeholder functions (replace with actual API calls)
async function verifyAadharWithProvider(aadharNumber: string) {
  // TODO: Call Cashfree or DigiLocker API
  return {
    success: true,
    userData: {
      name: 'John Doe',
      dob: '1990-01-01',
      address: 'Test Address',
    },
  };
}

async function verifyPANWithProvider(panNumber: string, fullName: string) {
  // TODO: Call PAN verification API
  return { success: true, userData: { panNumber, fullName } };
}

async function verifyBankAccountWithProvider(
  accountNumber: string,
  ifsc: string,
  accountHolderName: string
) {
  // TODO: Use Razorpay Account Validation API
  return { success: true, bankName: 'Sample Bank' };
}

async function validateIFSC(ifsc: string) {
  // Simple validation; in production, hit RBI registry
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

export { kycRouter };
```

---

## Part 4: Payout Routes

### Step 4.1: Create Payout Router

**File:** `backend/src/routes/payouts.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getAuth } from '../lib/auth';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PayoutRequestSchema } from '../lib/schemas';
import { debitWallet, lockBalance } from '../lib/wallet';

const prisma = new PrismaClient();
const payoutRouter = new Hono();

// Middleware: Require auth
payoutRouter.use('*', async (c, next) => {
  const auth = await getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', auth.userId);
  await next();
});

// POST /api/v1/payouts/request
payoutRouter.post(
  '/request',
  zValidator('json', PayoutRequestSchema),
  async (c) => {
    const userId = c.get('userId');
    const { amount, bankAccountId } = c.req.valid('json');

    try {
      // Validate user KYC status
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          kycStatus: true,
          aadharVerified: true,
          panVerified: true,
          bankAccountVerified: true,
          walletBalance: true,
          walletLocked: true,
        },
      });

      if (!user) return c.json({ error: 'User not found' }, 404);

      if (user.kycStatus !== 'approved') {
        return c.json({ error: 'KYC not approved' }, 400);
      }

      if (!user.aadharVerified || !user.panVerified || !user.bankAccountVerified) {
        return c.json({ error: 'Complete KYC verification required' }, 400);
      }

      const available = user.walletBalance.minus(user.walletLocked);
      if (available.lessThan(new Decimal(amount))) {
        return c.json({ error: 'Insufficient balance' }, 400);
      }

      // Create payout record
      const payout = await prisma.payout.create({
        data: {
          userId,
          amount: new Decimal(amount),
          bankAccountId: bankAccountId || user.bankAccountNumber || '',
          bankIfsc: user.bankIfsc || '',
          status: 'pending',
          balanceLocked: new Decimal(amount),
        },
      });

      // Lock balance
      await lockBalance(userId, amount);

      return c.json({
        payoutId: payout.id,
        status: 'pending',
        amount,
        message: 'Payout initiated. Processing...',
      }, 201);
    } catch (error) {
      console.error('[PAYOUT]', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// GET /api/v1/payouts/:payoutId
payoutRouter.get('/:payoutId', async (c) => {
  const userId = c.get('userId');
  const payoutId = c.req.param('payoutId');

  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) return c.json({ error: 'Payout not found' }, 404);

    if (payout.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    return c.json({
      payoutId: payout.id,
      amount: payout.amount.toNumber(),
      status: payout.status,
      bankAccountId: payout.bankAccountId,
      bankIfsc: payout.bankIfsc,
      initiatedAt: payout.initiatedAt,
      completedAt: payout.completedAt,
      failureReason: payout.failureReason,
    });
  } catch (error) {
    console.error('[PAYOUT]', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /api/v1/payouts/history
payoutRouter.get('/history', async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

  try {
    const payouts = await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        status: true,
        initiatedAt: true,
        completedAt: true,
      },
    });

    const totalEarned = await prisma.transaction.aggregate({
      where: { userId, type: 'earn' },
      _sum: { amount: true },
    });

    const totalPaidOut = await prisma.payout.aggregate({
      where: { userId, status: 'success' },
      _sum: { amount: true },
    });

    return c.json({
      payouts: payouts.map((p) => ({
        ...p,
        amount: p.amount.toNumber(),
      })),
      totalEarned: totalEarned._sum.amount?.toNumber() || 0,
      totalPaidOut: totalPaidOut._sum.amount?.toNumber() || 0,
    });
  } catch (error) {
    console.error('[PAYOUT]', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { payoutRouter };
```

---

## Part 5: Wallet Routes

### Step 5.1: Create Wallet Router

**File:** `backend/src/routes/wallet.ts`

```typescript
import { Hono } from 'hono';
import { getAuth } from '../lib/auth';
import { getWalletBalance, getTransactionHistory } from '../lib/wallet';

const walletRouter = new Hono();

// Middleware
walletRouter.use('*', async (c, next) => {
  const auth = await getAuth(c);
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', auth.userId);
  await next();
});

// GET /api/v1/wallet/balance
walletRouter.get('/balance', async (c) => {
  const userId = c.get('userId');

  const balance = await getWalletBalance(userId);
  if (!balance) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(balance);
});

// GET /api/v1/wallet/history
walletRouter.get('/history', async (c) => {
  const userId = c.get('userId');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

  const transactions = await getTransactionHistory(userId, limit);
  return c.json({ transactions });
});

export { walletRouter };
```

---

## Part 6: Mount Routes in Main App

**File:** `backend/src/index.ts` (Add these lines)

```typescript
import { kycRouter } from "./routes/kyc";
import { payoutRouter } from "./routes/payouts";
import { walletRouter } from "./routes/wallet";

// ... existing code ...

// Mount new routes
app.route("/api/v1/kyc", kycRouter);
app.route("/api/v1/payouts", payoutRouter);
app.route("/api/v1/wallet", walletRouter);
```

---

## Part 7: Environment Variables

**File:** `backend/.env` (Add these)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/paisa_mart"

# Encryption
ENCRYPTION_KEY="your-256-bit-hex-key-here"

# Payout Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="xxx"
RAZORPAY_ACCOUNT_NUMBER="1112220061"

# KYC Provider (Cashfree)
CASHFREE_API_KEY="xxx"
CASHFREE_API_SECRET="xxx"

# Webhook secrets
PARTNER_WEBHOOK_SECRET="random-secret-key"
```

---

## Part 8: Testing the APIs (Postman/curl)

### Test 1: Check KYC Status

```bash
curl -X GET http://localhost:3000/api/v1/kyc/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 2: Verify Aadhar

```bash
curl -X POST http://localhost:3000/api/v1/kyc/aadhar/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"aadharNumber": "123456789012"}'
```

### Test 3: Request Payout

```bash
curl -X POST http://localhost:3000/api/v1/payouts/request \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'
```

### Test 4: Check Wallet Balance

```bash
curl -X GET http://localhost:3000/api/v1/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Next: Integrate with Partners

After these APIs are ready:

1. **Generate API Documentation** (OpenAPI/Swagger)
2. **Create Postman Collection** for partners
3. **Setup Sandbox Environment** for partner testing
4. **Add Rate Limiting** (prevent abuse)
5. **Setup Monitoring & Alerts** (errors, failures, latency)
6. **Deploy to Staging** for partner UAT

---

**Status:** Ready for implementation  
**Estimated time:** 2-3 days
