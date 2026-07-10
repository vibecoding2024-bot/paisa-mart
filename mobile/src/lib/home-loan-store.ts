import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HomeLoanData {
  full_name: string;
  mobile_number: string;
  cibil: string;
  date_of_birth: string;
  monthly_income: string;
  existing_emi: string;
  loan_amount_required: string;
  loan_type: string;
  city: string;
  state: string;
  timestamp: string;
}

interface HomeLoanStore {
  data: HomeLoanData | null;
  setData: (data: HomeLoanData) => void;
  clearData: () => void;
}

export const useHomeLoanStore = create<HomeLoanStore>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'home-loan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
