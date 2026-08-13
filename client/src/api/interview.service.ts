import apiClient from './client';
import type { Interview, InterviewFilters, ScheduleInterviewInput, InterviewStatus } from './types';

export const interviewService = {
  getInterviews: async (filters: InterviewFilters = {}): Promise<Interview[]> => {
    const { data } = await apiClient.get<Interview[]>('/interviews', { params: filters });
    return data;
  },

  getInterviewById: async (id: string): Promise<Interview> => {
    const { data } = await apiClient.get<Interview>(`/interviews/${id}`);
    return data;
  },

  createInterview: async (payload: ScheduleInterviewInput): Promise<Interview> => {
    const { data } = await apiClient.post<Interview>('/interviews', payload);
    return data;
  },

  updateInterview: async (id: string, payload: Partial<ScheduleInterviewInput>): Promise<Interview> => {
    const { data } = await apiClient.put<Interview>(`/interviews/${id}`, payload);
    return data;
  },

  updateInterviewStatus: async (id: string, status: InterviewStatus): Promise<Interview> => {
    const { data } = await apiClient.patch<Interview>(`/interviews/${id}/status`, { status });
    return data;
  },

  cancelInterview: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/interviews/${id}`);
    return data;
  },
};
