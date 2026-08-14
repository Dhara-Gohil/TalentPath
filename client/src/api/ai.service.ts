import apiClient from './client';
import type { AiEvaluation } from './types';

export const aiService = {
  evaluateCandidate: async (candidateId: string): Promise<AiEvaluation> => {
    const { data } = await apiClient.post<AiEvaluation>(`/ai/evaluate-resume/${candidateId}`);
    return data;
  },
  evaluateResume: async (candidateId: string): Promise<AiEvaluation> => {
    const { data } = await apiClient.post<AiEvaluation>(`/ai/evaluate-resume/${candidateId}`);
    return data;
  },
  evaluateInterviews: async (candidateId: string): Promise<any> => {
    const { data } = await apiClient.post<any>(`/ai/evaluate-interviews/${candidateId}`);
    return data;
  },
};
