import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OtpVerificationModal from '../../components/auth/OtpVerificationModal';
import mbbcLogo from '../../assets/logo MBBC.png';
import sharkBg from '../../assets/camapne.jpg';

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

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // Đọc thông báo hoặc email từ trang đăng ký chuyển sang
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessNotice(location.state.successMessage);
    }
    if (location.state?.prefillEmail) {
      setEmail(location.state.prefillEmail);
    }
  }, [location.state]);

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessNotice('');

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
      // Trường hợp tài khoản chưa xác minh email (403 với requireOtp = true)
      if (err.response?.data?.requireOtp) {
        setUnverifiedEmail(err.response.data.email || email);
        setShowOtpModal(true);
        return;
      }

      const message = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi xác minh OTP thành công
  const handleOtpSuccess = async () => {
    setShowOtpModal(false);
    setSuccessNotice('Xác minh email thành công! Đang tiến hành đăng nhập...');

    // Tự động đăng nhập lại nếu đã có sẵn password
    if (password) {
      try {
        setLoading(true);
        const response = await login(email, password);
        const userRole = response.data.user.role;
        if (userRole === 'admin') {
          navigate('/admin');
        } else {
          navigate('/customer');
        }
      } catch (loginErr) {
        setSuccessNotice('Xác minh email thành công! Vui lòng nhấn Đăng nhập lại.');
      } finally {
        setLoading(false);
      }
    } else {
      setSuccessNotice('Xác minh email thành công! Mời bạn nhập mật khẩu để đăng nhập.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* --- Left Panel: Branding --- */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 bg-black border-r border-neutral-900 relative overflow-hidden">
        {/* Subtle decorative glow for dark theme */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-neutral-900/40 rounded-full blur-3xl" />
          <div className="absolute bottom-12 -right-16 w-80 h-80 bg-red-950/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src={mbbcLogo}
                alt="M.B.B.C Logo"
                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-brand text-2xl uppercase tracking-wider text-white">
                M.B.B.C
              </span>
            </Link>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <h2 className="font-brand text-5xl xl:text-6xl font-black tracking-tight text-[#dc2626] leading-none select-none">
              M.B.B.C
            </h2>
            <p className="text-white text-base xl:text-lg font-medium tracking-wide">
              "-Made By Bao Cuong-"
            </p>
          </div>

          {/* Footer */}
          <p className="text-neutral-500 text-xs tracking-wider">
            © 2026 M.B.B.C. Đồ án tốt nghiệp CNTT.
          </p>
        </div>
      </div>

      {/* --- Right Panel: Form with Shark Background --- */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden bg-[#0e5dbb]">
        {/* Background Image: camapne.jpg shifted to the left to show the shark */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={sharkBg}
            alt="Shark Background"
            className="w-full h-full object-cover object-[65%_center] scale-115 -translate-x-[8%] lg:-translate-x-[12%]"
          />
          {/* Subtle Dark Overlay for contrast and depth */}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Login Card (Glassmorphic Card) */}
        <div className="relative z-10 w-full max-w-[420px] bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/60 animate-slide-up">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2.5 mb-8">
            <img src={mbbcLogo} alt="M.B.B.C Logo" className="h-9 w-auto object-contain" />
            <span className="font-brand text-xl text-black tracking-wider">M.B.B.C</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Đăng nhập</h1>
            <p className="text-gray-500 mt-1.5 text-[0.9375rem]">Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          {/* Success Notice */}
          {successNotice && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-sm)] animate-slide-down" role="status">
              <CheckIcon />
              <p className="text-sm text-emerald-800 font-medium leading-relaxed">{successNotice}</p>
            </div>
          )}

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
                placeholder="you@gmail.com"
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
              className="w-full h-11 bg-black text-white font-semibold text-[0.9375rem] rounded-[var(--radius-sm)] hover:bg-neutral-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
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
            <Link to="/register" className="text-black font-semibold hover:text-[#dc2626] hover:underline transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Modal xác minh OTP */}
      {showOtpModal && (
        <OtpVerificationModal
          email={unverifiedEmail || email}
          onSuccess={handleOtpSuccess}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default LoginPage;
