import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MotorApplicationStatus = 'New' | 'Contacted' | 'In Process' | 'Closed';

export const VEHICLE_TYPES = [
  'Car',
  'Trucks',
  'Buses',
  'Taxis',
  'Delivery Vans',
  'Auto',
  'Tractors',
  'Harvesters',
  'Ambulances',
  'JCB',
  'Cranes',
  'Lorry',
  'Others',
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const INSURANCE_TYPES = [
  'Third Party Insurance',
  'Full Insurance (Comprehensive)',
  'Nil Depreciation (Nil Dep)',
] as const;
export type InsuranceType = (typeof INSURANCE_TYPES)[number];

export const MOTOR_STATUS_COLORS: Record<MotorApplicationStatus, string> = {
  New: '#3B82F6',
  Contacted: '#F59E0B',
  'In Process': '#8B5CF6',
  Closed: '#10B981',
};

export interface MotorInsuranceApplication {
  application_id: string;
  user_name: string;
  phone_number: string;
  selected_motor_insurer: string;
  vehicle_type: VehicleType;
  vehicle_type_other_text: string;
  insurance_type: InsuranceType;
  model_year: string;
  timestamp: string;
  status: MotorApplicationStatus;
}

interface MotorInsuranceStore {
  applications: MotorInsuranceApplication[];
  addApplication: (
    app: Omit<MotorInsuranceApplication, 'application_id' | 'timestamp' | 'status'>
  ) => string;
  updateStatus: (application_id: string, status: MotorApplicationStatus) => void;
  clearAll: () => void;
}

let _counter = 1;

export const useMotorInsuranceStore = create<MotorInsuranceStore>()(
  persist(
    (set) => ({
      applications: [],
      addApplication: (app) => {
        const application_id = `MI-${Date.now()}-${_counter++}`;
        const newApp: MotorInsuranceApplication = {
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
      name: 'motor-insurance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
