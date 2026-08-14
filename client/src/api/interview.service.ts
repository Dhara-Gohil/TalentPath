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

  saveTranscript: async (id: string, transcript: string): Promise<Interview> => {
    const { data } = await apiClient.put<Interview>(`/interviews/${id}/transcript`, { transcript });
    return data;
  },

  analyzeCopilot: async (id: string, transcript?: string, targetTopic?: string) => {
    const { data } = await apiClient.post(`/interviews/${id}/copilot/analyze`, { transcript, targetTopic });
    return data;
  },

  generateCopilotFeedback: async (id: string, transcript?: string) => {
    const { data } = await apiClient.post(`/interviews/${id}/copilot/generate-feedback`, { transcript });
    return data;
  },
};
