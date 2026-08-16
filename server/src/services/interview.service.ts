import prisma from '../lib/prisma';
import { ScheduleInterviewInput, UpdateInterviewInput, UpdateInterviewStatusInput } from '../schemas/interview.schema';

export interface InterviewQueryFilters {
  status?: string;
  date?: string;
  interviewerId?: string;
}

export const interviewService = {
  async getInterviews(filters: InterviewQueryFilters) {
    const { status, date, interviewerId } = filters;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (interviewerId) whereClause.interviewerId = interviewerId;
    if (date) {
      const d = new Date(date as string);
      whereClause.scheduledAt = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lt: new Date(d.setHours(23, 59, 59, 999)),
      };
    }

    return prisma.interview.findMany({
      where: whereClause,
      include: {
        candidate: { select: { id: true, name: true, job: { select: { title: true } } } },
        interviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  async getInterviewById(id: string) {
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: true,
        interviewer: { select: { id: true, name: true, email: true } },
        feedback: true,
      },
    });

    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    return interview;
  },

  async scheduleInterview(data: ScheduleInterviewInput) {
    const candidate = await prisma.candidate.findUnique({ where: { id: data.candidateId } });
    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate not found' };
    }

    const interviewer = await prisma.user.findUnique({ where: { id: data.interviewerId } });
    if (!interviewer) {
      throw { statusCode: 404, message: 'Interviewer not found' };
    }

    // Enforce sequential round progression rule:
    // Round order: TECHNICAL -> HR -> MANAGERIAL -> CULTURAL
    const roundOrder = ['TECHNICAL', 'HR', 'MANAGERIAL', 'CULTURAL'];
    const currentRoundIdx = roundOrder.indexOf(data.type);

    if (currentRoundIdx > 0) {
      const prevRoundType = roundOrder[currentRoundIdx - 1];
      const prevInterview = await prisma.interview.findFirst({
        where: {
          candidateId: data.candidateId,
          type: prevRoundType,
        },
        include: {
          feedback: true,
        },
      });

      if (!prevInterview) {
        throw {
          statusCode: 400,
          message: `Cannot schedule ${data.type} interview. The previous round (${prevRoundType}) has not been created yet.`
        };
      }

      if (prevInterview.status !== 'COMPLETED' || !prevInterview.feedback || prevInterview.feedback.length === 0) {
        throw {
          statusCode: 400,
          message: `Cannot schedule ${data.type} interview. The previous round (${prevRoundType}) must be COMPLETED and its scorecard submitted first.`
        };
      }
    }

    const interview = await prisma.interview.create({
      data: {
        candidateId: data.candidateId,
        interviewerId: data.interviewerId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        type: data.type,
        meetingLink: data.meetingLink || null,
        notes: data.notes || null,
        status: 'SCHEDULED',
      },
    });

    if (candidate.status !== 'HIRED' && candidate.status !== 'REJECTED') {
      await prisma.candidate.update({
        where: { id: data.candidateId },
        data: { status: 'INTERVIEW' },
      });
    }

    return interview;
  },

  async updateInterview(id: string, data: UpdateInterviewInput, userRole?: string, userId?: string) {
    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    if (userRole === 'INTERVIEWER' && existing.interviewerId !== userId) {
      throw { statusCode: 403, message: 'You are not authorized to update an interview assigned to another interviewer' };
    }

    const updateData: any = { ...data };
    if (data.scheduledAt) {
      updateData.scheduledAt = new Date(data.scheduledAt);
    }

    return prisma.interview.update({
      where: { id },
      data: updateData,
    });
  },

  async updateInterviewStatus(id: string, data: UpdateInterviewStatusInput, userRole?: string, userId?: string) {
    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    if (userRole === 'INTERVIEWER' && existing.interviewerId !== userId) {
      throw { statusCode: 403, message: 'You are not authorized to change status for an interview assigned to another interviewer' };
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: { status: data.status },
    });

    if (data.status === 'COMPLETED') {
      const candidate = await prisma.candidate.findUnique({ where: { id: existing.candidateId } });
      if (candidate && candidate.status !== 'HIRED' && candidate.status !== 'REJECTED') {
        await prisma.candidate.update({
          where: { id: existing.candidateId },
          data: { status: 'INTERVIEW' }
        });
      }
    }

    return updated;
  },

  async deleteInterview(id: string) {
    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    await prisma.interview.delete({ where: { id } });
    return { message: 'Interview session cancelled & deleted' };
  },

  async saveTranscript(id: string, transcript: string) {
    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    return prisma.interview.update({
      where: { id },
      data: { transcript },
    });
  },

  async analyzeCopilot(id: string, customTranscript?: string, targetTopic?: string) {
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    const candidate = interview.candidate;
    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate record not found for this interview session' };
    }

    const job = candidate.job;
    const transcriptText = customTranscript ?? interview.transcript ?? '';

    // Persist transcript if provided
    if (customTranscript !== undefined && customTranscript !== interview.transcript) {
      await prisma.interview.update({
        where: { id },
        data: { transcript: customTranscript },
      });
    }

    const { aiService } = await import('./ai.service');
    return aiService.analyzeLiveCopilotTranscript(
      {
        name: candidate.name || 'Candidate',
        resumeText: candidate.resumeText || '',
        skills: candidate.skills || '',
        experienceYears: candidate.experienceYears || 0,
      },
      {
        title: job?.title || 'Technical Role',
        description: job?.description || '',
        requiredSkills: job?.requiredSkills || '',
      },
      interview.type || 'TECHNICAL',
      transcriptText,
      targetTopic
    );
  },

  async generateCopilotFeedback(id: string, customTranscript?: string) {
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    const candidate = interview.candidate;
    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate record not found for this interview session' };
    }

    const job = candidate.job;
    const transcriptText = customTranscript ?? interview.transcript ?? '';

    // Save final transcript and set status to COMPLETED if active/scheduled
    await prisma.interview.update({
      where: { id },
      data: {
        transcript: transcriptText,
        status: 'COMPLETED',
      },
    });

    const { aiService } = await import('./ai.service');
    return aiService.generateCopilotFeedbackDraft(
      {
        name: candidate.name || 'Candidate',
        resumeText: candidate.resumeText || '',
        skills: candidate.skills || '',
        experienceYears: candidate.experienceYears || 0,
      },
      {
        title: job?.title || 'Technical Role',
        description: job?.description || '',
        requiredSkills: job?.requiredSkills || '',
      },
      interview.type || 'TECHNICAL',
      transcriptText
    );
  },

  async regenerateCopilotQuestions(id: string, targetTopic?: string) {
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    const candidate = interview.candidate;
    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate record not found for this interview session' };
    }

    const job = candidate.job;
    const transcriptText = interview.transcript ?? '';

    const { aiService } = await import('./ai.service');
    return aiService.generateCopilotQuestions(
      {
        name: candidate.name || 'Candidate',
        resumeText: candidate.resumeText || '',
        skills: candidate.skills || '',
        experienceYears: candidate.experienceYears || 0,
      },
      {
        title: job?.title || 'Technical Role',
        description: job?.description || '',
        requiredSkills: job?.requiredSkills || '',
      },
      interview.type || 'TECHNICAL',
      transcriptText,
      targetTopic
    );
  },
};
