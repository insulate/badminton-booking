import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants';
import useAuthStore from '../store/authStore';
import { authAPI } from '../lib/api';
import { LogIn, User, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      if (!response.success) {
        throw new Error(response.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }

      // Save to auth store
      const { token, ...userData } = response.data;
      login(userData, token);

      toast.success('เข้าสู่ระบบสำเร็จ!');

      // Redirect to admin dashboard
      navigate(ROUTES.ADMIN.DASHBOARD);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-blue flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-blue-lg">
            <span className="text-white font-bold text-4xl">B</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">Badminton System</h1>
          <p className="text-white/80 text-sm">ระบบจัดการสนามแบดมินตัน</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">เข้าสู่ระบบ</h2>
            <p className="text-text-secondary text-sm">กรุณาใส่ข้อมูลเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-slide-up">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-text-muted" size={20} />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent
                    transition-all duration-200 text-text-primary placeholder-text-muted"
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-text-muted" size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent
                    transition-all duration-200 text-text-primary placeholder-text-muted"
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-blue text-white py-3 rounded-lg font-medium
                hover:shadow-blue-lg transform hover:scale-[1.02] active:scale-[0.98]
                transition-all duration-200 flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-text-muted text-center mb-2">ข้อมูลสำหรับทดสอบ:</p>
            <div className="bg-slate-50 rounded-lg p-3 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-text-secondary">Username:</span>
                <code className="bg-white px-2 py-1 rounded text-primary-blue font-medium">admin</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Password:</span>
                <code className="bg-white px-2 py-1 rounded text-primary-blue font-medium">admin123</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            © 2024 Badminton System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
