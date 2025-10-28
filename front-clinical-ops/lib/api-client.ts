import Axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';

// API Base URLs
const AUTH_API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || 'https://auth.clinicalops.co';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.clinicalops.co';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }

  // Get token from localStorage if it exists
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
}

function handleResponseError(error: AxiosError<{ error?: string }>) {
  const message = error.response?.data?.error || error.message;

  // Handle 401 Unauthorized - redirect to login
  if (error.response?.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return Promise.reject(new Error(message));
}

// Auth API Client (for login, register, user management)
export const authApi = Axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

authApi.interceptors.request.use(authRequestInterceptor);
authApi.interceptors.response.use(
  (response) => response.data,
  handleResponseError
);

// Main API Client (for AI transformations, medical records, transcriptions)
export const api = Axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => response.data,
  handleResponseError
);

// Legacy: Export authApi as default for backward compatibility
export default api;
