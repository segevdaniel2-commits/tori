import axios from 'axios';
import { useAuthStore } from '../store/useStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Convenience hooks
export function useAuth() {
  return {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
  };
}

export function useBusinessApi() {
  return {
    getSettings: () => api.get('/businesses/settings'),
    updateSettings: (data) => api.put('/businesses/settings', data),
    getHours: () => api.get('/businesses/hours'),
    updateHours: (data) => api.put('/businesses/hours', data),
    getStaff: () => api.get('/businesses/staff'),
    createStaff: (data) => api.post('/businesses/staff', data),
    updateStaff: (id, data) => api.put(`/businesses/staff/${id}`, data),
    deleteStaff: (id) => api.delete(`/businesses/staff/${id}`),
    getServices: () => api.get('/businesses/services'),
    createService: (data) => api.post('/businesses/services', data),
    updateService: (id, data) => api.put(`/businesses/services/${id}`, data),
    deleteService: (id) => api.delete(`/businesses/services/${id}`),
    getBlockedTimes: (date) => api.get('/businesses/blocked-times', { params: { date } }),
    createBlockedTime: (data) => api.post('/businesses/blocked-times', data),
    deleteBlockedTime: (id) => api.delete(`/businesses/blocked-times/${id}`),
  };
}

export function useAppointmentsApi() {
  return {
    list: (params) => api.get('/appointments', { params }),
    create: (data) => api.post('/appointments', data),
    update: (id, data) => api.put(`/appointments/${id}`, data),
    cancel: (id) => api.delete(`/appointments/${id}`),
  };
}

export function useCustomersApi() {
  return {
    list: (params) => api.get('/customers', { params }),
    get: (id) => api.get(`/customers/${id}`),
    update: (id, data) => api.put(`/customers/${id}`, data),
  };
}

export function useAnalyticsApi() {
  return {
    overview: () => api.get('/analytics/overview'),
    dailyRevenue: (days) => api.get('/analytics/daily-revenue', { params: { days } }),
    popularServices: () => api.get('/analytics/popular-services'),
    peakHours: () => api.get('/analytics/peak-hours'),
    monthlyReport: (month) => api.get('/analytics/monthly-report', { params: { month } }),
  };
}
