import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'จัดการผู้ใช้งาน',
      path: '/admin/users',
      icon: Users,
    },
    {
      name: 'ตั้งค่า',
      path: '/admin/settings',
      icon: Settings,
    },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-bg-cream">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 gradient-blue shadow-lg z-40">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          {/* Left: Menu Toggle + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                Badminton System
              </span>
            </div>
          </div>

          {/* Right: User Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-white text-sm font-medium">Admin User</p>
              <p className="text-white/70 text-xs">ผู้ดูแลระบบ</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-semibold">A</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-bg-sidebar shadow-xl z-30
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <nav className="flex flex-col h-full">
          {/* Menu Items */}
          <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-primary-blue text-white shadow-blue'
                      : 'text-slate-300 hover:bg-bg-sidebar-hover hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-700 p-3 space-y-1">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-slate-300 hover:bg-bg-sidebar-hover hover:text-white
                transition-colors duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">ออกจากระบบ</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
