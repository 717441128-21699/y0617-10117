import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Clock,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/utils/format';
import type { MaintenanceFund as MaintenanceFundType, ApprovalRecord } from '../../shared/types';

export default function MaintenanceFund() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fundRecords, setFundRecords } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [detailRecord, setDetailRecord] = useState<MaintenanceFundType | null>(null);

  useEffect(() => {
    if (id) {
      loadRecordDetail(parseInt(id));
    } else {
      loadFundRecords();
    }
  }, [id]);

  const loadFundRecords = async () => {
    setLoading(true);
    try {
      const response = await api.maintenanceFund.getList({ pageSize: 100 });
      setFundRecords(response.data);
      setStats({
        totalIncome: response.totalIncome,
        totalExpense: response.totalExpense,
        balance: response.balance,
      });
    } catch (error) {
      console.error('加载维修基金失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordDetail = async (recordId: number) => {
    setLoading(true);
    try {
      const response = await api.maintenanceFund.getById(recordId);
      setDetailRecord(response.data);
    } catch (error) {
      console.error('加载记录详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = fundRecords.filter((record) => {
    if (activeTab === 'all') return true;
    return record.type === activeTab;
  });

  const getTypeTextColor = (type: string) => {
    return type === 'income' ? 'text-success-500' : 'text-orange-500';
  };

  const getTypeBgColor = (type: string) => {
    return type === 'income' ? 'bg-green-100' : 'bg-orange-100';
  };

  const getHeaderGradient = (type: string) => {
    return type === 'income' ? 'bg-gradient-to-r from-success-500 to-green-600' : 'bg-gradient-to-r from-warning-500 to-orange-500';
  };

  if (id && detailRecord) {
    const detailAmountColor = detailRecord.type === 'income' ? 'text-success-500' : 'text-danger-500';

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/maintenance-fund')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回流水列表</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-6 ${getHeaderGradient(detailRecord.type)} text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {detailRecord.type === 'income' ? '收入' : '支出'}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold mb-4">{detailRecord.description}</h1>
            <div className="flex items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDate(detailRecord.date)}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-2">金额</p>
                <p className={`text-3xl font-bold ${detailAmountColor}`}>
                  {detailRecord.type === 'income' ? '+' : '-'}{formatCurrency(detailRecord.amount)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-500 text-sm mb-2">当前结余</p>
                <p className="text-3xl font-bold text-gray-800">{formatCurrency(detailRecord.balance)}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">交易类型</span>
                <span className="font-medium text-gray-800">{detailRecord.type === 'income' ? '收入' : '支出'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">交易日期</span>
                <span className="font-medium text-gray-800">{formatDate(detailRecord.date)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">交易描述</span>
                <span className="font-medium text-gray-800">{detailRecord.description}</span>
              </div>
            </div>

            {detailRecord.approvalRecords && detailRecord.approvalRecords.length > 0 && (
              <div className="mb-8">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  审批记录
                </h4>
                <div className="space-y-3">
                  {detailRecord.approvalRecords.map((approval: ApprovalRecord, idx: number) => {
                    const approvalBg = approval.status === 'approved' ? 'bg-green-100' : 'bg-red-100';
                    const approvalColor = approval.status === 'approved' ? 'text-success-500' : 'text-danger-500';
                    const approvalBadgeBg = approval.status === 'approved' ? 'bg-green-100 text-success-500' : 'bg-red-100 text-danger-500';
                    const approvalText = approval.status === 'approved' ? '已通过' : '已驳回';

                    return (
                      <div key={idx} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${approvalBg}`}>
                              {approval.status === 'approved' ? (
                                <CheckCircle size={16} className={approvalColor} />
                              ) : (
                                <XCircle size={16} className={approvalColor} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{approval.approver}</p>
                              <p className="text-sm text-gray-500">{approval.role}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${approvalBadgeBg}`}>
                            {approvalText}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{approval.comment}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                          <Clock size={12} />
                          {formatDateTime(approval.approvedAt)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {detailRecord.invoicePhotos && detailRecord.invoicePhotos.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <ImageIcon size={18} />
                  发票照片
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {detailRecord.invoicePhotos.map((photo, idx) => (
                    <div key={idx} className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative group cursor-pointer">
                      <img src={photo} alt={`发票 ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">点击查看大图</span>
                      </div>
                    </div>
                  ))}
                </div>
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
            <PiggyBank className="text-primary-600" />
            公共维修基金
          </h1>
          <p className="text-gray-500 mt-1">透明公开，每一笔收支都清晰可见</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-sm opacity-90">累计收入</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <span className="text-sm opacity-90">累计支出</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalExpense)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-primary-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet size={24} />
            </div>
            <span className="text-sm opacity-90">当前结余</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.balance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部流水' },
              { value: 'income', label: '收入记录' },
              { value: 'expense', label: '支出记录' },
            ].map((tab) => (
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
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <PiggyBank size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无记录</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRecords.map((record, idx) => (
              <div
                key={record.id}
                onClick={() => navigate(`/maintenance-fund/${record.id}`)}
                className="p-5 hover:bg-gray-50 cursor-pointer transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getTypeBgColor(record.type)}`}>
                      {record.type === 'income' ? (
                        <TrendingUp size={24} className="text-success-500" />
                      ) : (
                        <TrendingDown size={24} className="text-orange-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{record.description}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(record.date)}
                        </span>
                        {record.approvalRecords && record.approvalRecords.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            已审批
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${getTypeTextColor(record.type)}`}>
                      {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                    </p>
                    <p className="text-sm text-gray-500">结余：{formatCurrency(record.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
