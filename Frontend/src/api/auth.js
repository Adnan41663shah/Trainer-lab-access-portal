import apiClient from './client';

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  
  /**
   * Login user
   */
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  
  /**
   * Refresh access token
   */
  refresh: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
  
  /**
   * Logout user
   */
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  /**
   * Get current user profile
   */
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};
