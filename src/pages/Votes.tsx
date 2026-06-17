import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Vote,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  BarChart3,
  Calendar,
  AlertCircle,
  CheckSquare,
  Plus,
  X,
  Send,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import {
  formatDate,
  formatDateTime,
  formatDeadline,
  getStatusColor,
  VOTE_STATUS_LABELS,
} from '@/utils/format';
import type { Vote as VoteType } from '../../shared/types';

export default function Votes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentHouseholdId, userRole, votes, setVotes } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ongoing' | 'ended'>('all');
  const [detailVote, setDetailVote] = useState<VoteType | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
    deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadVoteDetail(parseInt(id));
    } else {
      loadVotes();
    }
  }, [id, currentHouseholdId]);

  const loadVotes = async () => {
    setLoading(true);
    try {
      const response = await api.votes.getList(currentHouseholdId);
      setVotes(response.data);
    } catch (error) {
      console.error('加载投票失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVoteDetail = async (voteId: number) => {
    setLoading(true);
    try {
      const response = await api.votes.getById(voteId, currentHouseholdId);
      setDetailVote(response.data);
      if (response.data.hasVoted && response.data.userVote !== undefined) {
        setSelectedOption(response.data.userVote);
      }
    } catch (error) {
      console.error('加载投票详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!detailVote || selectedOption === null) return;
    setVoting(true);
    try {
      await api.votes.castVote(detailVote.id, selectedOption, currentHouseholdId);
      loadVoteDetail(detailVote.id);
    } catch (error) {
      console.error('投票失败', error);
      alert('投票失败，请重试');
    } finally {
      setVoting(false);
    }
  };

  const handleAddOption = () => {
    if (createForm.options.length >= 5) {
      alert('最多只能添加5个选项');
      return;
    }
    setCreateForm({ ...createForm, options: [...createForm.options, ''] });
  };

  const handleRemoveOption = (index: number) => {
    if (createForm.options.length <= 2) {
      alert('至少需要2个选项');
      return;
    }
    const newOptions = createForm.options.filter((_, i) => i !== index);
    setCreateForm({ ...createForm, options: newOptions });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...createForm.options];
    newOptions[index] = value;
    setCreateForm({ ...createForm, options: newOptions });
  };

  const handleCreateVote = async () => {
    const validOptions = createForm.options.filter(o => o.trim() !== '');
    if (!createForm.title || !createForm.description || validOptions.length < 2 || !createForm.deadline) {
      alert('请填写完整的投票信息（标题、说明、至少2个选项、截止日期）');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.votes.create({
        title: createForm.title,
        description: createForm.description,
        options: validOptions,
        deadline: `${createForm.deadline} 23:59:59`,
      });

      if (response.data) {
        setShowCreateModal(false);
        setCreateForm({ title: '', description: '', options: ['', ''], deadline: '' });
        loadVotes();
      }
    } catch (error) {
      console.error('创建投票失败', error);
      alert('创建投票失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVotes = votes.filter((vote) => {
    if (activeTab === 'all') return true;
    return vote.status === activeTab;
  });

  const ongoingCount = votes.filter((v) => v.status === 'ongoing').length;

  const getPercentage = (vote: VoteType, optionIndex: number) => {
    if (!vote.results || vote.totalVotes === 0) return 0;
    return Math.round((vote.results[optionIndex] / vote.totalVotes) * 100);
  };

  if (id && detailVote) {
    const deadlineInfo = formatDeadline(detailVote.deadline);

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate('/votes')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回投票列表</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className={`p-6 ${detailVote.status === 'ongoing' ? 'bg-gradient-to-r from-primary-500 to-blue-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {VOTE_STATUS_LABELS[detailVote.status]}
              </span>
              {detailVote.hasVoted && (
                <span className="px-3 py-1 bg-green-500/80 rounded-full text-sm font-medium">
                  已投票
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold mb-4">{detailVote.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>创建于 {formatDate(detailVote.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>截止时间 {formatDateTime(detailVote.deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>已有 {detailVote.totalVotes} 户参与投票</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {detailVote.status === 'ongoing' && deadlineInfo.urgent && !detailVote.hasVoted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle size={20} className="text-warning-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">{deadlineInfo.text}</p>
                  <p className="text-sm text-yellow-600">请尽快行使您的投票权利</p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 mb-4">投票说明</h3>
              <p className="text-gray-600 leading-relaxed">{detailVote.description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">投票选项</h3>
                {detailVote.status === 'ended' && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <BarChart3 size={14} />
                    最终结果
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {detailVote.options.map((option, idx) => {
                  const percentage = getPercentage(detailVote, idx);
                  const isSelected = selectedOption === idx;
                  const isWinning = detailVote.status === 'ended' && detailVote.results &&
                    detailVote.results[idx] === Math.max(...detailVote.results);

                  return (
                    <div key={idx}>
                      {detailVote.status === 'ongoing' && !detailVote.hasVoted ? (
                        <button
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all
                            ${isSelected
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                              ${isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}
                            `}>
                              {isSelected && <CheckCircle size={14} className="text-white" />}
                            </div>
                            <span className="font-medium text-gray-800">{option}</span>
                          </div>
                        </button>
                      ) : (
                        <div className={`p-4 rounded-xl border-2 relative overflow-hidden
                          ${isWinning ? 'border-success-500 bg-green-50' : 'border-gray-200 bg-gray-50'}
                        `}>
                          <div
                            className={`absolute inset-0 transition-all duration-500
                              ${isWinning ? 'bg-success-100' : 'bg-primary-100'}
                            `}
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                                ${isSelected ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
                              `}>
                                {idx + 1}
                              </span>
                              <span className="font-medium text-gray-800">{option}</span>
                              {isSelected && <CheckCircle size={16} className="text-primary-600" />}
                              {isWinning && (
                                <span className="px-2 py-0.5 bg-success-500 text-white text-xs rounded-full font-medium">
                                  通过
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 text-sm">
                                {detailVote.results ? detailVote.results[idx] : 0} 票
                              </span>
                              <span className={`font-bold text-lg
                                ${isWinning ? 'text-success-600' : 'text-primary-600'}
                              `}>
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {detailVote.status === 'ongoing' && !detailVote.hasVoted && (
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={16} />
                    <span>当前已有 {detailVote.totalVotes} 户参与投票</span>
                  </div>
                  <div className={`text-sm font-medium ${deadlineInfo.urgent ? 'text-danger-500' : 'text-gray-600'}`}>
                    {deadlineInfo.text}
                  </div>
                </div>
                <button
                  onClick={handleVote}
                  disabled={selectedOption === null || voting}
                  className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {voting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckSquare size={20} />
                      确认投票
                    </>
                  )}
                </button>
                <p className="text-center text-gray-500 text-sm mt-3">
                  投票后不可更改，请谨慎选择
                </p>
              </div>
            )}

            {detailVote.status === 'ended' && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 size={18} />
                  投票结果统计
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">参与户数</p>
                    <p className="text-2xl font-bold text-gray-800">{detailVote.totalVotes}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">通过率</p>
                    <p className="text-2xl font-bold text-success-600">
                      {detailVote.results ? Math.round((Math.max(...detailVote.results) / detailVote.totalVotes) * 100) : 0}%
                    </p>
                  </div>
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
            <Vote className="text-primary-600" />
            业主投票
          </h1>
          <p className="text-gray-500 mt-1">参与小区重要事务表决，行使业主权利</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-md"
          >
            <Plus size={20} />
            发起投票
          </button>
        )}
      </div>

      {ongoingCount > 0 && (
        <div className="mb-6">
          <span className="bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
            {ongoingCount} 个进行中
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部投票' },
              { value: 'ongoing', label: '进行中' },
              { value: 'ended', label: '已结束' },
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
        ) : filteredVotes.length === 0 ? (
          <div className="p-12 text-center">
            <Vote size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无投票</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredVotes.map((vote, idx) => {
              const deadlineInfo = formatDeadline(vote.deadline);
              return (
                <div
                  key={vote.id}
                  onClick={() => navigate(`/votes/${vote.id}`)}
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(vote.status)}`}>
                          {VOTE_STATUS_LABELS[vote.status]}
                        </span>
                        {vote.hasVoted && (
                          <span className="px-2 py-0.5 bg-green-100 text-success-500 text-xs font-medium rounded-full">
                            已投票
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">{vote.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{vote.description}</p>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {vote.totalVotes} 户已参与
                        </span>
                        <span className={`flex items-center gap-1 ${deadlineInfo.urgent ? 'text-danger-500' : ''}`}>
                          <Clock size={14} />
                          {vote.status === 'ongoing' ? deadlineInfo.text : `已于 ${formatDate(vote.deadline)} 截止`}
                        </span>
                      </div>
                    </div>
                    <div className="ml-6 flex-shrink-0">
                      {vote.status === 'ongoing' && !vote.hasVoted ? (
                        <div className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg font-medium">
                          去投票
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg font-medium">
                          查看结果
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800 font-serif">发起新投票</h2>
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
                  投票标题
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="如：是否同意更换物业公司"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投票说明
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="请详细描述投票事项的背景、目的和相关信息..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    投票选项
                  </label>
                  <button
                    onClick={handleAddOption}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    添加选项
                  </button>
                </div>
                <div className="space-y-3">
                  {createForm.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`选项 ${idx + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                      {createForm.options.length > 2 && (
                        <button
                          onClick={() => handleRemoveOption(idx)}
                          className="p-2 text-gray-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">投票将于截止日期当天23:59:59结束</p>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 sticky bottom-0 rounded-b-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCreateVote}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {submitting ? '发起中...' : '确认发起'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
