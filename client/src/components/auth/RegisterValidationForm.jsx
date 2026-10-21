/* Lucian UX/UI Prompt #244 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#244 */
import { useState, useRef, useEffect } from 'react';

// Eye icons for password toggle
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/**
 * Component Form validation that takes you to errors (Lucian UX #244)
 */
const RegisterValidationForm = ({
  onSubmit,
  loading = false,
  serverError = '',
  success = false,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tried, setTried] = useState(false);
  const [shakeFields, setShakeFields] = useState({});

  // Refs for smooth navigation and focus
  const fieldRefs = {
    fullName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    terms: useRef(null),
  };

  const inputRefs = {
    fullName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    password: useRef(null),
    confirmPassword: useRef(null),
    terms: useRef(null),
  };

  // Rule definitions
  const ALLOWED_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'edu.vn'];

  const validateField = (key, data, agreed) => {
    switch (key) {
      case 'fullName':
        return data.fullName.trim().length > 0;
      case 'email': {
        const val = data.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return false;
        const domain = val.split('@')[1]?.toLowerCase();
        return ALLOWED_DOMAINS.includes(domain);
      }
      case 'phone': {
        const val = data.phone.trim();
        if (val === '') return true; // optional
        return /^[0-9]{9,11}$/.test(val.replace(/\s+/g, ''));
      }
      case 'password':
        return data.password.length >= 6;
      case 'confirmPassword':
        return data.confirmPassword.length > 0 && data.confirmPassword === data.password;
      case 'terms':
        return agreed === true;
      default:
        return true;
    }
  };

  const FIELD_CONFIG = [
    {
      key: 'fullName',
      label: 'Họ và tên',
      required: true,
      type: 'text',
      placeholder: 'Nguyễn Văn A',
      hint: 'Vui lòng nhập họ và tên của bạn',
      autoComplete: 'name',
    },
    {
      key: 'email',
      label: 'Email',
      required: true,
      type: 'email',
      placeholder: 'you@example.com',
      hint: 'Email không hợp lệ hoặc chưa thuộc tên miền hỗ trợ (@gmail.com, @outlook.com, ...)',
      autoComplete: 'email',
    },
    {
      key: 'phone',
      label: 'Số điện thoại (tùy chọn)',
      required: false,
      type: 'tel',
      placeholder: '0901 234 567',
      hint: 'Số điện thoại phải từ 9 đến 11 chữ số',
      autoComplete: 'tel',
    },
    {
      key: 'password',
      label: 'Mật khẩu',
      required: true,
      type: 'password',
      placeholder: 'Tối thiểu 6 ký tự',
      hint: 'Mật khẩu phải có ít nhất 6 ký tự',
      autoComplete: 'new-password',
      isPassword: true,
    },
    {
      key: 'confirmPassword',
      label: 'Xác nhận mật khẩu',
      required: true,
      type: 'password',
      placeholder: 'Nhập lại mật khẩu',
      hint: 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập',
      autoComplete: 'new-password',
      isPassword: true,
    },
  ];

  // Tính danh sách các trường bị lỗi
  const getBadFields = (currentData = formData, currentAgreed = agreedToTerms) => {
    const bad = [];
    FIELD_CONFIG.forEach((f) => {
      if (!validateField(f.key, currentData, currentAgreed)) {
        bad.push(f.key);
      }
    });
    if (!validateField('terms', currentData, currentAgreed)) {
      bad.push('terms');
    }
    return bad;
  };

  const badFields = getBadFields(formData, agreedToTerms);

  // Smooth scroll and focus to element
  const goTo = (key, onComplete) => {
    const el = fieldRefs[key]?.current;
    const inp = inputRefs[key]?.current;
    if (!el) return;

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      behavior: isReduced ? 'auto' : 'smooth',
      block: 'center',
    });

    if (inp) {
      setTimeout(
        () => {
          try {
            inp.focus({ preventScroll: true });
          } catch {
            // Ignored
          }
          if (onComplete) onComplete();
        },
        isReduced ? 0 : 380
      );
    } else if (onComplete) {
      onComplete();
    }
  };

  // Trigger shake animation on fields
  const triggerShake = (keys) => {
    const next = {};
    keys.forEach((k) => {
      next[k] = true;
    });
    setShakeFields(next);
    setTimeout(() => {
      setShakeFields({});
    }, 450);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTermsClick = () => {
    setAgreedToTerms((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || success) return;

    setTried(true);
    const bad = getBadFields(formData, agreedToTerms);

    if (bad.length > 0) {
      triggerShake(bad);
      const firstBad = bad[0];
      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(
        () => {
          goTo(firstBad);
        },
        isReduced ? 0 : 180
      );
      return;
    }

    // Tất cả hợp lệ -> Gọi callback gửi dữ liệu
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className={`u244-root ${tried && badFields.length > 0 ? 'is-err' : ''}`}>
      <style>{`
        /* Lucian UX/UI Prompt #244 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#244 */
        .u244-root {
          --ux-surface: #ffffff;
          --ux-ink: #111827;
          --ux-ink-2: #374151;
          --ux-ink-3: #9ca3af;
          --ux-line: #e5e7eb;
          --ux-accent: #000000;
          --ux-mint: #10b981;
          --ux-danger: #e11d48;
          --ux-danger-text: #be123c;
          --ux-danger-bg: #fff1f2;
          --ux-danger-border: #fecdd3;
          font-family: inherit;
          color: #111827;
        }

        .u244-sm {
          display: grid;
          grid-template-rows: 0fr;
          margin-top: 0;
          transition: grid-template-rows 0.4s cubic-bezier(0.3, 1, 0.4, 1), margin 0.4s;
        }
        .u244-sm > div {
          min-height: 0;
          overflow: hidden;
        }
        .u244-root.is-err .u244-sm {
          grid-template-rows: 1fr;
          margin-top: 14px;
          margin-bottom: 6px;
        }
        .u244-sb {
          padding: 12px 14px;
          border-radius: 12px;
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }
        .u244-sb b {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 800;
          color: #be123c;
        }
        .u244-sb b i {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #e11d48;
          color: #ffffff;
          font-style: normal;
          font-size: 11px;
          font-weight: 900;
          display: grid;
          place-items: center;
          line-height: 1;
        }
        .u244-sb ul {
          margin: 8px 0 0;
          padding: 0 0 0 24px;
          font-size: 12px;
          font-weight: 600;
          list-style-type: disc;
        }
        .u244-sb li {
          margin-top: 4px;
          transition: opacity 0.25s;
        }
        .u244-sb li.is-fixed {
          opacity: 0.35;
          text-decoration: line-through;
        }
        .u244-sb a {
          color: #be123c;
          text-underline-offset: 2px;
          cursor: pointer;
          text-decoration: underline;
        }
        .u244-sb a:hover {
          color: #9f1239;
        }

        .u244-fd {
          margin-top: 15px;
        }
        .u244-fd label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .u244-bx {
          position: relative;
        }
        .u244-in {
          width: 100%;
          height: 44px;
          padding: 0 42px 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font: inherit;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .u244-in:focus {
          border-color: #000000;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        .u244-fd.is-bad .u244-in {
          border-color: #e11d48 !important;
          box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.2) !important;
        }
        .u244-fd.is-good .u244-in {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.25) !important;
        }

        .u244-fd.is-shake .u244-bx,
        .u244-ag.is-shake {
          animation: u244-sh 0.4s ease-in-out;
        }
        @keyframes u244-sh {
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        .u244-ok {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          transform: scale(0);
          transition: transform 0.35s cubic-bezier(0.3, 1.7, 0.5, 1);
          pointer-events: none;
          z-index: 2;
        }
        .u244-ok::after {
          content: "";
          position: absolute;
          left: 7px;
          top: 4px;
          width: 4px;
          height: 8px;
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .u244-fd.is-good .u244-ok {
          transform: scale(1);
        }

        .u244-fd.is-pwd .u244-ok {
          right: 40px;
        }
        .u244-pwd-btn {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          background: none;
          border: 0;
          padding: 4px;
          cursor: pointer;
          display: grid;
          place-items: center;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .u244-pwd-btn:hover {
          color: #111827;
        }

        .u244-ms {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s cubic-bezier(0.3, 1, 0.4, 1);
        }
        .u244-ms > div {
          min-height: 0;
          overflow: hidden;
          font-size: 11.5px;
          font-weight: 600;
          color: #be123c;
        }
        .u244-ms > div > span {
          display: block;
          padding-top: 5px;
          line-height: 1.4;
        }
        .u244-fd.is-bad .u244-ms {
          grid-template-rows: 1fr;
        }

        .u244-ag {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 18px;
          padding: 0;
          border: 0;
          background: none;
          color: #374151;
          font: inherit;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          line-height: 1.4;
        }
        .u244-ag i {
          flex: none;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          display: grid;
          place-items: center;
          transition: background 0.2s, border-color 0.2s;
          margin-top: 1px;
        }
        .u244-ag[aria-checked="true"] i {
          background: #000000;
          border-color: #000000;
        }
        .u244-ag[aria-checked="true"] i::after {
          content: "";
          width: 4px;
          height: 8px;
          margin-top: -2px;
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .u244-ag.is-bad i {
          border-color: #e11d48;
          box-shadow: 0 0 0 2px rgba(225, 29, 72, 0.2);
        }

        .u244-go {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 46px;
          margin-top: 22px;
          border: 0;
          border-radius: 8px;
          background: #000000;
          color: #ffffff;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, opacity 0.2s;
        }
        .u244-go:hover:not(:disabled) {
          background: #1f2937;
        }
        .u244-go:active:not(:disabled) {
          transform: scale(0.98);
        }
        .u244-go:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .u244-go.is-done {
          background: #059669 !important;
          color: #ffffff !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .u244-sm, .u244-ms, .u244-ok {
            transition: none !important;
          }
          .u244-fd.is-shake .u244-bx, .u244-ag.is-shake {
            animation: none !important;
          }
        }
      `}</style>

      {/* Summary Error Drop-in Banner */}
      <div className="u244-sm" role="alert" aria-live="polite">
        <div>
          <div className="u244-sb">
            <b>
              <i>!</i>
              <span>{badFields.length} mục cần hoàn thiện trước khi đăng ký</span>
            </b>
            <ul>
              {FIELD_CONFIG.map((f) => {
                const isBad = badFields.includes(f.key);
                const hasValue = formData[f.key]?.length > 0;
                const isFixed = tried && !isBad && hasValue;
                if (!tried && !isBad) return null;
                return (
                  <li key={f.key} className={isFixed ? 'is-fixed' : ''}>
                    <a
                      href={`#${f.key}`}
                      onClick={(e) => {
                        e.preventDefault();
                        goTo(f.key);
                      }}
                    >
                      {f.label}
                    </a>
                  </li>
                );
              })}
              {tried && (
                <li className={agreedToTerms ? 'is-fixed' : ''}>
                  <a
                    href="#terms"
                    onClick={(e) => {
                      e.preventDefault();
                      goTo('terms');
                    }}
                  >
                    Điều khoản dịch vụ & chính sách
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Server Error Alert (nếu có trả về từ backend) */}
      {serverError && (
        <div className="mt-3.5 p-3.5 bg-danger-50 border border-red-200 rounded-[var(--radius-sm)] flex items-start gap-2.5 text-xs font-semibold text-danger-700 animate-slide-down" role="alert">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} noValidate aria-label="Sign-up form">
        {FIELD_CONFIG.map((f) => {
          const isBad = tried && badFields.includes(f.key);
          const hasValue = (formData[f.key] || '').length > 0;
          const isGood = tried ? !isBad && hasValue : hasValue && validateField(f.key, formData, agreedToTerms);
          const isShake = !!shakeFields[f.key];
          const isPwd = f.isPassword;
          const showPwd = f.key === 'password' ? showPassword : showConfirmPassword;
          const setShowPwd = f.key === 'password' ? setShowPassword : setShowConfirmPassword;

          return (
            <div
              key={f.key}
              ref={fieldRefs[f.key]}
              className={`u244-fd ${isBad ? 'is-bad' : ''} ${isGood ? 'is-good' : ''} ${isShake ? 'is-shake' : ''} ${isPwd ? 'is-pwd' : ''}`}
            >
              <label htmlFor={`u244-${f.key}`}>
                {f.label} {f.required && <span className="text-rose-500">*</span>}
              </label>

              <div className="u244-bx">
                <input
                  id={`u244-${f.key}`}
                  ref={inputRefs[f.key]}
                  name={f.key}
                  type={isPwd ? (showPwd ? 'text' : 'password') : f.type}
                  value={formData[f.key]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  aria-invalid={isBad}
                  aria-describedby={`u244-hint-${f.key}`}
                  className="u244-in"
                />

                {/* Checkmark icon for valid state */}
                <span className="u244-ok" aria-hidden="true" />

                {/* Password show/hide toggle */}
                {isPwd && (
                  <button
                    type="button"
                    onClick={() => setShowPwd((prev) => !prev)}
                    className="u244-pwd-btn"
                    tabIndex={-1}
                    aria-label={showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPwd ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                )}
              </div>

              {/* Unfolding hint */}
              <div className="u244-ms" id={`u244-hint-${f.key}`}>
                <div>
                  <span>{f.hint}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Terms agreement checkbox */}
        <button
          type="button"
          ref={fieldRefs.terms}
          onClick={handleTermsClick}
          className={`u244-ag ${tried && badFields.includes('terms') ? 'is-bad' : ''} ${shakeFields.terms ? 'is-shake' : ''}`}
          role="checkbox"
          aria-checked={agreedToTerms}
        >
          <i aria-hidden="true" />
          <span>Tôi đồng ý với các điều khoản dịch vụ và chính sách bảo mật của M.B.B.C</span>
        </button>

        {/* Unfolding terms hint if wrong */}
        <div className="u244-ms" style={{ gridTemplateRows: tried && !agreedToTerms ? '1fr' : '0fr' }}>
          <div>
            <span style={{ paddingLeft: '30px' }}>
              Vui lòng xác nhận đồng ý với điều khoản để tiếp tục đăng ký.
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || success}
          className={`u244-go ${success ? 'is-done' : ''}`}
        >
          {loading ? (
            <>
              <SpinnerIcon />
              <span>Đang xử lý đăng ký...</span>
            </>
          ) : success ? (
            'Đăng ký thành công! Đang chuyển hướng...'
          ) : (
            'Đăng ký tài khoản'
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterValidationForm;
