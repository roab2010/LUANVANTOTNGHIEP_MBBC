import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Icon components
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      const userRole = response.data.user.role;

      // Điều hướng theo role
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* --- Left Panel: Branding --- */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 bg-primary-700 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-600 rounded-full opacity-40" />
          <div className="absolute bottom-10 -right-16 w-64 h-64 bg-primary-800 rounded-full opacity-30" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary-500 rounded-full opacity-20" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/15 rounded-[var(--radius-sm)] flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">SellStock</span>
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-6">
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight">
              Quản lý bán hàng{' '}
              <br />
              và kho hàng{' '}
              <br />
              <span className="text-primary-200">hiệu quả.</span>
            </h2>
            <p className="text-primary-200 text-base leading-relaxed max-w-sm">
              Theo dõi tồn kho, quản lý đơn hàng và phân tích doanh thu — tất cả trên một nền tảng duy nhất.
            </p>
          </div>

          {/* Footer */}
          <p className="text-primary-300 text-sm">
            © 2026 SellStock. Đồ án tốt nghiệp CNTT.
          </p>
        </div>
      </div>

      {/* --- Right Panel: Form --- */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-primary-600 rounded-[var(--radius-sm)] flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">SellStock</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Đăng nhập</h1>
            <p className="text-gray-500 mt-1.5 text-[0.9375rem]">Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-danger-50 border border-red-200 rounded-[var(--radius-sm)] animate-slide-down" role="alert">
              <AlertIcon />
              <div className="text-sm text-danger-700 font-medium leading-relaxed">
                {error.includes('admin@quanlybanhang.com') ? (
                  <span>
                    Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên qua email:{' '}
                    <a
                      href="mailto:admin@quanlybanhang.com"
                      className="font-bold underline hover:text-danger-900 transition-colors"
                    >
                      admin@quanlybanhang.com
                    </a>
                  </span>
                ) : (
                  error
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-[var(--radius-sm)] text-gray-900 text-[0.9375rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full h-11 px-3.5 pr-11 bg-white border border-gray-300 rounded-[var(--radius-sm)] text-gray-900 text-[0.9375rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary-600 text-white font-semibold text-[0.9375rem] rounded-[var(--radius-sm)] hover:bg-primary-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
