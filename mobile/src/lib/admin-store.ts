import { operations, operationsSnapshot } from "./admin-operations-api";
import { adminLogin } from "./home-loan-admin-api";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export type AdminRole = "admin" | "ops" | "viewer";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  lastLogin?: string;
  createdAt: string;
}

export type LeadStage =
  | "new"
  | "consent_given"
  | "eligibility_check"
  | "kyc_pending"
  | "kyc_completed"
  | "submitted"
  | "approved"
  | "rejected"
  | "disbursed"
  | "closed";

export type LeadOutcome =
  | "pending"
  | "approved"
  | "rejected"
  | "disbursed"
  | "closed";

export type ProductCategory =
  | "credit-cards"
  | "personal-loans"
  | "home-loans"
  | "vehicle-loans"
  | "business-loans"
  | "insta-loans"
  | "bank-accounts"
  | "health-insurance"
  | "life-insurance"
  | "motor-insurance"
  | "gold-loans"
  | "real-estate";

export interface Lead {
  version?: number;
  homeStage?: string;
  providerDecision?: string;
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
  priority: "low" | "medium" | "high";
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
  extraDetails?: Record<string, string>;
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
  entityType: "lead" | "admin" | "setting" | "export";
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
  new: "New",
  consent_given: "Consent Given",
  eligibility_check: "Eligibility Check",
  kyc_pending: "KYC Pending",
  kyc_completed: "KYC Completed",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  disbursed: "Disbursed",
  closed: "Closed",
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  new: "#3B82F6",
  consent_given: "#8B5CF6",
  eligibility_check: "#06B6D4",
  kyc_pending: "#F59E0B",
  kyc_completed: "#10B981",
  submitted: "#6366F1",
  approved: "#22C55E",
  rejected: "#EF4444",
  disbursed: "#14B8A6",
  closed: "#64748B",
};

export const PRODUCT_LABELS: Record<ProductCategory, string> = {
  "credit-cards": "Credit Cards",
  "personal-loans": "Personal Loans",
  "home-loans": "Home Loans",
  "vehicle-loans": "Vehicle Loans",
  "business-loans": "Business Loans",
  "insta-loans": "Insta Loans",
  "bank-accounts": "Bank Accounts",
  "health-insurance": "Health Insurance",
  "life-insurance": "Life Insurance",
  "motor-insurance": "Motor Insurance",
  "gold-loans": "Gold Loans",
  "real-estate": "Real Estate",
};

export const REJECTION_CODES = [
  { code: "CREDIT_SCORE", label: "Credit Score Failure" },
  { code: "KYC_MISMATCH", label: "KYC Mismatch" },
  { code: "DOC_INCOMPLETE", label: "Document Incomplete" },
  { code: "PARTNER_REJECT", label: "Partner Rejection" },
  { code: "UNREACHABLE", label: "Customer Unreachable" },
  { code: "WITHDRAWN", label: "Customer Withdrew" },
];

interface AdminStore {
  loading: boolean;
  error: string;
  availability: Record<string, string>;
  refresh: () => Promise<boolean>;

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
  addLead: (
    lead: Omit<
      Lead,
      "id" | "createdAt" | "updatedAt" | "notes" | "stageHistory"
    >,
  ) => void;
  updateLeadStage: (
    leadId: string,
    newStage: LeadStage,
    reason?: string,
    note?: string,
  ) => Promise<boolean>;
  assignLead: (leadId: string, owner: string) => Promise<boolean>;
  addLeadNote: (leadId: string, text: string) => Promise<boolean>;
  setFollowUp: (
    leadId: string,
    date: string,
    note?: string,
  ) => Promise<boolean>;

  // Admin actions
  addAdminUser: (user: Omit<AdminUser, "id" | "createdAt">) => void;
  removeAdminUser: (userId: string) => void;

  // Audit
  logAction: (
    action: string,
    entityType: AuditLog["entityType"],
    entityId?: string,
    before?: string,
    after?: string,
  ) => void;
}

export const useAdminStore = create<AdminStore>((set, get) => {
  const perform = async (task: () => Promise<unknown>) => {
    set({ error: "" });
    try {
      await task();
      return await get().refresh();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Operation failed",
      });
      return false;
    }
  };
  const update = (id: string, change: object) =>
    perform(async () => {
      const lead = get().leads.find((l) => l.id === id);
      if (!lead) throw new Error("Application not found. Refresh first.");
      await operations(
        "/applications/" + encodeURIComponent(id),
        { version: lead.version ?? 0, ...change },
        "PATCH",
      );
    });
  return {
    isAuthenticated: false,
    currentAdmin: null,
    adminUsers: [],
    leads: [],
    followUps: [],
    auditLogs: [],
    loading: true,
    error: "",
    availability: {},
    refresh: async () => {
      try {
        const data = await operationsSnapshot();
        set({
          ...data,
          loading: false,
          error: "",
          followUps: data.leads
            .filter((l: Lead) => l.followUpDate)
            .map((l: Lead) => ({
              id: l.id,
              leadId: l.id,
              scheduledAt: l.followUpDate!,
              completed: false,
              createdBy: l.assignedOwner || "",
            })),
        });
        return true;
      } catch (error) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : "Data unavailable",
        });
        return false;
      }
    },
    login: async (email, password) => {
      const user = await adminLogin(email, password);
      if (!user) return false;
      set({ isAuthenticated: true, currentAdmin: user, loading: true });
      await AsyncStorage.setItem("admin_session", JSON.stringify(user));
      return true;
    },
    logout: () => {
      set({
        isAuthenticated: false,
        currentAdmin: null,
        leads: [],
        auditLogs: [],
        adminUsers: [],
        followUps: [],
        loading: true,
        error: "",
      });
      void AsyncStorage.removeItem("admin_session");
      void AsyncStorage.removeItem("paisa_mart_admin_api_token");
    },
    addLead: () => {
      /* Customer routes save to their own APIs; never fabricate an admin record. */
    },
    updateLeadStage: (id, stage, reason, note) =>
      update(id, {
        stage,
        ...(note || reason ? { note: note || reason } : {}),
      }),
    assignLead: (id, owner) => update(id, { assignedOwner: owner }),
    addLeadNote: (id, text) => update(id, { note: text }),
    setFollowUp: (id, date, note) =>
      update(id, { followUpDate: date, ...(note ? { note } : {}) }),
    addAdminUser: () => {
      set({
        error:
          "Use Staff Access below to create a server-backed login with a password.",
      });
    },
    removeAdminUser: (id) => {
      void perform(async () => {
        const user = get().adminUsers.find((u) => u.id === id) as any;
        if (!user) throw new Error("User not found");
        await operations("/staff", { ...user, active: false });
      });
    },
    logAction: () => {
      /* Server APIs write audit events transactionally. */
    },
  };
});
