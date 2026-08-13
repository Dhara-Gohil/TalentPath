import apiClient from './client';
import type { User, Role } from './types';

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<{ token: string; user: User }> => {
    const { data } = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
    return data;
  },

  register: async (payload: { name: string; email: string; password: string; role?: Role }): Promise<User> => {
    const { data } = await apiClient.post<User>('/auth/register', payload);
    return data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/auth/users');
    return data;
  },

  updateUserRole: async (userId: string, role: Role): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/auth/users/${userId}/role`, { role });
    return data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/auth/users/${userId}`);
    return data;
  },
};
