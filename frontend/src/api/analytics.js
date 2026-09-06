// src/api/analytics.js
import { apiClient } from './client';

export const analyticsApi = {
  getOverview: () => 
    apiClient('/analytics/overview', { method: 'GET' }),

  getHeatmap: () => 
    apiClient('/analytics/heatmap', { method: 'GET' }),

  getRecurringAlerts: () => 
    apiClient('/analytics/recurring', { method: 'GET' }),

  getResolvedShowcase: () => 
    apiClient('/analytics/showcase', { method: 'GET' })
};
