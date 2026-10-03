import api from './api';

export const statsService = {
  student: () => api.get('/api/stats/student').then((r) => r.data),
  admin: () => api.get('/api/stats/admin').then((r) => r.data),
  activity: () => api.get('/api/stats/activity').then((r) => r.data),
  search: (q) => api.get('/api/search', { params: { q } }).then((r) => r.data),
};

export const adminService = {
  users: () => api.get('/api/admin/users').then((r) => r.data),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data).then((r) => r.data),
  responders: () => api.get('/api/admin/responders').then((r) => r.data),
};
