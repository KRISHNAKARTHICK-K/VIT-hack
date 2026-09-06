// src/api/auth.js
import { apiClient } from './client';

export const authApi = {
  login: (email, password) => 
    apiClient('/auth/login', { body: { email, password } }),

  register: (userData) => 
    apiClient('/auth/register', { body: userData }),

  getProfile: () => 
    apiClient('/auth/me', { method: 'GET' })
};
