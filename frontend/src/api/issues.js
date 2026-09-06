// src/api/issues.js
import { apiClient } from './client';

export const issuesApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'All' && val !== '') {
        params.append(key, val);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient(`/issues${query}`, { method: 'GET' });
  },

  getById: (id) => 
    apiClient(`/issues/${id}`, { method: 'GET' }),

  getDuplicates: (id) => 
    apiClient(`/issues/${id}/duplicates`, { method: 'GET' }),

  create: (formDataOrData) => 
    apiClient('/issues', { method: 'POST', body: formDataOrData }),

  verify: (id, verificationData) => 
    apiClient(`/issues/${id}/verify`, { method: 'PATCH', body: verificationData }),

  assign: (id, assignmentData) => 
    apiClient(`/issues/${id}/assign`, { method: 'PATCH', body: assignmentData }),

  updateStatus: (id, statusData) => 
    apiClient(`/issues/${id}/status`, { method: 'PATCH', body: statusData }),

  addProgress: (id, progressData) => 
    apiClient(`/issues/${id}/progress`, { method: 'POST', body: progressData }),

  resolve: (id, formDataOrData) => 
    apiClient(`/issues/${id}/resolve`, { method: 'POST', body: formDataOrData }),

  confirmResolution: (id, comment) => 
    apiClient(`/issues/${id}/confirm`, { method: 'POST', body: { comment } }),

  merge: (mergeData) => 
    apiClient('/issues/merge', { method: 'POST', body: mergeData })
};
