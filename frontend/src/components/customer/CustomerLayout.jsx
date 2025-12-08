import { useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, FileText, Calendar, User, LogOut, LogIn, UserPlus } from 'lucide-react';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, player, initAuth, logout } = usePlayerAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.CUSTOMER.HOME);
  };

  const navItems = [
    {
      name: 'แผนผัง',
      path: ROUTES.CUSTOMER.HOME,
      icon: MapPin,
    },
    {
      name: 'เงื่อนไขการจอง',
      path: ROUTES.CUSTOMER.RULES,
      icon: FileText,
    },
    {
      name: 'จองสนาม',
      path: ROUTES.CUSTOMER.BOOKING,
      icon: Calendar,
    },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 shadow-sm z-40">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg">🏸</span>
            </div>
            <span className="text-gray-800 font-bold text-lg hidden sm:block">Lucky Badminton</span>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NavLink
                  to={ROUTES.CUSTOMER.MY_BOOKINGS}
                  className={({ isActive }) =>
                    `flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`
                  }
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{player?.name}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">ออก</span>
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to={ROUTES.CUSTOMER.LOGIN}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </NavLink>
                <NavLink
                  to={ROUTES.CUSTOMER.REGISTER}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">สมัคร</span>
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-16 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
        <div className="h-full flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg
                  transition-all duration-200 min-w-[80px]
                  ${isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
