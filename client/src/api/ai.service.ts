import apiClient from './client';
import type { AiEvaluation } from './types';

export const aiService = {
  evaluateCandidate: async (candidateId: string): Promise<AiEvaluation> => {
    const { data } = await apiClient.post<AiEvaluation>(`/ai/evaluate/${candidateId}`);
    return data;
  },
};
