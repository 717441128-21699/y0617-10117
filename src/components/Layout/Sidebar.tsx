import { NavLink } from 'react-router-dom';
import {
  Home,
  Bell,
  CreditCard,
  Wallet,
  Vote,
  MessageSquare,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/notices', icon: Bell, label: '通知公告' },
  { path: '/property-fee', icon: CreditCard, label: '物业费' },
  { path: '/maintenance-fund', icon: Wallet, label: '维修基金' },
  { path: '/votes', icon: Vote, label: '业主投票' },
  { path: '/complaints', icon: MessageSquare, label: '投诉建议' },
  { path: '/committee', icon: Users, label: '业委会' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40
        ${sidebarCollapsed ? 'w-16' : 'w-60'}`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="font-serif font-bold text-lg text-primary-600 whitespace-nowrap">
            阳光社区
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarCollapsed ? (
            <Menu size={20} className="text-gray-600" />
          ) : (
            <X size={20} className="text-gray-600" />
          )}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${isActive
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <item.icon
              size={20}
              className={`flex-shrink-0 transition-transform duration-200
                ${!sidebarCollapsed ? 'group-hover:scale-110' : ''}`}
            />
            {!sidebarCollapsed && (
              <span className="font-medium whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {!sidebarCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            扫码关注，获取最新通知
          </div>
          <div className="mt-2 flex justify-center">
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://example.com/community"
                alt="关注二维码"
                className="w-16 h-16"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
