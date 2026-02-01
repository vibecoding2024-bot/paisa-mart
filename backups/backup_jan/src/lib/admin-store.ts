import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type AdminRole = 'admin' | 'ops' | 'viewer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLogin?: string;
  createdAt: string;
}

export type LeadStage =
  | 'new'
  | 'consent_given'
  | 'eligibility_check'
  | 'kyc_pending'
  | 'kyc_completed'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'closed';

export type LeadOutcome = 'pending' | 'approved' | 'rejected' | 'disbursed' | 'closed';

export type ProductCategory =
  | 'credit-cards'
  | 'personal-loans'
  | 'home-loans'
  | 'vehicle-loans'
  | 'business-loans'
  | 'insta-loans'
  | 'bank-accounts'
  | 'health-insurance'
  | 'life-insurance'
  | 'motor-insurance'
  | 'gold-loans'
  | 'real-estate';

export interface Lead {
  id: string;
  userName: string;
  mobile: string;
  email: string;
  productType: ProductCategory;
  provider: string;
  stage: LeadStage;
  outcome: LeadOutcome;
  createdAt: string;
  updatedAt: string;
  assignedOwner?: string;
  priority: 'low' | 'medium' | 'high';
  city?: string;
  state?: string;
  source?: string;
  campaign?: string;
  followUpDate?: string;
  notes: LeadNote[];
  stageHistory: StageChange[];
  rejectionReason?: string;
  rejectionCode?: string;
  partnerRefId?: string;
  partnerStatus?: string;
  kycStarted?: string;
  kycCompleted?: string;
  creditScore?: number;
  consentGiven?: boolean;
}

export interface LeadNote {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
}

export interface StageChange {
  fromStage: LeadStage | null;
  toStage: LeadStage;
  changedBy: string;
  changedAt: string;
  reason?: string;
  note?: string;
}

export interface AuditLog {
  id: string;
  adminUser: string;
  action: string;
  timestamp: string;
  entityType: 'lead' | 'admin' | 'setting' | 'export';
  entityId?: string;
  beforeValue?: string;
  afterValue?: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  scheduledAt: string;
  note?: string;
  completed: boolean;
  createdBy: string;
}

// Stage labels for display
export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  consent_given: 'Consent Given',
  eligibility_check: 'Eligibility Check',
  kyc_pending: 'KYC Pending',
  kyc_completed: 'KYC Completed',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  closed: 'Closed',
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  new: '#3B82F6',
  consent_given: '#8B5CF6',
  eligibility_check: '#06B6D4',
  kyc_pending: '#F59E0B',
  kyc_completed: '#10B981',
  submitted: '#6366F1',
  approved: '#22C55E',
  rejected: '#EF4444',
  disbursed: '#14B8A6',
  closed: '#64748B',
};

export const PRODUCT_LABELS: Record<ProductCategory, string> = {
  'credit-cards': 'Credit Cards',
  'personal-loans': 'Personal Loans',
  'home-loans': 'Home Loans',
  'vehicle-loans': 'Vehicle Loans',
  'business-loans': 'Business Loans',
  'insta-loans': 'Insta Loans',
  'bank-accounts': 'Bank Accounts',
  'health-insurance': 'Health Insurance',
  'life-insurance': 'Life Insurance',
  'motor-insurance': 'Motor Insurance',
  'gold-loans': 'Gold Loans',
  'real-estate': 'Real Estate',
};

export const REJECTION_CODES = [
  { code: 'CREDIT_SCORE', label: 'Credit Score Failure' },
  { code: 'KYC_MISMATCH', label: 'KYC Mismatch' },
  { code: 'DOC_INCOMPLETE', label: 'Document Incomplete' },
  { code: 'PARTNER_REJECT', label: 'Partner Rejection' },
  { code: 'UNREACHABLE', label: 'Customer Unreachable' },
  { code: 'WITHDRAWN', label: 'Customer Withdrew' },
];

