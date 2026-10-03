import api from './api';

export const contactService = {
  list: () => api.get('/api/emergency-contacts').then((r) => r.data),
  create: (data) => api.post('/api/emergency-contacts', data).then((r) => r.data),
  update: (id, data) => api.put(`/api/emergency-contacts/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/emergency-contacts/${id}`).then((r) => r.data),
};
