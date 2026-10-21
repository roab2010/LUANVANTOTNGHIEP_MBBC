import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OtpVerificationModal from '../../components/auth/OtpVerificationModal';
import RegisterValidationForm from '../../components/auth/RegisterValidationForm';
import mbbcLogo from '../../assets/logo MBBC.png';
import sharkBg from '../../assets/camapne.jpg';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Xử lý submit form đã qua kiểm tra hợp lệ
  const handleRegisterSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      const res = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });

      // Nếu yêu cầu xác thực OTP
      if (res?.data?.requireOtp) {
        setRegisteredEmail(values.email.trim());
        setShowOtpModal(true);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi xác minh OTP thành công
  const handleOtpSuccess = () => {
    setShowOtpModal(false);
    navigate('/login', {
      state: {
        successMessage: 'Xác minh email thành công! Bạn có thể đăng nhập ngay bây giờ.',
        prefillEmail: registeredEmail,
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* --- Left Panel: Branding --- */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] shrink-0 bg-black border-r border-neutral-900 relative overflow-hidden">
        {/* Subtle decorative glow */}
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
            <p className="text-gray-500 mt-1.5 text-[0.9375rem]">Đăng ký để bắt đầu mua sắm tại M.B.B.C</p>
          </div>

          {/* Form validation that takes you to errors (Lucian UX #244) */}
          <RegisterValidationForm
            onSubmit={handleRegisterSubmit}
            loading={loading}
            serverError={error}
            success={success}
          />

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-black font-semibold hover:text-[#dc2626] hover:underline transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      {/* Modal xác minh OTP */}
      {showOtpModal && (
        <OtpVerificationModal
          email={registeredEmail}
          onSuccess={handleOtpSuccess}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};

export default RegisterPage;
