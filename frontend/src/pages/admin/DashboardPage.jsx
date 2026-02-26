import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  LayoutDashboard,
  DollarSign,
  BarChart3,
  ShoppingBag,
  CalendarCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '../../components/common';
import { reportsAPI } from '../../lib/api';

const STATUS_MAP = {
  confirmed: { label: 'ยืนยัน', class: 'bg-green-100 text-green-700' },
  pending: { label: 'รอดำเนินการ', class: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'สำเร็จ', class: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'ยกเลิก', class: 'bg-red-100 text-red-700' },
  paid: { label: 'ชำระแล้ว', class: 'bg-green-100 text-green-700' },
  'checked-in': { label: 'เช็คอิน', class: 'bg-teal-100 text-teal-700' },
};

function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString('th-TH');
}

function formatCurrency(num) {
  if (num == null) return '฿0';
  return `฿${num.toLocaleString('th-TH')}`;
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsAPI.getDashboard();
      setData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('ไม่สามารถโหลดข้อมูล Dashboard ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data
    ? [
        {
          title: 'ลูกค้าทั้งหมด',
          value: formatNumber(data.stats.totalPlayers),
          trend: null,
          icon: Users,
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: 'การจองวันนี้',
          value: formatNumber(data.stats.todayBookings),
          trend: data.trends.bookings,
          trendLabel: 'จากเมื่อวาน',
          icon: Calendar,
          color: 'from-purple-500 to-purple-600',
        },
        {
          title: 'รายได้วันนี้',
          value: formatCurrency(data.stats.todayRevenue),
          trend: data.trends.todayRevenue,
          trendLabel: 'จากเมื่อวาน',
          icon: DollarSign,
          color: 'from-emerald-500 to-teal-600',
        },
        {
          title: 'รายได้เดือนนี้',
          value: formatCurrency(data.stats.monthlyRevenue),
          trend: data.trends.monthlyRevenue,
          trendLabel: 'จากเดือนที่แล้ว',
          icon: TrendingUp,
          color: 'from-orange-500 to-amber-600',
        },
      ]
    : [];

  // Weekly chart max
  const maxWeeklyCount = data
    ? Math.max(...data.weeklyBookings.map((d) => d.count), 1)
    : 1;

  return (
    <PageContainer variant="full">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <LayoutDashboard className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-blue-100 text-sm mt-1">
                  ภาพรวมระบบจัดการสนามแบดมินตัน
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <Activity size={16} />
                  <span>
                    อัพเดท:{' '}
                    {lastUpdated.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    น.
                  </span>
                </div>
              )}
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchDashboard}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const isPositive = stat.trend > 0;
              const isNeutral = stat.trend === 0 || stat.trend === null;

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm mb-2">
                        {stat.title}
                      </p>
                      <p className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                        {stat.value}
                      </p>
                      {stat.trend !== null && (
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <TrendingUp size={14} className="text-emerald-500" />
                          ) : !isNeutral ? (
                            <TrendingDown size={14} className="text-red-500" />
                          ) : null}
                          <span
                            className={`text-sm font-medium ${
                              isNeutral
                                ? 'text-gray-400'
                                : isPositive
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {stat.trend}%
                          </span>
                          <span className="text-xs text-text-muted">
                            {stat.trendLabel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}
                    >
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Two Column Layout */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Activity size={20} className="text-blue-500" />
                กิจกรรมล่าสุด
              </h2>
              {data.recentActivities.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <Activity
                    size={40}
                    className="mx-auto mb-2 opacity-40"
                  />
                  <p>ยังไม่มีกิจกรรม</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentActivities.map((activity, idx) => {
                    const statusInfo =
                      STATUS_MAP[activity.status] || STATUS_MAP.pending;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              activity.type === 'booking'
                                ? 'bg-blue-100'
                                : 'bg-orange-100'
                            }`}
                          >
                            {activity.type === 'booking' ? (
                              <CalendarCheck
                                size={16}
                                className="text-blue-600"
                              />
                            ) : (
                              <ShoppingBag
                                size={16}
                                className="text-orange-600"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary text-sm">
                              {activity.name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {activity.action}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${statusInfo.class}`}
                          >
                            {statusInfo.label}
                          </span>
                          <p className="text-xs text-text-muted">
                            {timeAgo(activity.time)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Popular Courts */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-500" />
                สนามยอดนิยม (สัปดาห์นี้)
              </h2>
              {data.courtsUsage.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <BarChart3
                    size={40}
                    className="mx-auto mb-2 opacity-40"
                  />
                  <p>ยังไม่มีข้อมูลการใช้สนาม</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {data.courtsUsage.map((court, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-text-primary">
                            {court.name}
                          </span>
                          <span className="text-sm text-text-secondary">
                            {court.bookings} การจอง
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${court.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {data.courtsUsage.length}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        สนามที่มีการจอง
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Weekly Bookings Chart */}
        {data && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              สถิติการจอง (7 วันที่ผ่านมา)
            </h2>
            {data.weeklyBookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-text-secondary">
                ยังไม่มีข้อมูล
              </div>
            ) : (
              <div className="flex items-end gap-3 h-48">
                {data.weeklyBookings.map((day, idx) => {
                  const heightPct =
                    maxWeeklyCount > 0
                      ? (day.count / maxWeeklyCount) * 100
                      : 0;
                  const isToday = idx === data.weeklyBookings.length - 1;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <span className="text-xs font-semibold text-text-primary">
                        {day.count}
                      </span>
                      <div className="w-full relative" style={{ height: '140px' }}>
                        <div
                          className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                            isToday
                              ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-t from-blue-400 to-blue-300'
                          }`}
                          style={{
                            height: `${Math.max(heightPct, 4)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isToday ? 'text-emerald-600' : 'text-text-muted'
                        }`}
                      >
                        {day.day}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {formatCurrency(day.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
