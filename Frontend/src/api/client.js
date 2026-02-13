import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If access token expired, try to refresh
    if (error.response?.status === 401) {
      // If explicit token expiration, try refresh
      if (error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          await apiClient.post('/auth/refresh');
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - session invalid
          window.dispatchEvent(new Event('auth:unauthorized'));
          return Promise.reject(refreshError);
        }
      }
      
      // Other 401s (invalid token, missing token, etc)
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
