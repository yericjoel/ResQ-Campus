import api from './api';

export const sosService = {
  create: (data) => api.post('/api/sos', data).then((r) => r.data),
  mine: () => api.get('/api/sos/my').then((r) => r.data),
  all: (activeOnly = false) => api.get('/api/sos', { params: { active: activeOnly } }).then((r) => r.data),
  get: (id) => api.get(`/api/sos/${id}`).then((r) => r.data),
  updateStatus: (id, status) => api.put(`/api/sos/${id}/status`, { status }).then((r) => r.data),
};
