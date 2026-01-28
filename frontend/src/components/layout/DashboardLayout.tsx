import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Table,
  Link as LinkIcon,
  Settings,
  LogOut,
  Leaf,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string, formId?: string) => void;
}

export const DashboardLayout = ({ children, currentPage, onNavigate }: DashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members Data', icon: Table },
    { id: 'forms', label: 'Form Generator', icon: LinkIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex">
      {/* SIDEBAR - FIXED POSITION */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        glass-panel border-r border-white/30
        transform transition-all duration-300
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto overflow-x-hidden
      `}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zomi-green rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Zomi Wealth</h2>
                  <p className="text-xs text-slate-600">Portal</p>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-10 h-10 bg-zomi-green rounded-xl flex items-center justify-center mx-auto">
                <Leaf className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Toggle Button - Desktop */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full p-2 mb-4 text-slate-600 hover:bg-white/50 rounded-lg transition-all"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Close Button - Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden flex items-center justify-center w-full p-2 mb-4 text-slate-600 hover:bg-white/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isSidebarCollapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-zomi-green text-white shadow-lg'
                      : 'text-slate-700 hover:bg-white/50'
                    }
                  `}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            {!isSidebarCollapsed && (
              <div className="px-4">
                <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-600">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-zomi-mint text-zomi-green text-xs font-semibold rounded">
                  {user?.role}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT - WITH SIDEBAR OFFSET */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <header className="glass-panel border-b border-white/30 px-6 py-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
