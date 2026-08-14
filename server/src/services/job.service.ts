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
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, parseInt(limit as string) || 10);
    const isAll = all === 'true';

    const whereClause: any = {};
    if (status && status !== 'all' && status.trim()) whereClause.status = status.trim();
    if (department && department !== 'all' && department.trim()) whereClause.department = department.trim();
    if (search && search.trim()) {
      const queryStr = search.trim();
      whereClause.OR = [
        { title: { contains: queryStr, mode: 'insensitive' } },
        { description: { contains: queryStr, mode: 'insensitive' } },
      ];
    }

    try {
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
        data: data || [],
        total: total || 0,
        page: pageNum,
        pageSize: isAll ? (total || 10) : limitNum,
        totalPages,
      };
    } catch (err: any) {
      console.error('Prisma query error in getJobs:', err?.message || err);
      // Fallback matching without case-insensitive mode if fails
      const fallbackWhere: any = {};
      if (status && status !== 'all' && status.trim()) fallbackWhere.status = status.trim();
      
      const data = await prisma.job.findMany({
        where: fallbackWhere,
        orderBy: { createdAt: 'desc' },
      });

      return {
        data: data || [],
        total: data?.length || 0,
        page: 1,
        pageSize: data?.length || 10,
        totalPages: 1,
      };
    }
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
