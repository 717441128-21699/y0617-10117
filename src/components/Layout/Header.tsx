import { Bell, User, LogOut, Shield, UserCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import type { Notice } from '../../../shared/types';
import { formatDateTime, truncateText } from '@/utils/format';

export default function Header() {
  const { sidebarCollapsed, currentHouseholdId, setImportantNotices, setShowStrongReminder, userRole, setUserRole } = useAppStore();
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

      if (unread > 0 && userRole === 'owner') {
        setTimeout(() => setShowStrongReminder(true), 1000);
      }
    } catch (error) {
      console.error('加载重要通知失败', error);
    }
  };

  const handleRoleSwitch = (role: 'owner' | 'admin') => {
    setUserRole(role);
    setShowUserMenu(false);
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30
        transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-60'}`}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-xl font-semibold text-gray-800">
            小区业主委员会管理平台
          </h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            userRole === 'admin' 
              ? 'bg-primary-100 text-primary-600' 
              : 'bg-green-100 text-green-600'
          }`}>
            {userRole === 'admin' ? '业委会' : '业主'}
          </span>
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                userRole === 'admin' ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                {userRole === 'admin' ? (
                  <Shield size={18} className="text-primary-600" />
                ) : (
                  <User size={18} className="text-gray-600" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {userRole === 'admin' ? '管理员' : '张三'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-800">
                    {userRole === 'admin' ? '业委会管理员' : '张三'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userRole === 'admin' ? '业委会办公室' : '1栋1单元101室'}
                  </div>
                </div>
                
                <div className="py-1">
                  <div className="px-4 py-1 text-xs text-gray-400 uppercase tracking-wider">身份切换</div>
                  <button
                    onClick={() => handleRoleSwitch('owner')}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      userRole === 'owner' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <UserCircle size={16} />
                    业主身份
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      userRole === 'admin' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield size={16} />
                    业委会身份
                  </button>
                </div>
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-red-50 transition-colors">
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
