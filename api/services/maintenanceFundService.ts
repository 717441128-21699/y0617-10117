import { maintenanceFunds, approvalRecords } from '../db/mockData';
import type { MaintenanceFund, ApprovalRecord } from '../../shared/types';

function mapApprovalRecord(ar: any): ApprovalRecord {
  return {
    id: ar.id,
    fundId: ar.fundId,
    approver: ar.approver,
    role: ar.role,
    comment: ar.comment,
    approvedAt: ar.approvedAt,
    status: ar.status,
  };
}

export function getFundRecords(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;

  const sorted = [...maintenanceFunds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const total = sorted.length;
  const data = sorted.slice(offset, offset + pageSize);

  const totalIncome = maintenanceFunds
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalExpense = maintenanceFunds
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  const balance = sorted[0]?.balance || 0;

  return {
    data,
    total,
    totalIncome,
    totalExpense,
    balance,
  };
}

export function getFundRecordById(id: number) {
  const record = maintenanceFunds.find(f => f.id === id);
  if (!record) return null;

  const fundApprovals = approvalRecords
    .filter(ar => ar.fundId === id)
    .sort((a, b) => new Date(a.approvedAt).getTime() - new Date(b.approvedAt).getTime())
    .map(mapApprovalRecord);

  const invoicePhotos = [
    `https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop`,
    `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop`,
  ];

  return {
    ...record,
    approvalRecords: fundApprovals,
    invoicePhotos,
  };
}
