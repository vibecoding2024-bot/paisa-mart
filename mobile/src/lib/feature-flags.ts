import { create } from 'zustand';

// Feature flags for coming soon modules
// Set to true to enable the module and open it normally
// Set to false to show the Coming Soon modal
interface FeatureFlagsStore {
  gold_loan_enabled: boolean;
  real_estate_enabled: boolean;
}

export const useFeatureFlags = create<FeatureFlagsStore>(() => ({
  gold_loan_enabled: false,
  real_estate_enabled: false,
}));
