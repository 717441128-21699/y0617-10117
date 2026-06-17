import type {
  Household,
  Notice,
  PropertyFee,
  MaintenanceFund,
  ApprovalRecord,
  Vote,
  VoteRecord,
  Complaint,
  CommitteeMember,
} from '../../shared/types';
import { loadData, saveData, hasDataFile } from './fileStorage';

const defaultHouseholds: Household[] = [
  { id: 1, building: '1栋', unit: '1单元', roomNumber: '101', ownerName: '张三', phone: '13800138001' },
  { id: 2, building: '1栋', unit: '1单元', roomNumber: '102', ownerName: '李四', phone: '13800138002' },
  { id: 3, building: '1栋', unit: '2单元', roomNumber: '201', ownerName: '王五', phone: '13800138003' },
  { id: 4, building: '2栋', unit: '1单元', roomNumber: '301', ownerName: '赵六', phone: '13800138004' },
  { id: 5, building: '2栋', unit: '2单元', roomNumber: '502', ownerName: '钱七', phone: '13800138005' },
];

const defaultNotices: Notice[] = [
  {
    id: 1,
    title: '关于小区停水通知',
    content: '因市政管道维修，1栋将于6月20日上午9:00-12:00停水，请提前做好储水准备。不便之处，敬请谅解。\n\n如有疑问，请联系物业服务中心：400-123-4567。',
    type: 'water',
    publishTime: '2024-06-18 09:00:00',
    publisher: '物业管理处',
    isRead: false,
  },
  {
    id: 2,
    title: '电梯维修通知',
    content: '3栋电梯将于6月25日进行年度检修，预计停运一天。请各位业主提前做好出行安排，如需帮助请联系物业。',
    type: 'construction',
    publishTime: '2024-06-17 14:30:00',
    publisher: '业委会',
    isRead: false,
  },
  {
    id: 3,
    title: '2024年业主大会会议通知',
    content: '兹定于2024年7月1日下午14:00在小区活动中心召开年度业主大会。\n\n会议议程：\n1. 年度工作报告\n2. 财务收支报告\n3. 其他事项讨论\n\n请各位业主准时参加。',
    type: 'normal',
    publishTime: '2024-06-15 10:00:00',
    publisher: '业委会',
    isRead: true,
  },
  {
    id: 4,
    title: '停电通知',
    content: '因线路检修，6月22日下午14:00-18:00全小区临时停电。请提前关闭电器设备，注意用电安全。',
    type: 'power',
    publishTime: '2024-06-20 08:00:00',
    publisher: '供电所',
    isRead: false,
  },
  {
    id: 5,
    title: '关于加强小区安全管理的通知',
    content: '为进一步加强小区安全管理，现通知如下：\n\n1. 外来人员进出小区请配合登记\n2. 车辆请停放至指定车位\n3. 夜间请关好门窗\n\n感谢您的配合！',
    type: 'important',
    publishTime: '2024-06-19 16:00:00',
    publisher: '业委会',
    isRead: false,
  },
];

const defaultNoticeRead: { noticeId: number; householdId: number; readAt: string }[] = [
  { noticeId: 3, householdId: 1, readAt: '2024-06-16 10:00:00' },
];

const defaultPropertyFees: PropertyFee[] = [
  { id: 1, householdId: 1, building: '1栋', unit: '1单元', roomNumber: '101', period: '2024-06', amount: 256.50, status: 'unpaid', dueDate: '2024-06-30' },
  { id: 2, householdId: 1, building: '1栋', unit: '1单元', roomNumber: '101', period: '2024-05', amount: 256.50, status: 'paid', dueDate: '2024-05-31', paidDate: '2024-05-20', paymentMethod: 'online' },
  { id: 3, householdId: 2, building: '1栋', unit: '1单元', roomNumber: '102', period: '2024-06', amount: 312.00, status: 'overdue', dueDate: '2024-06-10' },
  { id: 4, householdId: 2, building: '1栋', unit: '1单元', roomNumber: '102', period: '2024-05', amount: 312.00, status: 'paid', dueDate: '2024-05-31', paidDate: '2024-05-25', paymentMethod: 'offline' },
  { id: 5, householdId: 3, building: '1栋', unit: '2单元', roomNumber: '201', period: '2024-06', amount: 280.80, status: 'unpaid', dueDate: '2024-06-30' },
  { id: 6, householdId: 4, building: '2栋', unit: '1单元', roomNumber: '301', period: '2024-06', amount: 198.00, status: 'paid', dueDate: '2024-06-15', paidDate: '2024-06-10', paymentMethod: 'online' },
  { id: 7, householdId: 5, building: '2栋', unit: '2单元', roomNumber: '502', period: '2024-06', amount: 264.00, status: 'unpaid', dueDate: '2024-06-30' },
];

