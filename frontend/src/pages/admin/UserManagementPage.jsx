import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Plus, Search, RefreshCw, Trash2, Edit2, UserCheck } from 'lucide-react';
import { userAPI } from '../../lib/api';
import { PageContainer, PageHeader } from '../../components/common';

export default function Settings() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user',
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = showDeleted ? { includeDeleted: true } : {};
      const response = await userAPI.getAll(params);

      if (response.success) {
        setUsers(response.data);
        setFilteredUsers(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);

  // Search filter
  useEffect(() => {
    const filtered = users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.username || '').toLowerCase().includes(searchLower) ||
        (user.name || '').toLowerCase().includes(searchLower) ||
        (user.role || '').toLowerCase().includes(searchLower)
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Handle create user
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'user',
    });
    setModalOpen(true);
  };

  // Handle edit user
  const handleOpenEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
    });
    setModalOpen(true);
  };

  // Handle submit (create or edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        const response = await userAPI.create(formData);
        if (response.success) {
          toast.success('สร้างผู้ใช้สำเร็จ!');
          fetchUsers();
          setModalOpen(false);
        }
      } else {
        const updateData = {
          username: formData.username,
          name: formData.name,
          role: formData.role,
        };

        const response = await userAPI.update(selectedUser._id, updateData);
        if (response.success) {
          toast.success('อัพเดทข้อมูลสำเร็จ!');
          fetchUsers();
          setModalOpen(false);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Handle delete
  const handleDelete = async (userId, username) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ "${username}"?`)) return;

    try {
      const response = await userAPI.delete(userId);
      if (response.success) {
        toast.success('ลบผู้ใช้สำเร็จ');
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Handle restore
  const handleRestore = async (userId, username) => {
    if (!confirm(`คุณต้องการกู้คืนผู้ใช้ "${username}" หรือไม่?`)) return;

    try {
      const response = await userAPI.restore(userId);
      if (response.success) {
        toast.success('กู้คืนผู้ใช้สำเร็จ');
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <PageContainer variant="full"><div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="จัดการผู้ใช้งาน"
        subtitle="เพิ่ม แก้ไข และลบผู้ใช้งานในระบบ"
        icon={Users}
        iconColor="blue"
      />

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-blue/10 flex items-center justify-center">
              <Users className="text-primary-blue" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">รายการผู้ใช้งาน</h2>
              <p className="text-sm text-text-secondary">ดูและจัดการข้อมูลผู้ใช้งานทั้งหมด</p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 gradient-blue text-white rounded-lg
              hover:shadow-blue-lg transition-all duration-200 font-medium"
          >
            <Plus size={20} />
            <span>เพิ่มผู้ใช้</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้, ชื่อ, หรือ role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
          </div>

          {/* Show Deleted Toggle */}
          <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 text-primary-blue rounded focus:ring-primary-blue"
            />
            <span className="text-sm text-text-secondary">แสดงผู้ใช้ที่ถูกลบ</span>
          </label>

          {/* Refresh */}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="tooltip flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg
              hover:bg-slate-50 transition-colors disabled:opacity-50"
            data-tooltip="รีเฟรช"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary mt-2">กำลังโหลด...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-text-secondary">
              {searchTerm ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้ในระบบ'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">ชื่อผู้ใช้</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">ชื่อ</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-primary">สถานะ</th>
                  <th className="text-right py-3 px-4 font-semibold text-text-primary">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{user.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.deletedAt ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                          ถูกลบแล้ว
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                          ใช้งานได้
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.deletedAt ? (
                          <button
                            onClick={() => handleRestore(user._id, user.username)}
                            className="tooltip p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            data-tooltip="กู้คืนผู้ใช้"
                          >
                            <UserCheck size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="tooltip p-2 text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
                              data-tooltip="แก้ไข"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id, user.username)}
                              className="tooltip p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              data-tooltip="ลบ"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-text-secondary">
            แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
          </p>
        </div>
      </div>

      {/* User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-text-primary">
                {modalMode === 'create' ? 'เพิ่มผู้ใช้ใหม่' : 'แก้ไขข้อมูลผู้ใช้'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ชื่อผู้ใช้ *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  minLength={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="กรอกชื่อผู้ใช้"
                />
              </div>

              {/* Password */}
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    รหัสผ่าน *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  />
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  บทบาท *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                >
                  <option value="user">ผู้ใช้งานทั่วไป</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 gradient-blue text-white rounded-lg hover:shadow-blue-lg transition-all font-medium"
                >
                  {modalMode === 'create' ? 'สร้างผู้ใช้' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div></PageContainer>
  );
}
