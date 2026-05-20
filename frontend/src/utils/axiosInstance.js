import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_URL;
const baseURL = envBaseUrl && envBaseUrl.trim()
  ? envBaseUrl.trim()
  : 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL,
});

// Add interceptor to inject fresh token before every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;