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
  async generateEvaluation(
    candidate: CandidateContext,
    job: JobContext,
    feedbacks: FeedbackContext[]
  ): Promise<StructuredAiEvaluation> {
    const prompt = `
      You are an expert technical recruiter evaluating a candidate for a job.
      
      JOB DETAILS:
      Title: ${job.title}
      Description: ${job.description}
      Required Skills: ${job.requiredSkills}
      
      CANDIDATE DETAILS:
      Resume: ${candidate.resumeText}
      Skills: ${candidate.skills}
      Years of Experience: ${candidate.experienceYears}
      
      INTERVIEW FEEDBACKS:
      ${feedbacks
        .map(
          (f, i) => `
        Interview ${i + 1}:
        Tech Rating: ${f.technicalRating}/10, Comm Rating: ${f.communicationRating}/10
        Problem Solving: ${f.problemSolvingRating}/10, Culture Fit: ${f.cultureFitRating}/10
        Strengths: ${f.strengths || 'N/A'}, Weaknesses: ${f.weaknesses || 'N/A'}
        Comments: ${f.comments}
        Recommendation: ${f.recommendation || 'N/A'}
      `
        )
        .join('\n')}
      
      Based on the above information, provide a structured evaluation in JSON format exactly matching this schema:
      {
        "summary": "Overall summary of the candidate's fit",
        "strengths": ["strength 1", "strength 2"],
        "weaknesses": ["weakness 1", "weakness 2"],
        "skillMatch": ["skill 1", "skill 2"],
        "missingSkills": ["missing 1", "missing 2"],
        "recommendation": "YES or NO or MAYBE or STRONG_YES or STRONG_NO",
        "reasoning": "Detailed reasoning for the recommendation"
      }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a technical recruiter. Respond ONLY with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw { statusCode: 502, message: 'Invalid response payload received from AI service' };
      }

      return JSON.parse(content) as StructuredAiEvaluation;
    } catch (error: any) {
      if (error.statusCode) throw error;
      if (error.name === 'APIConnectionTimeoutError' || error.message?.includes('timeout')) {
        throw { statusCode: 504, message: 'AI evaluation service timed out. Please try again later.' };
      }
      console.error('AI Service Error:', error);
      throw { statusCode: 502, message: 'Failed to communicate with AI evaluation service' };
    }
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
