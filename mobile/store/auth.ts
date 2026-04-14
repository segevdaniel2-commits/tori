import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';

interface AuthState {
  token: string | null;
  user: any | null;
  business: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  business: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, business } = res.data;
    await AsyncStorage.setItem('token', token);
    set({ token, business, user: business });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ token: null, user: null, business: null });
  },

  loadFromStorage: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await authApi.me();
        set({ token, business: res.data, user: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.removeItem('token');
      set({ token: null, isLoading: false });
    }
  },
}));
