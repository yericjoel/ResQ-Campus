import api from './api';

export const authService = {
  register: (data) => api.post('/api/auth/register', data).then((r) => r.data),
  login: (email, password) => api.post('/api/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/api/auth/logout').catch(() => {}),
  profile: () => api.get('/api/users/profile').then((r) => r.data),
  updateProfile: (data) => api.put('/api/users/profile', data).then((r) => r.data),
  uploadPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/api/users/profile/photo', form).then((r) => r.data);
  },
};
