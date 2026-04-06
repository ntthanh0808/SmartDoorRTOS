import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/constants';
import Constants from 'expo-constants';

let _token = null;
let _onUnauthorized = null;

export const setAuthToken = (token) => { _token = token; };
export const clearAuthToken = () => { _token = null; };
export const setOnUnauthorized = (fn) => { _onUnauthorized = fn; };

// Create axios instance without custom adapter to avoid WebSocket conflicts
const api = axios.create({ 
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  // Add User-Agent to identify app requests
  config.headers['User-Agent'] = `Expo/${Constants.expoConfig?.version || '1.0.0'}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (
      err.response?.status === 401 &&
      !err.config.url.includes('/auth/login') &&
      _token
    ) {
      clearAuthToken();
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('fullName');
      _onUnauthorized?.();
    }
    return Promise.reject(err);
  }
);

export default api;
