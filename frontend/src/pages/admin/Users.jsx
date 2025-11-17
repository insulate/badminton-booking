import { useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  UserCircle,
  Phone,
  Mail,
  Calendar,
  Filter,
  Download
} from 'lucide-react';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const users = [
    {
      id: 1,
      name: 'สมชาย ใจดี',
      email: 'somchai@example.com',
      phone: '081-234-5678',
      role: 'member',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2 ชั่วโมงที่แล้ว',
    },
    {
      id: 2,
      name: 'สมหญิง รักสวย',
      email: 'somying@example.com',
      phone: '082-345-6789',
      role: 'member',
      status: 'active',
      joinDate: '2024-02-20',
      lastActive: '5 นาทีที่แล้ว',
    },
    {
      id: 3,
      name: 'ประยุทธ์ ทดสอบ',
      email: 'prayut@example.com',
      phone: '083-456-7890',
      role: 'admin',
      status: 'active',
      joinDate: '2023-12-01',
      lastActive: 'ออนไลน์',
    },
    {
      id: 4,
      name: 'วิภา เล่นดี',
      email: 'wipa@example.com',
      phone: '084-567-8901',
      role: 'member',
      status: 'inactive',
      joinDate: '2024-03-10',
      lastActive: '7 วันที่แล้ว',
    },
    {
      id: 5,
      name: 'สมศักดิ์ แข็งแรง',
      email: 'somsak@example.com',
      phone: '085-678-9012',
      role: 'member',
      status: 'active',
      joinDate: '2024-01-25',
      lastActive: '1 ชั่วโมงที่แล้ว',
    },
  ];

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700',
      member: 'bg-blue-100 text-blue-700',
    };
    const labels = {
      admin: 'ผู้ดูแลระบบ',
      member: 'สมาชิก',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      active: 'ใช้งาน',
      inactive: 'ไม่ใช้งาน',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">จัดการผู้ใช้งาน</h1>
          <p className="text-text-secondary mt-1">
            ผู้ใช้งานทั้งหมด {users.length} คน
          </p>
        </div>
        <button className="gradient-blue text-white px-6 py-3 rounded-lg font-medium hover:shadow-blue transition-all duration-200 flex items-center gap-2 justify-center sm:justify-start">
          <Plus size={20} />
          <span>เพิ่มผู้ใช้งาน</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
              size={20}
            />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 relative">
            <Filter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none"
              size={20}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent appearance-none bg-white cursor-pointer"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="md:col-span-4">
            <button className="w-full border-2 border-primary-blue text-primary-blue px-6 py-3 rounded-lg font-medium hover:bg-primary-blue hover:text-white transition-all duration-200 flex items-center gap-2 justify-center">
              <Download size={20} />
              <span>ส่งออกข้อมูล</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  ผู้ใช้งาน
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  ติดต่อ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  บทบาท
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  วันที่สมัคร
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                  การใช้งาน
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center">
                        <UserCircle className="text-primary-blue" size={24} />
                      </div>
                      <span className="font-medium text-text-primary">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Mail size={14} />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Calendar size={14} />
                      <span>{user.joinDate}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-secondary">
                      {user.lastActive}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-primary-blue hover:bg-primary-blue/10 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-accent-error hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center">
                    <UserCircle className="text-primary-blue" size={28} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{user.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone size={14} />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Calendar size={14} />
                  <span>สมัคร: {user.joinDate}</span>
                </div>
                <div className="text-text-muted">
                  ใช้งานล่าสุด: {user.lastActive}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button className="flex-1 px-4 py-2 text-primary-blue border border-primary-blue rounded-lg hover:bg-primary-blue hover:text-white transition-all flex items-center justify-center gap-2">
                  <Edit size={16} />
                  <span>แก้ไข</span>
                </button>
                <button className="flex-1 px-4 py-2 text-accent-error border border-accent-error rounded-lg hover:bg-accent-error hover:text-white transition-all flex items-center justify-center gap-2">
                  <Trash2 size={16} />
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <UserCircle className="mx-auto text-text-muted mb-4" size={64} />
            <p className="text-text-muted text-lg">ไม่พบผู้ใช้งานที่ค้นหา</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            แสดง 1-{filteredUsers.length} จาก {users.length} รายการ
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-text-secondary hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              ก่อนหน้า
            </button>
            <button className="px-4 py-2 bg-primary-blue text-white rounded-lg text-sm font-medium">
              1
            </button>
            <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-text-secondary hover:bg-slate-50">
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
