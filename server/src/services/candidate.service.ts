import prisma from '../lib/prisma';
import { CreateCandidateInput, UpdateCandidateInput } from '../schemas/candidate.schema';
import { isValidCandidateTransition, CandidateStatus } from '../utils/candidateWorkflow.util';

export interface CandidateQueryFilters {
  status?: string;
  jobId?: string;
  search?: string;
  page?: string;
  limit?: string;
  all?: string;
  userRole?: string;
  userId?: string;
}

export const candidateService = {
  async getCandidates(filters: CandidateQueryFilters) {
    const { status, jobId, search, page = '1', limit = '10', all, userRole, userId } = filters;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const isAll = all === 'true';

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (jobId) whereClause.jobId = jobId;
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { skills: { contains: search as string } },
      ];
    }

    if (userRole === 'INTERVIEWER' && userId) {
      whereClause.interviews = {
        some: { interviewerId: userId },
      };
    }

    const [data, total] = await Promise.all([
      prisma.candidate.findMany({
        where: whereClause,
        include: {
          job: { select: { title: true, department: true } },
          interviews: { select: { id: true, type: true, status: true, scheduledAt: true, interviewerId: true } },
        },
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip: (pageNum - 1) * limitNum, take: limitNum }),
      }),
      prisma.candidate.count({ where: whereClause }),
    ]);

    const totalPages = isAll ? 1 : Math.ceil(total / limitNum) || 1;

    return {
      data,
      total,
      page: pageNum,
      pageSize: limitNum,
      totalPages,
    };
  },

  async getCandidateById(id: string, userRole?: string, userId?: string) {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        job: true,
        interviews: {
          include: {
            interviewer: { select: { id: true, name: true, email: true } },
            feedback: true,
          },
        },
      },
    });

    if (!candidate) {
      throw { statusCode: 404, message: 'Candidate not found' };
    }

    if (userRole === 'INTERVIEWER' && userId) {
      const isAssigned = candidate.interviews.some((i) => i.interviewerId === userId);
      if (!isAssigned) {
        throw { statusCode: 403, message: 'Access denied: You are only allowed to view candidates assigned to you' };
      }
    }

    return candidate;
  },

  async createCandidate(data: CreateCandidateInput) {
    const job = await prisma.job.findUnique({ where: { id: data.jobId } });
    if (!job) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    return prisma.candidate.create({
      data: {
        ...data,
        status: 'APPLIED',
      },
    });
  },

  async updateCandidate(id: string, data: UpdateCandidateInput) {
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Candidate not found' };
    }

    return prisma.candidate.update({
      where: { id },
      data,
    });
  },

  async updateCandidateStatus(id: string, newStatus: CandidateStatus) {
    const current = await prisma.candidate.findUnique({ where: { id } });
    if (!current) {
      throw { statusCode: 404, message: 'Candidate not found' };
    }

    const currentStatus = current.status as CandidateStatus;
    if (!isValidCandidateTransition(currentStatus, newStatus)) {
      throw {
        statusCode: 409,
        message: `Invalid candidate status transition from '${currentStatus}' to '${newStatus}'`,
      };
    }

    return prisma.candidate.update({
      where: { id },
      data: { status: newStatus },
    });
  },

  async deleteCandidate(id: string) {
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Candidate not found' };
    }

    await prisma.candidate.delete({ where: { id } });
    return { message: 'Candidate deleted successfully' };
  },

  async assembleCandidateAiContext(candidateId: string) {
    const candidate = await this.getCandidateById(candidateId);

    const feedbacks = candidate.interviews
      ? candidate.interviews.flatMap((inv) =>
          inv.feedback.map((f) => ({
            technicalRating: f.technicalRating,
            communicationRating: f.communicationRating,
            problemSolvingRating: f.problemSolvingRating,
            cultureFitRating: f.cultureFitRating,
            comments: f.comments,
            strengths: f.strengths,
            weaknesses: f.weaknesses,
            recommendation: f.recommendation,
          }))
        )
      : [];

    const roundInterviews = candidate.interviews
      ? candidate.interviews.map((inv) => ({
          roundType: inv.type,
          interviewerName: inv.interviewer?.name || 'Assigned Interviewer',
          feedback: inv.feedback.map((f) => ({
            technicalRating: f.technicalRating,
            communicationRating: f.communicationRating,
            problemSolvingRating: f.problemSolvingRating,
            cultureFitRating: f.cultureFitRating,
            strengths: f.strengths || '',
            weaknesses: f.weaknesses || '',
            comments: f.comments,
            recommendation: f.recommendation,
          })),
        }))
      : [];

    return {
      candidate: {
        id: candidate.id,
        name: candidate.name,
        resumeText: candidate.resumeText,
        skills: candidate.skills,
        experienceYears: candidate.experienceYears,
        status: candidate.status as CandidateStatus,
      },
      job: {
        title: candidate.job.title,
        description: candidate.job.description,
        requiredSkills: candidate.job.requiredSkills,
      },
      feedbacks,
      roundInterviews,
    };
  },

  async saveAiEvaluation(candidateId: string, evaluationJson: string, newStatus?: string) {
    const updateData: any = { aiEvaluation: evaluationJson };
    if (newStatus) updateData.status = newStatus;

    return prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
    });
  },
};
