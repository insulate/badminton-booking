import { Link } from 'react-router-dom';
import { Users, Settings as SettingsIcon } from 'lucide-react';
import { ROUTES } from '../../constants';

export default function Settings() {
  const settingsCards = [
    {
      title: 'จัดการผู้ใช้งาน',
      description: 'เพิ่ม แก้ไข และลบผู้ใช้งานในระบบ',
      icon: Users,
      path: ROUTES.ADMIN.USERS,
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">ตั้งค่า</h1>
          <p className="text-text-secondary mt-1">จัดการการตั้งค่าและคอนฟิกระบบ</p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.path}
              to={card.path}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center
                    ${card.color === 'blue' ? 'bg-primary-blue/10' : 'bg-slate-100'}
                  `}>
                    <Icon className={`
                      ${card.color === 'blue' ? 'text-primary-blue' : 'text-slate-600'}
                    `} size={24} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-primary group-hover:text-primary-blue transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-blue/10 flex items-center justify-center">
            <SettingsIcon className="text-primary-blue" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">ข้อมูลระบบ</h2>
            <p className="text-text-secondary mt-2">
              Badminton Management System v1.0
            </p>
            <p className="text-sm text-text-muted mt-1">
              ระบบจัดการสนามแบดมินตันและการจองคอร์ต
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
