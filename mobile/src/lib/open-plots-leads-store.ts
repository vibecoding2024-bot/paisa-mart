import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OpenPlotsIntent = 'buy' | 'sell';
export type UserType = 'customer' | 'agent';
export type OpenPlotsLeadStatus = 'New' | 'Contacted' | 'Site Visit Scheduled' | 'Negotiation' | 'Closed' | 'Lost';

export interface OpenPlotsLead {
  id: string;

  // Basic Info
  intent: OpenPlotsIntent;
  userType: UserType;

  // Location
  location: string;
  area?: string;

  // Plot Details
  plotSize?: string;

  // Budget/Price
  budgetOrPrice?: string;

  // Timeline
  timeline?: string;

  // Contact
  name: string;
  mobile: string;

  // Additional
  siteVisitRequired?: boolean;

  // Status & Management
  status: OpenPlotsLeadStatus;
  priority: 'Normal' | 'High';
  assignedTo?: string;
  notes?: string;

  // Timestamps
  timestamp: string;
  createdAt: string;
  updatedAt?: string;
}

interface OpenPlotsLeadsStore {
  leads: OpenPlotsLead[];

  // Actions
  addLead: (lead: Omit<OpenPlotsLead, 'id' | 'status' | 'priority' | 'createdAt'>) => OpenPlotsLead;
  updateLeadStatus: (leadId: string, status: OpenPlotsLeadStatus) => void;
  assignLeadTo: (leadId: string, assignee: string) => void;
  addLeadNote: (leadId: string, note: string) => void;
  updateLeadPriority: (leadId: string, priority: 'Normal' | 'High') => void;
  getLeadById: (leadId: string) => OpenPlotsLead | undefined;
  getLeadsByStatus: (status: OpenPlotsLeadStatus) => OpenPlotsLead[];
  getLeadsByIntent: (intent: OpenPlotsIntent) => OpenPlotsLead[];
  getHighPriorityLeads: () => OpenPlotsLead[];

  // Export
  exportLeads: (leads?: OpenPlotsLead[]) => string;
}

// Helper function to generate unique ID
const generateLeadId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `OP-${timestamp}-${random}`.toUpperCase();
};

export const useOpenPlotsLeadsStore = create<OpenPlotsLeadsStore>()(
  persist(
    (set, get) => ({
      leads: [],

      addLead: (leadData) => {
        const newLead: OpenPlotsLead = {
          ...leadData,
          id: generateLeadId(),
          status: 'New',
          priority: leadData.siteVisitRequired ? 'High' : 'Normal',
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          leads: [newLead, ...state.leads],
        }));

        return newLead;
      },

      updateLeadStatus: (leadId, status) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? { ...lead, status, updatedAt: new Date().toISOString() }
              : lead
          ),
        }));
      },

      assignLeadTo: (leadId, assignee) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? { ...lead, assignedTo: assignee, updatedAt: new Date().toISOString() }
              : lead
          ),
        }));
      },

      addLeadNote: (leadId, note) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  notes: lead.notes ? `${lead.notes}\n\n${note}` : note,
                  updatedAt: new Date().toISOString(),
                }
              : lead
          ),
        }));
      },

      updateLeadPriority: (leadId, priority) => {
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? { ...lead, priority, updatedAt: new Date().toISOString() }
              : lead
          ),
        }));
      },

      getLeadById: (leadId) => {
        return get().leads.find((lead) => lead.id === leadId);
      },

      getLeadsByStatus: (status) => {
        return get().leads.filter((lead) => lead.status === status);
      },

      getLeadsByIntent: (intent) => {
        return get().leads.filter((lead) => lead.intent === intent);
      },

      getHighPriorityLeads: () => {
        return get().leads.filter((lead) => lead.priority === 'High' && lead.status !== 'Closed' && lead.status !== 'Lost');
      },

      exportLeads: (leadsToExport) => {
        const leads = leadsToExport || get().leads;

        // Create CSV format
        const headers = [
          'Lead ID',
          'Intent',
          'User Type',
          'Name',
          'Mobile',
          'Location',
          'Area',
          'Plot Size',
          'Budget/Price',
          'Timeline',
          'Site Visit Required',
          'Status',
          'Priority',
          'Assigned To',
          'Notes',
          'Created At',
        ];

        const rows = leads.map((lead) => [
          lead.id,
          lead.intent.toUpperCase(),
          lead.userType.charAt(0).toUpperCase() + lead.userType.slice(1),
          lead.name,
          lead.mobile,
          lead.location,
          lead.area || '',
          lead.plotSize || '',
          lead.budgetOrPrice || '',
          lead.timeline || '',
          lead.siteVisitRequired ? 'Yes' : 'No',
          lead.status,
          lead.priority,
          lead.assignedTo || '',
          lead.notes || '',
          lead.createdAt,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n');

        return csvContent;
      },
    }),
    {
      name: 'open-plots-leads-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to format lead for WhatsApp message
export const formatLeadForWhatsApp = (lead: OpenPlotsLead): string => {
  const intentEmoji = lead.intent === 'buy' ? '🛒' : '🏷️';
  const userTypeEmoji = lead.userType === 'customer' ? '👤' : '💼';

  return `${intentEmoji} *New Open Plots Lead - ${lead.intent.toUpperCase()}*

${userTypeEmoji} *${lead.userType === 'customer' ? 'Customer' : 'Agent'}*

👤 *Name:* ${lead.name}
📱 *Mobile:* ${lead.mobile}

📍 *Location:* ${lead.location}${lead.area ? `\n🗺️ *Area:* ${lead.area}` : ''}${lead.plotSize ? `\n📐 *Plot Size:* ${lead.plotSize}` : ''}${lead.budgetOrPrice ? `\n💰 *${lead.intent === 'buy' ? 'Budget' : 'Expected Price'}:* ${lead.budgetOrPrice}` : ''}${lead.timeline ? `\n⏰ *Timeline:* ${lead.timeline}` : ''}${lead.siteVisitRequired ? `\n🏠 *Site Visit:* Required ✅` : ''}

🆔 *Lead ID:* ${lead.id}
📊 *Status:* ${lead.status}
⭐ *Priority:* ${lead.priority}

🕐 *Time:* ${new Date(lead.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}

---
_Generated by Paisa Mart - Open Plots_`;
};
