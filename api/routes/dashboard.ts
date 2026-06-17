import { Router } from 'express';
import * as dashboardService from '../services/dashboardService';

const router = Router();

router.get('/stats', (_req, res) => {
  const stats = dashboardService.getDashboardStats();
  res.json({ data: stats });
});

export default router;