// Mock data generators
const generateMockLeads = (): Lead[] => {
  const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Anjali Gupta', 'Rajesh Verma', 'Deepika Nair', 'Suresh Rao', 'Kavita Joshi'];
  const providers = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Bajaj Finance', 'Kotak Bank', 'Yes Bank', 'IndusInd Bank'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Maharashtra', 'West Bengal', 'Gujarat'];
  const stages: LeadStage[] = ['new', 'consent_given', 'eligibility_check', 'kyc_pending', 'kyc_completed', 'submitted', 'approved', 'rejected', 'disbursed', 'closed'];
  const products: ProductCategory[] = ['credit-cards', 'personal-loans', 'home-loans', 'health-insurance', 'bank-accounts'];
  const sources = ['Organic', 'Facebook Ads', 'Google Ads', 'Referral', 'WhatsApp'];

  const leads: Lead[] = [];

  for (let i = 1; i <= 50; i++) {
    const stage = stages[Math.floor(Math.random() * stages.length)];
    let outcome: LeadOutcome = 'pending';
    if (stage === 'approved') outcome = 'approved';
    if (stage === 'rejected') outcome = 'rejected';
    if (stage === 'disbursed') outcome = 'disbursed';
    if (stage === 'closed') outcome = 'closed';

    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const updatedAt = new Date(Date.now() - Math.floor(Math.random() * daysAgo) * 24 * 60 * 60 * 1000).toISOString();

    leads.push({
      id: `LEAD-${String(i).padStart(5, '0')}`,
      userName: names[Math.floor(Math.random() * names.length)],
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `user${i}@example.com`,
      productType: products[Math.floor(Math.random() * products.length)],
      provider: providers[Math.floor(Math.random() * providers.length)],
      stage,
      outcome,
      createdAt,
      updatedAt,
      assignedOwner: Math.random() > 0.3 ? ['Admin', 'Ops Team', 'Support'][Math.floor(Math.random() * 3)] : undefined,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      notes: [],
      stageHistory: [
        {
          fromStage: null,
          toStage: 'new',
          changedBy: 'System',
          changedAt: createdAt,
        },
      ],
      creditScore: Math.random() > 0.5 ? Math.floor(600 + Math.random() * 200) : undefined,
      consentGiven: stages.indexOf(stage) >= 1,
    });
  }

  return leads;
};

interface AdminStore {
  // Auth
  isAuthenticated: boolean;
  currentAdmin: AdminUser | null;
  adminUsers: AdminUser[];

  // Data
  leads: Lead[];
  followUps: FollowUp[];
  auditLogs: AuditLog[];

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Lead actions
  updateLeadStage: (leadId: string, newStage: LeadStage, reason?: string, note?: string) => void;
  assignLead: (leadId: string, owner: string) => void;
  addLeadNote: (leadId: string, text: string) => void;
  setFollowUp: (leadId: string, date: string, note?: string) => void;

  // Admin actions
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  removeAdminUser: (userId: string) => void;

  // Audit
  logAction: (action: string, entityType: AuditLog['entityType'], entityId?: string, before?: string, after?: string) => void;
}

// Pre-configured admin users
const INITIAL_ADMIN_USERS: AdminUser[] = [
  { id: 'admin-1', name: 'Super Admin', email: 'admin@retire.com', role: 'admin', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'admin-2', name: 'Operations Lead', email: 'ops@retire.com', role: 'ops', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'admin-3', name: 'Viewer Account', email: 'viewer@retire.com', role: 'viewer', createdAt: '2024-01-01T00:00:00Z' },
];

