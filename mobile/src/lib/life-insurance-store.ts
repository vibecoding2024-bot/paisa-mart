import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LifeApplicationStatus = 'New' | 'Contacted' | 'In Process' | 'Closed';

export const POLICY_TYPES = [
  'Term Insurance',
  'Money Back / Pension Scheme',
  'Lump Sum Plan',
  'Child Education Policies',
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export const PREMIUM_SLABS = [
  '₹10,000',
  '₹20,000',
  '₹30,000',
  '₹40,000',
  '₹50,000',
  '₹60,000',
  '₹70,000',
  '₹80,000',
  '₹90,000',
  '₹1,00,000',
  'Others Amount',
] as const;
export type PremiumSlab = (typeof PREMIUM_SLABS)[number];

export const LIFE_STATUS_COLORS: Record<LifeApplicationStatus, string> = {
  New: '#3B82F6',
  Contacted: '#F59E0B',
  'In Process': '#8B5CF6',
  Closed: '#10B981',
};

export interface LifeInsuranceApplication {
  application_id: string;
  user_name: string;
  phone_number: string;
  selected_life_insurer: string;
  policy_type: PolicyType;
  premium_slab: PremiumSlab;
  premium_other_amount: string;
  timestamp: string;
  status: LifeApplicationStatus;
}

interface LifeInsuranceStore {
  applications: LifeInsuranceApplication[];
  addApplication: (
    app: Omit<LifeInsuranceApplication, 'application_id' | 'timestamp' | 'status'>
  ) => string;
  updateStatus: (application_id: string, status: LifeApplicationStatus) => void;
  clearAll: () => void;
}

let _counter = 1;

export const useLifeInsuranceStore = create<LifeInsuranceStore>()(
  persist(
    (set) => ({
      applications: [],
      addApplication: (app) => {
        const application_id = `LI-${Date.now()}-${_counter++}`;
        const newApp: LifeInsuranceApplication = {
          ...app,
          application_id,
          timestamp: new Date().toISOString(),
          status: 'New',
        };
        set((state) => ({ applications: [newApp, ...state.applications] }));
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
      name: 'life-insurance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
