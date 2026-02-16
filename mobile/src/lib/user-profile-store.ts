import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  phoneNumber: string;
  email: string;
  occupation: string;
  qualification: string;
  annualIncome: string;
  pincode: string;
  panCard?: string;
  cibilScore?: string;
  dateOfBirth?: {
    day: string;
    month: string;
    year: string;
  };
  createdAt: string;
  updatedAt?: string;
}

interface UserProfileStore {
  profile: UserProfile | null;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  getFirstName: () => string;
  hasProfile: () => boolean;
}

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) => {
        set({
          profile: {
            ...profile,
            createdAt: profile.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      clearProfile: () => {
        set({ profile: null });
      },

      getFirstName: () => {
        const profile = get().profile;
        if (!profile || !profile.name) return '';

        // Extract first name (first word before space)
        const firstName = profile.name.trim().split(' ')[0];
        return firstName;
      },

      hasProfile: () => {
        const profile = get().profile;
        return profile !== null && profile.name !== '';
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to get time-based greeting
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good Evening';
  } else {
    return 'Welcome';
  }
};
