import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://tori-production-212b.up.railway.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Appointments
export const appointmentsApi = {
  list: (params?: any) => api.get('/appointments', { params }),
  get: (id: number) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
  delete: (id: number) => api.delete(`/appointments/${id}`),
};

// Customers
export const customersApi = {
  list: (params?: any) => api.get('/customers', { params }),
  get: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
};

// Analytics
export const analyticsApi = {
  summary: (params?: any) => api.get('/analytics/summary', { params }),
  revenue: (params?: any) => api.get('/analytics/revenue', { params }),
};

// Business
export const businessApi = {
  get: () => api.get('/businesses/me'),
  update: (data: any) => api.put('/businesses/me', data),
  hours: () => api.get('/businesses/me/hours'),
  updateHours: (hours: any[]) => api.put('/businesses/me/hours', { hours }),
};

// Services
export const servicesApi = {
  list: () => api.get('/businesses/me/services'),
  create: (data: any) => api.post('/businesses/me/services', data),
  update: (id: number, data: any) => api.put(`/businesses/me/services/${id}`, data),
  delete: (id: number) => api.delete(`/businesses/me/services/${id}`),
};

// Staff
export const staffApi = {
  list: () => api.get('/businesses/me/staff'),
  create: (data: any) => api.post('/businesses/me/staff', data),
  update: (id: number, data: any) => api.put(`/businesses/me/staff/${id}`, data),
};

// Owner Bot (AI)
export const ownerBotApi = {
  chat: (message: string, history: any[]) =>
    api.post('/owner-bot/chat', { message, history }),
};

export default api;
