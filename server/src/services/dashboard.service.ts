import prisma from '../lib/prisma';
import { formatPipelineChart, formatDepartmentChart } from '../utils/dashboard.util';

export const dashboardService = {
  async getDashboardStats(userRole?: string, userId?: string) {
    const isInterviewer = userRole === 'INTERVIEWER';

    if (isInterviewer && userId) {
      const candidateWhere = { interviews: { some: { interviewerId: userId } } };

      const [assignedCandidates, assignedHired, interviewsConducted, candidatesByStatus] = await Promise.all([
        prisma.candidate.count({ where: candidateWhere }),
        prisma.candidate.count({ where: { status: 'HIRED', ...candidateWhere } }),
        prisma.interview.count({ where: { interviewerId: userId, status: 'COMPLETED' } }),
        prisma.candidate.groupBy({
          by: ['status'],
          where: candidateWhere,
          _count: { status: true },
        }),
      ]);

      const pipeline = formatPipelineChart(candidatesByStatus);

      return {
        isInterviewer: true,
        summary: {
          assignedCandidates,
          assignedHired,
          interviewsConducted,
        },
        charts: {
          pipeline,
        },
      };
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const [totalJobs, openJobs, totalCandidates, candidatesByStatus, interviewsThisWeek, jobsByDepartment] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'OPEN' } }),
      prisma.candidate.count(),
      prisma.candidate.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.interview.count({
        where: {
          scheduledAt: {
            gte: startOfWeek,
            lt: endOfWeek,
          },
        },
      }),
      prisma.job.groupBy({
        by: ['department'],
        _count: { department: true },
      }),
    ]);

    const pipeline = formatPipelineChart(candidatesByStatus);
    const departmentChart = formatDepartmentChart(jobsByDepartment);

    const pipelineMap = pipeline.reduce((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {} as Record<string, number>);

    return {
      isInterviewer: false,
      summary: {
        totalJobs,
        openJobs,
        totalCandidates,
        inInterview: pipelineMap.INTERVIEW || 0,
        shortlisted: pipelineMap.SHORTLISTED || 0,
        hired: pipelineMap.HIRED || 0,
        rejected: pipelineMap.REJECTED || 0,
        interviewsThisWeek,
      },
      charts: {
        pipeline,
        departmentChart,
      },
    };
  },
};
