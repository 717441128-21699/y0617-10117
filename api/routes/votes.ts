import { Router } from 'express';
import * as voteService from '../services/voteService';

const router = Router();

router.get('/', (req, res) => {
  const householdId = parseInt(req.query.householdId as string) || 1;
  const votes = voteService.getVotes(householdId);
  res.json({ data: votes });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const householdId = parseInt(req.query.householdId as string) || 1;
  const vote = voteService.getVoteById(id, householdId);

  if (!vote) {
    res.status(404).json({ error: '投票不存在' });
    return;
  }

  res.json({ data: vote });
});

router.post('/:id/vote', (req, res) => {
  const id = parseInt(req.params.id);
  const { optionIndex, householdId } = req.body;

  if (optionIndex === undefined || optionIndex === null) {
    res.status(400).json({ error: '请选择投票选项' });
    return;
  }

  const result = voteService.castVote(id, optionIndex, householdId || 1);

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

router.post('/create/new', (req, res) => {
  const { title, description, options, deadline } = req.body;

  if (!title || !description || !options || !Array.isArray(options) || options.length < 2 || !deadline) {
    res.status(400).json({ error: '请填写完整的投票信息（标题、说明、至少2个选项、截止日期）' });
    return;
  }

  const newVote = voteService.createVote({
    title,
    description,
    options,
    deadline,
  });

  res.status(201).json({ data: newVote });
});

router.get('/:id/statistics', (req, res) => {
  const id = parseInt(req.params.id);
  const stats = voteService.getVoteStatistics(id);
  if (!stats) {
    res.status(404).json({ error: '投票不存在' });
    return;
  }
  res.json({ data: stats });
});

export default router;