const defaultMaintenanceFunds: MaintenanceFund[] = [
  { id: 1, type: 'income', amount: 500000.00, description: '初始维修基金', date: '2023-01-01', balance: 500000.00 },
  { id: 2, type: 'expense', amount: 25000.00, description: '1栋电梯维修更换钢丝绳', date: '2023-06-15', balance: 475000.00 },
  { id: 3, type: 'expense', amount: 12000.00, description: '小区监控系统升级', date: '2023-09-20', balance: 463000.00 },
  { id: 4, type: 'expense', amount: 8500.00, description: '消防设施年度检测维护', date: '2024-03-10', balance: 454500.00 },
  { id: 5, type: 'income', amount: 15000.00, description: '小区广告位租金收入', date: '2024-05-01', balance: 469500.00 },
  { id: 6, type: 'expense', amount: 5000.00, description: '儿童游乐设施更新', date: '2024-05-20', balance: 464500.00 },
];

const defaultApprovalRecords: ApprovalRecord[] = [
  { id: 1, fundId: 2, approver: '王明', role: '业委会主任', comment: '情况属实，同意维修', approvedAt: '2023-06-10 10:00:00', status: 'approved' },
  { id: 2, fundId: 2, approver: '张健', role: '业委会委员', comment: '需要三家报价对比，选择性价比最高的方案', approvedAt: '2023-06-11 14:30:00', status: 'approved' },
  { id: 3, fundId: 3, approver: '王明', role: '业委会主任', comment: '同意升级监控系统对小区安全很有必要', approvedAt: '2023-09-15 09:00:00', status: 'approved' },
  { id: 4, fundId: 4, approver: '刘芳', role: '业委会委员', comment: '消防设施必须定期维护，同意', approvedAt: '2024-03-05 11:00:00', status: 'approved' },
  { id: 5, fundId: 6, approver: '王明', role: '业委会主任', comment: '儿童设施安全第一，同意更新', approvedAt: '2024-05-15 15:00:00', status: 'approved' },
];

const defaultVotes: Vote[] = [
  {
    id: 1,
    title: '关于更换物业公司的表决',
    description: '鉴于现有物业公司服务质量下降，业委会提议更换物业公司，请各位业主投票表决。\n\n候选物业公司：\n1. 诚信物业有限公司\n2. 家和物业服务集团\n\n请各位业主认真考虑，行使您的投票权利。',
    options: ['同意更换', '不同意更换', '弃权'],
    deadline: '2024-07-15 23:59:59',
    createdAt: '2024-06-01 10:00:00',
    status: 'ongoing',
    results: [0, 0, 0],
    totalVotes: 0,
    hasVoted: false,
  },
  {
    id: 2,
    title: '动用维修基金维修电梯',
    description: '3栋电梯已使用10年，需要进行重大维修，预计费用5万元。\n\n维修内容包括：\n- 更换主钢丝绳\n- 更换控制系统\n- 全面安全检测\n\n施工周期约7天。',
    options: ['同意动用', '不同意动用', '弃权'],
    deadline: '2024-06-30 23:59:59',
    createdAt: '2024-06-10 14:00:00',
    status: 'ongoing',
    results: [0, 0, 0],
    totalVotes: 0,
    hasVoted: false,
  },
  {
    id: 3,
    title: '小区健身器材采购方案',
    description: '计划采购一批健身器材放置在活动中心旁空地处，预算2万元。\n\n方案说明：\n- 方案A：常规户外健身器材\n- 方案B：智能健身器材（带计数、心率监测功能）',
    options: ['方案A（常规器材）', '方案B（智能器材）', '暂不采购'],
    deadline: '2024-06-10 23:59:59',
    createdAt: '2024-05-20 09:00:00',
    status: 'ended',
    results: [0, 0, 0],
    totalVotes: 0,
    hasVoted: false,
  },
];

