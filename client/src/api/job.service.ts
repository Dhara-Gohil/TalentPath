import apiClient from './client';
import type { Job, PaginatedResponse, JobFilters, CreateJobInput, JobStatus } from './types';

export const jobService = {
  getJobs: async (filters: JobFilters = {}): Promise<PaginatedResponse<Job>> => {
    const { data } = await apiClient.get<PaginatedResponse<Job>>('/jobs', { params: filters });
    return data;
  },

  getJobById: async (id: string): Promise<Job> => {
    const { data } = await apiClient.get<Job>(`/jobs/${id}`);
    return data;
  },

  createJob: async (payload: CreateJobInput): Promise<Job> => {
    const { data } = await apiClient.post<Job>('/jobs', payload);
    return data;
  },

  updateJob: async (id: string, payload: Partial<CreateJobInput>): Promise<Job> => {
    const { data } = await apiClient.put<Job>(`/jobs/${id}`, payload);
    return data;
  },

  updateJobStatus: async (id: string, status: JobStatus): Promise<Job> => {
    const { data } = await apiClient.put<Job>(`/jobs/${id}`, { status });
    return data;
  },

  deleteJob: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/jobs/${id}`);
    return data;
  },
};
