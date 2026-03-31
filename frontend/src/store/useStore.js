import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      business: null,
      isAuthenticated: false,

      setAuth: (token, business) => set({
        token,
        business,
        isAuthenticated: true,
      }),

      updateBusiness: (business) => set({ business }),

      logout: () => set({
        token: null,
        business: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'tori-auth',
      partialize: (state) => ({ token: state.token, business: state.business, isAuthenticated: state.isAuthenticated }),
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

  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
  })),

  unreadCount: () => {
    // This is a derived value, use it via get()
  },
}));
