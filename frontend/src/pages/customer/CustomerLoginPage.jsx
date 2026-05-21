import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { playerAuthAPI } from '../../lib/api';
import usePlayerAuthStore from '../../store/playerAuthStore';
import { ROUTES } from '../../constants';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = usePlayerAuthStore();
  
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get redirect path from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || ROUTES.CUSTOMER.BOOKING;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone.trim()) {
      setError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!formData.password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const response = await playerAuthAPI.login({
        phone: formData.phone,
        password: formData.password,
      });

      if (response.success) {
        const { token, ...playerData } = response.data;
        login(playerData, token);
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
            <p className="text-gray-500 mt-2">เข้าสู่ระบบเพื่อจองสนาม</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => { setError(''); handleChange(e); }}
                  placeholder="0812345678"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => { setError(''); handleChange(e); }}
                  placeholder="รหัสผ่าน"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
                />
              </div>
            </div>

            {/* Inline Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              ยังไม่มีบัญชี?{' '}
              <Link
                to={`${ROUTES.CUSTOMER.REGISTER}${location.search}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                สมัครสมาชิก
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
