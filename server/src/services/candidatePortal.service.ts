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

    let profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    // If profile is missing or has empty resumeText, check if candidate submitted any applications with resume text
    if ((!profile || !profile.resumeText) && user) {
      const lastApp = await prisma.candidate.findFirst({
        where: { OR: [{ userId }, { email: user.email }] },
        orderBy: { createdAt: 'desc' },
      });
      if (lastApp && lastApp.resumeText) {
        profile = await prisma.candidateProfile.upsert({
          where: { userId },
          create: {
            userId,
            name: lastApp.name || user.name,
            email: user.email,
            phone: lastApp.phone || '',
            experienceYears: lastApp.experienceYears || 0,
            skills: lastApp.skills || '',
            resumeText: lastApp.resumeText,
          },
          update: {
            resumeText: lastApp.resumeText,
            ...(lastApp.phone && { phone: lastApp.phone }),
            ...(lastApp.skills && { skills: lastApp.skills }),
            ...(lastApp.experienceYears !== undefined && { experienceYears: lastApp.experienceYears }),
          },
        });
      }
    }

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
    let profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if ((!profile || !profile.resumeText) && user) {
      const lastApp = await prisma.candidate.findFirst({
        where: { OR: [{ userId }, { email: user.email }] },
        orderBy: { createdAt: 'desc' },
      });
      if (lastApp && lastApp.resumeText) {
        profile = await prisma.candidateProfile.upsert({
          where: { userId },
          create: {
            userId,
            name: lastApp.name || user.name,
            email: user.email,
            phone: lastApp.phone || '',
            experienceYears: lastApp.experienceYears || 0,
            skills: lastApp.skills || '',
            resumeText: lastApp.resumeText,
          },
          update: {
            resumeText: lastApp.resumeText,
          },
        });
      }
    }

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
    let profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Fallback: If candidate profile resume is missing, check if user submitted an application with a resume
    if ((!profile || !profile.resumeText) && user) {
      const lastApp = await prisma.candidate.findFirst({
        where: { OR: [{ userId }, { email: user.email }] },
        orderBy: { createdAt: 'desc' },
      });
      if (lastApp && lastApp.resumeText) {
        profile = await prisma.candidateProfile.upsert({
          where: { userId },
          create: {
            userId,
            name: lastApp.name || user.name,
            email: user.email,
            phone: lastApp.phone || '',
            experienceYears: lastApp.experienceYears || 0,
            skills: lastApp.skills || '',
            resumeText: lastApp.resumeText,
          },
          update: {
            resumeText: lastApp.resumeText,
          },
        });
      }
    }

    // Fetch all job IDs candidate has ALREADY applied for
    const existingApps = user ? await prisma.candidate.findMany({
      where: {
        OR: [{ userId }, { email: user.email }]
      },
      select: { jobId: true }
    }) : [];

    const appliedJobIds = new Set(existingApps.map(a => a.jobId));

    const openJobs = await prisma.job.findMany({
      where: {
        status: 'OPEN',
        id: {
          notIn: Array.from(appliedJobIds)
        }
      },
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

  async applyForJob(userId: string, data: { jobId: string; resumeText?: string; name?: string; phone?: string; experienceYears?: number; skills?: string; updateProfileResume?: boolean }) {
    const { jobId, resumeText, name, phone, experienceYears, skills, updateProfileResume } = data;
    let profile = await prisma.candidateProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const finalResumeText = (resumeText && resumeText.trim().length > 0)
      ? resumeText
      : (profile?.resumeText || 'Application submitted via candidate portal.');

    const finalName = name || profile?.name || user.name;
    const finalPhone = phone || profile?.phone || '';
    const finalExpYears = experienceYears !== undefined ? experienceYears : (profile?.experienceYears || 0);
    const finalSkills = skills || profile?.skills || '';

    // Upsert profile if requested, or if profile doesn't exist, or if stored resumeText is empty
    if (updateProfileResume || !profile || !profile.resumeText || profile.resumeText.trim() === '') {
      profile = await prisma.candidateProfile.upsert({
        where: { userId },
        create: {
          userId,
          name: finalName,
          email: user.email,
          phone: finalPhone,
          experienceYears: finalExpYears,
          skills: finalSkills,
          resumeText: finalResumeText,
        },
        update: {
          resumeText: finalResumeText,
          ...(finalPhone && { phone: finalPhone }),
          ...(finalExpYears !== undefined && { experienceYears: finalExpYears }),
          ...(finalSkills && { skills: finalSkills }),
        },
      });
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
        name: finalName,
        email: profile.email || user.email,
        phone: finalPhone,
        experienceYears: finalExpYears,
        skills: finalSkills,
        resumeText: finalResumeText,
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
