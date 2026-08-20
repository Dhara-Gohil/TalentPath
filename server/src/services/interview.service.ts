import prisma from '../lib/prisma';
import { ScheduleInterviewInput, UpdateInterviewInput, UpdateInterviewStatusInput } from '../schemas/interview.schema';
import { aiService } from './ai.service';

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
      select: {
        id: true,
        candidateId: true,
        interviewerId: true,
        scheduledAt: true,
        duration: true,
        type: true,
        status: true,
        meetingLink: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        candidate: { select: { id: true, name: true, email: true, job: { select: { title: true } } } },
        interviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  },

  async getAuthorizedInterview(id: string, userRole?: string, userId?: string) {
    if (!userRole || !userId) {
      throw { statusCode: 401, message: 'Authentication required: User identity context (role and user ID) is required.' };
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
      select: {
        id: true,
        candidateId: true,
        interviewerId: true,
        scheduledAt: true,
        duration: true,
        type: true,
        status: true,
        meetingLink: true,
        notes: true,
        transcript: true,
        startedAt: true,
        createdAt: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            experienceYears: true,
            skills: true,
            resumeText: true,
            status: true,
            jobId: true,
            userId: true,
            job: { select: { id: true, title: true, department: true, description: true, requiredSkills: true } },
          },
        },
        interviewer: { select: { id: true, name: true, email: true } },
        feedback: true,
      },
    });

    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    // Identity Authorization Verification:
    if (userRole === 'INTERVIEWER') {
      if (interview.interviewerId !== userId) {
        throw { statusCode: 403, message: 'Access denied: You are not authorized to view or join an interview session assigned to another interviewer.' };
      }
    } else if (userRole === 'CANDIDATE') {
      const candUser = await prisma.user.findUnique({ where: { id: userId } });
      const matchesUserId = interview.candidate.userId === userId;
      const matchesEmail = candUser && candUser.email.toLowerCase() === interview.candidate.email.toLowerCase();
      if (!matchesUserId && !matchesEmail) {
        throw { statusCode: 403, message: 'Access denied: You are not authorized to view or join another candidate\'s interview session.' };
      }
    }

    return interview;
  },

  async getInterviewById(id: string, userRole?: string, userId?: string) {
    const interview = await this.getAuthorizedInterview(id, userRole, userId);

    if (userRole === 'CANDIDATE' && !interview.startedAt && interview.status !== 'COMPLETED' && interview.status !== 'CANCELLED') {
      const now = new Date();
      await prisma.interview.update({
        where: { id },
        data: {
          startedAt: now,
          status: 'IN_PROGRESS',
        },
      });
      interview.startedAt = now;
      interview.status = 'IN_PROGRESS';
    }

    return interview;
  },

  async getInterviewSync(id: string, userRole?: string, userId?: string) {
    const interview = await this.getAuthorizedInterview(id, userRole, userId);
    return {
      id: interview.id,
      status: interview.status,
      transcript: interview.transcript,
      startedAt: interview.startedAt,
      updatedAt: interview.updatedAt,
    };
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

    const updateData: any = {};
    if (data.interviewerId) updateData.interviewerId = data.interviewerId;
    if (data.duration) updateData.duration = data.duration;
    if (data.type) updateData.type = data.type;
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink;
    if (data.notes !== undefined) updateData.notes = data.notes;
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

  async saveTranscript(id: string, transcript: string, userRole?: string, userId?: string) {
    await this.getAuthorizedInterview(id, userRole, userId);

    return prisma.interview.update({
      where: { id },
      data: { transcript },
    });
  },

  async analyzeCopilot(id: string, customTranscript?: string, targetTopic?: string, userRole?: string, userId?: string) {
    const interview = await this.getAuthorizedInterview(id, userRole, userId);

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

  async generateCopilotFeedback(id: string, customTranscript?: string, userRole?: string, userId?: string) {
    const interview = await this.getAuthorizedInterview(id, userRole, userId);

    const candidate = interview.candidate;
    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate record not found for this interview session' };
    }

    const job = candidate.job;
    const transcriptText = customTranscript ?? interview.transcript ?? '';

    // Save transcript without changing interview status to COMPLETED prematurely
    if (customTranscript !== undefined && customTranscript !== interview.transcript) {
      await prisma.interview.update({
        where: { id },
        data: {
          transcript: transcriptText,
        },
      });
    }

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

  async regenerateCopilotQuestions(id: string, targetTopic?: string, userRole?: string, userId?: string) {
    const interview = await this.getAuthorizedInterview(id, userRole, userId);

    const candidate = interview.candidate;
    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate record not found for this interview session' };
    }

    const job = candidate.job;
    const transcriptText = interview.transcript ?? '';

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
