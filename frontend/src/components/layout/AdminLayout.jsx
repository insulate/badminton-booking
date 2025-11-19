import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '../../constants';
import useAuthStore from '../../store/authStore';
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronDown,
  ChevronUp,
  Building2,
  Clock,
  Calendar,
  CalendarDays,
  CreditCard,
  Settings as SettingsIcon,
  LayoutGrid,
  Timer,
  ClipboardList,
  Package,
  ShoppingCart,
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('ออกจากระบบสำเร็จ');
    navigate(ROUTES.LOGIN);
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: ROUTES.ADMIN.DASHBOARD,
      icon: LayoutDashboard,
    },
    {
      name: 'จองสนาม',
      path: '/admin/booking',
      icon: CalendarDays,
    },
    {
      name: 'รายการจอง',
      path: '/admin/bookings',
      icon: ClipboardList,
    },
    {
      name: 'POS - ขายสินค้า',
      path: ROUTES.ADMIN.POS,
      icon: ShoppingCart,
    },
    {
      name: 'ตั้งค่า',
      icon: Settings,
      children: [
        {
          name: 'จัดการผู้ใช้งาน',
          path: ROUTES.ADMIN.USERS,
          icon: Users,
        },
        {
          name: 'จัดการสนาม',
          path: ROUTES.ADMIN.COURTS,
          icon: LayoutGrid,
        },
        {
          name: 'ช่วงเวลาและราคา',
          path: ROUTES.ADMIN.TIMESLOTS,
          icon: Timer,
        },
        {
          name: 'จัดการสินค้า',
          path: ROUTES.ADMIN.PRODUCTS,
          icon: Package,
        },
        {
          name: 'ข้อมูลสนาม',
          path: ROUTES.ADMIN.SETTINGS_VENUE,
          icon: Building2,
        },
        {
          name: 'เวลาทำการ',
          path: ROUTES.ADMIN.SETTINGS_OPERATING,
          icon: Clock,
        },
        {
          name: 'การตั้งค่าการจอง',
          path: ROUTES.ADMIN.SETTINGS_BOOKING,
          icon: Calendar,
        },
        {
          name: 'วิธีการชำระเงิน',
          path: ROUTES.ADMIN.SETTINGS_PAYMENT,
          icon: CreditCard,
        },
        {
          name: 'การตั้งค่าทั่วไป',
          path: ROUTES.ADMIN.SETTINGS_GENERAL,
          icon: SettingsIcon,
        },
      ],
    },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => isActivePath(child.path));
  };

  const toggleMenu = (menuName) => {
    setExpandedMenu(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
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
              <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
              <p className="text-white/70 text-xs">
                {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
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
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenu[item.name] || isParentActive(item);
              const isActive = !hasChildren && isActivePath(item.path);

              return (
                <div key={item.name}>
                  {/* Parent Menu */}
                  {hasChildren ? (
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg
                        transition-all duration-200
                        ${isParentActive(item)
                          ? 'bg-primary-blue/20 text-white'
                          : 'text-slate-300 hover:bg-bg-sidebar-hover hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  ) : (
                    <Link
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
                  )}

                  {/* Children Menu */}
                  {hasChildren && isExpanded && (
                    <div className="mt-1 ml-3 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = isActivePath(child.path);

                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2.5 rounded-lg
                              transition-all duration-200
                              ${isChildActive
                                ? 'bg-primary-blue text-white shadow-blue'
                                : 'text-slate-300 hover:bg-bg-sidebar-hover hover:text-white'
                              }
                            `}
                          >
                            <ChildIcon size={18} />
                            <span className="font-medium text-sm">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-700 p-3 space-y-1">
            <button
              onClick={handleLogout}
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
