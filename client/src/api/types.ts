export type Role = 'ADMIN' | 'RECRUITER' | 'INTERVIEWER' | 'CANDIDATE';
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type CandidateStatus = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
export type InterviewType = 'TECHNICAL' | 'HR' | 'MANAGERIAL' | 'CULTURAL';
export type InterviewStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type Recommendation = 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO' | 'STRONG_NO';

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  skills: string;
  resumeText: string;
  aiSummary?: string | null;
}

export interface CandidateProfileSummary {
  executiveSummary: string;
  coreCompetencies: string[];
  keyStrengths: string[];
  recommendedRoles: string[];
  careerTrajectory: string;
}

export interface SuitableJobItem extends Job {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  fitRationale: string;
}

export interface MyCandidateApplication extends Candidate {
  job: Job;
  interviews: Interview[];
}

export interface ApplyJobPayload {
  jobId: string;
  resumeText?: string;
  name?: string;
  phone?: string;
  experienceYears?: number;
  skills?: string;
  updateProfileResume?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  experienceRequired: string;
  requiredSkills: string;
  status: JobStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalCandidates: number;
    shortlisted: number;
    hired: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  experienceYears: number;
  skills: string;
  status: CandidateStatus;
  aiEvaluation?: string | null;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  job?: {
    title: string;
    department: string;
  };
  interviews?: Interview[];
}

export interface Interview {
  id: string;
  candidateId: string;
  interviewerId: string;
  scheduledAt: string;
  duration: number;
  type: InterviewType;
  status: InterviewStatus;
  meetingLink?: string | null;
  notes?: string | null;
  transcript?: string | null;
  createdAt: string;
  updatedAt: string;
  candidate?: {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    experienceYears?: number;
    skills?: string;
    resumeText?: string;
    jobId?: string;
    job?: {
      id?: string;
      title: string;
      description?: string;
      department?: string;
      requiredSkills?: string;
    };
  };
  interviewer?: {
    id: string;
    name: string;
    email: string;
  };
  feedback?: Feedback[];
}

export interface CopilotCoverageTopic {
  topic: string;
  category: string;
  status: 'COVERED' | 'IN_PROGRESS' | 'GAP';
  notes: string;
}

export interface CopilotSuggestedQuestion {
  question: string;
  category: 'Technical Probe' | 'Deep Dive' | 'Behavioral / Culture' | 'Clarification';
  reasoning: string;
}

export interface CopilotSignals {
  answerQuality: 'Strong' | 'Moderate' | 'Weak';
  technicalDepth: string;
  confidenceClarity: string;
  redFlags: string[];
}

export interface CopilotAnalysis {
  coverage: CopilotCoverageTopic[];
  suggestedQuestions: CopilotSuggestedQuestion[];
  resumeInsights: string[];
  signals: CopilotSignals;
}

export interface CopilotFeedbackDraft {
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  cultureFitRating: number;
  strengths: string;
  weaknesses: string;
  comments: string;
  recommendation: Recommendation;
  summary: string;
}

export interface Feedback {
  id: string;
  interviewId: string;
  createdBy: string;
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  cultureFitRating: number;
  strengths: string;
  weaknesses: string;
  comments: string;
  recommendation: Recommendation;
  createdAt: string;
  updatedAt: string;
  interviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AiEvaluation {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillMatch: string[];
  missingSkills: string[];
  recommendation: Recommendation;
  reasoning: string;
  newStatus?: CandidateStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JobFilters {
  status?: JobStatus;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}

export interface CandidateFilters {
  status?: CandidateStatus;
  jobId?: string;
  search?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}

export interface InterviewFilters {
  status?: InterviewStatus;
  date?: string;
  interviewerId?: string;
}

export interface DashboardStats {
  isInterviewer: boolean;
  summary: {
    totalJobs?: number;
    openJobs?: number;
    totalCandidates?: number;
    inInterview?: number;
    shortlisted?: number;
    hired?: number;
    rejected?: number;
    interviewsThisWeek?: number;
    assignedCandidates?: number;
    assignedHired?: number;
    interviewsConducted?: number;
  };
  charts: {
    pipeline: Array<{ name: string; value: number }>;
    departmentChart?: Array<{ name: string; value: number }>;
  };
}

export interface CreateJobInput {
  title: string;
  description: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  experienceRequired: string;
  requiredSkills: string;
  status?: JobStatus;
}

export interface CreateCandidateInput {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  experienceYears: number;
  skills: string;
  jobId: string;
}

export interface ScheduleInterviewInput {
  candidateId: string;
  interviewerId: string;
  scheduledAt: string;
  duration: number;
  type: InterviewType;
  meetingLink?: string;
  notes?: string;
}

export interface SubmitFeedbackInput {
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  cultureFitRating: number;
  strengths: string;
  weaknesses: string;
  comments: string;
  recommendation: Recommendation;
}
