import { Router } from 'express';
import * as committeeService from '../services/committeeService';

const router = Router();

router.get('/', (_req, res) => {
  const members = committeeService.getCommitteeMembers();
  res.json({ data: members });
});

export default router;
