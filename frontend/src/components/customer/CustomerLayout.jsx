import { Outlet, Link, useLocation } from 'react-router-dom';
import { MapPin, FileText, Calendar } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function CustomerLayout() {
  const location = useLocation();

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
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-blue-950/80 backdrop-blur-sm shadow-lg z-40">
        <div className="h-full flex items-center justify-center px-4">
          <div className="flex items-center gap-3">
            {/* Badminton Icon */}
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-900"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="5" r="3" />
                <path d="M12 8C10.34 8 9 9.34 9 11v2c0 1.66 1.34 3 3 3s3-1.34 3-3v-2c0-1.66-1.34-3-3-3z" />
                <path d="M12 18c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl">Lucky Badminton</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-16 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation (fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-blue-950 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-40">
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
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-gray-200'
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
