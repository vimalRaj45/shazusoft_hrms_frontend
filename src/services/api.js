import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shazusoft_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle 401
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('shazusoft_token');
    localStorage.removeItem('shazusoft_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const attendanceAPI = {
  checkGeofence: (coords) => api.post('/attendance/check-geofence', coords),
  getToday: () => api.get('/attendance/today'),
  punchIn: (coords) => api.post('/attendance/punch-in', coords),
  punchOut: (coords) => api.post('/attendance/punch-out', coords),
  getMyHistory: () => api.get('/attendance/my-history'),
  getMyMonthlyHistory: (month) => api.get('/attendance/my-monthly-history', { params: { month } }),
  getStaffMonthlyHistory: (params) => api.get('/attendance/staff-monthly-history', { params }),
  getAll: () => api.get('/attendance/all'),
  adminOverride: (data) => api.post('/attendance/admin-override', data),
  getHolidays: () => api.get('/attendance/holidays')  // Staff-accessible holiday list
};

export const communicationsAPI = {
  getRequests: () => api.get('/communications/requests'),
  requestRegularization: (data) => api.post('/communications/request-regularization', data),
  resolveRequest: (data) => api.post('/communications/resolve-request', data),
  getLogs: () => api.get('/communications/logs')
};

export const tasksAPI = {
  assign: (taskData) => api.post('/tasks/assign', taskData),
  getMyAssigned: () => api.get('/tasks/my-assigned'),
  updateProgress: (id, data) => api.put(`/tasks/${id}/progress`, data),
  getAllAssigned: (params) => api.get('/tasks/all', { params }),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export const workDoneAPI = {
  create: (taskData) => api.post('/workdone', taskData),
  getMyTasks: (date) => api.get('/workdone/my-tasks', { params: { date } }),
  getAllTasks: (params) => api.get('/workdone/all', { params }),
  update: (id, taskData) => api.put(`/workdone/${id}`, taskData),
  delete: (id) => api.delete(`/workdone/${id}`)
};

export const leavesAPI = {
  getBalances: (params) => api.get('/leaves/balances', { params }),
  apply: (leaveData) => api.post('/leaves/apply', leaveData),
  applyPermission: (data) => api.post('/leaves/apply-permission', data),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  getMyPermissions: () => api.get('/leaves/my-permissions'),
  getAllLeaves: () => api.get('/leaves/all'),
  getAllPermissions: () => api.get('/leaves/all-permissions'),
  updateStatus: (id, status, rejection_reason) => api.put(`/leaves/${id}/status`, typeof status === 'object' ? status : { status, rejection_reason }),
  updatePermissionStatus: (id, status, rejection_reason) => api.put(`/leaves/permissions/${id}/status`, typeof status === 'object' ? status : { status, rejection_reason })
};

export const evaluationsAPI = {
  getMonthlyStatus: () => api.get('/evaluations/monthly-status'),
  getPrefillTasks: (params) => api.get('/evaluations/prefill-tasks', { params }),
  submit: (data) => api.post('/evaluations/submit', data),
  getMyEvaluations: () => api.get('/evaluations/my-evaluations'),
  getAllEvaluations: () => api.get('/evaluations/all'),
  submitManagerReview: (id, data) => api.put(`/evaluations/${id}/manager-review`, data),
  getPrefillWeeklyTasks: () => api.get('/evaluations/prefill-weekly-tasks'),
  submitWeekly: (data) => api.post('/evaluations/weekly-submit', data),
  getMyWeekly: () => api.get('/evaluations/my-weekly'),
  getAllWeekly: () => api.get('/evaluations/all-weekly')
};

export const reportsAPI = {
  getEmployeeFullReport: (params) => api.get('/reports/employee-full-report', { params }),
  generate: (data) => api.post('/reports/generate', data),
  getHistory: () => api.get('/reports/history')
};

export const adminAPI = {
  getLiveStatus: () => api.get('/admin/live-status'),
  getEmployees: () => api.get('/admin/employees'),
  createEmployee: (data) => api.post('/admin/employees', data),
  updateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
  updateWorkMode: (id, work_mode) => api.patch(`/admin/employees/${id}/work-mode`, { work_mode }),
  freezeDocuments: (id, data) => api.post(`/admin/employees/${id}/freeze-documents`, data),
  getSettings: () => api.get('/admin/settings'),
  // Geofence is read-only (ENV only) — no updateGeofence
  getHolidays: () => api.get('/admin/holidays'),
  addHoliday: (data) => api.post('/admin/holidays', data),
  deleteHoliday: (date) => api.delete(`/admin/holidays/${date}`)
};

export const searchAPI = {
  globalSearch: (query) => api.get('/search', { params: { q: query } })
};

export const ticketsAPI = {
  getTickets: (params) => api.get('/tickets', { params }),
  createTicket: (data) => api.post('/tickets', data),
  getTicket: (id) => api.get(`/tickets/${id}`),
  getMessages: (id) => api.get(`/tickets/${id}/messages`),
  sendMessage: (id, data) => api.post(`/tickets/${id}/messages`, data),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  getBroadcasts: () => api.get('/tickets/broadcasts/all'),
  createBroadcast: (data) => api.post('/tickets/broadcasts', data)
};

export const uploadsAPI = {
  uploadBase64: (data) => api.post('/uploads/base64', data),
  deleteFile: (key) => api.delete(`/uploads/file/${key}`)
};

export const notificationsAPI = {
  getVapidKey: () => api.get('/notifications/vapid-public-key'),
  subscribe: (data) => api.post('/notifications/subscribe', data),
  unsubscribe: (data) => api.post('/notifications/unsubscribe', data),
  sendTest: () => api.post('/notifications/send-test'),
  broadcast: (data) => api.post('/notifications/broadcast', data),
  getStatus: () => api.get('/notifications/status')
};

export default api;


