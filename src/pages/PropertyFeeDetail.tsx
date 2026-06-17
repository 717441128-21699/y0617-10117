import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  MapPin,
  ArrowLeft,
  Calendar,
  Smartphone,
  Banknote,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  FEE_STATUS_LABELS,
} from '@/utils/format';
import type { PropertyFee } from '../../shared/types';

export default function PropertyFeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'all';
  const { userRole, setPropertyFees, setUnpaidTotal, currentHouseholdId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState<PropertyFee | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (id) {
      loadFeeDetail(parseInt(id));
    }
  }, [id]);

  const loadFeeDetail = async (feeId: number) => {
    setLoading(true);
    try {
      const response = await api.propertyFee.getById(feeId);
      setFee(response.data);
    } catch (error) {
      console.error('加载物业费详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshListData = async () => {
    try {
      const response = await api.propertyFee.getList(currentHouseholdId);
      setPropertyFees(response.data);
      setUnpaidTotal(response.unpaidTotal);
    } catch (error) {
      console.error('刷新列表数据失败', error);
    }
  };

  const handlePay = () => {
    setShowPayModal(true);
  };

  const confirmPay = async () => {
    if (!fee) return;
    setPaying(true);
    try {
      await api.propertyFee.pay(fee.id, 'online', payMethod);
      setShowPayModal(false);
      await loadFeeDetail(fee.id);
      await refreshListData();
    } catch (error) {
      console.error('缴费失败', error);
      alert('缴费失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  const handleMarkPaidOffline = async () => {
    if (!fee) return;
    if (!confirm(`确认将 ${fee.period} 物业费标记为线下已缴吗？`)) return;

    try {
      const result = await api.propertyFee.markPaidOffline(fee.id);
      if (result.success) {
        await loadFeeDetail(fee.id);
        await refreshListData();
      } else {
        alert((result as any).error || '操作失败');
      }
    } catch (error) {
      console.error('标记缴费失败', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusTextColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/property-fee?tab=${tabParam}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回缴费列表</span>
        </button>
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">账单不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(`/property-fee?tab=${tabParam}`)}
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
              <span className="text-gray-500">楼栋</span>
              <span className="font-medium text-gray-800">{fee.building}栋</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">单元</span>
              <span className="font-medium text-gray-800">{fee.unit}单元</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">房号</span>
              <span className="font-medium text-gray-800">{fee.roomNumber}室</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">缴费截止日期</span>
              <span className="font-medium text-gray-800">{formatDate(fee.dueDate)}</span>
            </div>
            {fee.status === 'paid' && fee.paidDate && (
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">缴费时间</span>
                <span className="font-medium text-gray-800">{formatDateTime(fee.paidDate)}</span>
              </div>
            )}
            {fee.status === 'paid' && fee.paymentMethod && (
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">缴费方式</span>
                <span className="font-medium text-gray-800">
                  {fee.paymentMethod === 'online' ? '在线支付' : '线下缴纳'}
                </span>
              </div>
            )}
          </div>

          {fee.status !== 'paid' && (
            <div className="mt-8">
              {userRole === 'owner' ? (
                <button
                  onClick={handlePay}
                  className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} />
                  立即缴费
                </button>
              ) : userRole === 'admin' ? (
                <button
                  onClick={handleMarkPaidOffline}
                  className="w-full py-4 bg-success-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  标记线下已缴
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {showPayModal && (
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
                  <span className="font-medium">{fee.period} 物业费</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-500">房屋信息</span>
                  <span className="font-medium">{fee.building}栋 {fee.unit}单元 {fee.roomNumber}室</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-500">应缴金额</span>
                  <span className="text-2xl font-bold text-primary-600">{formatCurrency(fee.amount)}</span>
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
                  <>确认支付 {formatCurrency(fee.amount)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
