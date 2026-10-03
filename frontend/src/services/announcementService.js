import api from './api';

export const announcementService = {
  list: () => api.get('/api/announcements').then((r) => r.data),
  create: (data) => api.post('/api/announcements', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/announcements/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/announcements/${id}`).then((r) => r.data),
};
