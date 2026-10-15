import type { PersonalLoanReceipt } from './personal-loan-api';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalLoanData {
  full_name: string;
  mobile_number: string;
  cibil: string;
  date_of_birth: string;
  city: string;
  state: string;
  company_name: string;
  monthly_income: string;
  loan_amount_required: string;
  existing_emi: string;
  employment_type: string;
  timestamp: string;
}

interface PersonalLoanStore {
  receipt: PersonalLoanReceipt | null;
  setReceipt: (receipt: PersonalLoanReceipt) => void;
  data: PersonalLoanData | null;
  setData: (data: PersonalLoanData) => void;
  clearData: () => void;
}

export const usePersonalLoanStore = create<PersonalLoanStore>()(
  persist(
    (set) => ({
      receipt: null,
      setReceipt: (receipt) => set({ receipt }),
      data: null,
      setData: (data) => set({ data }),
      clearData: () => set({ data: null, receipt: null }),
    }),
    {
      name: 'personal-loan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
