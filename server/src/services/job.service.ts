import prisma from '../lib/prisma';
import { CreateJobInput, UpdateJobInput } from '../schemas/job.schema';

export interface JobQueryFilters {
  status?: string;
  department?: string;
  search?: string;
  page?: string;
  limit?: string;
  all?: string;
}

export const jobService = {
  async getJobs(filters: JobQueryFilters) {
    const { status, department, search, page = '1', limit = '10', all } = filters;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const isAll = all === 'true';

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (department) whereClause.department = department;
    if (search) {
      whereClause.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        ...(isAll ? {} : { skip: (pageNum - 1) * limitNum, take: limitNum }),
      }),
      prisma.job.count({ where: whereClause }),
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

  async getJobById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        candidates: {
          select: { id: true, status: true, name: true },
        },
      },
    });

    if (!job) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    const stats = {
      totalCandidates: job.candidates.length,
      shortlisted: job.candidates.filter((c) => c.status === 'SHORTLISTED').length,
      hired: job.candidates.filter((c) => c.status === 'HIRED').length,
    };

    return { ...job, stats };
  },

  async createJob(data: CreateJobInput, userId: string) {
    return prisma.job.create({
      data: {
        ...data,
        status: data.status || 'DRAFT',
        createdBy: userId,
      },
    });
  },

  async updateJob(id: string, data: UpdateJobInput) {
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    return prisma.job.update({
      where: { id },
      data,
    });
  },

  async deleteJob(id: string) {
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      throw { statusCode: 404, message: 'Job not found' };
    }

    await prisma.job.delete({ where: { id } });
    return { message: 'Job deleted successfully' };
  },
};
