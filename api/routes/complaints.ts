import { Router } from 'express';
import * as complaintService from '../services/complaintService';
import type { Complaint } from '../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const householdId = parseInt(req.query.householdId as string) || 1;
  const all = req.query.all === 'true';
  const complaints = complaintService.getComplaints(all ? undefined : householdId, all);
  res.json({ data: complaints });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const complaint = complaintService.getComplaintById(id);

  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  res.json({ data: complaint });
});

router.post('/', (req, res) => {
  const { title, type, content, householdId, images } = req.body;

  if (!title || !type || !content) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  const validTypes: Complaint['type'][] = ['maintenance', 'noise', 'sanitation', 'security', 'suggestion', 'other'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: '无效的投诉类型' });
    return;
  }

  const result = complaintService.createComplaint(title, type, content, householdId || 1, images);
  res.json(result);
});

router.put('/:id/reply', (req, res) => {
  const id = parseInt(req.params.id);
  const { reply, replier } = req.body;

  if (!reply || !replier) {
    res.status(400).json({ error: '请填写回复内容和回复人' });
    return;
  }

  const result = complaintService.replyComplaint(id, reply, replier);

  if (!result.success) {
    res.status(400).json({ error: '回复失败' });
    return;
  }

  res.json(result);
});

export default router;
