import prisma from '../lib/prisma';
import { SubmitFeedbackInput, UpdateFeedbackInput } from '../schemas/feedback.schema';

export const feedbackService = {
  async submitFeedback(interviewId: string, data: SubmitFeedbackInput, userId: string, userRole?: string) {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    if (userRole === 'INTERVIEWER' && interview.interviewerId !== userId) {
      throw { statusCode: 403, message: 'You are not authorized to submit feedback for an interview assigned to another interviewer' };
    }

    if (interview.status !== 'COMPLETED') {
      throw { statusCode: 400, message: 'Feedback can only be submitted for completed interviews' };
    }

    const feedback = await prisma.feedback.create({
      data: {
        ...data,
        comments: data.comments || '',
        interviewId,
        createdBy: userId,
      },
    });

    const candidate = await prisma.candidate.findUnique({ where: { id: interview.candidateId } });
    if (candidate && candidate.status !== 'HIRED' && candidate.status !== 'REJECTED') {
      await prisma.candidate.update({
        where: { id: interview.candidateId },
        data: { status: 'INTERVIEW' }
      });
    }

    return feedback;
  },

  async updateFeedback(feedbackId: string, data: UpdateFeedbackInput, userId: string, userRole?: string) {
    const existing = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: { interview: true },
    });

    if (!existing) {
      throw { statusCode: 404, message: 'Feedback not found' };
    }

    if (userRole === 'INTERVIEWER' && existing.createdBy !== userId && existing.interview.interviewerId !== userId) {
      throw { statusCode: 403, message: 'You are not authorized to update feedback submitted by another interviewer' };
    }

    const updateData: any = { ...data };
    if (data.comments !== undefined) {
      updateData.comments = data.comments || '';
    }

    return prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
    });
  },

  async getFeedbackByInterview(interviewId: string) {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) {
      throw { statusCode: 404, message: 'Interview not found' };
    }

    return prisma.feedback.findMany({
      where: { interviewId },
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
