import axios from 'axios';
import { store } from '../store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const axiosClient = axios.create({
  baseURL: BACKEND_URL,
});

axiosClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
