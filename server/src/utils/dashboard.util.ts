import { CandidateStatus } from './candidateWorkflow.util';

export interface RawCandidateStatusGroup {
  status: string;
  _count: { status: number };
}

export interface RawJobDepartmentGroup {
  department: string;
  _count: { department: number };
}

export function formatPipelineChart(statusGroups: RawCandidateStatusGroup[]): Array<{ name: string; value: number }> {
  const pipelineMap: Record<CandidateStatus, number> = {
    APPLIED: 0,
    SCREENING: 0,
    INTERVIEW: 0,
    SHORTLISTED: 0,
    HIRED: 0,
    REJECTED: 0,
  };

  statusGroups.forEach((group) => {
    if (group.status in pipelineMap) {
      pipelineMap[group.status as CandidateStatus] = group._count.status;
    }
  });

  return Object.entries(pipelineMap).map(([status, count]) => ({
    name: status,
    value: count,
  }));
}

export function formatDepartmentChart(departmentGroups: RawJobDepartmentGroup[]): Array<{ name: string; value: number }> {
  return departmentGroups.map((group) => ({
    name: group.department,
    value: group._count.department,
  }));
}
