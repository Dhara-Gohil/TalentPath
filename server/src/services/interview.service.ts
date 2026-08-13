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

    if (['APPLIED', 'SCREENING'].includes(candidate.status)) {
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

    return prisma.interview.update({
      where: { id },
      data: { status: data.status },
    });
  },

  async deleteInterview(id: string) {
    const existing = await prisma.interview.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    await prisma.interview.delete({ where: { id } });
    return { message: 'Interview session cancelled & deleted' };
  },
};
