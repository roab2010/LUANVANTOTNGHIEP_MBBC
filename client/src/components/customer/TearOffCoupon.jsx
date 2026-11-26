// Lucian UX/UI Prompt #298 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#298
import { useState, useEffect, useRef } from 'react';

// Format tiền tệ VNĐ
const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const TearOffCoupon = ({
  promotion,
  isLoggedIn = false,
  onSave,
  onUseNow,
  onRequireLogin,
}) => {
  const [isGot, setIsGot] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [noticeOn, setNoticeOn] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('00:00:00');
  const [isExpired, setIsExpired] = useState(false);
  const copyBtnRef = useRef(null);
  const noticeTimerRef = useRef(null);

  // Đếm ngược thời gian hết hạn theo giây
  useEffect(() => {
    if (!promotion?.endAt) return;

    const pad = (n) => (n < 10 ? '0' : '') + n;

    const tick = () => {
      const now = new Date().getTime();
      const end = new Date(promotion.endAt).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeftStr('00:00:00');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const totalSeconds = Math.floor(distance / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (days > 0) {
        setTimeLeftStr(`${days}N ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [promotion?.endAt]);

  // Xử lý bấm xé cuống vé ("LẤY MÃ")
  const handleGetStub = () => {
    if (isExpired || promotion.computedStatus !== 'active') return;

    setIsGot(true);

    // Tự động lưu voucher vào ví nếu đủ điều kiện
    if (isLoggedIn && onSave && !promotion.isSaved && promotion.allowSaving) {
      onSave(promotion._id);
    }

    // Tự động focus nút sao chép sau khi cuống vé xé rời
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      if (copyBtnRef.current) {
        copyBtnRef.current.focus({ preventScroll: true });
      }
    }, prefersReducedMotion ? 0 : 500);
  };

  // Xử lý sao chép mã
  const handleCopy = () => {
    const codeToCopy = promotion.code || 'KHUYENMAI';
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(codeToCopy).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }

    setIsCopied(true);
    setNoticeOn(true);

    clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => {
      setNoticeOn(false);
    }, 2800);
  };

  const isUsable = promotion.computedStatus === 'active' && !isExpired;
  const isVoucher = promotion.type === 'voucher';

  // CSS custom properties cho voucher (Đỏ/Hồng) vs Tự động (Xanh dương)
  const themeVars = isVoucher
    ? {
        '--u298-glow': 'rgba(244, 63, 94, 0.12)',
        '--u298-shadow': 'rgba(225, 29, 72, 0.22)',
        '--u298-grad-main': 'linear-gradient(135deg, #FB7185, #E11D48)',
        '--u298-grad-stub': 'linear-gradient(135deg, #F43F5E, #BE123C)',
        '--u298-accent': '#E11D48',
      }
    : {
        '--u298-glow': 'rgba(59, 130, 246, 0.12)',
        '--u298-shadow': 'rgba(37, 99, 235, 0.22)',
        '--u298-grad-main': 'linear-gradient(135deg, #60A5FA, #2563EB)',
        '--u298-grad-stub': 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        '--u298-accent': '#2563EB',
      };

  const isPercentage = promotion.discountType === 'percentage';

  return (
    <div className={`u298 ${isGot ? 'is-got' : ''}`} style={themeVars}>
      <style>{`
        .u298 {
          position: relative;
          width: 100%;
          max-width: 360px;
          height: 365px;
          border-radius: 28px;
          overflow: hidden;
          background: radial-gradient(90% 70% at 50% 0%, var(--u298-glow), transparent 70%), #ffffff;
          box-shadow: 0 0 0 1px rgba(22,21,27,0.08), 0 24px 48px -24px rgba(40,30,80,0.18);
          color: #16151B;
          font-family: 'Montserrat', sans-serif;
          margin: 0 auto;
          transition: box-shadow 0.3s ease;
        }
        .u298:hover {
          box-shadow: 0 0 0 1px rgba(22,21,27,0.12), 0 28px 56px -24px rgba(40,30,80,0.22);
        }
        .u298-tm {
          position: absolute;
          left: 0;
          right: 0;
          top: 24px;
          text-align: center;
          font-size: 11px;
          font-weight: 750;
          color: #57535F;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .u298-tm b {
          margin-left: 6px;
          padding: 3px 8px;
          border-radius: 7px;
          background: #16151B;
          color: #ffffff;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.04em;
        }
        .u298-tk {
          position: absolute;
          left: 20px;
          right: 20px;
          top: 64px;
          height: 136px;
          display: flex;
          filter: drop-shadow(0 14px 20px var(--u298-shadow));
        }
        .u298-mn {
          position: relative;
          flex: 1;
          padding: 14px 16px;
          border-radius: 18px 0 0 18px;
          background: var(--u298-grad-main);
          color: #ffffff;
          -webkit-mask: radial-gradient(circle 10px at 100% 0, transparent 98%, #000) top/100% 51% no-repeat,
                        radial-gradient(circle 10px at 100% 100%, transparent 98%, #000) bottom/100% 51% no-repeat;
          mask: radial-gradient(circle 10px at 100% 0, transparent 98%, #000) top/100% 51% no-repeat,
                radial-gradient(circle 10px at 100% 100%, transparent 98%, #000) bottom/100% 51% no-repeat;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          transition: border-right 0.2s ease;
        }
        .u298.is-got .u298-mn {
          border-right: 2px dashed rgba(255,255,255,0.75);
        }
        .u298-mn small {
          font-size: 10px;
          font-weight: 800;
          opacity: .95;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .u298-mn b.u298-val {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-top: 2px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .u298-mn b.u298-val em {
          font-style: normal;
          font-size: 14px;
          letter-spacing: 0;
          font-weight: 800;
          opacity: 0.95;
        }
        .u298-mn p.u298-sub {
          margin: 6px 0 0;
          font-size: 11px;
          font-weight: 700;
          opacity: .92;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .u298-cd {
          position: absolute;
          inset: 0;
          padding: 14px 16px;
          border-radius: 18px 0 0 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: inherit;
          opacity: 0;
          transform: scale(.96);
          transition: opacity .3s .25s, transform .4s cubic-bezier(.3,1.5,.5,1) .25s;
          pointer-events: none;
        }
        .u298.is-got .u298-cd {
          opacity: 1;
          transform: none;
          pointer-events: auto;
        }
        .u298-cd small {
          font-size: 10px;
          font-weight: 800;
          opacity: .95;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .u298-cr {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          padding: 5px 6px 5px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,.2);
          box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.55);
        }
        .u298-cr code {
          flex: 1;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: .08em;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .u298-cp {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 30px;
          padding: 0 10px;
          border: 0;
          border-radius: 8px;
          background: #ffffff;
          color: var(--u298-accent);
          font: inherit;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
          letter-spacing: 0.04em;
          white-space: nowrap;
          flex-shrink: 0;
          transition: transform 0.15s ease, background-color 0.2s ease, color 0.2s ease;
        }
        .u298-cp:hover {
          transform: scale(1.02);
        }
        .u298-cp:active {
          transform: scale(0.96);
        }
        .u298-cp.is-copied {
          background: #10B981;
          color: #ffffff;
        }
        .u298-st {
          position: relative;
          flex: none;
          width: 86px;
          border-left: 2px dashed rgba(255,255,255,.75);
          border-radius: 0 18px 18px 0;
          background: var(--u298-grad-stub);
          transform-origin: 0 100%;
          transition: transform .6s cubic-bezier(.5,0,.6,1), opacity .4s .3s;
          -webkit-mask: radial-gradient(circle 10px at 0 0, transparent 98%, #000) top/100% 51% no-repeat,
                        radial-gradient(circle 10px at 0 100%, transparent 98%, #000) bottom/100% 51% no-repeat;
          mask: radial-gradient(circle 10px at 0 0, transparent 98%, #000) top/100% 51% no-repeat,
                radial-gradient(circle 10px at 0 100%, transparent 98%, #000) bottom/100% 51% no-repeat;
        }
        .u298.is-got .u298-st {
          transform: translate(20px, 120px) rotate(30deg);
          opacity: 0;
          pointer-events: none;
        }
        .u298-gt {
          position: absolute;
          inset: 0;
          border: 0;
          background: none;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .u298-gt svg {
          width: 22px;
          height: 22px;
          transition: transform .3s cubic-bezier(.3,1.6,.5,1);
        }
        .u298-gt:hover svg {
          transform: translateY(3px);
        }
        .u298-gt small {
          font-size: 9px;
          font-weight: 700;
          opacity: .85;
          letter-spacing: 0.04em;
        }
        .u298-info {
          position: absolute;
          left: 20px;
          right: 20px;
          top: 214px;
          bottom: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .u298-cond {
          font-size: 11px;
          color: #57535F;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 2.5px;
          overflow: hidden;
        }
        .u298-cond p {
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .u298-cond b {
          color: #16151B;
          font-weight: 700;
        }
        .u298-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px dashed rgba(22,21,27,0.12);
          font-size: 11px;
          flex-shrink: 0;
        }
        .u298-use-btn {
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #DC2626;
          background: none;
          border: 0;
          cursor: pointer;
          margin-left: auto;
          transition: transform 0.15s ease;
        }
        .u298-use-btn:hover {
          transform: translateX(3px);
        }
        .u298-nt {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 14px;
          background: #16151B;
          color: #ffffff;
          font-size: 11px;
          font-weight: 750;
          transform: translateY(90px);
          transition: transform .5s cubic-bezier(.3,1.4,.5,1);
          z-index: 20;
        }
        .u298-nt.is-on {
          transform: none;
        }
        .u298-nt i {
          flex: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #10B981;
          display: grid;
          place-items: center;
        }
        .u298-nt i::after {
          content: "";
          width: 4px;
          height: 7px;
          margin-top: -2px;
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        @media (prefers-reduced-motion: reduce) {
          .u298-st, .u298-cd, .u298-nt {
            transition: opacity .2s;
          }
          .u298.is-got .u298-st {
            transform: none;
          }
        }
      `}</style>

      {/* THANH ĐẾM NGƯỢC THỜI GIAN PHÍA TRÊN */}
      <div className="u298-tm">
        {isUsable ? 'Thời gian còn lại' : 'Trạng thái'}
        <b>
          {isExpired
            ? 'ĐÃ HẾT HẠN'
            : promotion.computedStatus === 'scheduled'
            ? 'SẮP DIỄN RA'
            : timeLeftStr}
        </b>
      </div>

      {/* VÉ GIẢM GIÁ (ĐƯỢC CẤU THÀNH TỪ THÂN TRÁI VÀ CUỐNG PHẢI) */}
      <div className="u298-tk">
        {/* PHẦN MẶT BÊN TRÁI CỦA VÉ */}
        <div className="u298-mn">
          <div>
            <small>
              <span>{isVoucher ? 'Voucher' : 'Tự động'}</span>
              <span>•</span>
              <span>{promotion.scope === 'product' ? 'Theo sản phẩm' : 'Toàn đơn'}</span>
            </small>

            <b className="u298-val" style={{ fontSize: isPercentage ? '38px' : '26px' }}>
              {isPercentage ? (
                <>
                  {promotion.discountValue}%<em>GIẢM</em>
                </>
              ) : (
                <>
                  {formatCurrency(promotion.discountValue)}
                </>
              )}
            </b>

            <p className="u298-sub" title={promotion.name}>
              {promotion.name}
            </p>
          </div>

          <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: 700 }}>
            {promotion.minOrderValue > 0
              ? `Đơn từ ${formatCurrency(promotion.minOrderValue)}`
              : 'Mọi giá trị đơn'}
          </div>

          {/* MẶT BÊN TRÁI ĐƯỢC HÉ LỘ SAU KHI XÉ CUỐNG VÉ */}
          <div className="u298-cd" aria-hidden={!isGot}>
            <small>Mã ưu đãi của bạn</small>
            <div className="u298-cr">
              <code>{promotion.code || 'TỰ ĐỘNG ÁP DỤNG'}</code>
              {promotion.code && (
                <button
                  ref={copyBtnRef}
                  type="button"
                  onClick={handleCopy}
                  tabIndex={isGot ? 0 : -1}
                  className={`u298-cp ${isCopied ? 'is-copied' : ''}`}
                  aria-label="Sao chép mã giảm giá"
                >
                  {isCopied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 6.5l2.3 2.3L9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>ĐÃ CHÉP</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5" />
                        <path d="M2 8V2.8C2 2.4 2.4 2 2.8 2H8" strokeLinecap="round" />
                      </svg>
                      <span>SAO CHÉP</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '10px', opacity: 0.9, fontWeight: 700 }}>
              {isPercentage ? `Giảm ${promotion.discountValue}%` : formatCurrency(promotion.discountValue)}
              {promotion.minOrderValue > 0 ? ` · Đơn từ ${formatCurrency(promotion.minOrderValue)}` : ''}
            </p>
          </div>
        </div>

        {/* PHẦN CUỐNG VÉ BÊN PHẢI (NGHIÊNG VÀ XÉ VĂNG RA KHI BẤM) */}
        <div className="u298-st">
          <button
            type="button"
            disabled={!isUsable}
            onClick={handleGetStub}
            className="u298-gt"
            aria-label="Xé lấy mã ưu đãi"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3v10M5.5 9l4.5 4.5L14.5 9M4 16.5h12" />
            </svg>
            <span>LẤY MÃ</span>
            <small>XÉ TẠI ĐÂY</small>
          </button>
        </div>
      </div>

      {/* CHI TIẾT ĐIỀU KIỆN & NÚT HÀNH ĐỘNG DƯỚI ĐÁY CARD */}
      <div className="u298-info">
        <div className="u298-cond">
          <p title={promotion.name}>
            Chương trình: <b>{promotion.name}</b>
          </p>
          <p>
            • Đơn tối thiểu: <b>{promotion.minOrderValue > 0 ? formatCurrency(promotion.minOrderValue) : 'Không yêu cầu'}</b>
          </p>
          {promotion.discountType === 'percentage' && promotion.maxDiscount ? (
            <p>
              • Giảm tối đa: <b>{formatCurrency(promotion.maxDiscount)}</b>
            </p>
          ) : (
            <p>
              • Phạm vi: <b>{promotion.scope === 'product' ? 'Theo sản phẩm chỉ định' : 'Toàn bộ đơn hàng'}</b>
            </p>
          )}
          {promotion.remainingUses !== null ? (
            <p>
              • Lượt dùng còn: <b style={{ color: '#D97706' }}>{promotion.remainingUses} lượt</b>
            </p>
          ) : (
            <p>
              • Lượt dùng: <b style={{ color: '#059669' }}>Không giới hạn</b>
            </p>
          )}
        </div>

        <div className="u298-actions">
          {promotion.isSaved ? (
            <span style={{ color: '#059669', fontWeight: 800 }}>✓ Đã lưu vào ví</span>
          ) : promotion.allowSaving ? (
            <span style={{ color: '#6B7280', fontWeight: 600 }}>• Có thể lưu mã</span>
          ) : <span />}

          {onUseNow && isUsable && (
            <button
              type="button"
              onClick={() => onUseNow(promotion)}
              className="u298-use-btn"
            >
              Sử dụng ngay &rarr;
            </button>
          )}
        </div>
      </div>

      {/* THÔNG BÁO NỔI LÊN TỪ DƯỚI ĐÁY KHI SAO CHÉP MÃ */}
      <div className={`u298-nt ${noticeOn ? 'is-on' : ''}`} role="status">
        <i aria-hidden="true" />
        <span>Đã lưu vào kho voucher · Áp dụng khi thanh toán</span>
      </div>
    </div>
  );
};

export default TearOffCoupon;
