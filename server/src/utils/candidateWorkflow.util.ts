export type CandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SHORTLISTED' | 'HIRED' | 'REJECTED';

const ALLOWED_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  APPLIED: ['SCREENING', 'INTERVIEW', 'REJECTED'],
  SCREENING: ['SHORTLISTED', 'INTERVIEW', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['HIRED', 'REJECTED', 'SCREENING', 'SHORTLISTED', 'APPLIED'],
  HIRED: ['INTERVIEW', 'REJECTED', 'SHORTLISTED'],
  REJECTED: ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW'],
};

export function isValidCandidateTransition(
  fromStatus: CandidateStatus,
  toStatus: CandidateStatus,
  userRole?: string
): boolean {
  if (fromStatus === toStatus) return true;
  // ADMIN role can change candidate status to ANY stage at any time
  if (userRole === 'ADMIN') return true;
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  return allowed ? allowed.includes(toStatus) : false;
}