const defaultVoteRecords: VoteRecord[] = [
  { id: 1, voteId: 1, householdId: 1, optionIndex: 0, votedAt: '2024-06-02 10:30:00' },
  { id: 2, voteId: 1, householdId: 2, optionIndex: 1, votedAt: '2024-06-03 14:20:00' },
  { id: 3, voteId: 1, householdId: 3, optionIndex: 0, votedAt: '2024-06-04 09:15:00' },
  { id: 4, voteId: 1, householdId: 4, optionIndex: 0, votedAt: '2024-06-05 16:45:00' },
  { id: 5, voteId: 2, householdId: 1, optionIndex: 0, votedAt: '2024-06-11 11:00:00' },
  { id: 6, voteId: 2, householdId: 4, optionIndex: 0, votedAt: '2024-06-12 15:30:00' },
  { id: 7, voteId: 3, householdId: 1, optionIndex: 0, votedAt: '2024-05-21 10:00:00' },
  { id: 8, voteId: 3, householdId: 2, optionIndex: 1, votedAt: '2024-05-22 14:00:00' },
  { id: 9, voteId: 3, householdId: 3, optionIndex: 2, votedAt: '2024-05-23 11:30:00' },
  { id: 10, voteId: 3, householdId: 5, optionIndex: 0, votedAt: '2024-05-24 09:45:00' },
];

const defaultComplaints: Complaint[] = [
  {
    id: 1,
    title: '1栋楼道灯损坏',
    type: 'maintenance',
    content: '1栋2单元3楼楼道灯不亮已有一周，晚上回家很不方便，老年人上下楼存在安全隐患。',
    status: 'completed',
    createdAt: '2024-06-14 19:30:00',
    reply: '已安排维修人员于6月15日上午更换完毕，感谢您的反馈。',
    repliedAt: '2024-06-15 10:30:00',
    replier: '李华',
    householdId: 1,
  },
  {
    id: 2,
    title: '深夜噪音扰民',
    type: 'noise',
    content: '2栋楼下烧烤店每晚营业到凌晨3点，客人划拳噪音严重影响休息，多次沟通无效。',
    status: 'processing',
    createdAt: '2024-06-16 23:45:00',
    householdId: 2,
  },
  {
    id: 3,
    title: '建议增设垃圾分类点',
    type: 'suggestion',
    content: '目前只有大门处有一个垃圾分类点，建议在各栋楼下增设小型分类桶，方便业主投放。',
    status: 'pending',
    createdAt: '2024-06-17 10:15:00',
    householdId: 3,
  },
  {
    id: 4,
    title: '地下车库积水问题',
    type: 'maintenance',
    content: '地下车库B区雨天多处积水，地面湿滑容易滑倒，希望尽快处理。',
    status: 'completed',
    createdAt: '2024-06-10 08:30:00',
    reply: '已安排施工队进行防水处理，现已修复完成。',
    repliedAt: '2024-06-12 16:00:00',
    replier: '张健',
    householdId: 4,
  },
  {
    id: 5,
    title: '小区绿化修剪',
    type: 'sanitation',
    content: '小区部分绿化带杂草丛生，建议定期修剪维护。',
    status: 'processing',
    createdAt: '2024-06-13 15:00:00',
    householdId: 5,
  },
];

const defaultCommitteeMembers: CommitteeMember[] = [
  {
    id: 1,
    name: '王明',
    position: '主任',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    phone: '13900139001',
    email: 'wangming@example.com',
    responsibilities: ['主持业委会全面工作', '分管财务审批'],
  },
  {
    id: 2,
    name: '李华',
    position: '副主任',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    phone: '13900139002',
    email: 'lihua@example.com',
    responsibilities: ['分管物业监督', '分管投诉处理'],
  },
  {
    id: 3,
    name: '张健',
    position: '委员',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    phone: '13900139003',
    email: 'zhangjian@example.com',
    responsibilities: ['分管维修基金管理', '分管工程维修'],
  },
  {
    id: 4,
    name: '刘芳',
    position: '委员',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    phone: '13900139004',
    email: 'liufang@example.com',
    responsibilities: ['分管环境卫生', '分管社区活动'],
  },
  {
    id: 5,
    name: '陈伟',
    position: '委员',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    phone: '13900139005',
    email: 'chenwei@example.com',
    responsibilities: ['分管安全保卫', '分管宣传通知'],
  },
];

