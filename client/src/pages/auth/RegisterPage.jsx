import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  <svg className="w-4 h-4 text-success-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // State form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Validate form phía frontend
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không đúng định dạng');
      return false;
    }

    const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'edu.vn'];
    const emailDomain = formData.email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      setError('Chỉ hỗ trợ đăng ký với các email: ' + allowedDomains.map(d => '@' + d).join(', '));
      return false;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại';
      setError(message);
    } finally {
      setLoading(false);
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

        {/* Register Card (Glassmorphic Card) */}
        <div className="relative z-10 w-full max-w-[420px] bg-white/90 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.3)] border border-white/60 animate-slide-up">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2.5 mb-8">
            <img src={mbbcLogo} alt="M.B.B.C Logo" className="h-9 w-auto object-contain" />
            <span className="font-brand text-xl text-black tracking-wider">M.B.B.C</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tạo tài khoản</h1>
            <p className="text-gray-500 mt-1.5 text-[0.9375rem]">Đăng ký để bắt đầu sử dụng hệ thống</p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-success-50 border border-green-200 rounded-[var(--radius-sm)] animate-slide-down" role="status">
              <CheckIcon />
              <p className="text-sm text-success-700 font-medium">
                Đăng ký thành công! Đang chuyển đến trang đăng nhập...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-danger-50 border border-red-200 rounded-[var(--radius-sm)] animate-slide-down" role="alert">
              <AlertIcon />
              <p className="text-sm text-danger-700 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 stagger-children">
            {/* Họ và tên */}
            <div>
              <label htmlFor="reg-fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Họ và tên <span className="text-danger-500">*</span>
              </label>
              <input
                id="reg-fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-[var(--radius-sm)] text-gray-900 text-[0.9375rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-danger-500">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-[var(--radius-sm)] text-gray-900 text-[0.9375rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Số điện thoại <span className="text-gray-400 text-xs font-normal">(không bắt buộc)</span>
              </label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901 234 567"
                autoComplete="tel"
                className="w-full h-11 px-3.5 bg-white border border-gray-300 rounded-[var(--radius-sm)] text-gray-900 text-[0.9375rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
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

            {/* Xác nhận mật khẩu */}
            <div>
              <label htmlFor="reg-confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Xác nhận mật khẩu <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className="w-full h-11 px-3.5 pr-11 bg-white border border-gray-300 rounded-[var(--radius-sm)] text-gray-900 text-[0.9375rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full h-11 bg-black text-white font-semibold text-[0.9375rem] rounded-[var(--radius-sm)] hover:bg-neutral-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <SpinnerIcon />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </div>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-black font-semibold hover:text-[#dc2626] hover:underline transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
