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
    pay: (id: number, paymentMethod: 'online' | 'offline', channel?: 'wechat' | 'alipay') => {
      return request<{ success: boolean; paidDate: string }>(`/property-fee/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod, channel }),
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
  },

  committee: {
    getList: () => {
      return request<{ data: any[] }>('/committee');
    },
  },
};
