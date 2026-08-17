import apiClient from './client';
import type {
  Candidate,
  PaginatedResponse,
  CandidateFilters,
  CreateCandidateInput,
  CandidateStatus,
  CandidateProfile,
  CandidateProfileSummary,
  SuitableJobItem,
  MyCandidateApplication,
  ApplyJobPayload,
} from './types';

export const candidateService = {
  getCandidates: async (filters: CandidateFilters = {}): Promise<PaginatedResponse<Candidate>> => {
    const { data } = await apiClient.get<PaginatedResponse<Candidate>>('/candidates', { params: filters });
    return data;
  },

  getCandidateById: async (id: string): Promise<Candidate> => {
    const { data } = await apiClient.get<Candidate>(`/candidates/${id}`);
    return data;
  },

  createCandidate: async (payload: CreateCandidateInput): Promise<Candidate> => {
    const { data } = await apiClient.post<Candidate>('/candidates', payload);
    return data;
  },

  updateCandidate: async (id: string, payload: Partial<CreateCandidateInput>): Promise<Candidate> => {
    const { data } = await apiClient.put<Candidate>(`/candidates/${id}`, payload);
    return data;
  },

  updateCandidateStatus: async (id: string, status: CandidateStatus): Promise<Candidate> => {
    const { data } = await apiClient.patch<Candidate>(`/candidates/${id}/status`, { status });
    return data;
  },

  deleteCandidate: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/candidates/${id}`);
    return data;
  },

  // Candidate Portal Methods
  getProfile: async (): Promise<{ user: any; profile: CandidateProfile }> => {
    const { data } = await apiClient.get<{ user: any; profile: CandidateProfile }>('/candidate-portal/profile');
    return data;
  },

  updateProfile: async (payload: CandidateProfile): Promise<CandidateProfile> => {
    const { data } = await apiClient.put<CandidateProfile>('/candidate-portal/profile', payload);
    return data;
  },

  generateProfileSummary: async (): Promise<CandidateProfileSummary> => {
    const { data } = await apiClient.post<CandidateProfileSummary>('/candidate-portal/generate-summary');
    return data;
  },

  getSuitableJobs: async (): Promise<SuitableJobItem[]> => {
    const { data } = await apiClient.get<SuitableJobItem[]>('/candidate-portal/suitable-jobs');
    return data;
  },

  applyForJob: async (payload: string | ApplyJobPayload): Promise<Candidate> => {
    const requestBody = typeof payload === 'string' ? { jobId: payload } : payload;
    const { data } = await apiClient.post<Candidate>('/candidate-portal/apply', requestBody);
    return data;
  },

  getMyApplications: async (): Promise<MyCandidateApplication[]> => {
    const { data } = await apiClient.get<MyCandidateApplication[]>('/candidate-portal/applications');
    return data;
  },
};
