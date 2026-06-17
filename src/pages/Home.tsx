import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Vote as VoteIcon,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Wallet,
  Bell,
  ChevronRight,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import { formatCurrency, formatDeadline, formatDateTime, getNoticeTypeColor, NOTICE_TYPE_LABELS } from '@/utils/format';
import type { Notice, DashboardStats, Vote } from '../../shared/types';

export default function Home() {
  const navigate = useNavigate();
  const { currentHouseholdId, setDashboardStats, setNotices, setVotes } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestNotices, setLatestNotices] = useState<Notice[]>([]);
  const [ongoingVotes, setOngoingVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noticeIndex, setNoticeIndex] = useState(0);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      if (latestNotices.length > 0) {
        setNoticeIndex((prev) => (prev + 1) % latestNotices.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [currentHouseholdId, latestNotices.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, noticesRes, votesRes] = await Promise.all([
        api.dashboard.getStats(),
        api.notices.getLatest(5, currentHouseholdId),
        api.votes.getList(currentHouseholdId),
      ]);
      setStats(statsRes.data);
      setDashboardStats(statsRes.data);
      setLatestNotices(noticesRes.data);
      setNotices(noticesRes.data);
      const ongoing = votesRes.data.filter((v: Vote) => v.status === 'ongoing');
      setOngoingVotes(ongoing);
      setVotes(votesRes.data);
    } catch (error) {
      console.error('加载首页数据失败', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          title: '小区总户数',
          value: stats.totalHouseholds,
          unit: '户',
          icon: Building2,
          gradient: 'from-blue-500 to-primary-600',
          delay: 0,
        },
        {
          title: '已缴费户数',
          value: stats.paidHouseholds,
          unit: '户',
          icon: CreditCard,
          gradient: 'from-green-500 to-success-500',
          delay: 100,
        },
        {
          title: '进行中投票',
          value: stats.ongoingVotes,
          unit: '项',
          icon: VoteIcon,
          gradient: 'from-amber-500 to-warning-500',
          delay: 200,
        },
        {
          title: '待处理投诉',
          value: stats.pendingComplaints,
          unit: '件',
          icon: MessageSquare,
          gradient: 'from-rose-500 to-danger-500',
          delay: 300,
        },
      ]
    : [];

  const quickEntries = [
    { title: '通知公告', icon: Bell, path: '/notices', color: 'bg-blue-50 text-blue-600' },
    { title: '物业费', icon: CreditCard, path: '/property-fee', color: 'bg-green-50 text-green-600' },
    { title: '维修基金', icon: Wallet, path: '/maintenance-fund', color: 'bg-amber-50 text-amber-600' },
    { title: '业主投票', icon: VoteIcon, path: '/votes', color: 'bg-purple-50 text-purple-600' },
    { title: '投诉建议', icon: MessageSquare, path: '/complaints', color: 'bg-rose-50 text-rose-600' },
    { title: '业委会', icon: Users, path: '/committee', color: 'bg-slate-50 text-slate-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl p-6 text-white animate-fade-in"
            style={{
              background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              animationDelay: `${card.delay}ms`,
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-90`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <card.icon size={24} />
                </div>
                <ChevronRight size={20} className="opacity-70" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {card.value.toLocaleString()}
                <span className="text-lg font-normal ml-1 opacity-80">{card.unit}</span>
              </div>
              <div className="text-white/80 text-sm">{card.title}</div>
            </div>
          </div>
        ))}
      </div>

      {stats && stats.unpaidTotal > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4 animate-slide-up">
          <div className="p-3 bg-orange-100 rounded-xl">
            <AlertCircle size={24} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-800">物业费欠费提醒</div>
            <div className="text-sm text-gray-600">
              您当前有 <span className="font-semibold text-danger-600">{formatCurrency(stats.unpaidTotal)}</span> 的物业费待缴纳
            </div>
          </div>
          <button
            onClick={() => navigate('/property-fee')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            立即缴纳
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-semibold text-gray-800">快捷入口</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickEntries.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(entry.path)}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`p-4 rounded-2xl ${entry.color} transition-transform group-hover:scale-110`}>
                    <entry.icon size={28} />
                  </div>
                  <span className="font-medium text-gray-700">{entry.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold text-gray-800">维修基金</h3>
              <button
                onClick={() => navigate('/maintenance-fund')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                查看详情
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp size={18} className="text-green-600" />
                  </div>
                  <span className="text-gray-600">总收入</span>
                </div>
                <span className="font-semibold text-green-600">
                  {stats ? formatCurrency(515000) : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown size={18} className="text-red-600" />
                  </div>
                  <span className="text-gray-600">总支出</span>
                </div>
                <span className="font-semibold text-red-600">
                  {stats ? formatCurrency(50500) : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border-2 border-primary-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Wallet size={18} className="text-primary-600" />
                  </div>
                  <span className="font-medium text-gray-700">当前结余</span>
                </div>
                <span className="text-xl font-bold text-primary-600">
                  {stats ? formatCurrency(stats.fundBalance) : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold text-gray-800">最新通知</h2>
            <button
              onClick={() => navigate('/notices')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {latestNotices.slice(0, 3).map((notice, idx) => (
              <div
                key={notice.id}
                className={`p-4 rounded-xl border transition-all duration-500 cursor-pointer hover:shadow-md
                  ${idx === noticeIndex ? 'border-primary-300 bg-primary-50' : 'border-gray-100 hover:border-gray-200'}`}
                onClick={() => navigate(`/notices/${notice.id}`)}
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getNoticeTypeColor(notice.type)}`}>
                    {NOTICE_TYPE_LABELS[notice.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 mb-1 truncate">{notice.title}</div>
                    <div className="text-xs text-gray-500">{formatDateTime(notice.publishTime)}</div>
                  </div>
                  {!notice.isRead && (
                    <div className="w-2 h-2 bg-danger-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold text-gray-800">进行中的投票</h2>
            <button
              onClick={() => navigate('/votes')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {ongoingVotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无进行中的投票</div>
            ) : (
              ongoingVotes.slice(0, 3).map((vote) => {
                const deadline = formatDeadline(vote.deadline);
                return (
                  <div
                    key={vote.id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/votes/${vote.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-medium text-gray-800 flex-1">{vote.title}</div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${deadline.urgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {deadline.text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">已有 {vote.totalVotes} 户参与</span>
                      {vote.hasVoted ? (
                        <span className="text-green-600 font-medium">已投票</span>
                      ) : (
                        <span className="text-primary-600 font-medium">去投票</span>
                      )}
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((vote.totalVotes / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
