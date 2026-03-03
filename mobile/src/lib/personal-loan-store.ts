import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalLoanData {
  employment_type: string;
  credit_score_range: string;
  monthly_income: string;
  total_monthly_emi: string;
  total_outstanding_balance: string;
  timestamp: string;
}

interface PersonalLoanStore {
  data: PersonalLoanData | null;
  setData: (data: PersonalLoanData) => void;
  clearData: () => void;
}

export const usePersonalLoanStore = create<PersonalLoanStore>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'personal-loan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
