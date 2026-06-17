import { Router } from 'express';
import * as noticeService from '../services/noticeService';

const router = Router();

router.get('/', (req, res) => {
  const type = req.query.type as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const householdId = parseInt(req.query.householdId as string) || 1;

  const result = noticeService.getNotices(type, page, pageSize, householdId);
  res.json(result);
});

router.get('/important', (req, res) => {
  const householdId = parseInt(req.query.householdId as string) || 1;
  const notices = noticeService.getImportantNotices(householdId);
  res.json({ data: notices });
});

router.get('/latest', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 3;
  const householdId = parseInt(req.query.householdId as string) || 1;
  const notices = noticeService.getLatestNotices(limit, householdId);
  res.json({ data: notices });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const householdId = parseInt(req.query.householdId as string) || 1;
  const notice = noticeService.getNoticeById(id, householdId);

  if (!notice) {
    res.status(404).json({ error: '通知不存在' });
    return;
  }

  res.json({ data: notice });
});

router.put('/:id/read', (req, res) => {
  const id = parseInt(req.params.id);
  const householdId = parseInt(req.query.householdId as string) || 1;
  const result = noticeService.markNoticeAsRead(id, householdId);
  res.json(result);
});

export default router;
