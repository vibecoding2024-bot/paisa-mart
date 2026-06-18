import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WalletTxType = 'credit' | 'debit';
export type WalletTxCategory = 'add_money' | 'bank_transfer';

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  category: WalletTxCategory;
  amount: number;
  title: string;
  subtitle: string;
  timestamp: string;
  balanceAfter: number;
}

interface WalletStore {
  balance: number;
  transactions: WalletTransaction[];
  /** Credit money into the wallet. Returns the created transaction. */
  addMoney: (amount: number, method?: string) => WalletTransaction;
  /** Debit money to a bank account. Returns the transaction, or null if insufficient balance. */
  transferToBank: (amount: number, bankLabel: string) => WalletTransaction | null;
  clearAll: () => void;
}

let _idCounter = 1;
const makeId = () => `wtx-${Date.now()}-${_idCounter++}`;

/** Format a number as Indian Rupees, e.g. 1234567 -> "₹12,34,567". */
export const formatINR = (amount: number): string => {
  const negative = amount < 0;
  const n = Math.round(Math.abs(amount));
  const s = String(n);
  let grouped: string;
  if (s.length > 3) {
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const parts: string[] = [];
    while (rest.length > 2) {
      parts.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest.length) parts.unshift(rest);
    grouped = parts.join(',') + ',' + last3;
  } else {
    grouped = s;
  }
  return (negative ? '-₹' : '₹') + grouped;
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],

      addMoney: (amount, method = 'UPI') => {
        const balanceAfter = get().balance + amount;
        const tx: WalletTransaction = {
          id: makeId(),
          type: 'credit',
          category: 'add_money',
          amount,
          title: 'Money Added',
          subtitle: `Added via ${method}`,
          timestamp: new Date().toISOString(),
          balanceAfter,
        };
        set((state) => ({
          balance: balanceAfter,
          transactions: [tx, ...state.transactions],
        }));
        return tx;
      },

      transferToBank: (amount, bankLabel) => {
        const current = get().balance;
        if (amount <= 0 || amount > current) return null;
        const balanceAfter = current - amount;
        const tx: WalletTransaction = {
          id: makeId(),
          type: 'debit',
          category: 'bank_transfer',
          amount,
          title: 'Transferred to Bank',
          subtitle: bankLabel,
          timestamp: new Date().toISOString(),
          balanceAfter,
        };
        set((state) => ({
          balance: balanceAfter,
          transactions: [tx, ...state.transactions],
        }));
        return tx;
      },

      clearAll: () => set({ balance: 0, transactions: [] }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
