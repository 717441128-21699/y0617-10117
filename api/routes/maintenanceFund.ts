import { Router } from 'express';
import * as maintenanceFundService from '../services/maintenanceFundService';

const router = Router();

router.get('/', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = maintenanceFundService.getFundRecords(page, pageSize);
  res.json(result);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const record = maintenanceFundService.getFundRecordById(id);

  if (!record) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  res.json({ data: record });
});

export default router;
