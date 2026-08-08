import axios from 'axios';
import {
  API_BASE,
  USER_TOKEN_KEY,
  ADMIN_TOKEN_KEY,
  getStorageItem,
} from './config';

function createClient(tokenKey) {
  const client = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = getStorageItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';
      return Promise.reject(new Error(message));
    }
  );

  return client;
}

export const userApi = createClient(USER_TOKEN_KEY);
export const adminApi = createClient(ADMIN_TOKEN_KEY);
export const publicApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);
