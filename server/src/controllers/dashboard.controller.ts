import { Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user?.role, req.user?.id);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching dashboard stats' });
  }
};
