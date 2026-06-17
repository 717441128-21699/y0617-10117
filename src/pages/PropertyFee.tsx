import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Smartphone,
  Banknote,
  X,
  Plus,
  Users,
  FileText,
  Building,
  Layers,
  Bell,
  CheckSquare,
  Square,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  FEE_STATUS_LABELS,
} from '@/utils/format';
import type { PropertyFee, Household, PaymentReminder } from '../../shared/types';

export default function PropertyFee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentHouseholdId, userRole, propertyFees, setPropertyFees, unpaidTotal, setUnpaidTotal } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'unpaid_overdue'>(
    (searchParams.get('tab') as any) || 'all'
  );
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<PropertyFee | null>(null);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [paying, setPaying] = useState(false);
  
  const [allFees, setAllFees] = useState<PropertyFee[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    householdId: 1,
    period: '',
    amount: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchMode, setBatchMode] = useState<'filter' | 'select'>('filter');
  const [batchForm, setBatchForm] = useState({
    period: '',
    building: '',
    unit: '',
    amountPerHousehold: '',
    dueDate: '',
  });
  const [buildings, setBuildings] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [batchPreviewData, setBatchPreviewData] = useState<{ willCreate: any[]; willSkip: any[]; totalAmount: number } | null>(null);
  const [batchPreviewLoading, setBatchPreviewLoading] = useState(false);
  const [batchCreating, setBatchCreating] = useState(false);
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<number[]>([]);

  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [creatingReminder, setCreatingReminder] = useState(false);

  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  useEffect(() => {
    loadPropertyFees();
    if (userRole === 'admin') {
      loadAllFees();
      loadHouseholds();
      loadBuildings();
    }
    if (userRole === 'owner') {
      loadReminders();
    }
  }, [currentHouseholdId, userRole, activeTab]);

  useEffect(() => {
    if (batchForm.building) {
      loadUnits(batchForm.building);
    } else {
      setUnits([]);
    }
  }, [batchForm.building]);

  const loadPropertyFees = async () => {
    setLoading(true);
    try {
      const response = await api.propertyFee.getList(currentHouseholdId);
      setPropertyFees(response.data);
      setUnpaidTotal(response.unpaidTotal);
    } catch (error) {
      console.error('加载物业费失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFees = async () => {
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await api.propertyFee.getAll(status);
      setAllFees(response.data);
    } catch (error) {
      console.error('加载全部物业费失败', error);
    }
  };

  const loadHouseholds = async () => {
    try {
      const response = await api.propertyFee.getHouseholds();
      setHouseholds(response.data);
    } catch (error) {
      console.error('加载业主列表失败', error);
    }
  };

  const loadBuildings = async () => {
    try {
      const response = await api.propertyFee.getBuildings();
      setBuildings(response.data);
    } catch (error) {
      console.error('加载楼栋列表失败', error);
    }
  };

  const loadUnits = async (building: string) => {
    try {
      const response = await api.propertyFee.getUnits(building);
      setUnits(response.data);
    } catch (error) {
      console.error('加载单元列表失败', error);
    }
  };

  const loadReminders = async () => {
    setRemindersLoading(true);
    try {
      const response = await api.propertyFee.getReminders(currentHouseholdId);
      setReminders(response.data);
    } catch (error) {
      console.error('加载催缴记录失败', error);
    } finally {
      setRemindersLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    setSearchParams({ tab });
    setSelectedFeeIds([]);
  };

  const handlePay = (fee: PropertyFee) => {
    setSelectedFee(fee);
    setShowPayModal(true);
  };

  const confirmPay = async () => {
    if (!selectedFee) return;
    setPaying(true);
    try {
      await api.propertyFee.pay(selectedFee.id, 'online', payMethod);
      setShowPayModal(false);
      setSelectedFee(null);
      loadPropertyFees();
      if (userRole === 'admin') {
        loadAllFees();
      }
      if (userRole === 'owner') {
        loadReminders();
      }
    } catch (error) {
      console.error('缴费失败', error);
      alert('缴费失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  const handleCreateFee = async () => {
    if (!createForm.householdId || !createForm.period || !createForm.amount || !createForm.dueDate) {
      alert('请填写完整的账单信息');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.propertyFee.create({
        householdId: parseInt(createForm.householdId as any),
        period: createForm.period,
        amount: parseFloat(createForm.amount),
        dueDate: createForm.dueDate,
      });

      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({ householdId: 1, period: '', amount: '', dueDate: '' });
        loadAllFees();
        loadPropertyFees();
      } else {
        alert((result as any).error || '创建账单失败');
      }
    } catch (error) {
      console.error('创建账单失败', error);
      alert('创建账单失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchPreview = async () => {
    if (!batchForm.period || !batchForm.amountPerHousehold || !batchForm.dueDate) {
      alert('请填写完整的批量账单信息（计费周期、金额、截止日期）');
      return;
    }

    if (batchMode === 'select' && selectedHouseholdIds.length === 0) {
      alert('请至少选择一个房号');
      return;
    }

    setBatchPreviewLoading(true);
    try {
      const result = await api.propertyFee.batchPreview({
        period: batchForm.period,
        building: batchMode === 'filter' ? (batchForm.building || undefined) : undefined,
        unit: batchMode === 'filter' ? (batchForm.unit || undefined) : undefined,
        householdIds: batchMode === 'select' ? selectedHouseholdIds : undefined,
        amountPerHousehold: parseFloat(batchForm.amountPerHousehold),
        dueDate: batchForm.dueDate,
      });
      setBatchPreviewData(result);
    } catch (error) {
      console.error('批量预览失败', error);
      alert('批量预览失败，请重试');
    } finally {
      setBatchPreviewLoading(false);
    }
  };

  const handleBatchCreate = async () => {
    if (!batchPreviewData) {
      alert('请先预览账单');
      return;
    }
    if (batchPreviewData.willCreate.length === 0) {
      alert('没有需要生成的账单');
      return;
    }

    setBatchCreating(true);
    try {
      const result = await api.propertyFee.batchCreate({
        period: batchForm.period,
        building: batchMode === 'filter' ? (batchForm.building || undefined) : undefined,
        unit: batchMode === 'filter' ? (batchForm.unit || undefined) : undefined,
        householdIds: batchMode === 'select' ? selectedHouseholdIds : undefined,
        amountPerHousehold: parseFloat(batchForm.amountPerHousehold),
        dueDate: batchForm.dueDate,
      });

      if (result.success) {
        alert(`成功生成 ${result.createdCount} 条账单，跳过 ${result.skippedCount} 条`);
        setShowBatchModal(false);
        setBatchForm({ period: '', building: '', unit: '', amountPerHousehold: '', dueDate: '' });
        setBatchMode('filter');
        setSelectedHouseholdIds([]);
        setBatchPreviewData(null);
        loadAllFees();
        loadPropertyFees();
      } else {
        alert((result as any).error || '批量生成失败');
      }
    } catch (error) {
      console.error('批量生成失败', error);
      alert('批量生成失败，请重试');
    } finally {
      setBatchCreating(false);
    }
  };

  const handleToggleSelectFee = (feeId: number) => {
    setSelectedFeeIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    );
  };

  const handleSelectAllFees = () => {
    const unpaidFees = allFees.filter((f) => f.status === 'unpaid' || f.status === 'overdue');
    if (selectedFeeIds.length === unpaidFees.length) {
      setSelectedFeeIds([]);
    } else {
      setSelectedFeeIds(unpaidFees.map((f) => f.id));
    }
  };

  const handleCreateReminders = async () => {
    if (selectedFeeIds.length === 0) {
      alert('请选择要催缴的账单');
      return;
    }

    setCreatingReminder(true);
    try {
      const result = await api.propertyFee.createReminders(selectedFeeIds, reminderMessage || undefined);
      if (result.success) {
        alert(`成功生成 ${result.createdCount} 条催缴记录`);
        setShowReminderModal(false);
        setSelectedFeeIds([]);
        setReminderMessage('');
      } else {
        alert((result as any).error || '生成催缴记录失败');
      }
    } catch (error) {
      console.error('生成催缴记录失败', error);
      alert('生成催缴记录失败，请重试');
    } finally {
      setCreatingReminder(false);
    }
  };

  const handleMarkPaidOffline = async (fee: PropertyFee) => {
    if (!confirm(`确认将 ${fee.period} 物业费标记为线下已缴吗？`)) return;

    try {
      const result = await api.propertyFee.markPaidOffline(fee.id);
      if (result.success) {
        loadAllFees();
        loadPropertyFees();
      } else {
        alert((result as any).error || '操作失败');
      }
    } catch (error) {
      console.error('标记缴费失败', error);
      alert('操作失败，请重试');
    }
  };

  const filteredFees = propertyFees.filter((fee) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unpaid_overdue') {
      return fee.status === 'unpaid' || fee.status === 'overdue';
    }
    return fee.status === activeTab;
  });

  const displayFees = userRole === 'admin' ? allFees : filteredFees;
  const showCheckbox = userRole === 'admin' && activeTab === 'unpaid_overdue';
  const unpaidFeesForSelect = allFees.filter((f) => f.status === 'unpaid' || f.status === 'overdue');

  const unpaidCount = userRole === 'admin'
    ? allFees.filter((f) => f.status === 'unpaid' || f.status === 'overdue').length
    : propertyFees.filter((f) => f.status !== 'paid').length;

  const totalAmount = userRole === 'admin'
    ? allFees.reduce((sum, f) => sum + f.amount, 0)
    : propertyFees.reduce((sum, f) => sum + f.amount, 0);

  const paidAmount = userRole === 'admin'
    ? allFees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)
    : propertyFees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  const unpaidTotalAmount = userRole === 'admin'
    ? allFees.filter((f) => f.status === 'unpaid' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0)
    : unpaidTotal;

  const getStatusTextColor = (status: string) => {
    if (status === 'paid') return 'text-success-500';
    if (status === 'overdue') return 'text-danger-500';
    return 'text-warning-500';
  };

  const getFeeIconBgColor = (status: string) => {
    if (status === 'paid') return 'bg-green-100';
    if (status === 'overdue') return 'bg-red-100';
    return 'bg-yellow-100';
  };

  const getFeeIconColor = (status: string) => {
    if (status === 'paid') return 'text-success-500';
    if (status === 'overdue') return 'text-danger-500';
    return 'text-warning-500';
  };

  const getHeaderGradient = (status: string) => {
    if (status === 'paid') return 'bg-gradient-to-r from-success-500 to-green-600';
    if (status === 'overdue') return 'bg-gradient-to-r from-danger-500 to-orange-500';
    return 'bg-gradient-to-r from-warning-500 to-yellow-600';
  };

  const getPayMethodColor = (method: string) => {
    if (method === 'wechat') return 'text-green-500';
    return 'text-blue-500';
  };

  const getPayMethodBorderColor = (method: string) => {
    if (method === 'wechat') return 'border-green-500 bg-green-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getPayMethodTextColor = (method: string) => {
    if (method === 'wechat') return 'text-green-700';
    return 'text-blue-700';
  };

  if (id) {
    const fee = propertyFees.find((f) => f.id === parseInt(id));
    if (!fee) return null;

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate(`/property-fee?tab=${activeTab}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回缴费列表</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-6 ${getHeaderGradient(fee.status)} text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {FEE_STATUS_LABELS[fee.status]}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold mb-4">{fee.period} 物业费</h1>
            <div className="flex items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{fee.building}栋 {fee.unit}单元 {fee.roomNumber}室</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>缴费截止：{formatDate(fee.dueDate)}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-2">应缴金额</p>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(fee.amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-2">当前状态</p>
                <p className={`text-xl font-semibold ${getStatusTextColor(fee.status)}`}>
                  {FEE_STATUS_LABELS[fee.status]}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">计费周期</span>
                <span className="font-medium text-gray-800">{fee.period}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">房屋信息</span>
                <span className="font-medium text-gray-800">{fee.building}栋 {fee.unit}单元 {fee.roomNumber}室</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">缴费截止日期</span>
                <span className="font-medium text-gray-800">{formatDate(fee.dueDate)}</span>
              </div>
              {fee.paidDate && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">缴费日期</span>
                  <span className="font-medium text-gray-800">{formatDateTime(fee.paidDate)}</span>
                </div>
              )}
              {fee.paymentMethod && (
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">缴费方式</span>
                  <span className="font-medium text-gray-800">{fee.paymentMethod === 'online' ? '在线支付' : '线下缴纳'}</span>
                </div>
              )}
            </div>

            {fee.status !== 'paid' && (
              <div className="mt-8">
                <button
                  onClick={() => handlePay(fee)}
                  className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  立即缴费
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-800 flex items-center gap-3">
            <CreditCard className="text-primary-600" />
            物业费管理
          </h1>
          <p className="text-gray-500 mt-1">
            {userRole === 'admin' ? '管理全小区物业费账单和缴费状态' : '查看和缴纳物业费，管理您的缴费记录'}
          </p>
        </div>
        {userRole === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-success-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Layers size={18} />
              <span>批量生成账单</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              <span>录入账单</span>
            </button>
          </div>
        )}
      </div>

      {userRole === 'owner' && reminders.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Bell size={18} className="text-danger-500" />
            催缴通知
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`rounded-2xl p-5 border-l-4 ${
                  reminder.status === 'paid'
                    ? 'bg-green-50 border-success-500'
                    : 'bg-red-50 border-danger-500'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className={reminder.status === 'paid' ? 'text-success-600' : 'text-danger-600'} />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      reminder.status === 'paid'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {reminder.status === 'paid' ? '已处理' : '待处理'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDateTime(reminder.createdAt)}</span>
                </div>
                <p className="font-semibold text-gray-800 mb-1">
                  {reminder.period} 物业费催缴
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {reminder.message || '您有待缴物业费，请及时缴纳，避免产生滞纳金。'}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    涉及 {reminder.propertyFeeIds.length} 笔账单
                  </p>
                  <p className={`text-lg font-bold ${
                    reminder.status === 'paid' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {formatCurrency(reminder.totalAmount)}
                  </p>
                </div>
                {reminder.status !== 'paid' && (
                  <button
                    onClick={() => handleTabChange('unpaid')}
                    className="mt-3 w-full py-2 bg-danger-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                  >
                    立即查看并缴费
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {userRole === 'owner' && unpaidTotal > 0 && (
        <div className="bg-gradient-to-r from-warning-500 to-orange-500 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle size={24} />
              <div>
                <p className="font-medium">您有 {unpaidCount} 笔待缴费用</p>
                <p className="text-sm opacity-90">为避免产生滞纳金，请及时缴费</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">待缴总额</p>
              <p className="text-2xl font-bold">{formatCurrency(unpaidTotal)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign size={24} className="text-primary-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{userRole === 'admin' ? '账单总额' : '应缴总额'}</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle size={24} className="text-success-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已缴金额</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(paidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <AlertTriangle size={24} className="text-warning-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">待缴金额</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(unpaidTotalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(userRole === 'admin'
                ? [
                    { value: 'all', label: '全部账单' },
                    { value: 'unpaid_overdue', label: '欠费列表' },
                    { value: 'paid', label: '已缴费' },
                  ]
                : [
                    { value: 'all', label: '全部' },
                    { value: 'unpaid', label: '待缴费' },
                    { value: 'paid', label: '已缴费' },
                  ]
              ).map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${activeTab === tab.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {showCheckbox && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAllFees}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  {selectedFeeIds.length === unpaidFeesForSelect.length && unpaidFeesForSelect.length > 0 ? (
                    <CheckSquare size={18} className="text-primary-600" />
                  ) : (
                    <Square size={18} />
                  )}
                  <span>全选</span>
                </button>
                {selectedFeeIds.length > 0 && (
                  <button
                    onClick={() => setShowReminderModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-danger-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                  >
                    <Bell size={16} />
                    生成催缴 ({selectedFeeIds.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : displayFees.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无相关账单</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayFees.map((fee, idx) => {
              const isSelected = selectedFeeIds.includes(fee.id);
              const canSelect = showCheckbox && (fee.status === 'unpaid' || fee.status === 'overdue');

              return (
                <div
                  key={fee.id}
                  className={`p-5 hover:bg-gray-50 transition-colors animate-fade-in ${
                    isSelected ? 'bg-primary-50' : ''
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {canSelect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectFee(fee.id);
                          }}
                          className="flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare size={22} className="text-primary-600" />
                          ) : (
                            <Square size={22} className="text-gray-400 hover:text-primary-500" />
                          )}
                        </button>
                      )}
                      <div
                        className="flex items-center gap-4 cursor-pointer flex-1"
                        onClick={() => navigate(`/property-fee/${fee.id}?tab=${activeTab}`)}
                      >
                        <div className={`p-3 rounded-xl ${getFeeIconBgColor(fee.status)}`}>
                          <CreditCard
                            size={24}
                            className={getFeeIconColor(fee.status)}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-800">{fee.period} 物业费</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(fee.status)}`}>
                              {FEE_STATUS_LABELS[fee.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {fee.building}栋 {fee.unit}单元 {fee.roomNumber}室
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              截止：{formatDate(fee.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">{formatCurrency(fee.amount)}</p>
                      {userRole === 'admin' && fee.status !== 'paid' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkPaidOffline(fee);
                          }}
                          className="mt-2 px-4 py-1.5 bg-success-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          标记已缴
                        </button>
                      ) : userRole === 'owner' && fee.status !== 'paid' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePay(fee);
                          }}
                          className="mt-2 px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          立即缴费
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPayModal && selectedFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 animate-bounce-in">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-semibold text-gray-800">确认缴费</h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500">费用项目</span>
                  <span className="font-medium">{selectedFee.period} 物业费</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500">房屋信息</span>
                  <span className="font-medium">{selectedFee.building}栋 {selectedFee.unit}单元 {selectedFee.roomNumber}室</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-500">应缴金额</span>
                  <span className="text-2xl font-bold text-primary-600">{formatCurrency(selectedFee.amount)}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4 font-medium">选择支付方式</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPayMethod('wechat')}
                  className={`p-4 rounded-xl border-2 transition-all
                    ${payMethod === 'wechat'
                      ? getPayMethodBorderColor('wechat')
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <Smartphone size={28} className={`mx-auto mb-2 ${getPayMethodColor('wechat')}`} />
                  <p className={`font-medium ${getPayMethodTextColor('wechat')}`}>微信支付</p>
                </button>
                <button
                  onClick={() => setPayMethod('alipay')}
                  className={`p-4 rounded-xl border-2 transition-all
                    ${payMethod === 'alipay'
                      ? getPayMethodBorderColor('alipay')
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <Banknote size={28} className={`mx-auto mb-2 ${getPayMethodColor('alipay')}`} />
                  <p className={`font-medium ${getPayMethodTextColor('alipay')}`}>支付宝</p>
                </button>
              </div>

              <button
                onClick={confirmPay}
                disabled={paying}
                className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    支付中...
                  </>
                ) : (
                  <>确认支付 {formatCurrency(selectedFee.amount)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 font-serif">录入物业费账单</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择业主
                </label>
                <select
                  value={createForm.householdId}
                  onChange={(e) => setCreateForm({ ...createForm, householdId: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.building}{h.unit}{h.roomNumber} - {h.ownerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    计费周期
                  </label>
                  <input
                    type="text"
                    value={createForm.period}
                    onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                    placeholder="如：2024-07"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    应缴金额（元）
                  </label>
                  <input
                    type="number"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  缴费截止日期
                </label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCreateFee}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={18} />
                {submitting ? '录入中...' : '确认录入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 font-serif flex items-center gap-2">
                <Layers size={22} className="text-success-600" />
                批量生成物业费账单
              </h2>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchForm({ period: '', building: '', unit: '', amountPerHousehold: '', dueDate: '' });
                  setBatchMode('filter');
                  setSelectedHouseholdIds([]);
                  setBatchPreviewData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => {
                    setBatchMode('filter');
                    setBatchPreviewData(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    batchMode === 'filter'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  按楼栋筛选
                </button>
                <button
                  onClick={() => {
                    setBatchMode('select');
                    setBatchPreviewData(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                    batchMode === 'select'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  选择具体房号
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    计费周期 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={batchForm.period}
                    onChange={(e) => {
                      setBatchForm({ ...batchForm, period: e.target.value });
                      setBatchPreviewData(null);
                    }}
                    placeholder="如：2024-07"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    每户金额（元） <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={batchForm.amountPerHousehold}
                    onChange={(e) => {
                      setBatchForm({ ...batchForm, amountPerHousehold: e.target.value });
                      setBatchPreviewData(null);
                    }}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {batchMode === 'filter' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择楼栋
                    </label>
                    <select
                      value={batchForm.building}
                      onChange={(e) => {
                        setBatchForm({ ...batchForm, building: e.target.value, unit: '' });
                        setBatchPreviewData(null);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="">全部楼栋</option>
                      {buildings.map((b) => (
                        <option key={b} value={b}>{b}栋</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择单元
                    </label>
                    <select
                      value={batchForm.unit}
                      onChange={(e) => {
                        setBatchForm({ ...batchForm, unit: e.target.value });
                        setBatchPreviewData(null);
                      }}
                      disabled={!batchForm.building}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">全部单元</option>
                      {units.map((u) => (
                        <option key={u} value={u}>{u}单元</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      截止日期 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={batchForm.dueDate}
                      onChange={(e) => {
                        setBatchForm({ ...batchForm, dueDate: e.target.value });
                        setBatchPreviewData(null);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      截止日期 <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={batchForm.dueDate}
                      onChange={(e) => {
                        setBatchForm({ ...batchForm, dueDate: e.target.value });
                        setBatchPreviewData(null);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        选择房号 <span className="text-danger-500">*</span>
                        <span className="text-gray-400 ml-2">（已选 {selectedHouseholdIds.length} 户）</span>
                      </label>
                      <button
                        onClick={() => {
                          if (selectedHouseholdIds.length === households.length) {
                            setSelectedHouseholdIds([]);
                          } else {
                            setSelectedHouseholdIds(households.map(h => h.id));
                          }
                          setBatchPreviewData(null);
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {selectedHouseholdIds.length === households.length ? '取消全选' : '全选'}
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto p-2 bg-gray-50">
                      {households.map((household) => {
                        const isSelected = selectedHouseholdIds.includes(household.id);
                        return (
                          <div
                            key={household.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedHouseholdIds(prev => prev.filter(id => id !== household.id));
                              } else {
                                setSelectedHouseholdIds(prev => [...prev, household.id]);
                              }
                              setBatchPreviewData(null);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary-100' : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? 'bg-primary-600 border-primary-600'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <CheckSquare size={14} className="text-white" />}
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'}`}>
                              {household.building}栋{household.unit}单元{household.roomNumber}室 - {household.ownerName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleBatchPreview}
                disabled={batchPreviewLoading || !batchForm.period || !batchForm.amountPerHousehold || !batchForm.dueDate}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {batchPreviewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                    预览中...
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} />
                    点击预览生成结果
                  </>
                )}
              </button>

              {batchPreviewData && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">预览结果</span>
                      <span className="text-sm text-gray-600">
                        预计生成 <span className="text-success-600 font-semibold">{batchPreviewData.willCreate.length}</span> 条，
                        跳过 <span className="text-warning-600 font-semibold">{batchPreviewData.willSkip.length}</span> 条，
                        合计 <span className="text-primary-600 font-semibold">{formatCurrency(batchPreviewData.totalAmount)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {batchPreviewData.willCreate.length > 0 && (
                      <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-medium text-success-700 mb-2 flex items-center gap-1">
                          <CheckCircle size={16} />
                          以下房号将新增账单：
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {batchPreviewData.willCreate.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {item.building}栋{item.unit}单元{item.roomNumber}室
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {batchPreviewData.willSkip.length > 0 && (
                      <div className="p-4">
                        <p className="text-sm font-medium text-warning-700 mb-2 flex items-center gap-1">
                          <AlertTriangle size={16} />
                          以下房号账单已存在，将跳过：
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {batchPreviewData.willSkip.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                              {item.building}栋{item.unit}单元{item.roomNumber}室
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {batchPreviewData.willCreate.length === 0 && batchPreviewData.willSkip.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        没有匹配的住户
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchForm({ period: '', building: '', unit: '', amountPerHousehold: '', dueDate: '' });
                  setBatchPreviewData(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleBatchCreate}
                disabled={batchCreating || !batchPreviewData || batchPreviewData.willCreate.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-success-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Layers size={18} />
                {batchCreating ? '生成中...' : '确认生成账单'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 font-serif flex items-center gap-2">
                <Bell size={22} className="text-danger-600" />
                批量生成催缴记录
              </h2>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderMessage('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-danger-50 rounded-xl p-4 border border-danger-200">
                <p className="text-sm text-danger-700">
                  已选择 <span className="font-bold text-lg">{selectedFeeIds.length}</span> 笔欠费账单，
                  确认生成催缴记录后，业主将收到催缴通知。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  催缴消息（可选）
                </label>
                <textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder="请输入催缴消息内容，如：您的物业费已逾期，请尽快缴纳，避免产生滞纳金。"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderMessage('');
                }}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCreateReminders}
                disabled={creatingReminder}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-danger-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell size={18} />
                {creatingReminder ? '生成中...' : '确认生成催缴'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
