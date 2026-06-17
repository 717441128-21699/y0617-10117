import { Router } from 'express';
import * as propertyFeeService from '../services/propertyFeeService';

const router = Router();

router.get('/', (req, res) => {
  const householdId = parseInt(req.query.householdId as string) || 1;
  const result = propertyFeeService.getPropertyFees(householdId);
  res.json(result);
});

router.get('/records', (req, res) => {
  const householdId = parseInt(req.query.householdId as string) || 1;
  const records = propertyFeeService.getPaymentRecords(householdId);
  res.json({ data: records });
});

router.post('/:id/pay', (req, res) => {
  const id = parseInt(req.params.id);
  const { paymentMethod, channel } = req.body;

  if (!paymentMethod || !['online', 'offline'].includes(paymentMethod)) {
    res.status(400).json({ error: '无效的支付方式' });
    return;
  }

  const result = propertyFeeService.payPropertyFee(id, paymentMethod, channel);

  if (!result.success) {
    res.status(400).json({ error: '支付失败，该账单可能已支付' });
    return;
  }

  res.json(result);
});

export default router;
