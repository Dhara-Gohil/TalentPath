import { useState, useEffect, useCallback } from 'react';
import { jobService } from '../api/job.service';
import type { Job, JobFilters, PaginatedResponse } from '../api/types';

export function useJobs(initialFilters: JobFilters = {}) {
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [data, setData] = useState<PaginatedResponse<Job> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await jobService.getJobs(filters);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { data, loading, error, setFilters, refetch: fetchJobs };
}
