import prisma from '../lib/prisma';
import { aiService } from './ai.service';

export interface UpsertProfileInput {
  name: string;
  email: string;
  phone: string;
  experienceYears: number;
  skills: string;
  resumeText: string;
}

export const candidatePortalService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    return {
      user,
      profile: profile || {
        name: user.name,
        email: user.email,
        phone: '',
        experienceYears: 0,
        skills: '',
        resumeText: '',
        aiSummary: null,
      },
    };
  },

  async upsertProfile(userId: string, data: UpsertProfileInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    return prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        experienceYears: data.experienceYears,
        skills: data.skills,
        resumeText: data.resumeText,
      },
      update: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        experienceYears: data.experienceYears,
        skills: data.skills,
        resumeText: data.resumeText,
      },
    });
  },

  async generateProfileSummary(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile || !profile.resumeText) {
      throw {
        statusCode: 400,
        message: 'Candidate profile and resume details must be filled out before generating AI Executive Summary.',
      };
    }

    const summaryObj = await aiService.generateCandidateProfileSummary({
      name: profile.name,
      experienceYears: profile.experienceYears,
      skills: profile.skills,
      resumeText: profile.resumeText,
    });

    const aiSummaryJson = JSON.stringify(summaryObj);

    await prisma.candidateProfile.update({
      where: { userId },
      data: { aiSummary: aiSummaryJson },
    });

    return summaryObj;
  },

  async getSuitableJobs(userId: string) {
    const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    
    const openJobs = await prisma.job.findMany({
      where: { status: 'OPEN' },
      select: {
        id: true,
        title: true,
        description: true,
        department: true,
        location: true,
        employmentType: true,
        experienceRequired: true,
        requiredSkills: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!profile || !profile.resumeText) {
      return openJobs.map((j) => ({
        ...j,
        matchScore: 0,
        matchingSkills: [],
        missingSkills: [],
        fitRationale: 'Fill out your profile and resume details to get AI job matching analysis.',
      }));
    }

    const matches = await aiService.matchJobsForCandidate(
      {
        experienceYears: profile.experienceYears,
        skills: profile.skills,
        resumeText: profile.resumeText,
      },
      openJobs
    );

    const matchMap = new Map(matches.map((m) => [m.jobId, m]));

    const enrichedJobs = openJobs.map((job) => {
      const match = matchMap.get(job.id);
      return {
        ...job,
        matchScore: match ? match.matchScore : 50,
        matchingSkills: match ? match.matchingSkills : [],
        missingSkills: match ? match.missingSkills : [],
        fitRationale: match ? match.fitRationale : 'Potential career fit based on open requisition.',
      };
    });

    enrichedJobs.sort((a, b) => b.matchScore - a.matchScore);

    return enrichedJobs;
  },

  async applyForJob(userId: string, jobId: string) {
    let profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    if (!profile) {
      profile = {
        id: '',
        userId,
        name: user.name,
        email: user.email,
        phone: '',
        experienceYears: 0,
        skills: '',
        resumeText: 'Application submitted via Candidate Portal.',
        aiSummary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw { statusCode: 404, message: 'Job requisition not found' };
    }

    const existingApp = await prisma.candidate.findFirst({
      where: {
        jobId,
        OR: [{ userId }, { email: user.email }],
      },
    });

    if (existingApp) {
      throw { statusCode: 400, message: 'You have already submitted an application for this position.' };
    }

    const candidateRecord = await prisma.candidate.create({
      data: {
        jobId,
        userId,
        name: profile.name || user.name,
        email: profile.email || user.email,
        phone: profile.phone || '',
        experienceYears: profile.experienceYears || 0,
        skills: profile.skills || '',
        resumeText: profile.resumeText || 'Application submitted via candidate portal.',
        status: 'APPLIED',
      },
    });

    return candidateRecord;
  },

  async getMyApplications(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const applications = await prisma.candidate.findMany({
      where: {
        OR: [{ userId }, { email: user.email }],
      },
      include: {
        job: true,
        interviews: {
          include: {
            interviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { scheduledAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  },
};
