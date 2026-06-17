import { notices, noticeRead, getNextId } from '../db/mockData';
import type { Notice } from '../../shared/types';

const DEFAULT_HOUSEHOLD_ID = 1;

function attachIsRead(notice: Notice, householdId: number): Notice {
  const read = noticeRead.find(
    nr => nr.noticeId === notice.id && nr.householdId === householdId
  );
  return { ...notice, isRead: !!read };
}

export function getNotices(type?: string, page: number = 1, pageSize: number = 20, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const offset = (page - 1) * pageSize;

  let filtered = [...notices];
  if (type && type !== 'all') {
    filtered = filtered.filter(n => n.type === type);
  }

  const sorted = filtered.sort((a, b) =>
    new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
  );

  const total = sorted.length;
  const paged = sorted.slice(offset, offset + pageSize);
  const data = paged.map(n => attachIsRead(n, householdId));

  return { data, total };
}

export function getNoticeById(id: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const notice = notices.find(n => n.id === id);
  if (!notice) return null;
  return attachIsRead(notice, householdId);
}

export function markNoticeAsRead(id: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const existing = noticeRead.find(nr => nr.noticeId === id && nr.householdId === householdId);
  if (existing) return { success: true };

  noticeRead.push({
    noticeId: id,
    householdId,
    readAt: new Date().toISOString(),
  });
  return { success: true };
}

export function getImportantNotices(householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const importantTypes: Notice['type'][] = ['water', 'power', 'construction', 'important'];
  const filtered = notices
    .filter(n => importantTypes.includes(n.type))
    .sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime())
    .slice(0, 5);
  return filtered.map(n => attachIsRead(n, householdId));
}

export function getLatestNotices(limit: number = 3, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const sorted = [...notices].sort(
    (a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
  );
  const latest = sorted.slice(0, limit);
  return latest.map(n => attachIsRead(n, householdId));
}
