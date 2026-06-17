import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Clock,
  User,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Send,
  X,
  Image as ImageIcon,
  Eye,
  MessageCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import {
  formatDateTime,
  getStatusColor,
  COMPLAINT_TYPE_LABELS,
  COMPLAINT_STATUS_LABELS,
  truncateText,
} from '@/utils/format';
import type { Complaint } from '../../shared/types';

export default function Complaints() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentHouseholdId, complaints, setComplaints } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    type: 'maintenance' as Complaint['type'],
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const typeOptions: { value: Complaint['type']; label: string; icon: string }[] = [
    { value: 'maintenance', label: '维修维护', icon: '🔧' },
    { value: 'noise', label: '噪音扰民', icon: '🔇' },
    { value: 'sanitation', label: '环境卫生', icon: '🧹' },
    { value: 'security', label: '治安问题', icon: '🛡️' },
    { value: 'suggestion', label: '建议咨询', icon: '💡' },
    { value: 'other', label: '其他问题', icon: '📝' },
  ];

  useEffect(() => {
    if (id) {
      loadComplaintDetail(parseInt(id));
    } else {
      loadComplaints();
    }
  }, [id, activeTab, currentHouseholdId]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const params = activeTab === 'all' ? { all: true } : { householdId: currentHouseholdId };
      const response = await api.complaints.getList(params);
      setComplaints(response.data);
    } catch (error) {
      console.error('加载投诉建议失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComplaintDetail = async (complaintId: number) => {
    setLoading(true);
    try {
      const response = await api.complaints.getById(complaintId);
      setDetailComplaint(response.data);
    } catch (error) {
      console.error('加载投诉详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComplaint.title.trim() || !newComplaint.content.trim()) {
      alert('请填写完整信息');
      return;
    }
    setSubmitting(true);
    try {
      await api.complaints.create({
        ...newComplaint,
        householdId: currentHouseholdId,
      });
      setShowCreateModal(false);
      setNewComplaint({ title: '', type: 'maintenance', content: '' });
      loadComplaints();
    } catch (error) {
      console.error('提交失败', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === 'my') {
      return c.householdId === currentHouseholdId;
    }
    return true;
  });

  const pendingCount = complaints.filter((c) => c.status === 'pending').length;

  if (id && detailComplaint) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/complaints')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回投诉列表</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-6 ${detailComplaint.status === 'completed' ? 'bg-gradient-to-r from-success-500 to-green-600' : detailComplaint.status === 'processing' ? 'bg-gradient-to-r from-primary-500 to-blue-600' : 'bg-gradient-to-r from-warning-500 to-yellow-600'} text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {COMPLAINT_TYPE_LABELS[detailComplaint.type]}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {COMPLAINT_STATUS_LABELS[detailComplaint.status]}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold mb-4">{detailComplaint.title}</h1>
            <div className="flex items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>业主 {detailComplaint.householdId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{formatDateTime(detailComplaint.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h4 className="font-medium text-gray-800 mb-3">问题描述</h4>
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {detailComplaint.content}
                </p>
              </div>
            </div>

            {detailComplaint.images && detailComplaint.images.length > 0 && (
              <div className="mb-8">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <ImageIcon size={18} />
                  图片证据
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {detailComplaint.images.map((img, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                      <img src={img} alt={`图片 ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailComplaint.reply && (
              <div className="border-t border-gray-100 pt-8">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <MessageCircle size={18} className="text-primary-600" />
                  业委会回复
                </h4>
                <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-primary-600">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {detailComplaint.reply}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {detailComplaint.replier || '业委会'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {detailComplaint.repliedAt ? formatDateTime(detailComplaint.repliedAt) : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {detailComplaint.status !== 'completed' && detailComplaint.householdId === currentHouseholdId && (
              <div className="mt-6 text-center text-gray-500 text-sm">
                <div className="flex items-center justify-center gap-2">
                  {detailComplaint.status === 'pending' && <AlertCircle size={16} className="text-warning-500" />}
                  {detailComplaint.status === 'processing' && <Loader2 size={16} className="text-primary-600 animate-spin" />}
                  <span>
                    {detailComplaint.status === 'pending' ? '等待业委会处理中...' : '正在处理中，请耐心等待'}
                  </span>
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
            <MessageSquare className="text-primary-600" />
            投诉与建议
          </h1>
          <p className="text-gray-500 mt-1">反馈问题，共建美好家园</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          提交反馈
        </button>
      </div>

      {pendingCount > 0 && activeTab === 'my' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-warning-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">您有 {pendingCount} 条投诉待处理</p>
            <p className="text-sm text-yellow-600">业委会正在处理中，请耐心等待回复</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2">
            {[
              { value: 'my', label: '我的反馈' },
              { value: 'all', label: '全部公开' },
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
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{activeTab === 'my' ? '您还没有提交过反馈' : '暂无公开反馈'}</p>
            {activeTab === 'my' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                提交第一条反馈
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredComplaints.map((complaint, idx) => (
              <div
                key={complaint.id}
                onClick={() => navigate(`/complaints/${complaint.id}`)}
                className="p-5 hover:bg-gray-50 cursor-pointer transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{typeOptions.find((t) => t.value === complaint.type)?.icon || '📝'}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {COMPLAINT_TYPE_LABELS[complaint.type]}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                        {COMPLAINT_STATUS_LABELS[complaint.status]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{complaint.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {truncateText(complaint.content, 100)}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {complaint.householdId === currentHouseholdId ? '我' : `业主 ${complaint.householdId}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDateTime(complaint.createdAt)}
                      </span>
                      {complaint.reply && (
                        <span className="flex items-center gap-1 text-primary-600">
                          <Eye size={14} />
                          已回复
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-6 flex-shrink-0">
                    {complaint.status === 'pending' && <AlertCircle size={24} className="text-warning-500" />}
                    {complaint.status === 'processing' && <Loader2 size={24} className="text-primary-600 animate-spin" />}
                    {complaint.status === 'completed' && <CheckCircle size={24} className="text-success-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-bounce-in">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-semibold text-gray-800">提交投诉与建议</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-gray-700 font-medium mb-2">反馈类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {typeOptions.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewComplaint({ ...newComplaint, type: type.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-center
                        ${newComplaint.type === type.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                        }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-gray-700 font-medium mb-2">标题</label>
                <input
                  type="text"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                  placeholder="请简要描述您的问题或建议"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">详细描述</label>
                <textarea
                  value={newComplaint.content}
                  onChange={(e) => setNewComplaint({ ...newComplaint, content: e.target.value })}
                  placeholder="请详细描述您遇到的问题或建议，以便我们更好地处理"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      提交反馈
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
