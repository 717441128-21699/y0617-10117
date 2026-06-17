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

router.get('/buildings/list', (req, res) => {
  const data = propertyFeeService.getBuildings();
  res.json({ data });
});

router.get('/units/list', (req, res) => {
  const building = req.query.building as string | undefined;
  const data = propertyFeeService.getUnits(building);
  res.json({ data });
});

router.get('/detail/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = propertyFeeService.getPropertyFeeById(id);
  if (!data) {
    res.status(404).json({ error: '账单不存在' });
    return;
  }
  res.json({ data });
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

router.get('/all/list', (req, res) => {
  const status = req.query.status as string | undefined;
  const period = req.query.period as string | undefined;
  const data = propertyFeeService.getAllPropertyFees(status, period);
  res.json({ data });
});

router.get('/households/list', (req, res) => {
  const data = propertyFeeService.getHouseholds();
  res.json({ data });
});

router.post('/create/new', (req, res) => {
  const { householdId, period, amount, dueDate } = req.body;

  if (!householdId || !period || !amount || !dueDate) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const result = propertyFeeService.createPropertyFee({
    householdId: parseInt(householdId),
    period,
    amount: parseFloat(amount),
    dueDate,
  });

  if (!result.success) {
    res.status(400).json({ error: (result as any).error });
    return;
  }

  res.status(201).json(result);
});

router.post('/batch/preview', (req, res) => {
  const { period, building, unit, householdIds, amountPerHousehold, dueDate } = req.body;

  if (!period || !amountPerHousehold || !dueDate) {
    res.status(400).json({ error: '缺少必要参数（计费周期、金额、截止日期）' });
    return;
  }

  const result = propertyFeeService.previewBatchCreateFees({
    period,
    building,
    unit,
    householdIds: householdIds ? (householdIds as number[]) : undefined,
    amountPerHousehold: parseFloat(amountPerHousehold),
    dueDate,
  });

  res.json(result);
});

router.post('/batch/create', (req, res) => {
  const { period, building, unit, householdIds, amountPerHousehold, dueDate } = req.body;

  if (!period || !amountPerHousehold || !dueDate) {
    res.status(400).json({ error: '缺少必要参数（计费周期、金额、截止日期）' });
    return;
  }

  const result = propertyFeeService.batchCreateFees({
    period,
    building,
    unit,
    householdIds: householdIds ? (householdIds as number[]) : undefined,
    amountPerHousehold: parseFloat(amountPerHousehold),
    dueDate,
  });

  res.status(201).json(result);
});

router.post('/:id/mark-paid-offline', (req, res) => {
  const id = parseInt(req.params.id);
  const result = propertyFeeService.markAsPaidOffline(id);

  if (!result.success) {
    res.status(400).json({ error: (result as any).error });
    return;
  }

  res.json(result);
});

router.get('/reminders/list', (req, res) => {
  const householdId = req.query.householdId ? parseInt(req.query.householdId as string) : undefined;
  const data = propertyFeeService.getPaymentReminders(householdId);
  res.json({ data });
});

router.post('/reminders/create', (req, res) => {
  const { propertyFeeIds, message } = req.body;

  if (!propertyFeeIds || !Array.isArray(propertyFeeIds) || propertyFeeIds.length === 0) {
    res.status(400).json({ error: '请选择要催缴的账单' });
    return;
  }

  const result = propertyFeeService.createPaymentReminders(propertyFeeIds as number[], message);

  if (!result.success) {
    res.status(400).json({ error: (result as any).error });
    return;
  }

  res.status(201).json(result);
});

export default router;
