import { notices, noticeRead, noticeReminders, getNextId, persistData, households } from '../db/mockData';
import type { Notice, NoticeReadRecord, NoticeReminderRecord } from '../../shared/types';

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

export function getAllNoticesForAdmin(type?: string) {
  let filtered = [...notices];
  if (type && type !== 'all') {
    filtered = filtered.filter(n => n.type === type);
  }

  const sorted = filtered.sort((a, b) =>
    new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime()
  );

  const data = sorted.map(notice => {
    const readCount = noticeRead.filter(nr => nr.noticeId === notice.id).length;
    const unreadCount = households.length - readCount;
    return {
      ...notice,
      isRead: false,
      readCount,
      unreadCount,
    };
  });

  return { data };
}

export function getNoticeById(id: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const notice = notices.find(n => n.id === id);
  if (!notice) return null;
  return attachIsRead(notice, householdId);
}

export function markNoticeAsRead(id: number, householdId: number = DEFAULT_HOUSEHOLD_ID) {
  const existing = noticeRead.find(nr => nr.noticeId === id && nr.householdId === householdId);
  if (existing) return { success: true };

  const record: NoticeReadRecord = {
    id: getNextId('noticeRead'),
    noticeId: id,
    householdId,
    readAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  noticeRead.push(record);
  persistData();
  return { success: true };
}

export function getNoticeStatistics(noticeId: number) {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) return null;

  const readRecordIds = new Set(
    noticeRead.filter(nr => nr.noticeId === noticeId).map(nr => nr.householdId)
  );

  const readHouseholds = households.filter(h => readRecordIds.has(h.id));
  const unreadHouseholds = households.filter(h => !readRecordIds.has(h.id));

  const byBuilding: Record<string, { total: number; read: number; unreadHouseholds: any[] }> = {};

  households.forEach(household => {
    if (!byBuilding[household.building]) {
      byBuilding[household.building] = { total: 0, read: 0, unreadHouseholds: [] };
    }
    byBuilding[household.building].total++;
    if (readRecordIds.has(household.id)) {
      byBuilding[household.building].read++;
    } else {
      byBuilding[household.building].unreadHouseholds.push({
        id: household.id,
        building: household.building,
        unit: household.unit,
        roomNumber: household.roomNumber,
        ownerName: household.ownerName,
        phone: household.phone,
      });
    }
  });

  return {
    noticeId,
    noticeTitle: notice.title,
    noticeType: notice.type,
    publishTime: notice.publishTime,
    totalHouseholds: households.length,
    readCount: readHouseholds.length,
    unreadCount: unreadHouseholds.length,
    readRate: households.length > 0 ? Math.round((readHouseholds.length / households.length) * 100) : 0,
    byBuilding,
    readHouseholds,
    unreadHouseholds,
  };
}

export function createNotice(data: { title: string; content: string; type: Notice['type']; publisher: string }) {
  const newNotice: Notice = {
    id: getNextId('notice'),
    title: data.title,
    content: data.content,
    type: data.type,
    publishTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    publisher: data.publisher,
    isRead: false,
  };
  
  notices.unshift(newNotice);
  persistData();
  return newNotice;
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

export function sendNoticeReminder(noticeId: number, sender: string = '业委会管理员') {
  const notice = notices.find(n => n.id === noticeId);
  if (!notice) {
    return { success: false, error: '通知不存在' };
  }

  const readRecordIds = new Set(
    noticeRead.filter(nr => nr.noticeId === noticeId).map(nr => nr.householdId)
  );

  const unreadHouseholds = households.filter(h => !readRecordIds.has(h.id));
  
  if (unreadHouseholds.length === 0) {
    return { success: false, error: '所有住户都已阅读此通知' };
  }

  const defaultMessage = `【重要通知提醒】${notice.title}。请您及时阅读了解详情。`;

  const reminder: NoticeReminderRecord = {
    id: getNextId('noticeReminder'),
    noticeId,
    sender,
    targetHouseholdIds: unreadHouseholds.map(h => h.id),
    message: defaultMessage,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  noticeReminders.push(reminder);
  persistData();

  return {
    success: true,
    data: reminder,
    unreadCount: unreadHouseholds.length,
    unreadHouseholds,
  };
}

export function getNoticeReminders(noticeId?: number) {
  let filtered = [...noticeReminders];
  if (noticeId) {
    filtered = filtered.filter(r => r.noticeId === noticeId);
  }
  
  return filtered
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(reminder => {
      const targetHouseholds = households.filter(h => reminder.targetHouseholdIds.includes(h.id));
      return {
        ...reminder,
        targetHouseholds,
      };
    });
}
