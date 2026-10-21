import { useState, useEffect, useRef } from 'react';
import { verifyOtp, resendOtp } from '../../services/authApi';
import mbbcLogo from '../../assets/logo MBBC.png';

// Icon components (Không dùng thư viện ngoài)
const MailCheckIcon = () => (
  <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  </div>
);

const SuccessCheckIcon = () => (
  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4 animate-ripple shadow-sm">
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  </div>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const OtpVerificationModal = ({ email, onSuccess, onClose, initialCountdown = 60 }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(initialCountdown);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRefs = useRef([]);

  // Auto focus vào ô đầu tiên khi mở modal
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer cho nút gửi lại mã
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Xử lý thay đổi ký tự trong từng ô
  const handleChange = (index, value) => {
    // Chỉ chấp nhận ký tự số
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const digit = cleanValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Tự động nhảy ô tiếp theo
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Nếu đã điền đủ 6 số, tự động trigger xác minh
    if (newOtp.every((char) => char !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  // Xử lý phím đặc biệt (Backspace, Arrow keys)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Nếu ô hiện tại rỗng, lùi về ô trước và xóa
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Xử lý dán mã (Paste)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text').trim();
    const cleanDigits = pasteText.replace(/\D/g, '').slice(0, 6);

    if (!cleanDigits) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = cleanDigits[i] || '';
    }
    setOtp(newOtp);
    setError('');

    // Focus vào ô tiếp theo hoặc ô cuối
    const focusIndex = Math.min(cleanDigits.length, 5);
    inputRefs.current[focusIndex]?.focus();

    // Nếu đủ 6 số, tự động xác minh
    if (cleanDigits.length === 6) {
      handleVerify(cleanDigits);
    }
  };

  // Xử lý xác minh OTP
  const handleVerify = async (otpCodeString) => {
    const code = otpCodeString || otp.join('');
    if (code.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số mã xác minh');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyOtp(email, code);
      setIsSuccess(true);
      setSuccessMsg(response.message || 'Xác minh email thành công!');

      // Chờ 1.2s để người dùng thấy hiệu ứng thành công trước khi callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response);
        }
      }, 1200);
    } catch (err) {
      const message = err.response?.data?.message || 'Mã xác minh không chính xác hoặc đã hết hạn';
      setError(message);
      triggerShake();
      // Xóa các ô và focus lại ô đầu
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Kích hoạt hiệu ứng lắc (Shake)
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  };

  // Xử lý gửi lại mã OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await resendOtp(email);
      setSuccessMsg(response.message || 'Đã gửi lại mã OTP mới qua email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
      setError(message);
      triggerShake();
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 animate-slide-up transition-transform duration-200 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Nút đóng */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        )}

        {/* Header & Logo MBBC */}
        <div className="text-center">
          {isSuccess ? (
            <SuccessCheckIcon />
          ) : (
            <div className="mb-3">
              <img
                src={mbbcLogo}
                alt="MBBC Logo"
                className="h-12 w-auto mx-auto object-contain"
              />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isSuccess ? 'Xác minh thành công!' : 'Xác minh tài khoản'}
          </h2>

          <p className="mt-2 text-sm text-gray-600 leading-relaxed px-2">
            {isSuccess ? (
              <span className="text-emerald-700 font-medium">
                Tài khoản của bạn đã được kích hoạt thành công. Đang tiếp tục...
              </span>
            ) : (
              <>
                Chúng tôi đã gửi mã xác minh 6 chữ số đến địa chỉ email:
                <br />
                <span className="font-semibold text-gray-900 break-all">{email}</span>
              </>
            )}
          </p>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center font-medium animate-slide-down"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Thông báo gửi lại thành công */}
        {successMsg && !isSuccess && (
          <div
            className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 text-center font-medium animate-slide-down"
            role="status"
          >
            {successMsg}
          </div>
        )}

        {/* Form OTP 6 ô (Lucian Prompt #026 Style) */}
        {!isSuccess && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="mt-6"
          >
            <div className="flex justify-between items-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
              {otp.map((digit, index) => {
                const isFilled = digit !== '';
                const hasError = !!error;

                let borderClass = 'border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10';
                if (hasError) {
                  borderClass = 'border-red-400 bg-red-50/30 text-red-600 focus:border-red-500 focus:ring-red-200';
                } else if (isFilled) {
                  borderClass = 'border-black bg-gray-50/50 text-gray-900';
                }

                return (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading || isSuccess}
                    className={`w-11 h-13 sm:w-13 sm:h-15 text-2xl font-bold text-center border-2 rounded-xl transition-all duration-150 outline-none select-none ${borderClass}`}
                  />
                );
              })}
            </div>

            {/* Nút xác nhận */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6 || isSuccess}
              className="w-full h-11 bg-black text-white font-semibold text-sm rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span>Đang xác minh...</span>
                </>
              ) : (
                'Xác nhận mã OTP'
              )}
            </button>
          </form>
        )}

        {/* Nút gửi lại mã & đếm ngược */}
        {!isSuccess && (
          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500">
              Chưa nhận được mã OTP?{' '}
              {countdown > 0 ? (
                <span className="font-semibold text-gray-400">
                  Gửi lại sau <span className="tabular-nums font-bold text-gray-700">({countdown}s)</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-semibold text-black hover:text-red-600 underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resending ? 'Đang gửi lại...' : 'Gửi lại mã mới'}
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationModal;
