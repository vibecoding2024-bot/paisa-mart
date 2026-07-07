import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BusinessLoanData {
  business_type: string;
  loan_amount_required: string;
  loan_purpose: string;
  loan_purpose_other_text: string;
  timestamp: string;
}

interface BusinessLoanStore {
  data: BusinessLoanData | null;
  setData: (data: BusinessLoanData) => void;
  clearData: () => void;
}

export const useBusinessLoanStore = create<BusinessLoanStore>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clearData: () => set({ data: null }),
    }),
    {
      name: 'business-loan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
