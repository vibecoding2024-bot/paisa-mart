import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Commission rates per product category
export const COMMISSION_RATES: Record<string, { rate: string; rateValue: number }> = {
  'home-loans': { rate: 'up to 1.5%', rateValue: 1.5 },
  'personal-loans': { rate: 'up to 2.5%', rateValue: 2.5 },
  'vehicle-loans': { rate: 'up to 2.5%', rateValue: 2.5 },
  'business-loans': { rate: 'up to 2.5%', rateValue: 2.5 },
  'insta-loans': { rate: 'up to 3.5%', rateValue: 3.5 },
  'health-insurance': { rate: 'up to 15%', rateValue: 15 },
  'life-insurance': { rate: 'up to 20%', rateValue: 20 },
  'motor-insurance': { rate: 'up to 30%', rateValue: 30 },
  'gold-loans': { rate: '0.7%', rateValue: 0.7 },
  'real-estate': { rate: 'up to 20%', rateValue: 20 },
  'credit-cards': { rate: 'Fixed', rateValue: 0 },
  'bank-accounts': { rate: 'Fixed', rateValue: 0 },
  // NO PAYOUT modules — Commission: 0%, Fixed Payout: ₹0
  // Excluded from earnings reports and admin payout calculations
  'cash-cards': { rate: '0%', rateValue: 0 },
  'recharge-bills': { rate: '0%', rateValue: 0 },
  'travel-tickets': { rate: '0%', rateValue: 0 },
};

// Modules that carry zero payout — excluded from earnings and admin payout reports
export const NO_PAYOUT_MODULES = new Set(['cash-cards', 'recharge-bills', 'travel-tickets']);

export const isNoPayout = (moduleId: string): boolean => NO_PAYOUT_MODULES.has(moduleId);

// Helper function to calculate potential commission
export const calculatePotentialCommission = (productCategory: string, amount?: number): string => {
  const commissionInfo = COMMISSION_RATES[productCategory];
  if (!commissionInfo) return 'N/A';

  // For fixed rate products (credit cards, bank accounts), just show the rate text
  if (commissionInfo.rateValue === 0) {
    return commissionInfo.rate;
  }

  // If amount is provided, calculate the potential commission
  if (amount && amount > 0) {
    const potentialEarning = (amount * commissionInfo.rateValue) / 100;
    return `${commissionInfo.rate} (₹${potentialEarning.toLocaleString()})`;
  }

  // If no amount, just show the rate
  return commissionInfo.rate;
};

// Types
export type IncentiveStatus = 'pending' | 'approved' | 'paid';
export type PayoutStatus = 'initiated' | 'processing' | 'completed' | 'failed';
export type KYCStatus = 'not_started' | 'submitted' | 'verified' | 'rejected';

export interface UserIncentive {
  id: string;
  userName: string;
  oderId: string;
  productType: 'bank-account' | 'credit-card' | 'loan';
  bankName: string;
  amount: number;
  status: IncentiveStatus;
  date: string;
  approvedAt?: string;
  paidAt?: string;
  approvedBy?: string;
}

export interface IncomingOutgoingRecord {
  id: string;
  bankPartner: string;
  totalLeads: number;
  approvedLeads: number;
  totalReceivable: number;
  totalPaidToUsers: number;
  marginRetained: number;
  month: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  status: PayoutStatus;
  initiatedAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  transactionId?: string;
}