function getDefaultNextIds() {
  return {
    notice: defaultNotices.length + 1,
    propertyFee: defaultPropertyFees.length + 1,
    maintenanceFund: defaultMaintenanceFunds.length + 1,
    vote: defaultVotes.length + 1,
    voteRecord: defaultVoteRecords.length + 1,
    complaint: defaultComplaints.length + 1,
    committeeMember: defaultCommitteeMembers.length + 1,
    noticeRead: defaultNoticeRead.length + 1,
  };
}

export let households: Household[] = [];
export let notices: Notice[] = [];
export let noticeRead: { noticeId: number; householdId: number; readAt: string }[] = [];
export let propertyFees: PropertyFee[] = [];
export let maintenanceFunds: MaintenanceFund[] = [];
export let approvalRecords: ApprovalRecord[] = [];
export let votes: Vote[] = [];
export let voteRecords: VoteRecord[] = [];
export let complaints: Complaint[] = [];
export let committeeMembers: CommitteeMember[] = [];

let nextIds = getDefaultNextIds();

export function getNextId(type: keyof typeof nextIds) {
  const id = nextIds[type]++;
  persistData();
  return id;
}

export function persistData() {
  const data = {
    households,
    notices,
    noticeRead,
    propertyFees,
    maintenanceFunds,
    approvalRecords,
    votes,
    voteRecords,
    complaints,
    committeeMembers,
    nextIds,
  };
  saveData(data);
}

export function initMockData() {
  const savedData = loadData();
  
  if (savedData) {
    households = savedData.households || [];
    notices = savedData.notices || [];
    noticeRead = savedData.noticeRead || [];
    propertyFees = savedData.propertyFees || [];
    maintenanceFunds = savedData.maintenanceFunds || [];
    approvalRecords = savedData.approvalRecords || [];
    votes = savedData.votes || [];
    voteRecords = savedData.voteRecords || [];
    complaints = savedData.complaints || [];
    committeeMembers = savedData.committeeMembers || [];
    nextIds = savedData.nextIds || getDefaultNextIds();
    
    console.log('Data loaded from file successfully');
  } else {
    households = [...defaultHouseholds];
    notices = [...defaultNotices];
    noticeRead = [...defaultNoticeRead];
    propertyFees = [...defaultPropertyFees];
    maintenanceFunds = [...defaultMaintenanceFunds];
    approvalRecords = [...defaultApprovalRecords];
    votes = [...defaultVotes];
    voteRecords = [...defaultVoteRecords];
    complaints = [...defaultComplaints];
    committeeMembers = [...defaultCommitteeMembers];
    nextIds = getDefaultNextIds();
    
    persistData();
    console.log('Default data initialized and saved');
  }

  votes.forEach(vote => {
    const records = voteRecords.filter(vr => vr.voteId === vote.id);
    vote.results = vote.options.map((_, i) => records.filter(r => r.optionIndex === i).length);
    vote.totalVotes = records.length;
  });
  
  console.log('Mock data initialized successfully');
}

export function resetToDefault() {
  households = [...defaultHouseholds];
  notices = [...defaultNotices];
  noticeRead = [...defaultNoticeRead];
  propertyFees = [...defaultPropertyFees];
  maintenanceFunds = [...defaultMaintenanceFunds];
  approvalRecords = [...defaultApprovalRecords];
  votes = [...defaultVotes];
  voteRecords = [...defaultVoteRecords];
  complaints = [...defaultComplaints];
  committeeMembers = [...defaultCommitteeMembers];
  nextIds = getDefaultNextIds();
  
  votes.forEach(vote => {
    const records = voteRecords.filter(vr => vr.voteId === vote.id);
    vote.results = vote.options.map((_, i) => records.filter(r => r.optionIndex === i).length);
    vote.totalVotes = records.length;
  });
  
  persistData();
  console.log('Data reset to default');
}
