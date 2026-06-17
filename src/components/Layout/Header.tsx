import { Bell, User, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import type { Notice } from '../../../shared/types';
import { formatDateTime, truncateText } from '@/utils/format';

export default function Header() {
  const { sidebarCollapsed, currentHouseholdId, setImportantNotices, setShowStrongReminder } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadImportantNotices();
  }, [currentHouseholdId]);

  const loadImportantNotices = async () => {
    try {
      const response = await api.notices.getImportant(currentHouseholdId);
      setImportantNotices(response.data);
      const unread = response.data.filter((n: Notice) => !n.isRead).length;
      setUnreadCount(unread);

      if (unread > 0) {
        setTimeout(() => setShowStrongReminder(true), 1000);
      }
    } catch (error) {
      console.error('加载重要通知失败', error);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30
        transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-60'}`}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div>
          <h1 className="font-serif text-xl font-semibold text-gray-800">
            小区业主委员会管理平台
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowStrongReminder(true)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse-strong">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User size={18} className="text-primary-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">张三</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-800">张三</div>
                  <div className="text-xs text-gray-500">1栋1单元101室</div>
                </div>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User size={16} />
                  个人中心
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-red-50 transition-colors">
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
