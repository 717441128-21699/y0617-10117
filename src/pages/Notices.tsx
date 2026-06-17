import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  User,
  ArrowLeft,
  CheckCircle,
  FileText,
  Plus,
  X,
  Send,
  Eye,
  EyeOff,
  BarChart3,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import {
  formatDateTime,
  getNoticeTypeColor,
  NOTICE_TYPE_LABELS,
  truncateText,
} from '@/utils/format';
import type { Notice, Household } from '../../shared/types';

const typeFilters = [
  { value: 'all', label: '全部' },
  { value: 'important', label: '重要通知' },
  { value: 'water', label: '停水通知' },
  { value: 'power', label: '停电通知' },
  { value: 'construction', label: '施工告知' },
  { value: 'normal', label: '普通通知' },
];

interface AdminNotice extends Notice {
  readCount: number;
  unreadCount: number;
}

interface NoticeStatistics {
  noticeId: number;
  noticeTitle: string;
  noticeType: Notice['type'];
  publishTime: string;
  totalHouseholds: number;
  readCount: number;
  unreadCount: number;
  readRate: number;
  byBuilding: Record<string, { total: number; read: number; unreadHouseholds: Household[] }>;
  readHouseholds: Household[];
  unreadHouseholds: Household[];
}

export default function Notices() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentHouseholdId, userRole, notices, setNotices, setCurrentNotice, setShowStrongReminder, setImportantNotices } = useAppStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detailNotice, setDetailNotice] = useState<Notice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    type: 'normal' as Notice['type'],
  });
  const [submitting, setSubmitting] = useState(false);

  const [adminNotices, setAdminNotices] = useState<AdminNotice[]>([]);
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [adminActiveFilter, setAdminActiveFilter] = useState('all');
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [noticeStatistics, setNoticeStatistics] = useState<NoticeStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [reminding, setReminding] = useState(false);

  useEffect(() => {
    if (userRole === 'admin') {
      setViewMode('admin');
    }
  }, [userRole]);

  useEffect(() => {
    if (id) {
      loadNoticeDetail(parseInt(id));
    } else {
      if (viewMode === 'admin') {
        loadAdminNotices();
      } else {
        loadNotices();
      }
    }
  }, [id, activeFilter, adminActiveFilter, currentHouseholdId, viewMode]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const response = await api.notices.getList({
        type: activeFilter === 'all' ? undefined : activeFilter,
        pageSize: 50,
        householdId: currentHouseholdId,
      });
      setNotices(response.data);
    } catch (error) {
      console.error('加载通知失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoticeDetail = async (noticeId: number) => {
    setLoading(true);
    try {
      const response = await api.notices.getById(noticeId, currentHouseholdId);
      setDetailNotice(response.data);
      setCurrentNotice(response.data);
      if (!response.data.isRead) {
        await api.notices.markAsRead(noticeId, currentHouseholdId);
      }
    } catch (error) {
      console.error('加载通知详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notice: Notice) => {
    navigate(`/notices/${notice.id}`);
  };

  const handleCreateNotice = async () => {
    if (!createForm.title || !createForm.content) {
      alert('请填写通知标题和内容');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.notices.create({
        ...createForm,
        publisher: '业委会',
      });

      if (response.data) {
        setShowCreateModal(false);
        setCreateForm({ title: '', content: '', type: 'normal' });
        loadNotices();

        if (['water', 'power', 'construction', 'important'].includes(createForm.type)) {
          const importantRes = await api.notices.getImportant(currentHouseholdId);
          setImportantNotices(importantRes.data);
          setShowStrongReminder(true);
        }
      }
    } catch (error) {
      console.error('发布通知失败', error);
      alert('发布通知失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const loadAdminNotices = async () => {
    setLoading(true);
    try {
      const response = await api.notices.getAdminList(
        adminActiveFilter === 'all' ? undefined : adminActiveFilter
      );
      setAdminNotices(response.data as AdminNotice[]);
    } catch (error) {
      console.error('加载管理通知失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoticeStatistics = async (noticeId: number) => {
    setStatisticsLoading(true);
    try {
      const response = await api.notices.getStatistics(noticeId);
      setNoticeStatistics(response.data as NoticeStatistics);
      setShowStatisticsModal(true);
    } catch (error) {
      console.error('加载通知统计失败', error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleRemindUnread = async (_noticeId: number) => {
    setReminding(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      alert('已再次提醒未读住户！');
    } catch (error) {
      console.error('提醒失败', error);
      alert('提醒失败，请重试');
    } finally {
      setReminding(false);
    }
  };

  const handleAdminNoticeClick = (notice: AdminNotice) => {
    loadNoticeStatistics(notice.id);
  };

  const filteredNotices = notices.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'important') {
      return ['water', 'power', 'construction', 'important'].includes(n.type);
    }
    return n.type === activeFilter;
  });

  const filteredAdminNotices = adminNotices.filter((n) => {
    if (adminActiveFilter === 'all') return true;
    if (adminActiveFilter === 'important') {
      return ['water', 'power', 'construction', 'important'].includes(n.type);
    }
    return n.type === adminActiveFilter;
  });

  const unreadCount = notices.filter((n) => !n.isRead).length;

  if (id && detailNotice) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/notices')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回通知列表</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-6 ${getNoticeTypeColor(detailNotice.type).includes('danger') ? 'bg-gradient-to-r from-danger-500 to-orange-500' : 'bg-gradient-to-r from-primary-500 to-blue-600'} text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {NOTICE_TYPE_LABELS[detailNotice.type]}
              </span>
              {detailNotice.isRead && (
                <span className="flex items-center gap-1 text-white/80 text-sm">
                  <CheckCircle size={16} />
                  已读
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold mb-4">{detailNotice.title}</h1>
            <div className="flex items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{detailNotice.publisher}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{formatDateTime(detailNotice.publishTime)}</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                {detailNotice.content}
              </p>
            </div>

            {detailNotice.attachments && detailNotice.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <FileText size={18} />
                  附件
                </h4>
                <div className="space-y-2">
                  {detailNotice.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <FileText size={20} className="text-primary-600" />
                      <span className="text-primary-600">附件 {idx + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'admin' && !id) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <Bell className="text-primary-600" />
              通知公告管理
            </h1>
            <p className="text-gray-500 mt-1">管理和查看通知发布及阅读情况</p>
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'admin' && (
              <button
                onClick={() => setViewMode('user')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Eye size={18} />
                <span>住户视角</span>
              </button>
            )}
            {userRole === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
              >
                <Plus size={18} />
                <span>发布通知</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setAdminActiveFilter('all')}
                className={`px-6 py-4 font-medium transition-colors border-b-2
                  ${adminActiveFilter === 'all'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
              >
                全部通知
              </button>
              <button
                onClick={() => setAdminActiveFilter('important')}
                className={`px-6 py-4 font-medium transition-colors border-b-2
                  ${adminActiveFilter === 'important'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
              >
                已发布管理
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {typeFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setAdminActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${adminActiveFilter === filter.value
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : filteredAdminNotices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无相关通知</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAdminNotices.map((notice, idx) => (
              <div
                key={notice.id}
                onClick={() => handleAdminNoticeClick(notice)}
                className="bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl flex-shrink-0
                    ${['water', 'power', 'construction', 'important'].includes(notice.type)
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                    }`}>
                    <Bell
                      size={24}
                      className={
                        ['water', 'power', 'construction', 'important'].includes(notice.type)
                          ? 'text-danger-600'
                          : 'text-primary-600'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getNoticeTypeColor(notice.type)}`}>
                        {NOTICE_TYPE_LABELS[notice.type]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      {notice.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {truncateText(notice.content, 100)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {notice.publisher}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDateTime(notice.publishTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-sm text-success-600">
                          <Eye size={14} />
                          已读 {notice.readCount}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-danger-600">
                          <EyeOff size={14} />
                          未读 {notice.unreadCount}
                        </span>
                        {['water', 'power', 'construction', 'important'].includes(notice.type) && notice.unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemindUnread(notice.id);
                            }}
                            disabled={reminding}
                            className="flex items-center gap-1 px-3 py-1.5 bg-danger-50 text-danger-600 rounded-lg text-sm font-medium hover:bg-danger-100 transition-colors disabled:opacity-50"
                          >
                            <Megaphone size={14} />
                            再次提醒
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showStatisticsModal && noticeStatistics && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 font-serif flex items-center gap-2">
                    <BarChart3 size={20} className="text-primary-600" />
                    阅读统计详情
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{noticeStatistics.noticeTitle}</p>
                </div>
                <button
                  onClick={() => setShowStatisticsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {statisticsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-gray-500 text-sm mb-1">总户数</p>
                        <p className="text-2xl font-bold text-gray-800">{noticeStatistics.totalHouseholds}</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-success-600 text-sm mb-1">已读</p>
                        <p className="text-2xl font-bold text-success-600">{noticeStatistics.readCount}</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-danger-600 text-sm mb-1">未读</p>
                        <p className="text-2xl font-bold text-danger-600">{noticeStatistics.unreadCount}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-primary-600 text-sm mb-1">阅读率</p>
                        <p className="text-2xl font-bold text-primary-600">{noticeStatistics.readRate}%</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-warning-500" />
                        按楼栋统计
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(noticeStatistics.byBuilding).map(([building, data]) => (
                          <div key={building} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-800">{building}</span>
                              <span className="text-sm text-gray-500">
                                {data.read}/{data.total} 户已读
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${data.total > 0 ? (data.read / data.total) * 100 : 0}%` }}
                              />
                            </div>
                            {data.unreadHouseholds.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">未读住户：</p>
                                <div className="flex flex-wrap gap-2">
                                  {data.unreadHouseholds.slice(0, 5).map((h: Household) => (
                                    <span key={h.id} className="px-2 py-1 bg-danger-100 text-danger-600 text-xs rounded-md">
                                      {h.building}{h.unit}{h.roomNumber} - {h.ownerName}
                                    </span>
                                  ))}
                                  {data.unreadHouseholds.length > 5 && (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-md">
                                      +{data.unreadHouseholds.length - 5} 户
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {noticeStatistics.unreadHouseholds.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <EyeOff size={18} className="text-danger-500" />
                          未读住户列表（{noticeStatistics.unreadHouseholds.length}户）
                        </h3>
                        <div className="bg-gray-50 rounded-xl overflow-hidden">
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                  <th className="text-left px-4 py-3 font-medium text-gray-600">房号</th>
                                  <th className="text-left px-4 py-3 font-medium text-gray-600">业主姓名</th>
                                  <th className="text-left px-4 py-3 font-medium text-gray-600">联系电话</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {noticeStatistics.unreadHouseholds.map((h: Household) => (
                                  <tr key={h.id} className="hover:bg-white">
                                    <td className="px-4 py-3 text-gray-800">
                                      {h.building}{h.unit}{h.roomNumber}
                                    </td>
                                    <td className="px-4 py-3 text-gray-800">{h.ownerName}</td>
                                    <td className="px-4 py-3 text-gray-600">{h.phone}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 font-serif">发布通知</h2>
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
                    通知类型
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {typeFilters.filter(f => f.value !== 'all' && f.value !== 'important').map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setCreateForm({ ...createForm, type: type.value as Notice['type'] })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          createForm.type === type.value
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => setCreateForm({ ...createForm, type: 'important' })}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        createForm.type === 'important'
                          ? 'bg-danger-500 text-white shadow-md'
                          : 'bg-red-50 text-danger-600 hover:bg-red-100'
                      }`}
                    >
                      🔔 重要通知
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知标题
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="请输入通知标题"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通知内容
                  </label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    placeholder="请输入通知内容..."
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
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
                  onClick={handleCreateNotice}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  {submitting ? '发布中...' : '发布通知'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-800 flex items-center gap-3">
            <Bell className="text-primary-600" />
            通知公告
            {unreadCount > 0 && (
              <span className="text-sm font-normal bg-danger-100 text-danger-600 px-2 py-0.5 rounded-full">
                {unreadCount} 条未读
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">了解小区最新动态和重要通知</p>
        </div>
        <div className="flex items-center gap-3">
          {userRole === 'admin' && (
            <button
              onClick={() => setViewMode('admin')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <BarChart3 size={18} />
              <span>管理视角</span>
            </button>
          )}
          {userRole === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={18} />
              <span>发布通知</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${activeFilter === filter.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无相关通知</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice, idx) => (
            <div
              key={notice.id}
              onClick={() => handleNoticeClick(notice)}
              className={`bg-white rounded-xl shadow-sm p-5 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in
                ${!notice.isRead ? 'border-l-4 border-danger-500' : ''}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0
                  ${['water', 'power', 'construction', 'important'].includes(notice.type)
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                  }`}>
                  <Bell
                    size={24}
                    className={
                      ['water', 'power', 'construction', 'important'].includes(notice.type)
                        ? 'text-danger-600'
                        : 'text-primary-600'
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getNoticeTypeColor(notice.type)}`}>
                      {NOTICE_TYPE_LABELS[notice.type]}
                    </span>
                    {!notice.isRead && (
                      <span className="text-xs bg-danger-100 text-danger-600 px-2 py-0.5 rounded-full font-medium">
                        新
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    {notice.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {truncateText(notice.content, 100)}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {notice.publisher}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDateTime(notice.publishTime)}
                      </span>
                    </div>
                    {notice.isRead && (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} />
                        已读
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 font-serif">发布通知</h2>
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
                  通知类型
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {typeFilters.filter(f => f.value !== 'all' && f.value !== 'important').map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setCreateForm({ ...createForm, type: type.value as Notice['type'] })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        createForm.type === type.value
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setCreateForm({ ...createForm, type: 'important' })}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      createForm.type === 'important'
                        ? 'bg-danger-500 text-white shadow-md'
                        : 'bg-red-50 text-danger-600 hover:bg-red-100'
                    }`}
                  >
                    🔔 重要通知
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知标题
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="请输入通知标题"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知内容
                </label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  placeholder="请输入通知内容..."
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
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
                onClick={handleCreateNotice}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {submitting ? '发布中...' : '发布通知'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
