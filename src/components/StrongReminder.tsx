import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import { NOTICE_TYPE_LABELS } from '../../shared/types';
import { formatDateTime } from '@/utils/format';
import { useState } from 'react';

export default function StrongReminder() {
  const { showStrongReminder, setShowStrongReminder, importantNotices, currentHouseholdId, setImportantNotices } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  const unreadNotices = importantNotices.filter(n => !n.isRead);
  const currentNotice = unreadNotices[currentIndex];

  if (!showStrongReminder || unreadNotices.length === 0) return null;

  const handleMarkRead = async () => {
    if (!currentNotice) return;

    try {
      await api.notices.markAsRead(currentNotice.id, currentHouseholdId);
      const updated = importantNotices.map(n =>
        n.id === currentNotice.id ? { ...n, isRead: true } : n
      );
      setImportantNotices(updated);

      if (currentIndex < unreadNotices.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowStrongReminder(false);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('标记已读失败', error);
    }
  };

  const handleClose = () => {
    setShowStrongReminder(false);
    setCurrentIndex(0);
  };

  const handleMarkAllRead = async () => {
    try {
      for (const notice of unreadNotices) {
        await api.notices.markAsRead(notice.id, currentHouseholdId);
      }
      const updated = importantNotices.map(n => ({ ...n, isRead: true }));
      setImportantNotices(updated);
      setShowStrongReminder(false);
      setCurrentIndex(0);
    } catch (error) {
      console.error('全部标记已读失败', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-bounce-in overflow-hidden"
        style={{ animationDelay: '0s' }}
      >
        <div className="bg-gradient-to-r from-danger-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse-strong">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold">重要通知</h3>
                <p className="text-white/80 text-sm">
                  {unreadNotices.length} 条未读重要通知
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 bg-danger-100 text-danger-600 text-xs font-medium rounded-full mb-3">
              {currentNotice ? NOTICE_TYPE_LABELS[currentNotice.type] : ''}
            </span>
            <h4 className="font-serif text-lg font-semibold text-gray-800 mb-2">
              {currentNotice?.title}
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              发布时间：{currentNotice ? formatDateTime(currentNotice.publishTime) : ''}
            </p>
            <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {currentNotice?.content}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {unreadNotices.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300
                  ${idx === currentIndex ? 'w-6 bg-primary-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {unreadNotices.length > 1 && (
              <button
                onClick={handleMarkAllRead}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                全部已读
              </button>
            )}
            <button
              onClick={handleMarkRead}
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              确认收到
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
