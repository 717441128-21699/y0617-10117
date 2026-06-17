import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StrongReminder from '../StrongReminder';
import { useAppStore } from '@/store/useAppStore';

export default function Layout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <Header />
      <StrongReminder />
      <main
        className={`pt-16 transition-all duration-300
          ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
