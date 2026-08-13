import apiClient from './client';
import type { Feedback, SubmitFeedbackInput } from './types';

export const feedbackService = {
  submitFeedback: async (interviewId: string, payload: SubmitFeedbackInput): Promise<Feedback> => {
    const { data } = await apiClient.post<Feedback>(`/interviews/${interviewId}/feedback`, payload);
    return data;
  },

  updateFeedback: async (feedbackId: string, payload: Partial<SubmitFeedbackInput>): Promise<Feedback> => {
    const { data } = await apiClient.put<Feedback>(`/interviews/feedback/${feedbackId}`, payload);
    return data;
  },

  getFeedbackByInterview: async (interviewId: string): Promise<Feedback[]> => {
    const { data } = await apiClient.get<Feedback[]>(`/interviews/${interviewId}/feedback`);
    return data;
  },
};
