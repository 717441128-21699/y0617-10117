import { propertyFees, getNextId } from '../db/mockData';
import { households } from '../db/mockData';
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
