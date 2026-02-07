import { create } from 'zustand';

export type NotificationType = 'incentive_approved' | 'payout_success' | 'kyc_approved' | 'kyc_rejected' | 'general';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;

  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Helper to create notifications for different events
export const createIncentiveApprovedNotification = (amount: number, productType: string) => ({
  type: 'incentive_approved' as NotificationType,
  title: 'Incentive Approved',
  message: `Your ₹${amount} incentive for ${productType} has been approved and is ready for withdrawal.`,
  actionUrl: '/earnings',
});

export const createPayoutSuccessNotification = (amount: number, bankName: string) => ({
  type: 'payout_success' as NotificationType,
  title: 'Payout Successful',
  message: `₹${amount} has been transferred to your ${bankName} account successfully.`,
  actionUrl: '/earnings',
});

export const createKYCApprovedNotification = () => ({
  type: 'kyc_approved' as NotificationType,
  title: 'KYC Verified',
  message: 'Your KYC verification is complete. You can now withdraw your earnings.',
  actionUrl: '/kyc',
});

export const createKYCRejectedNotification = (reason: string) => ({
  type: 'kyc_rejected' as NotificationType,
  title: 'KYC Rejected',
  message: `Your KYC was rejected: ${reason}. Please re-upload your documents.`,
  actionUrl: '/kyc',
});

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [
    {
      id: 'notif-1',
      type: 'incentive_approved',
      title: 'Incentive Approved',
      message: 'Your ₹2,000 incentive for HDFC Credit Card sale has been approved.',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionUrl: '/earnings',
    },
    {
      id: 'notif-2',
      type: 'payout_success',
      title: 'Payout Successful',
      message: '₹5,000 has been transferred to your HDFC Bank account.',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      actionUrl: '/earnings',
    },
    {
      id: 'notif-3',
      type: 'kyc_approved',
      title: 'KYC Verified',
      message: 'Your KYC verification is complete. You can now withdraw your earnings.',
      read: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      actionUrl: '/kyc',
    },
  ],
  unreadCount: 1,

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (notificationId: string) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        return {
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    });
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
