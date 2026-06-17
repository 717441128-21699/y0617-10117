import { propertyFees, getNextId, persistData, households, paymentReminders } from '../db/mockData';
import type { PropertyFee, PaymentReminder } from '../../shared/types';

const DEFAULT_HOUSEHOLD_ID = 1;

function withHouseholdInfo(fee: PropertyFee): PropertyFee {
  const household = households.find(h => h.id === fee.householdId);
  if (household) {
    return {
      ...fee,
      building: household.building,
      unit: household.unit,
      roomNumber: household.roomNumber,
    };
  }
  return fee;
}

export function getPropertyFees(householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const data = propertyFees
    .filter(f => f.householdId === householdId)
    .sort((a, b) => b.period.localeCompare(a.period))
    .map(withHouseholdInfo);

  const unpaidTotal = data
    .filter(f => f.status === 'unpaid' || f.status === 'overdue')
    .reduce((sum, f) => sum + f.amount, 0);

  return { data, unpaidTotal };
}

export function getPaymentRecords(householdId: number = DEFAULT_HOUSEHOLD_ID) {
  return propertyFees
    .filter(f => f.householdId === householdId && f.status === 'paid')
    .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime())
    .map(withHouseholdInfo);
}

export function payPropertyFee(id: number, paymentMethod: 'online' | 'offline', channel?: 'wechat' | 'alipay') {
  const fee = propertyFees.find(f => f.id === id);
  if (!fee || fee.status === 'paid') {
    return { success: false, paidDate: '' };
  }

  const paidDate = new Date().toISOString().split('T')[0];
  fee.status = 'paid';
  fee.paidDate = paidDate;
  fee.paymentMethod = paymentMethod;
  
  const reminders = paymentReminders.filter(r => r.propertyFeeIds.includes(id));
  reminders.forEach(r => {
    r.status = 'paid';
    r.paidAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  });
  
  persistData();

  return { success: true, paidDate };
}

export function getAllPropertyFees(status?: string, period?: string) {
  let filtered = [...propertyFees];
  
  if (status && status !== 'all') {
    if (status === 'unpaid_overdue') {
      filtered = filtered.filter(f => f.status === 'unpaid' || f.status === 'overdue');
    } else {
      filtered = filtered.filter(f => f.status === status);
    }
  }
  
  if (period) {
    filtered = filtered.filter(f => f.period === period);
  }
  
  return filtered
    .sort((a, b) => b.period.localeCompare(a.period) || a.householdId - b.householdId)
    .map(withHouseholdInfo);
}

export function getPropertyFeeById(id: number) {
  const fee = propertyFees.find(f => f.id === id);
  if (!fee) return null;
  return withHouseholdInfo(fee);
}

export function createPropertyFee(data: {
  householdId: number;
  period: string;
  amount: number;
  dueDate: string;
}) {
  const household = households.find(h => h.id === data.householdId);
  if (!household) {
    return { success: false, error: '业主不存在' };
  }

  const existing = propertyFees.find(
    f => f.householdId === data.householdId && f.period === data.period
  );
  if (existing) {
    return { success: false, error: '该户该期物业费已存在' };
  }

  const newFee: PropertyFee = {
    id: getNextId('propertyFee'),
    householdId: data.householdId,
    building: household.building,
    unit: household.unit,
    roomNumber: household.roomNumber,
    period: data.period,
    amount: data.amount,
    status: 'unpaid',
    dueDate: data.dueDate,
  };

  propertyFees.push(newFee);
  persistData();
  return { success: true, data: newFee };
}

export function previewBatchCreateFees(data: {
  period: string;
  building?: string;
  unit?: string;
  householdIds?: number[];
  amountPerHousehold: number;
  dueDate: string;
}) {
  let targetHouseholds = [...households];
  
  if (data.householdIds && data.householdIds.length > 0) {
    targetHouseholds = households.filter(h => data.householdIds!.includes(h.id));
  } else {
    if (data.building) {
      targetHouseholds = targetHouseholds.filter(h => h.building === data.building);
    }
    if (data.unit) {
      targetHouseholds = targetHouseholds.filter(h => h.unit === data.unit);
    }
  }

  const willCreate: any[] = [];
  const willSkip: any[] = [];

  targetHouseholds.forEach(household => {
    const existing = propertyFees.find(
      f => f.householdId === household.id && f.period === data.period
    );
    if (existing) {
      willSkip.push({
        householdId: household.id,
        building: household.building,
        unit: household.unit,
        roomNumber: household.roomNumber,
        ownerName: household.ownerName,
        existingFeeId: existing.id,
      });
    } else {
      willCreate.push({
        householdId: household.id,
        building: household.building,
        unit: household.unit,
        roomNumber: household.roomNumber,
        ownerName: household.ownerName,
        amount: data.amountPerHousehold,
      });
    }
  });

  return { willCreate, willSkip, totalAmount: willCreate.reduce((sum, h) => sum + h.amount, 0) };
}

