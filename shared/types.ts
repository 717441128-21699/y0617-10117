export interface Household {
  id: number;
  building: string;
  unit: string;
  roomNumber: string;
  ownerName: string;
  phone: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  type: 'normal' | 'water' | 'power' | 'construction' | 'important';
  publishTime: string;
  publisher: string;
  isRead: boolean;
  attachments?: string[];
}

export interface PropertyFee {
  id: number;
  householdId: number;
  building: string;
  unit: string;
  roomNumber: string;
  period: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  paymentMethod?: 'online' | 'offline';
}

export interface ApprovalRecord {
  id: number;
  fundId: number;
  approver: string;
  role: string;
  comment: string;
  approvedAt: string;
  status: 'approved' | 'rejected';
}

export interface MaintenanceFund {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  balance: number;
  approvalRecords?: ApprovalRecord[];
  invoicePhotos?: string[];
}

export interface Vote {
  id: number;
  title: string;
  description: string;
  options: string[];
  deadline: string;
  createdAt: string;
  status: 'ongoing' | 'ended';
  results?: number[];
  totalVotes: number;
  hasVoted: boolean;
  userVote?: number;
}

export interface VoteRecord {
  id: number;
  voteId: number;
  householdId: number;
  optionIndex: number;
  votedAt: string;
}

export interface NoticeReadRecord {
  id: number;
  noticeId: number;
  householdId: number;
  readAt: string;
}

export interface NoticeReminderRecord {
  id: number;
  noticeId: number;
  sender: string;
  targetHouseholdIds: number[];
  message: string;
  createdAt: string;
}

export interface PaymentReminder {
  id: number;
  propertyFeeIds: number[];
  householdId: number;
  building: string;
  unit: string;
  roomNumber: string;
  period: string;
  totalAmount: number;
  message: string;
  status: 'active' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface Complaint {
  id: number;
  title: string;
  type: 'maintenance' | 'noise' | 'sanitation' | 'security' | 'suggestion' | 'other';
  content: string;
  images?: string[];
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  replier?: string;
  householdId: number;
}

export interface CommitteeMember {
  id: number;
  name: string;
  position: string;
  avatar: string;
  phone: string;
  email: string;
  responsibilities: string[];
}

export interface DashboardStats {
  totalHouseholds: number;
  paidHouseholds: number;
  ongoingVotes: number;
  pendingComplaints: number;
  unpaidTotal: number;
  fundBalance: number;
}

export interface User {
  id: number;
  householdId: number;
  name: string;
  role: 'owner' | 'admin';
}

export const NOTICE_TYPE_LABELS: Record<Notice['type'], string> = {
  normal: '普通通知',
  water: '停水通知',
  power: '停电通知',
  construction: '施工告知',
  important: '重要通知',
};

export const FEE_STATUS_LABELS: Record<PropertyFee['status'], string> = {
  unpaid: '待缴费',
  paid: '已缴费',
  overdue: '已逾期',
};

export const COMPLAINT_TYPE_LABELS: Record<Complaint['type'], string> = {
  maintenance: '维修维护',
  noise: '噪音扰民',
  sanitation: '环境卫生',
  security: '治安问题',
  suggestion: '建议咨询',
  other: '其他问题',
};

export const COMPLAINT_STATUS_LABELS: Record<Complaint['status'], string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
};

export const VOTE_STATUS_LABELS: Record<Vote['status'], string> = {
  ongoing: '进行中',
  ended: '已结束',
};
