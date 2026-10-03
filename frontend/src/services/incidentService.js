import api from './api';

export const incidentService = {
  /** values: {type,title,description,location,incidentDate(ISO),severity}, photo: File | null */
  create: (values, photo) => {
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.append(key, value));
    if (photo) form.append('photo', photo);
    return api.post('/api/incidents', form).then((r) => r.data);
  },
  mine: () => api.get('/api/incidents/my').then((r) => r.data),
  all: (filter = 'all') => api.get('/api/incidents', { params: { filter } }).then((r) => r.data),
  get: (id) => api.get(`/api/incidents/${id}`).then((r) => r.data),
  update: (id, data) => api.put(`/api/incidents/${id}`, data).then((r) => r.data),
};
