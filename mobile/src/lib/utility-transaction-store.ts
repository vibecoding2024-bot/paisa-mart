import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ZERO-PAYOUT SAFETY: These three modules are PERMANENTLY locked at 0% commission.
// This configuration overrides any global payout mapping. Do not remove.
export const UTILITY_MODULES = ['cash-cards', 'recharge-bills', 'travel-tickets'] as const;
export type UtilityModule = (typeof UTILITY_MODULES)[number];

export const UTILITY_MODULE_LABELS: Record<UtilityModule, string> = {
  'cash-cards': 'Cash on Credit Card',
  'recharge-bills': 'Recharge & Pay Bills',
  'travel-tickets': 'Travel & Tickets',
};

// Safety function — always returns 0 for utility modules, no matter what
export const getUtilityPayout = (_module: UtilityModule): 0 => 0;
export const getUtilityCommission = (_module: UtilityModule): '0%' => '0%';
export const isUtilityModule = (id: string): id is UtilityModule =>
  (UTILITY_MODULES as readonly string[]).includes(id);

export type UtilityTxStatus = 'Completed' | 'Pending' | 'Failed';

export interface UtilityTransaction {
  id: string;
  user_name: string;
  mobile: string;
  module: UtilityModule;
  transaction_amount: string;
  timestamp: string;
  status: UtilityTxStatus;
  // Safety fields — always forced to zero, never editable
  payout: 0;
  commission: '0%';
}

interface UtilityTransactionStore {
  transactions: UtilityTransaction[];
  addTransaction: (tx: Omit<UtilityTransaction, 'id' | 'payout' | 'commission'>) => void;
  clearAll: () => void;
}

let _idCounter = 1;

export const useUtilityTransactionStore = create<UtilityTransactionStore>()(
  persist(
    (set) => ({
      transactions: [
        // Seed data so the admin screen is never empty
        {
          id: 'utx-1',
          user_name: 'Ravi Kumar',
          mobile: '9876543210',
          module: 'recharge-bills',
          transaction_amount: '₹299',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'Completed',
          payout: 0,
          commission: '0%',
        },
        {
          id: 'utx-2',
          user_name: 'Priya Sharma',
          mobile: '9123456780',
          module: 'travel-tickets',
          transaction_amount: '₹4,500',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'Pending',
          payout: 0,
          commission: '0%',
        },
        {
          id: 'utx-3',
          user_name: 'Anil Mehta',
          mobile: '9988776655',
          module: 'cash-cards',
          transaction_amount: '₹10,000',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'Completed',
          payout: 0,
          commission: '0%',
        },
      ],
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            {
              ...tx,
              id: `utx-${Date.now()}-${_idCounter++}`,
              // SAFETY: always force payout and commission to zero
              payout: 0,
              commission: '0%',
            },
            ...state.transactions,
          ],
        })),
      clearAll: () => set({ transactions: [] }),
    }),
    {
      name: 'utility-transaction-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