export interface KYCDocument {
  type: 'aadhaar_front' | 'aadhaar_back' | 'pan' | 'selfie';
  uri: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

export interface UserKYC {
  userId: string;
  status: KYCStatus;
  documents: KYCDocument[];
  aadhaarName?: string;
  panName?: string;
  nameMatch: boolean;
  submittedAt?: string;
  verifiedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  progressPercentage: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: 'incentive' | 'payout' | 'kyc' | 'bank_account';
  entityId: string;
  performedBy: string;
  timestamp: string;
  details?: string;
  beforeValue?: string;
  afterValue?: string;
}

// Mock data generators
const generateMockIncentives = (): UserIncentive[] => {
  const users = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh'];
  const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Bank', 'Yes Bank'];
  const products: ('bank-account' | 'credit-card' | 'loan')[] = ['bank-account', 'credit-card', 'loan'];
  const statuses: IncentiveStatus[] = ['pending', 'approved', 'paid'];

  const incentives: UserIncentive[] = [];

  for (let i = 1; i <= 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const productType = products[Math.floor(Math.random() * products.length)];

    let amount = 0;
    if (productType === 'bank-account') amount = 600;
    else if (productType === 'credit-card') amount = Math.floor(Math.random() * 2000) + 1500;
    else amount = Math.floor(Math.random() * 3000) + 2000;

    incentives.push({
      id: `INC-${String(i).padStart(5, '0')}`,
      userName: users[Math.floor(Math.random() * users.length)],
      oderId: `ORD-${String(i * 100 + Math.floor(Math.random() * 100)).padStart(6, '0')}`,
      productType,
      bankName: banks[Math.floor(Math.random() * banks.length)],
      amount,
      status,
      date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      approvedAt: status !== 'pending' ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      paidAt: status === 'paid' ? new Date(Date.now() - (daysAgo - 2) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
  }

  return incentives;
};

const generateMockIncomingOutgoing = (): IncomingOutgoingRecord[] => {
  const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Bank', 'Yes Bank', 'IndusInd Bank'];

  return banks.map((bank, index) => {
    const totalLeads = Math.floor(Math.random() * 100) + 50;
    const approvedLeads = Math.floor(totalLeads * (0.5 + Math.random() * 0.3));
    const totalReceivable = approvedLeads * (Math.floor(Math.random() * 2000) + 1500);
    const totalPaidToUsers = Math.floor(totalReceivable * 0.7);

    return {
      id: `IO-${String(index + 1).padStart(3, '0')}`,
      bankPartner: bank,
      totalLeads,
      approvedLeads,
      totalReceivable,
      totalPaidToUsers,
      marginRetained: totalReceivable - totalPaidToUsers,
      month: 'January 2026',
    };
  });
};

const generateMockPayouts = (): Payout[] => {
  const users = [
    { id: 'user-1', name: 'Rahul Sharma' },
    { id: 'user-2', name: 'Priya Patel' },
    { id: 'user-3', name: 'Amit Kumar' },
  ];
  const statuses: PayoutStatus[] = ['initiated', 'processing', 'completed', 'failed'];
  const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI'];

  const payouts: Payout[] = [];

  for (let i = 1; i <= 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const daysAgo = Math.floor(Math.random() * 15);

    payouts.push({
      id: `PAY-${String(i).padStart(5, '0')}`,
      userId: user.id,
      userName: user.name,
      amount: Math.floor(Math.random() * 5000) + 500,
      bankAccountId: `BA-${user.id}`,
      bankName: banks[Math.floor(Math.random() * banks.length)],
      accountNumber: `XXXX${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      status,
      initiatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: ['processing', 'completed', 'failed'].includes(status) ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      completedAt: status === 'completed' ? new Date(Date.now() - (daysAgo - 2) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      failedAt: status === 'failed' ? new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString() : undefined,
      failureReason: status === 'failed' ? 'Invalid account number' : undefined,
      transactionId: status === 'completed' ? `TXN${Date.now()}${i}` : undefined,
    });
  }

  return payouts;
};

interface IncentiveStore {
  // Incentive data
  incentives: UserIncentive[];
  incomingOutgoing: IncomingOutgoingRecord[];

  // Payout data
  payouts: Payout[];
  bankAccounts: BankAccount[];
  minWithdrawalAmount: number;
  dailyPayoutLimit: number;

  // KYC data
  userKYC: UserKYC | null;

  // Audit logs
  auditLogs: AuditLogEntry[];

  // Computed values
  getTotalIncentivesEarned: () => number;
  getTotalIncentivesPaid: () => number;
  getPendingIncentives: () => number;
  getNetBalance: () => number;

  // Incentive actions
  approveIncentive: (incentiveId: string, adminName: string) => void;
  markIncentivePaid: (incentiveId: string, adminName: string) => void;

  // Payout actions
  addBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'isVerified'>) => void;
  removeBankAccount: (accountId: string) => void;
  setPrimaryBankAccount: (accountId: string) => void;
  initiatePayout: (userId: string, userName: string, amount: number, bankAccountId: string) => boolean;
  updatePayoutStatus: (payoutId: string, status: PayoutStatus, reason?: string) => void;

  // KYC actions
  initializeKYC: (userId: string) => void;
  uploadKYCDocument: (docType: KYCDocument['type'], uri: string) => void;
  submitKYC: () => void;
  approveKYC: (adminName: string) => void;
  rejectKYC: (adminName: string, reason: string) => void;

  // Admin settings
  updatePayoutSettings: (minAmount: number, dailyLimit: number) => void;

  // Audit
  logAuditAction: (action: string, entityType: AuditLogEntry['entityType'], entityId: string, performedBy: string, details?: string) => void;
}

export const useIncentiveStore = create<IncentiveStore>((set, get) => ({
  incentives: generateMockIncentives(),
  incomingOutgoing: generateMockIncomingOutgoing(),
  payouts: generateMockPayouts(),
  bankAccounts: [],
  minWithdrawalAmount: 500,
  dailyPayoutLimit: 50000,
  userKYC: null,
  auditLogs: [],

  getTotalIncentivesEarned: () => {
    return get().incentives.reduce((sum, inc) => sum + inc.amount, 0);
  },

  getTotalIncentivesPaid: () => {
    return get().incentives
      .filter(inc => inc.status === 'paid')
      .reduce((sum, inc) => sum + inc.amount, 0);
  },

  getPendingIncentives: () => {
    return get().incentives
      .filter(inc => inc.status === 'pending' || inc.status === 'approved')
      .reduce((sum, inc) => sum + inc.amount, 0);
  },

  getNetBalance: () => {
    const totalReceivable = get().incomingOutgoing.reduce((sum, rec) => sum + rec.totalReceivable, 0);
    const totalPaid = get().incomingOutgoing.reduce((sum, rec) => sum + rec.totalPaidToUsers, 0);
    return totalReceivable - totalPaid;
  },

  approveIncentive: (incentiveId: string, adminName: string) => {
    set(state => ({
      incentives: state.incentives.map(inc =>
        inc.id === incentiveId
          ? { ...inc, status: 'approved' as IncentiveStatus, approvedAt: new Date().toISOString(), approvedBy: adminName }
          : inc
      ),
    }));
    get().logAuditAction('APPROVE_INCENTIVE', 'incentive', incentiveId, adminName);
  },

  markIncentivePaid: (incentiveId: string, adminName: string) => {
    set(state => ({
      incentives: state.incentives.map(inc =>
        inc.id === incentiveId
          ? { ...inc, status: 'paid' as IncentiveStatus, paidAt: new Date().toISOString() }
          : inc
      ),
    }));
    get().logAuditAction('MARK_PAID', 'incentive', incentiveId, adminName);
  },

  addBankAccount: (account) => {
    const newAccount: BankAccount = {
      ...account,
      id: `BA-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVerified: false,
    };

    set(state => ({
      bankAccounts: [...state.bankAccounts, newAccount],
    }));

    get().logAuditAction('ADD_BANK_ACCOUNT', 'bank_account', newAccount.id, account.userId);
  },

  removeBankAccount: (accountId: string) => {
    const account = get().bankAccounts.find(a => a.id === accountId);
    if (account) {
      set(state => ({
        bankAccounts: state.bankAccounts.filter(a => a.id !== accountId),
      }));
      get().logAuditAction('REMOVE_BANK_ACCOUNT', 'bank_account', accountId, account.userId);
    }
  },

  setPrimaryBankAccount: (accountId: string) => {
    set(state => ({
      bankAccounts: state.bankAccounts.map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId,
      })),
    }));
  },

  initiatePayout: (userId: string, userName: string, amount: number, bankAccountId: string) => {
    const { minWithdrawalAmount, userKYC, bankAccounts } = get();

    // Validation checks
    if (amount < minWithdrawalAmount) {
      return false;
    }

    if (!userKYC || userKYC.status !== 'verified') {
      return false;
    }

    const bankAccount = bankAccounts.find(a => a.id === bankAccountId);
    if (!bankAccount) {
      return false;
    }

    const payout: Payout = {
      id: `PAY-${Date.now()}`,
      userId,
      userName,
      amount,
      bankAccountId,
      bankName: bankAccount.bankName,
      accountNumber: `XXXX${bankAccount.accountNumber.slice(-4)}`,
      status: 'initiated',
      initiatedAt: new Date().toISOString(),
    };

    set(state => ({
      payouts: [payout, ...state.payouts],
    }));

    get().logAuditAction('INITIATE_PAYOUT', 'payout', payout.id, userName, `Amount: ₹${amount}`);
    return true;
  },

  updatePayoutStatus: (payoutId: string, status: PayoutStatus, reason?: string) => {
    set(state => ({
      payouts: state.payouts.map(p => {
        if (p.id === payoutId) {
          const updates: Partial<Payout> = { status };
          if (status === 'processing') updates.processedAt = new Date().toISOString();
          if (status === 'completed') {
            updates.completedAt = new Date().toISOString();
            updates.transactionId = `TXN${Date.now()}`;
          }
          if (status === 'failed') {
            updates.failedAt = new Date().toISOString();
            updates.failureReason = reason;
          }
          return { ...p, ...updates };
        }
        return p;
      }),
    }));

    get().logAuditAction('UPDATE_PAYOUT_STATUS', 'payout', payoutId, 'System', `Status: ${status}`);
  },

  initializeKYC: (userId: string) => {
    set({
      userKYC: {
        userId,
        status: 'not_started',
        documents: [],
        nameMatch: false,
        progressPercentage: 0,
      },
    });
  },

  uploadKYCDocument: (docType: KYCDocument['type'], uri: string) => {
    set(state => {
      if (!state.userKYC) return state;

      const existingIndex = state.userKYC.documents.findIndex(d => d.type === docType);
      const newDoc: KYCDocument = {
        type: docType,
        uri,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };

      let documents = [...state.userKYC.documents];
      if (existingIndex >= 0) {
        documents[existingIndex] = newDoc;
      } else {
        documents.push(newDoc);
      }

      // Calculate progress
      const requiredDocs = ['aadhaar_front', 'aadhaar_back', 'pan', 'selfie'];
      const uploadedCount = documents.filter(d => requiredDocs.includes(d.type)).length;
      const progressPercentage = Math.floor((uploadedCount / requiredDocs.length) * 100);

      return {
        userKYC: {
          ...state.userKYC,
          documents,
          progressPercentage,
        },
      };
    });
  },

  submitKYC: () => {
    set(state => {
      if (!state.userKYC) return state;

      return {
        userKYC: {
          ...state.userKYC,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        },
      };
    });

    const kyc = get().userKYC;
    if (kyc) {
      get().logAuditAction('SUBMIT_KYC', 'kyc', kyc.userId, kyc.userId);
    }
  },

  approveKYC: (adminName: string) => {
    set(state => {
      if (!state.userKYC) return state;

      return {
        userKYC: {
          ...state.userKYC,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminName,
          nameMatch: true,
          documents: state.userKYC.documents.map(d => ({ ...d, status: 'verified' as const })),
        },
      };
    });

    const kyc = get().userKYC;
    if (kyc) {
      get().logAuditAction('APPROVE_KYC', 'kyc', kyc.userId, adminName);
    }
  },

  rejectKYC: (adminName: string, reason: string) => {
    set(state => {
      if (!state.userKYC) return state;

      return {
        userKYC: {
          ...state.userKYC,
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      };
    });

    const kyc = get().userKYC;
    if (kyc) {
      get().logAuditAction('REJECT_KYC', 'kyc', kyc.userId, adminName, `Reason: ${reason}`);
    }
  },

  updatePayoutSettings: (minAmount: number, dailyLimit: number) => {
    set({
      minWithdrawalAmount: minAmount,
      dailyPayoutLimit: dailyLimit,
    });
  },

  logAuditAction: (action, entityType, entityId, performedBy, details) => {
    const log: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      action,
      entityType,
      entityId,
      performedBy,
      timestamp: new Date().toISOString(),
      details,
    };

    set(state => ({
      auditLogs: [log, ...state.auditLogs].slice(0, 500),
    }));
  },
}));
