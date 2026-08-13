import { useState, useEffect, useCallback } from 'react';
import { candidateService } from '../api/candidate.service';
import type { Candidate, CandidateFilters, PaginatedResponse } from '../api/types';

export function useCandidates(initialFilters: CandidateFilters = {}) {
  const [filters, setFilters] = useState<CandidateFilters>(initialFilters);
  const [data, setData] = useState<PaginatedResponse<Candidate> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await candidateService.getCandidates(filters);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return { data, loading, error, setFilters, refetch: fetchCandidates };
}