export const useAdminStore = create<AdminStore>((set, get) => ({
  isAuthenticated: false,
  currentAdmin: null,
  adminUsers: INITIAL_ADMIN_USERS,
  leads: generateMockLeads(),
  followUps: [],
  auditLogs: [],

  login: async (email: string, password: string) => {
    // Simple auth check - in production, this would be a proper API call
    const user = get().adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && password === 'admin123') {
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      set({ isAuthenticated: true, currentAdmin: updatedUser });
      get().logAction('LOGIN', 'admin', user.id);
      await AsyncStorage.setItem('admin_session', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  },

  logout: () => {
    const admin = get().currentAdmin;
    if (admin) {
      get().logAction('LOGOUT', 'admin', admin.id);
    }
    set({ isAuthenticated: false, currentAdmin: null });
    AsyncStorage.removeItem('admin_session');
  },

  updateLeadStage: (leadId: string, newStage: LeadStage, reason?: string, note?: string) => {
    const admin = get().currentAdmin;
    if (!admin || admin.role === 'viewer') return;

    set(state => ({
      leads: state.leads.map(lead => {
        if (lead.id === leadId) {
          const stageChange: StageChange = {
            fromStage: lead.stage,
            toStage: newStage,
            changedBy: admin.name,
            changedAt: new Date().toISOString(),
            reason,
            note,
          };

          let outcome = lead.outcome;
          if (newStage === 'approved') outcome = 'approved';
          if (newStage === 'rejected') outcome = 'rejected';
          if (newStage === 'disbursed') outcome = 'disbursed';
          if (newStage === 'closed') outcome = 'closed';

          return {
            ...lead,
            stage: newStage,
            outcome,
            updatedAt: new Date().toISOString(),
            stageHistory: [...lead.stageHistory, stageChange],
          };
        }
        return lead;
      }),
    }));

    get().logAction(`STAGE_CHANGE: ${newStage}`, 'lead', leadId);
  },

  assignLead: (leadId: string, owner: string) => {
    const admin = get().currentAdmin;
    if (!admin || admin.role === 'viewer') return;

    set(state => ({
      leads: state.leads.map(lead =>
        lead.id === leadId
          ? { ...lead, assignedOwner: owner, updatedAt: new Date().toISOString() }
          : lead
      ),
    }));

    get().logAction(`ASSIGN: ${owner}`, 'lead', leadId);
  },

  addLeadNote: (leadId: string, text: string) => {
    const admin = get().currentAdmin;
    if (!admin) return;

    const note: LeadNote = {
      id: `note-${Date.now()}`,
      text,
      createdBy: admin.name,
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      leads: state.leads.map(lead =>
        lead.id === leadId
          ? { ...lead, notes: [...lead.notes, note], updatedAt: new Date().toISOString() }
          : lead
      ),
    }));
  },

  setFollowUp: (leadId: string, date: string, note?: string) => {
    const admin = get().currentAdmin;
    if (!admin || admin.role === 'viewer') return;

    const followUp: FollowUp = {
      id: `fu-${Date.now()}`,
      leadId,
      scheduledAt: date,
      note,
      completed: false,
      createdBy: admin.name,
    };

    set(state => ({
      followUps: [...state.followUps, followUp],
      leads: state.leads.map(lead =>
        lead.id === leadId
          ? { ...lead, followUpDate: date, updatedAt: new Date().toISOString() }
          : lead
      ),
    }));

    get().logAction(`FOLLOW_UP: ${date}`, 'lead', leadId);
  },

  addAdminUser: (user) => {
    const admin = get().currentAdmin;
    if (!admin || admin.role !== 'admin') return;

    const newUser: AdminUser = {
      ...user,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      adminUsers: [...state.adminUsers, newUser],
    }));

    get().logAction(`ADD_USER: ${user.email}`, 'admin', newUser.id);
  },

  removeAdminUser: (userId: string) => {
    const admin = get().currentAdmin;
    if (!admin || admin.role !== 'admin') return;

    set(state => ({
      adminUsers: state.adminUsers.filter(u => u.id !== userId),
    }));

    get().logAction(`REMOVE_USER`, 'admin', userId);
  },

  logAction: (action: string, entityType: AuditLog['entityType'], entityId?: string, before?: string, after?: string) => {
    const admin = get().currentAdmin;

    const log: AuditLog = {
      id: `log-${Date.now()}`,
      adminUser: admin?.name || 'System',
      action,
      timestamp: new Date().toISOString(),
      entityType,
      entityId,
      beforeValue: before,
      afterValue: after,
    };

    set(state => ({
      auditLogs: [log, ...state.auditLogs].slice(0, 1000), // Keep last 1000 logs
    }));
  },
}));
