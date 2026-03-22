import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      !err.config.url.includes('/auth/login') &&
      localStorage.getItem('token')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('fullName');
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
