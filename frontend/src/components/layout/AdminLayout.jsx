import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '../../constants';
import useAuthStore from '../../store/authStore';
import useSocket from '../../hooks/useSocket';
import { bookingsAPI } from '../../lib/api';
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
  Tag,
  UserCircle2,
  BarChart3,
  Receipt,
  Map,
  Repeat,
  UserCheck,
  Calculator,
  Bell,
} from 'lucide-react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState({});
  const [pendingSlipsCount, setPendingSlipsCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Fetch pending slips count
  const fetchPendingSlipsCount = useCallback(async () => {
    try {
      const response = await bookingsAPI.getPendingSlipsCount();
      if (response.success) {
        setPendingSlipsCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching pending slips count:', error);
    }
  }, []);

  // Fetch on mount and periodically
  useEffect(() => {
    fetchPendingSlipsCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingSlipsCount, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingSlipsCount]);

  // Refresh when navigating to bookings page
  useEffect(() => {
    if (location.pathname === '/admin/bookings') {
      fetchPendingSlipsCount();
    }
  }, [location.pathname, fetchPendingSlipsCount]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket event handlers for realtime notifications
  const handleNewBooking = useCallback((data) => {
    toast.success(
      <div>
        <p className="font-semibold">การจองใหม่!</p>
        <p className="text-sm">{data.booking?.bookingCode} - {data.booking?.customerName}</p>
      </div>,
      { duration: 5000, icon: '📅' }
    );
    // Refresh pending slips count
    fetchPendingSlipsCount();
  }, [fetchPendingSlipsCount]);

  const handleSlipUploaded = useCallback((data) => {
    toast.success(
      <div>
        <p className="font-semibold">สลิปใหม่รอตรวจสอบ!</p>
        <p className="text-sm">{data.booking?.bookingCode} - {data.booking?.customerName}</p>
      </div>,
      { duration: 5000, icon: '💳' }
    );
    // Refresh pending slips count
    fetchPendingSlipsCount();
  }, [fetchPendingSlipsCount]);

  const handleBookingCancelled = useCallback((data) => {
    toast(
      <div>
        <p className="font-semibold">การจองถูกยกเลิก</p>
        <p className="text-sm">{data.booking?.bookingCode}</p>
      </div>,
      { duration: 4000, icon: '❌' }
    );
  }, []);

  // Initialize socket connection
  useSocket({
    onNewBooking: handleNewBooking,
    onSlipUploaded: handleSlipUploaded,
    onBookingCancelled: handleBookingCancelled,
  });

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
      name: 'ข้อมูลลูกค้า',
      path: ROUTES.ADMIN.PLAYERS,
      icon: UserCircle2,
    },
    {
      name: 'ระบบตีก๊วน',
      path: ROUTES.ADMIN.GROUPPLAY,
      icon: Users,
    },
    {
      name: 'จัดการกะ',
      icon: Clock,
      children: [
        {
          name: 'ลงเวลางาน',
          path: ROUTES.ADMIN.ATTENDANCE,
          icon: UserCheck,
        },
        {
          name: 'เช็คเงินกะ',
          path: ROUTES.ADMIN.SHIFTS,
          icon: Calculator,
        },
      ],
    },
    {
      name: 'การจอง',
      icon: CalendarDays,
      badge: pendingSlipsCount > 0 ? pendingSlipsCount : null,
      children: [
        {
          name: 'จองสนาม',
          path: '/admin/booking',
          icon: Calendar,
        },
        {
          name: 'รายการจอง',
          path: '/admin/bookings',
          icon: ClipboardList,
          badge: pendingSlipsCount > 0 ? pendingSlipsCount : null,
        },
        {
          name: 'การจองประจำ',
          path: '/admin/recurring-bookings',
          icon: Repeat,
        },
      ],
    },
    {
      name: 'ขายสินค้า',
      icon: ShoppingCart,
      children: [
        {
          name: 'POS - ขายสินค้า',
          path: ROUTES.ADMIN.POS,
          icon: ShoppingCart,
        },
        {
          name: 'ประวัติการขาย',
          path: ROUTES.ADMIN.SALES,
          icon: Receipt,
        },
        {
          name: 'จัดการสินค้า',
          path: ROUTES.ADMIN.PRODUCTS,
          icon: Package,
        },
        {
          name: 'จัดการหมวดหมู่',
          path: ROUTES.ADMIN.CATEGORIES,
          icon: Tag,
        },
      ],
    },
    {
      name: 'รายงานและสถิติ',
      path: ROUTES.ADMIN.REPORTS,
      icon: BarChart3,
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
        {
          name: 'รูปแผนผังสนาม',
          path: ROUTES.ADMIN.SETTINGS_FLOOR_PLAN,
          icon: Map,
        },
        {
          name: 'ระดับมือผู้เล่น',
          path: ROUTES.ADMIN.SETTINGS_PLAYER_LEVELS,
          icon: UserCircle2,
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

          {/* Right: Notification + User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell */}
            <Link
              to="/admin/bookings"
              className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              title="สลิปรอตรวจสอบ"
            >
              <Bell size={22} />
              {pendingSlipsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {pendingSlipsCount > 99 ? '99+' : pendingSlipsCount}
                </span>
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-white/70 text-xs">
                    {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm sm:text-base">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-white transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b md:hidden">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">
                      {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
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
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
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
                            {child.badge && (
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ml-auto">
                                {child.badge > 99 ? '99+' : child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
