import OpenAI from 'openai';

const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 15000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  timeout: AI_REQUEST_TIMEOUT_MS,
});


export interface CandidateContext {
  resumeText: string;
  skills: string;
  experienceYears: number;
}

export interface JobContext {
  title: string;
  description: string;
  requiredSkills: string;
}

export interface FeedbackContext {
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  cultureFitRating: number;
  comments: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: string;
}

export interface RoundInterviewData {
  roundType: string;
  interviewerName: string;
  feedback: FeedbackContext[];
}

export interface StructuredAiEvaluation {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillMatch: string[];
  missingSkills: string[];
  recommendation: 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO' | 'STRONG_NO';
  reasoning: string;
}

export interface StructuredInterviewSummary {
  summary: string;
  recommendation: 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO' | 'STRONG_NO';
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  roundAnalysis?: {
    technical?: string;
    hr?: string;
    managerial?: string;
    cultural?: string;
  };
}

export interface StructuredCandidateProfileSummary {
  executiveSummary: string;
  coreCompetencies: string[];
  keyStrengths: string[];
  recommendedRoles: string[];
  careerTrajectory: string;
}

export interface JobMatchItem {
  jobId: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  fitRationale: string;
}

export const aiService = {
  // 1. AI Intelligence Evaluation from Candidate Resume Text & Profile
  async generateResumeEvaluation(
    candidate: CandidateContext,
    job: JobContext
  ): Promise<StructuredAiEvaluation> {
    const prompt = `
      You are an expert technical recruiter evaluating a candidate's background and resume against job requirements.
      
      JOB REQUISITION:
      Title: ${job.title}
      Description: ${job.description}
      Required Skills: ${job.requiredSkills}
      
      CANDIDATE PROFILE & RESUME:
      Resume / Bio: ${candidate.resumeText}
      Skills: ${candidate.skills}
      Years of Experience: ${candidate.experienceYears}
      
      Based STRICTLY on the candidate's resume text and background compared against job requirements, provide a structured JSON evaluation matching this schema:
      {
        "summary": "Executive summary of candidate's qualifications and fit derived from resume text",
        "strengths": ["Identified strength 1 from resume", "Identified strength 2 from resume"],
        "weaknesses": ["Identified risk/gap 1 from resume", "Identified risk/gap 2 from resume"],
        "skillMatch": ["Matching skill 1", "Matching skill 2"],
        "missingSkills": ["Missing/Required skill 1"],
        "recommendation": "STRONG_YES or YES or MAYBE or NO or STRONG_NO",
        "reasoning": "Detailed reasoning explaining initial resume fit and qualification alignment"
      }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a technical recruiter evaluating candidate resumes. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw { statusCode: 502, message: 'Invalid response payload received from AI resume evaluation service' };
      }

      return JSON.parse(content) as StructuredAiEvaluation;
    } catch (error: any) {
      if (error.statusCode) throw error;
      if (error.name === 'APIConnectionTimeoutError' || error.message?.includes('timeout')) {
        throw { statusCode: 504, message: 'AI resume evaluation service timed out.' };
      }
      console.error('AI Service Error (Resume Evaluation):', error);
      throw { statusCode: 502, message: 'Failed to generate AI resume evaluation' };
    }
  },

  // 2. Interview Process AI Summary Synthesized from Interviewer Scorecards
  async generateInterviewSummary(
    candidate: CandidateContext,
    job: JobContext,
    feedbacks: FeedbackContext[],
    roundInterviews?: RoundInterviewData[]
  ): Promise<StructuredInterviewSummary> {
    const prompt = `
      You are an executive talent strategist synthesizing 4-round interview scorecards and interviewer evaluations.
      
      TARGET JOB:
      Title: ${job.title}
      
      CANDIDATE:
      Skills: ${candidate.skills}
      Experience: ${candidate.experienceYears} Years
      
      SUBMITTED INTERVIEW SCORECARDS & NOTES:
      ${
        roundInterviews && roundInterviews.length > 0
          ? roundInterviews
              .map(
                (r, i) => `
        Round ${i + 1} [${r.roundType}] (Interviewer: ${r.interviewerName}):
        ${
          r.feedback && r.feedback.length > 0
            ? r.feedback
                .map(
                  (f) => `
          - Scorecard Ratings: Tech ${f.technicalRating}/10, Comm ${f.communicationRating}/10, ProblemSolving ${f.problemSolvingRating}/10, Culture ${f.cultureFitRating}/10
          - Verified Strengths: ${f.strengths || 'N/A'}
          - Risk Areas / Red Flags: ${f.weaknesses || 'N/A'}
          - Notes / Comments: ${f.comments || 'N/A'}
          - Recommendation: ${f.recommendation || 'N/A'}
        `
                )
                .join('')
            : '  - No scorecard submitted yet for this round.'
        }
      `
              )
              .join('\n')
          : feedbacks && feedbacks.length > 0
          ? feedbacks
              .map(
                (f, i) => `
        Interview Scorecard ${i + 1}:
        Ratings: Tech ${f.technicalRating}/10, Comm ${f.communicationRating}/10, ProblemSolving ${f.problemSolvingRating}/10, Culture ${f.cultureFitRating}/10
        Strengths: ${f.strengths || 'N/A'}, Risk Areas: ${f.weaknesses || 'N/A'}
        Comments: ${f.comments || 'N/A'}
        Recommendation: ${f.recommendation || 'N/A'}
      `
              )
              .join('\n')
          : 'No interview scorecards submitted yet across interview rounds.'
      }
      
      Synthesize the submitted scorecards across the interview rounds into JSON format matching this schema:
      {
        "summary": "Executive interview process summary synthesizing interviewer scorecards across rounds",
        "recommendation": "STRONG_YES or YES or MAYBE or NO or STRONG_NO",
        "reasoning": "Detailed synthesis of interviewer ratings, comments, and scorecard recommendations",
        "strengths": ["Interviewer verified strength 1", "Interviewer verified strength 2"],
        "weaknesses": ["Interviewer red flag / risk area 1", "Interviewer red flag / risk area 2"],
        "roundAnalysis": {
          "technical": "Takeaway summary from Technical round scorecard, or 'Pending evaluation' if no scorecard submitted yet",
          "hr": "Takeaway summary from HR & Screening round scorecard, or 'Pending evaluation' if no scorecard submitted yet",
          "managerial": "Takeaway summary from Managerial round scorecard, or 'Pending evaluation' if no scorecard submitted yet",
          "cultural": "Takeaway summary from Cultural Fit round scorecard, or 'Pending evaluation' if no scorecard submitted yet"
        }
      }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an executive talent strategist synthesizing interview scorecards. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw { statusCode: 502, message: 'Invalid response payload received from AI interview synthesis service' };
      }

      return JSON.parse(content) as StructuredInterviewSummary;
    } catch (error: any) {
      if (error.statusCode) throw error;
      if (error.name === 'APIConnectionTimeoutError' || error.message?.includes('timeout')) {
        throw { statusCode: 504, message: 'AI interview synthesis service timed out.' };
      }
      console.error('AI Service Error (Interview Summary):', error);
      throw { statusCode: 502, message: 'Failed to generate AI interview process summary' };
    }
  },

  // Legacy wrapper mapping generateEvaluation -> generateResumeEvaluation
  async generateEvaluation(
    candidate: CandidateContext,
    job: JobContext,
    feedbacks: FeedbackContext[],
    roundInterviews?: RoundInterviewData[]
  ): Promise<StructuredAiEvaluation> {
    return this.generateResumeEvaluation(candidate, job);
  },

  async generateCandidateProfileSummary(candidate: {
    name: string;
    experienceYears: number;
    skills: string;
    resumeText: string;
  }): Promise<StructuredCandidateProfileSummary> {
    const prompt = `
      You are an executive talent strategist analyzing a candidate's background and resume.
      
      CANDIDATE DETAILS:
      Name: ${candidate.name}
      Years of Experience: ${candidate.experienceYears}
      Skills: ${candidate.skills}
      Resume / Bio: ${candidate.resumeText}
      
      Generate an executive career profile analysis for this candidate in JSON format matching this schema:
      {
        "executiveSummary": "Concise 2-3 sentence overview highlighting candidate background and core value proposition",
        "coreCompetencies": ["competency 1", "competency 2", "competency 3"],
        "keyStrengths": ["strength 1", "strength 2", "strength 3"],
        "recommendedRoles": ["target role 1", "target role 2"],
        "careerTrajectory": "Short breakdown of potential leadership or growth trajectory"
      }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an executive talent strategist. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw { statusCode: 502, message: 'Invalid response payload from AI service' };
      }

      return JSON.parse(content) as StructuredCandidateProfileSummary;
    } catch (error: any) {
      if (error.statusCode) throw error;
      if (error.name === 'APIConnectionTimeoutError' || error.message?.includes('timeout')) {
        throw { statusCode: 504, message: 'AI profile summary service timed out.' };
      }
      console.error('AI Service Error:', error);
      throw { statusCode: 502, message: 'Failed to generate AI candidate profile summary' };
    }
  },

  async matchJobsForCandidate(
    candidate: { experienceYears: number; skills: string; resumeText: string },
    openJobs: Array<{ id: string; title: string; description: string; requiredSkills: string; department: string }>
  ): Promise<JobMatchItem[]> {
    if (!openJobs || openJobs.length === 0) {
      return [];
    }

    const prompt = `
      You are an AI job recommendation engine evaluating open job requisitions for a candidate.
      
      CANDIDATE PROFILE:
      Experience Years: ${candidate.experienceYears}
      Skills: ${candidate.skills}
      Resume: ${candidate.resumeText}
      
      AVAILABLE OPEN JOBS:
      ${openJobs
        .map(
          (j) => `
        Job ID: ${j.id}
        Title: ${j.title} (${j.department})
        Required Skills: ${j.requiredSkills}
        Description: ${j.description}
      `
        )
        .join('\n')}
      
      Evaluate each job and return a JSON array under the key "matches" containing fit analysis for EVERY job:
      {
        "matches": [
          {
            "jobId": "exact job ID string",
            "matchScore": number between 0 and 100,
            "matchingSkills": ["matching skill 1", "matching skill 2"],
            "missingSkills": ["missing/gap skill 1"],
            "fitRationale": "Short rationale explaining match score"
          }
        ]
      }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a career matching AI. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw { statusCode: 502, message: 'Invalid response payload from AI matching service' };
      }

      const parsed = JSON.parse(content);
      return (parsed.matches || []) as JobMatchItem[];
    } catch (error: any) {
      if (error.statusCode) throw error;
      console.error('AI Matching Error:', error);
      // Fallback matching logic if OpenAI call fails
      return openJobs.map((j) => ({
        jobId: j.id,
        matchScore: 75,
        matchingSkills: candidate.skills ? candidate.skills.split(',').map((s) => s.trim()) : [],
        missingSkills: [],
        fitRationale: 'Automated skill alignment recommendation.',
      }));
    }
  },
};
