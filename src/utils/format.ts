export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDeadline(deadline: string): { text: string; urgent: boolean; daysLeft: number } {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: '已截止', urgent: false, daysLeft: diffDays };
  }
  if (diffDays === 0) {
    return { text: '今天截止', urgent: true, daysLeft: 0 };
  }
  if (diffDays <= 3) {
    return { text: `剩余 ${diffDays} 天`, urgent: true, daysLeft: diffDays };
  }
  return { text: `剩余 ${diffDays} 天`, urgent: false, daysLeft: diffDays };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
    case 'completed':
    case 'approved':
    case 'success':
      return 'text-success-500 bg-green-50';
    case 'unpaid':
      return 'text-warning-500 bg-yellow-50';
    case 'overdue':
    case 'rejected':
      return 'text-danger-500 bg-red-50';
    case 'pending':
      return 'text-warning-500 bg-yellow-50';
    case 'processing':
    case 'ongoing':
      return 'text-primary-600 bg-blue-50';
    case 'ended':
      return 'text-gray-500 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getNoticeTypeColor(type: string): string {
  switch (type) {
    case 'water':
    case 'power':
    case 'construction':
    case 'important':
      return 'bg-danger-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export const NOTICE_TYPE_LABELS: Record<string, string> = {
  normal: '普通通知',
  water: '停水通知',
  power: '停电通知',
  construction: '施工告知',
  important: '重要通知',
};

export const FEE_STATUS_LABELS: Record<string, string> = {
  unpaid: '待缴费',
  paid: '已缴费',
  overdue: '已逾期',
};

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  maintenance: '维修维护',
  noise: '噪音扰民',
  sanitation: '环境卫生',
  security: '治安问题',
  suggestion: '建议咨询',
  other: '其他问题',
};

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
};

export const VOTE_STATUS_LABELS: Record<string, string> = {
  ongoing: '进行中',
  ended: '已结束',
};
