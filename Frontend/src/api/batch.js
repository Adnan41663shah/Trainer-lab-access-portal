import apiClient from './client';

export const batchAPI = {
  /**
   * Get all batches (admin sees all, trainer sees assigned)
   */
  getBatches: async () => {
    const response = await apiClient.get('/batches');
    return response.data;
  },
  
  /**
   * Get single batch by ID
   */
  getBatchById: async (id) => {
    const response = await apiClient.get(`/batches/${id}`);
    return response.data;
  },
  
  /**
   * Create new batch (admin only)
   */
  createBatch: async (data) => {
    const response = await apiClient.post('/batches', data);
    return response.data;
  },
  
  /**
   * Update batch (admin only)
   */
  updateBatch: async (id, data) => {
    const response = await apiClient.put(`/batches/${id}`, data);
    return response.data;
  },
  
  /**
   * Delete batch (admin only)
   */
  deleteBatch: async (id) => {
    const response = await apiClient.delete(`/batches/${id}`);
    return response.data;
  },
  
  /**
   * Cancel batch (admin only)
   */
  cancelBatch: async (id) => {
    const response = await apiClient.patch(`/batches/${id}/cancel`);
    return response.data;
  },
  
  /**
   * Get lab credentials for a batch (trainer only, only when LIVE)
   */
  getLabCredentials: async (id) => {
    const response = await apiClient.get(`/batches/${id}/credentials`);
    return response.data;
  }
};

export const userAPI = {
  /**
   * Get all trainers (admin only)
   */
  getTrainers: async () => {
    const response = await apiClient.get('/users/trainers');
    return response.data;
  }
};
