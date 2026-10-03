import api from './api';

export const lostFoundService = {
  /** values: {itemType,itemName,category,description,location,date(yyyy-mm-dd),contactPreference} */
  create: (values, photo) => {
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    if (photo) form.append('photo', photo);
    return api.post('/api/lost-found', form).then((r) => r.data);
  },
  list: (params = {}) => api.get('/api/lost-found', { params }).then((r) => r.data),
  get: (id) => api.get(`/api/lost-found/${id}`).then((r) => r.data),
  update: (id, data) => api.put(`/api/lost-found/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/lost-found/${id}`).then((r) => r.data),
  suggestions: (id) => api.get(`/api/lost-found/${id}/suggestions`).then((r) => r.data),
  matches: () => api.get('/api/lost-found/matches').then((r) => r.data),
  proposeMatch: (lostItemId, foundItemId) =>
    api.post('/api/lost-found/matches', { lostItemId, foundItemId }).then((r) => r.data),
  reviewMatch: (id, matchStatus) => api.put(`/api/lost-found/matches/${id}`, { matchStatus }).then((r) => r.data),
};
