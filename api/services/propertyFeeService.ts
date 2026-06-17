import { propertyFees, getNextId, persistData, households } from '../db/mockData';
import type { PropertyFee } from '../../shared/types';

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

export function markAsPaidOffline(id: number) {
  const fee = propertyFees.find(f => f.id === id);
  if (!fee || fee.status === 'paid') {
    return { success: false, error: '账单不存在或已缴费' };
  }

  const paidDate = new Date().toISOString().split('T')[0];
  fee.status = 'paid';
  fee.paidDate = paidDate;
  fee.paymentMethod = 'offline';
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
