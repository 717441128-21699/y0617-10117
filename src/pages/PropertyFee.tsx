import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import type { PropertyFee, Household } from '../../shared/types';

export default function PropertyFee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentHouseholdId, userRole, propertyFees, setPropertyFees, unpaidTotal, setUnpaidTotal } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'unpaid_overdue'>('all');
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

  useEffect(() => {
    loadPropertyFees();
    if (userRole === 'admin') {
      loadAllFees();
      loadHouseholds();
    }
  }, [currentHouseholdId, userRole, activeTab]);

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

  const handlePay = async (fee: PropertyFee) => {
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
          onClick={() => navigate('/property-fee')}
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span>录入账单</span>
          </button>
        )}
      </div>

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
                onClick={() => setActiveTab(tab.value as any)}
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
            {displayFees.map((fee, idx) => (
              <div
                key={fee.id}
                onClick={() => navigate(`/property-fee/${fee.id}`)}
                className="p-5 hover:bg-gray-50 cursor-pointer transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
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
            ))}
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
    </div>
  );
}
