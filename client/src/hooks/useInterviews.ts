import { useState, useEffect, useCallback } from 'react';
import { interviewService } from '../api/interview.service';
import type { Interview, InterviewFilters } from '../api/types';

export function useInterviews(initialFilters: InterviewFilters = {}) {
  const [filters, setFilters] = useState<InterviewFilters>(initialFilters);
  const [data, setData] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await interviewService.getInterviews(filters);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return { data, loading, error, setFilters, refetch: fetchInterviews };
}
