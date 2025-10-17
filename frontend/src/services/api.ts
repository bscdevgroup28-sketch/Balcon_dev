import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Demo API methods
export const demoAPI = {
  // Get all demo users for role selection
  getDemoUsers: () => api.get('/demo/users'),
  
  // Demo login
  loginAsRole: (role: string) => api.post('/demo/login', { role }),
  
  // Get demo metrics for a specific role
  getMetrics: (role: string) => api.get(`/demo/metrics/${role}`),
  
  // Get demo projects
  getProjects: () => api.get('/demo/projects'),
};

export default api;
