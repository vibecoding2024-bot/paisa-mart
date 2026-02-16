import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type VehicleInsuranceLeadStatus = 'New' | 'Contacted' | 'Quote Sent' | 'Policy Issued' | 'Closed' | 'Lost';

export interface VehicleInsuranceLead {
  id: string;

  // Vehicle Info
  vehicleCategory: string;
  vehicleType: string;
  vehicleNumber: string;
  registrationYear: string;
  insuranceExpiryDate: string;

  // Owner Info
  ownerName: string;
  mobile: string;
  city: string;

  // Status & Management
  status: VehicleInsuranceLeadStatus;
  assignedTo?: string;
  notes?: string;

  // Timestamps
  timestamp: string;
  createdAt: string;
  updatedAt?: string;
}

interface VehicleInsuranceLeadsStore {
  leads: VehicleInsuranceLead[];

  // Actions
  addLead: (lead: Omit<VehicleInsuranceLead, 'id' | 'status' | 'createdAt'>) => VehicleInsuranceLead;
  updateLeadStatus: (leadId: string, status: VehicleInsuranceLeadStatus) => void;
  assignLeadTo: (leadId: string, assignee: string) => void;
  addLeadNote: (leadId: string, note: string) => void;
  getLeadById: (leadId: string) => VehicleInsuranceLead | undefined;
  getLeadsByStatus: (status: VehicleInsuranceLeadStatus) => VehicleInsuranceLead[];
  getLeadsByVehicleCategory: (category: string) => VehicleInsuranceLead[];

  // Export
  exportLeads: (leads?: VehicleInsuranceLead[]) => string;
}

// Helper function to generate unique ID
const generateLeadId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `VI-${timestamp}-${random}`.toUpperCase();
};

export const useVehicleInsuranceLeadsStore = create<VehicleInsuranceLeadsStore>()(
  persist(
    (set, get) => ({
      leads: [],

      addLead: (leadData) => {
        const newLead: VehicleInsuranceLead = {
          ...leadData,
          id: generateLeadId(),
          status: 'New',
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

      getLeadById: (leadId) => {
        return get().leads.find((lead) => lead.id === leadId);
      },

      getLeadsByStatus: (status) => {
        return get().leads.filter((lead) => lead.status === status);
      },

      getLeadsByVehicleCategory: (category) => {
        return get().leads.filter((lead) => lead.vehicleCategory === category);
      },

      exportLeads: (leadsToExport) => {
        const leads = leadsToExport || get().leads;

        // Create CSV format
        const headers = [
          'Lead ID',
          'Owner Name',
          'Mobile',
          'Vehicle Category',
          'Vehicle Type',
          'Vehicle Number',
          'Registration Year',
          'Insurance Expiry Date',
          'City',
          'Status',
          'Assigned To',
          'Notes',
          'Created At',
        ];

        const rows = leads.map((lead) => [
          lead.id,
          lead.ownerName,
          lead.mobile,
          lead.vehicleCategory,
          lead.vehicleType,
          lead.vehicleNumber,
          lead.registrationYear,
          lead.insuranceExpiryDate,
          lead.city,
          lead.status,
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
      name: 'vehicle-insurance-leads-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to format lead for WhatsApp message
export const formatLeadForWhatsApp = (lead: VehicleInsuranceLead): string => {
  const categoryEmoji = lead.vehicleCategory === 'four-wheelers' ? '🚙' :
                        lead.vehicleCategory === 'commercial-vehicles' ? '🚚' :
                        lead.vehicleCategory === 'passenger-vehicles' ? '🚌' :
                        lead.vehicleCategory === 'special-vehicles' ? '🚜' : '🛻';

  return `${categoryEmoji} *New Motor Insurance Lead*

🚗 *Vehicle Type:* ${lead.vehicleType}
📋 *Vehicle Number:* ${lead.vehicleNumber}
📅 *Registration Year:* ${lead.registrationYear}
⏰ *Insurance Expiry:* ${lead.insuranceExpiryDate}

👤 *Owner Name:* ${lead.ownerName}
📱 *Mobile:* ${lead.mobile}
📍 *City:* ${lead.city}

🆔 *Lead ID:* ${lead.id}
📊 *Status:* ${lead.status}

🕐 *Time:* ${new Date(lead.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}

---
_Generated by Paisa Mart - Motor Insurance_`;
};
