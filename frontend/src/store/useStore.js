import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
// Note: token is no longer stored in localStorage — it lives in an httpOnly cookie.
// setAuth accepts (token, business) OR (business) for backward compatibility.
export const useAuthStore = create(
  persist(
    (set) => ({
      business: null,
      isAuthenticated: false,

      setAuth: (tokenOrBusiness, maybeBusiness) => {
        const business = maybeBusiness || tokenOrBusiness;
        set({ business, isAuthenticated: true });
      },

      updateBusiness: (business) => set({ business }),

      logout: () => set({
        business: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'tori-auth',
      partialize: (state) => ({ business: state.business, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Dashboard store
export const useDashboardStore = create((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  sidebarOpen: true,
  currentPage: 'calendar',

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCurrentPage: (page) => set({ currentPage: page }),
}));

// Notification store
export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => set((state) => ({
    notifications: [
      { id: Date.now(), ...notification, createdAt: new Date() },
      ...state.notifications,
    ].slice(0, 50),
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),

  // Mark all as read (keeps notifications visible, removes the badge count)
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
  })),

  // Remove all notifications entirely
  clearAll: () => set(() => ({ notifications: [] })),
}));
