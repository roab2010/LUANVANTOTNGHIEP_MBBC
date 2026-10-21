// Lucian UX/UI Prompt #016 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#016
import React, { useState, useEffect, useRef, useId } from 'react';

const WORDS = [
  'Chạm vào sao để đánh giá',
  'Rất tệ (1 sao)',
  'Tạm được (2 sao)',
  'Hài lòng (3 sao)',
  'Rất tốt (4 sao)',
  'Tuyệt vời (5 sao)',
];

const COLORS = [
  '#8E8A97',
  '#DC2626', // Đỏ
  '#EA580C', // Cam
  '#D97706', // Vàng hổ phách
  '#059669', // Xanh ngọc
  '#000000', // Đen MBBC
];

const STAR_PATH =
  'M26 4.5l6.4 13.2 14.4 2-10.5 10.1 2.6 14.3L26 37.3l-12.9 6.8 2.6-14.3L5.2 19.7l14.4-2z';

const StarRatingInput = ({
  value = 0,
  onChange,
  question = 'Bạn đánh giá thế nào về sản phẩm?',
  disabled = false,
  className = '',
}) => {
  const [val, setVal] = useState(value);
  const [previewVal, setPreviewVal] = useState(0);
  const [poppingIndex, setPoppingIndex] = useState(-1);
  const wrapRef = useRef(null);
  const idPrefix = useId().replace(/:/g, '');
  const gradId = `u016-g-${idPrefix}`;

  // Kiểm tra prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // Đồng bộ props value
  useEffect(() => {
    setVal(value || 0);
  }, [value]);

  const setRating = (n) => {
    if (disabled) return;
    const clamped = Math.max(1, Math.min(5, n));
    const prev = val;
    setVal(clamped);
    if (onChange) onChange(clamped);

    // Kích hoạt animation pop tuần tự
    if (!reducedMotion) {
      setPoppingIndex(clamped - 1);
      setTimeout(() => {
        setPoppingIndex(-1);
      }, 600);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    const delta = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
    }[e.key];

    if (e.key === 'Home') {
      e.preventDefault();
      setRating(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      setRating(5);
    } else if (delta !== undefined) {
      e.preventDefault();
      setRating(Math.max(1, Math.min(5, val + delta)));
    } else if (/^[1-5]$/.test(e.key)) {
      e.preventDefault();
      setRating(Number(e.key));
    }
  };

  const currentDisplayVal = previewVal || val;
  const currentWord = WORDS[currentDisplayVal] || WORDS[0];
  const currentColor = COLORS[currentDisplayVal] || COLORS[0];

  return (
    <div className={`u016-container ${className}`}>
      <style>{`
        .u016-wrap {
          --ux-spring: cubic-bezier(.34, 1.45, .64, 1);
          --ux-ease: cubic-bezier(.2, .8, .2, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          user-select: none;
        }
        .u016-q {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #404040;
        }
        .u016-stars {
          display: flex;
          gap: 6px;
          border-radius: 12px;
          padding: 4px;
        }
        .u016-stars:focus-visible {
          outline: 2px solid #000;
          outline-offset: 4px;
        }
        .u016-s {
          position: relative;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0;
          background: none;
          cursor: pointer;
          transition: transform .35s var(--ux-spring);
        }
        @media (min-width: 640px) {
          .u016-s {
            width: 48px;
            height: 48px;
          }
        }
        .u016-s svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .u016-s .bg {
          fill: #F5F5F5;
          stroke: #D4D4D4;
          stroke-width: 1.2;
        }
        .u016-s .fg {
          transform-origin: 50% 55%;
          transform: scale(0);
          transition: transform .35s var(--ux-spring), opacity .2s ease;
        }
        .u016-s.is-pre .fg {
          transform: scale(.72);
          opacity: .6;
        }
        .u016-s.is-on .fg {
          transform: scale(1);
          opacity: 1;
        }
        .u016-s:hover:not(:disabled) {
          transform: scale(1.15) rotate(-4deg);
        }
        .u016-s.is-pop {
          animation: u016-pop .55s var(--ux-spring);
        }
        @keyframes u016-pop {
          0% { transform: scale(1); }
          35% { transform: scale(1.3) rotate(8deg); }
          100% { transform: scale(1); }
        }
        .u016-s i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 5px;
          height: 5px;
          margin: -2.5px;
          border-radius: 50%;
          background: #F59E0B;
          opacity: 0;
          pointer-events: none;
        }
        .u016-s.is-pop i {
          animation: u016-spark .6s var(--ux-ease) forwards;
        }
        @keyframes u016-spark {
          0% { opacity: 1; transform: rotate(var(--a)) translateY(-10px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--a)) translateY(-32px) scale(.2); }
        }
        .u016-out {
          display: flex;
          align-items: baseline;
          gap: 8px;
          height: 32px;
        }
        .u016-score {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.04em;
          font-variant-numeric: tabular-nums;
          transition: color .3s ease;
        }
        .u016-word {
          font-size: 13px;
          font-weight: 700;
          transition: color .3s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .u016-s, .u016-s .fg, .u016-s.is-pop, .u016-s.is-pop i {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="u016-wrap">
        {question && <p className="u016-q">{question}</p>}

        <div
          ref={wrapRef}
          className="u016-stars"
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label="Đánh giá sao"
          aria-valuemin="1"
          aria-valuemax="5"
          aria-valuenow={val}
          aria-valuetext={val ? `${val} sao, ${currentWord}` : 'Chưa đánh giá'}
          onKeyDown={handleKeyDown}
          onPointerLeave={() => setPreviewVal(0)}
        >
          {/* Định nghĩa màu vàng hổ phách đặc trưng cho ngôi sao (Solid Gold sang trọng) */}
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>

          {[1, 2, 3, 4, 5].map((starNum) => {
            const isPre = previewVal >= starNum && val < starNum;
            const isOn = (previewVal ? previewVal : val) >= starNum;
            const isPopping = poppingIndex >= starNum - 1 && poppingIndex >= 0;

            return (
              <button
                key={starNum}
                type="button"
                disabled={disabled}
                className={`u016-s ${isPre ? 'is-pre' : ''} ${isOn ? 'is-on' : ''} ${
                  isPopping ? 'is-pop' : ''
                }`}
                onPointerEnter={() => setPreviewVal(starNum)}
                onClick={() => setRating(starNum)}
                aria-label={`${starNum} sao`}
              >
                <svg viewBox="0 0 52 52">
                  <path className="bg" d={STAR_PATH} strokeLinejoin="round" />
                  <path className="fg" d={STAR_PATH} style={{ fill: `url(#${gradId})` }} />
                </svg>
                {/* 5 tia sáng bắn ra theo góc 72 độ */}
                <i style={{ '--a': '0deg' }} />
                <i style={{ '--a': '72deg' }} />
                <i style={{ '--a': '144deg' }} />
                <i style={{ '--a': '216deg' }} />
                <i style={{ '--a': '288deg' }} />
              </button>
            );
          })}
        </div>

        <div className="u016-out" aria-hidden="true">
          <span className="u016-score" style={{ color: currentColor }}>
            {currentDisplayVal > 0 ? currentDisplayVal.toFixed(1) : '0.0'}
          </span>
          <span className="u016-word" style={{ color: currentColor }}>
            {currentWord}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StarRatingInput;
