const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

export const api = {
  dashboard: {
    getStats: () => request<{ data: any }>('/dashboard/stats'),
  },

  notices: {
    getList: (params?: { type?: string; page?: number; pageSize?: number; householdId?: number }) => {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
      if (params?.householdId) query.append('householdId', params.householdId.toString());
      return request<{ data: any[]; total: number }>(`/notices?${query.toString()}`);
    },
    getById: (id: number, householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any }>(`/notices/${id}${query}`);
    },
    markAsRead: (id: number, householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ success: boolean }>(`/notices/${id}/read${query}`, { method: 'PUT' });
    },
    getImportant: (householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any[] }>(`/notices/important${query}`);
    },
    getLatest: (limit?: number, householdId?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (householdId) params.append('householdId', householdId.toString());
      return request<{ data: any[] }>(`/notices/latest?${params.toString()}`);
    },
    create: (data: { title: string; content: string; type: string; publisher?: string }) => {
      return request<{ data: any }>('/notices', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getAdminList: (type?: string) => {
      const query = type ? `?type=${type}` : '';
      return request<{ data: any[] }>(`/notices/admin/list${query}`);
    },
    getStatistics: (id: number) => {
      return request<{ data: any }>(`/notices/${id}/statistics`);
    },
    sendReminder: (id: number, sender?: string) => {
      return request<{ success: boolean; data?: any; unreadCount?: number; unreadHouseholds?: any[]; error?: string }>(`/notices/${id}/remind`, {
        method: 'POST',
        body: JSON.stringify({ sender }),
      });
    },
    getReminders: (id: number) => {
      return request<{ data: any[] }>(`/notices/${id}/reminders`);
    },
  },

  propertyFee: {
    getList: (householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any[]; unpaidTotal: number }>(`/property-fee${query}`);
    },
    getRecords: (householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any[] }>(`/property-fee/records${query}`);
    },
    getById: (id: number) => {
      return request<{ data: any }>(`/property-fee/detail/${id}`);
    },
    pay: (id: number, paymentMethod: 'online' | 'offline', channel?: 'wechat' | 'alipay') => {
      return request<{ success: boolean; paidDate: string }>(`/property-fee/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, channel }),
      });
    },
    getAll: (status?: string, period?: string) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (period) params.append('period', period);
      return request<{ data: any[] }>(`/property-fee/all/list?${params.toString()}`);
    },
    getHouseholds: () => {
      return request<{ data: any[] }>('/property-fee/households/list');
    },
    getBuildings: () => {
      return request<{ data: string[] }>('/property-fee/buildings/list');
    },
    getUnits: (building?: string) => {
      const query = building ? `?building=${encodeURIComponent(building)}` : '';
      return request<{ data: string[] }>(`/property-fee/units/list${query}`);
    },
    create: (data: { householdId: number; period: string; amount: number; dueDate: string }) => {
      return request<{ success: boolean; data?: any; error?: string }>('/property-fee/create/new', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    batchPreview: (data: { period: string; building?: string; unit?: string; householdIds?: number[]; amountPerHousehold: number; dueDate: string }) => {
      return request<{ willCreate: any[]; willSkip: any[]; totalAmount: number }>('/property-fee/batch/preview', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    batchCreate: (data: { period: string; building?: string; unit?: string; householdIds?: number[]; amountPerHousehold: number; dueDate: string }) => {
      return request<{ success: boolean; createdCount: number; skippedCount: number; data?: any[] }>('/property-fee/batch/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    markPaidOffline: (id: number) => {
      return request<{ success: boolean; paidDate?: string; error?: string }>(`/property-fee/${id}/mark-paid-offline`, {
        method: 'POST',
      });
    },
    getReminders: (householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any[] }>(`/property-fee/reminders/list${query}`);
    },
    createReminders: (propertyFeeIds: number[], message?: string) => {
      return request<{ success: boolean; createdCount: number; data?: any[]; error?: string }>('/property-fee/reminders/create', {
        method: 'POST',
        body: JSON.stringify({ propertyFeeIds, message }),
      });
    },
  },

  maintenanceFund: {
    getList: (params?: { page?: number; pageSize?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
      return request<{ data: any[]; total: number; totalIncome: number; totalExpense: number; balance: number }>(
        `/maintenance-fund?${query.toString()}`
      );
    },
    getById: (id: number) => {
      return request<{ data: any }>(`/maintenance-fund/${id}`);
    },
  },

  votes: {
    getList: (householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any[] }>(`/votes${query}`);
    },
    getById: (id: number, householdId?: number) => {
      const query = householdId ? `?householdId=${householdId}` : '';
      return request<{ data: any }>(`/votes/${id}${query}`);
    },
    castVote: (id: number, optionIndex: number, householdId?: number) => {
      return request<{ success: boolean; message?: string }>(`/votes/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionIndex, householdId }),
      });
    },
    create: (data: { title: string; description: string; options: string[]; deadline: string }) => {
      return request<{ data: any }>('/votes/create/new', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getStatistics: (id: number) => {
      return request<{ data: any }>(`/votes/${id}/statistics`);
    },
  },

  complaints: {
    getList: (params?: { householdId?: number; all?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.householdId) query.append('householdId', params.householdId.toString());
      if (params?.all) query.append('all', 'true');
      return request<{ data: any[] }>(`/complaints?${query.toString()}`);
    },
    getById: (id: number) => {
      return request<{ data: any }>(`/complaints/${id}`);
    },
    create: (data: { title: string; type: string; content: string; householdId?: number; images?: string[] }) => {
      return request<{ success: boolean; id: number }>('/complaints', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    reply: (id: number, reply: string, replier: string) => {
      return request<{ success: boolean }>(`/complaints/${id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ reply, replier }),
      });
    },
    updateStatus: (id: number, status: string) => {
      return request<{ success: boolean }>(`/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
  },

  committee: {
    getList: () => {
      return request<{ data: any[] }>('/committee');
    },
  },
};
