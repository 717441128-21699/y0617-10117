import { complaints, getNextId, persistData } from '../db/mockData';
import type { Complaint } from '../../shared/types';

const DEFAULT_HOUSEHOLD_ID = 1;

export function getComplaints(householdId?: number, all: boolean = false) {
  let filtered = [...complaints];
  if (!all && householdId) {
    filtered = filtered.filter(c => c.householdId === householdId);
  }
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getComplaintById(id: number) {
  return complaints.find(c => c.id === id) || null;
}

export function createComplaint(
  title: string,
  type: Complaint['type'],
  content: string,
  householdId: number = DEFAULT_HOUSEHOLD_ID,
  images?: string[]
) {
  const newComplaint: Complaint = {
    id: getNextId('complaint'),
    title,
    type,
    content,
    images,
    status: 'pending',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    householdId,
  };
  complaints.unshift(newComplaint);
  persistData();
  return { success: true, id: newComplaint.id };
}

export function replyComplaint(id: number, reply: string, replier: string) {
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return { success: false, error: '投诉不存在' };

  complaint.status = 'completed';
  complaint.reply = reply;
  complaint.replier = replier;
  complaint.repliedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  persistData();

  return { success: true };
}

export function updateComplaintStatus(id: number, status: Complaint['status']) {
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) return { success: false, error: '投诉不存在' };

  complaint.status = status;
  persistData();

  return { success: true };
}

export function getPendingCount() {
  return complaints.filter(c => c.status === 'pending' || c.status === 'processing').length;
}
