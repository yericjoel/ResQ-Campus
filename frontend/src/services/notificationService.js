import api from './api';

export const notificationService = {
  list: () => api.get('/api/notifications').then((r) => r.data),
  markRead: (id) => api.put(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put('/api/notifications/read-all').then((r) => r.data),
};
