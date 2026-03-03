import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type InsuranceMember = 'myself' | 'spouse' | 'children' | 'parents';
export type ApplicationStatus = 'New' | 'Contacted' | 'In Process' | 'Closed';

export interface HealthInsuranceApplication {
  application_id: string;
  user_name: string;
  phone_number: string;
  selected_health_insurer: string; // insurer chosen from partner list
  selected_members: InsuranceMember[];
  elder_age: string; // age of elder among self/spouse
  children_count: number;
  pincode: string;
  pre_existing_disease: 'Yes' | 'No';
  timestamp: string;
  status: ApplicationStatus;
}

export const MEMBER_LABELS: Record<InsuranceMember, string> = {
  myself: 'Myself',
  spouse: 'Spouse',
  children: 'Children',
  parents: 'Parents / In-laws',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  New: '#3B82F6',
  Contacted: '#F59E0B',
  'In Process': '#8B5CF6',
  Closed: '#10B981',
};

interface HealthInsuranceStore {
  applications: HealthInsuranceApplication[];
  addApplication: (app: Omit<HealthInsuranceApplication, 'application_id' | 'timestamp' | 'status'>) => string;
  updateStatus: (application_id: string, status: ApplicationStatus) => void;
  clearAll: () => void;
}

let _appCounter = 1;

export const useHealthInsuranceStore = create<HealthInsuranceStore>()(
  persist(
    (set) => ({
      applications: [],
      addApplication: (app) => {
        const application_id = `HI-${Date.now()}-${_appCounter++}`;
        const newApp: HealthInsuranceApplication = {
          ...app,
          application_id,
          timestamp: new Date().toISOString(),
          status: 'New',
        };
        set((state) => ({
          applications: [newApp, ...state.applications],
        }));
        return application_id;
      },
      updateStatus: (application_id, status) =>
        set((state) => ({
          applications: state.applications.map((a) =>
            a.application_id === application_id ? { ...a, status } : a
          ),
        })),
      clearAll: () => set({ applications: [] }),
    }),
    {
      name: 'health-insurance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
