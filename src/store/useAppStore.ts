import { create } from 'zustand';
import type {
  DashboardStats,
  Notice,
  PropertyFee,
  MaintenanceFund,
  Vote,
  Complaint,
  CommitteeMember,
} from '../../shared/types';

interface AppState {
  currentHouseholdId: number;
  userRole: 'owner' | 'admin';
  importantNotices: Notice[];
  dashboardStats: DashboardStats | null;
  notices: Notice[];
  propertyFees: PropertyFee[];
  unpaidTotal: number;
  paymentRecords: PropertyFee[];
  fundRecords: MaintenanceFund[];
  fundSummary: { totalIncome: number; totalExpense: number; balance: number } | null;
  votes: Vote[];
  complaints: Complaint[];
  committeeMembers: CommitteeMember[];
  showStrongReminder: boolean;
  currentNotice: Notice | MaintenanceFund | null;
  currentVote: Vote | null;
  loading: boolean;
  sidebarCollapsed: boolean;

  setCurrentHouseholdId: (id: number) => void;
  setUserRole: (role: 'owner' | 'admin') => void;
  setImportantNotices: (notices: Notice[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setNotices: (notices: Notice[]) => void;
  setPropertyFees: (fees: PropertyFee[]) => void;
  setUnpaidTotal: (total: number) => void;
  setPaymentRecords: (records: PropertyFee[]) => void;
  setFundRecords: (records: MaintenanceFund[]) => void;
  setVotes: (votes: Vote[]) => void;
  setComplaints: (complaints: Complaint[]) => void;
  setCommitteeMembers: (members: CommitteeMember[]) => void;
  setShowStrongReminder: (show: boolean) => void;
  setCurrentNotice: (notice: Notice | MaintenanceFund | null) => void;
  setCurrentVote: (vote: Vote | null) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentHouseholdId: 1,
  userRole: 'owner',
  importantNotices: [],
  dashboardStats: null,
  notices: [],
  propertyFees: [],
  unpaidTotal: 0,
  paymentRecords: [],
  fundRecords: [],
  fundSummary: null,
  votes: [],
  complaints: [],
  committeeMembers: [],
  showStrongReminder: false,
  currentNotice: null,
  currentVote: null,
  loading: false,
  sidebarCollapsed: false,

  setCurrentHouseholdId: (id) => set({ currentHouseholdId: id }),
  setUserRole: (role) => set({ userRole: role }),
  setImportantNotices: (notices) => set({ importantNotices: notices }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setNotices: (notices) => set({ notices }),
  setPropertyFees: (fees) => set({ propertyFees: fees }),
  setUnpaidTotal: (total) => set({ unpaidTotal: total }),
  setPaymentRecords: (records) => set({ paymentRecords: records }),
  setFundRecords: (records) => set({ fundRecords: records }),
  setVotes: (votes) => set({ votes }),
  setComplaints: (complaints) => set({ complaints }),
  setCommitteeMembers: (members) => set({ committeeMembers: members }),
  setShowStrongReminder: (show) => set({ showStrongReminder: show }),
  setCurrentNotice: (notice) => set({ currentNotice: notice }),
  setCurrentVote: (vote) => set({ currentVote: vote }),
  setLoading: (loading) => set({ loading }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
