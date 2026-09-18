import axios from 'axios';
import { API_BASE_URL } from './api';

const kernelClient = axios.create({
  baseURL: `${API_BASE_URL}/kernel`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Isolated Kernel JWT Token
kernelClient.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('shazusoft_kernel_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor
kernelClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('shazusoft_kernel_token');
        localStorage.removeItem('shazusoft_kernel_user');
      }
    }
    return Promise.reject(error);
  }
);

export const kernelAPI = {
  // Authentication (Root Email OTP Only)
  getAuthConfig: () => kernelClient.get('/auth/config'),
  sendOTP: (email) => kernelClient.post('/auth/send-otp', { email }),
  verifyOTP: (email, otp) => kernelClient.post('/auth/verify-otp', { email, otp }),
  getMe: () => kernelClient.get('/auth/me'),
  logout: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('shazusoft_kernel_token');
      localStorage.removeItem('shazusoft_kernel_user');
    }
  },

  // Schema & Tables
  getTables: () => kernelClient.get('/tables'),
  getTableData: (table, params = {}) => kernelClient.get(`/tables/${table}`, { params }),
  getTableRecord: (table, id) => kernelClient.get(`/tables/${table}/${id}`),

  // Audited Universal CRUD
  createRecord: (table, data, reason = '') =>
    kernelClient.post(`/tables/${table}`, { ...data, _reason: reason }, {
      headers: { 'x-audit-reason': reason }
    }),

  updateRecord: (table, id, data, reason = '') =>
    kernelClient.put(`/tables/${table}/${id}`, { ...data, _reason: reason }, {
      headers: { 'x-audit-reason': reason }
    }),

  deleteRecord: (table, id, reason = '') =>
    kernelClient.delete(`/tables/${table}/${id}`, {
      data: { reason },
      headers: { 'x-audit-reason': reason }
    }),

  // Audit Ledger & Rollback
  getAuditLogs: (params = {}) => kernelClient.get('/audit/logs', { params }),
  rollbackRecord: (logId, reason = '') => kernelClient.post(`/audit/rollback/${logId}`, { reason }),
  exportAuditLogs: (format = 'csv') => {
    if (format === 'csv') {
      return kernelClient.get('/audit/export?format=csv', { responseType: 'blob' });
    }
    return kernelClient.get('/audit/export?format=json');
  },

  // Diagnostics & System Maintenance
  getDiagnostics: () => kernelClient.get('/system/diagnostics'),
  clearCache: (table = '') => kernelClient.post('/system/clear-cache', { table })
};

export default kernelAPI;
