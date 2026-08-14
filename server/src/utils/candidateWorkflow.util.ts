export type CandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SHORTLISTED' | 'HIRED' | 'REJECTED';

const ALLOWED_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  APPLIED: ['SCREENING', 'REJECTED'],
  SCREENING: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

export function isValidCandidateTransition(
  fromStatus: CandidateStatus,
  toStatus: CandidateStatus
): boolean {
  if (fromStatus === toStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  return allowed ? allowed.includes(toStatus) : false;
}
