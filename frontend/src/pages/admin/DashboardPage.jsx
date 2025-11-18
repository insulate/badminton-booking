import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function Dashboard() {
  // Mock data
  const stats = [
    {
      title: 'ผู้ใช้งานทั้งหมด',
      value: '1,248',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'ผู้ใช้งานวันนี้',
      value: '342',
      change: '+8.2%',
      trend: 'up',
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      title: 'การจองวันนี้',
      value: '87',
      change: '-3.1%',
      trend: 'down',
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'รายได้รวม',
      value: '฿124,850',
      change: '+15.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'สมชาย ใจดี',
      action: 'จองคอร์ต A',
      time: '5 นาทีที่แล้ว',
      status: 'success',
    },
    {
      id: 2,
      user: 'สมหญิง รักสวย',
      action: 'ยกเลิกการจอง',
      time: '15 นาทีที่แล้ว',
      status: 'cancelled',
    },
    {
      id: 3,
      user: 'ประยุทธ์ ทดสอบ',
      action: 'สมัครสมาชิก',
      time: '1 ชั่วโมงที่แล้ว',
      status: 'success',
    },
    {
      id: 4,
      user: 'วิภา เล่นดี',
      action: 'จองคอร์ต B',
      time: '2 ชั่วโมงที่แล้ว',
      status: 'success',
    },
    {
      id: 5,
      user: 'สมศักดิ์ แข็งแรง',
      action: 'ชำระเงิน',
      time: '3 ชั่วโมงที่แล้ว',
      status: 'success',
    },
  ];

  const popularCourts = [
    { name: 'คอร์ต A', bookings: 45, percentage: 90 },
    { name: 'คอร์ต B', bookings: 38, percentage: 76 },
    { name: 'คอร์ต C', bookings: 32, percentage: 64 },
    { name: 'คอร์ต D', bookings: 28, percentage: 56 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">ภาพรวมระบบจัดการสนามแบดมินตัน</p>
        </div>
        <div className="flex items-center gap-2 text-text-secondary">
          <Activity size={20} />
          <span className="text-sm">อัพเดทล่าสุด: วันนี้ 14:30 น.</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === 'up';

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-text-secondary text-sm mb-2">{stat.title}</p>
                  <p className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-medium ${
                        isPositive ? 'text-accent-success' : 'text-accent-error'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-text-muted">จากเดือนที่แล้ว</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">กิจกรรมล่าสุด</h2>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{activity.user}</p>
                  <p className="text-sm text-text-secondary">{activity.action}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                      activity.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {activity.status === 'success' ? 'สำเร็จ' : 'ยกเลิก'}
                  </span>
                  <p className="text-xs text-text-muted">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Courts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            คอร์ตยอดนิยม (สัปดาห์นี้)
          </h2>
          <div className="space-y-4">
            {popularCourts.map((court, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{court.name}</span>
                  <span className="text-sm text-text-secondary">
                    {court.bookings} การจอง
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-blue to-primary-light-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${court.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-blue">85%</p>
              <p className="text-xs text-text-muted mt-1">อัตราการใช้งาน</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-blue">4.8</p>
              <p className="text-xs text-text-muted mt-1">คะแนนความพึงพอใจ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          สถิติการจอง (7 วันที่แล้ว)
        </h2>
        <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="mx-auto text-primary-blue mb-2" size={48} />
            <p className="text-text-muted">
              กราฟแสดงสถิติจะแสดงที่นี่
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