export function batchCreateFees(data: {
  period: string;
  building?: string;
  unit?: string;
  householdIds?: number[];
  amountPerHousehold: number;
  dueDate: string;
}) {
  const preview = previewBatchCreateFees(data);
  const createdFees: PropertyFee[] = [];

  preview.willCreate.forEach(h => {
    const household = households.find(hh => hh.id === h.householdId);
    if (household) {
      const newFee: PropertyFee = {
        id: getNextId('propertyFee'),
        householdId: h.householdId,
        building: household.building,
        unit: household.unit,
        roomNumber: household.roomNumber,
        period: data.period,
        amount: data.amountPerHousehold,
        status: 'unpaid',
        dueDate: data.dueDate,
      };
      propertyFees.push(newFee);
      createdFees.push(newFee);
    }
  });

  persistData();
  return {
    success: true,
    createdCount: createdFees.length,
    skippedCount: preview.willSkip.length,
    data: createdFees,
  };
}

export function markAsPaidOffline(id: number) {
  const fee = propertyFees.find(f => f.id === id);
  if (!fee || fee.status === 'paid') {
    return { success: false, error: '账单不存在或已缴费' };
  }

  const paidDate = new Date().toISOString().split('T')[0];
  fee.status = 'paid';
  fee.paidDate = paidDate;
  fee.paymentMethod = 'offline';
  
  const reminders = paymentReminders.filter(r => r.propertyFeeIds.includes(id));
  reminders.forEach(r => {
    r.status = 'paid';
    r.paidAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  });
  
  persistData();

  return { success: true, paidDate };
}

export function getUnpaidCount() {
  const unpaidHouseholds = new Set(
    propertyFees
      .filter(f => f.status === 'unpaid' || f.status === 'overdue')
      .map(f => f.householdId)
  );
  return unpaidHouseholds.size;
}

export function getPaidCount() {
  const paidHouseholds = new Set(
    propertyFees.filter(f => f.status === 'paid').map(f => f.householdId)
  );
  return paidHouseholds.size;
}

export function getHouseholds() {
  return households;
}

export function getBuildings() {
  const buildings = [...new Set(households.map(h => h.building))];
  return buildings;
}

export function getUnits(building?: string) {
  let filteredHouseholds = households;
  if (building) {
    filteredHouseholds = households.filter(h => h.building === building);
  }
  return [...new Set(filteredHouseholds.map(h => h.unit))];
}

export function createPaymentReminders(propertyFeeIds: number[], message?: string) {
  const fees = propertyFees.filter(f => propertyFeeIds.includes(f.id) && f.status !== 'paid');
  if (fees.length === 0) {
    return { success: false, error: '没有可生成催缴的欠费账单' };
  }

  const groupedByHousehold = new Map<number, PropertyFee[]>();
  fees.forEach(fee => {
    if (!groupedByHousehold.has(fee.householdId)) {
      groupedByHousehold.set(fee.householdId, []);
    }
    groupedByHousehold.get(fee.householdId)!.push(fee);
  });

  const createdReminders: PaymentReminder[] = [];
  
  groupedByHousehold.forEach((householdFees, householdId) => {
    const household = households.find(h => h.id === householdId);
    if (household) {
      const existingActiveReminder = paymentReminders.find(
        r => r.householdId === householdId && r.status === 'active'
      );
      if (existingActiveReminder) {
        return;
      }

      const periods = householdFees.map(f => f.period).sort().reverse();
      const totalAmount = householdFees.reduce((sum, f) => sum + f.amount, 0);
      const defaultMessage = `您有${periods.length}笔物业费待缴（${periods.join('、')}），共计${totalAmount.toFixed(2)}元，请尽快缴纳。`;

      const reminder: PaymentReminder = {
        id: getNextId('paymentReminder'),
        propertyFeeIds: householdFees.map(f => f.id),
        householdId,
        building: household.building,
        unit: household.unit,
        roomNumber: household.roomNumber,
        period: periods[0] + (periods.length > 1 ? ' 等' : ''),
        totalAmount,
        message: message || defaultMessage,
        status: 'active',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      paymentReminders.push(reminder);
      createdReminders.push(reminder);
    }
  });

  persistData();
  return { success: true, createdCount: createdReminders.length, data: createdReminders };
}

export function getPaymentReminders(householdId?: number) {
  let filtered = [...paymentReminders];
  if (householdId) {
    filtered = filtered.filter(r => r.householdId === householdId);
  }
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
