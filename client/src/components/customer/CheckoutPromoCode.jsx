// Lucian UX/UI Prompt #230 · Order summary that recalculates with a promo code (Commerce & Pricing)
import { useState, useEffect, useRef, useMemo } from 'react';
import { validatePromotion, getPublicPromotions, getMySavedPromotions } from '../../services/promotionApi';
import { normalizePromoCode } from '../../utils/promoCodeHelper';

const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const CheckoutPromoCode = ({
  cart = [],
  subtotal = 0,
  shippingFee = 0,
  onPromoChange,
  isLoggedIn = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isBad, setIsBad] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCodePill, setAppliedCodePill] = useState('');
  const [displayTotal, setDisplayTotal] = useState(subtotal + (shippingFee || 0));

  // Danh sách "Ưu đãi dành cho bạn" (Gợi ý mã có sẵn / đã lưu)
  const [availablePromos, setAvailablePromos] = useState([]);
  const [showPromoList, setShowPromoList] = useState(false);

  const inputRef = useRef(null);
  const rafRef = useRef(null);

  // Tự động kiểm tra session storage nếu khách bấm "Sử dụng ngay" từ trang voucher
  useEffect(() => {
    const prefillCode = sessionStorage.getItem('mbbc_applied_promo_code');
    if (prefillCode) {
      sessionStorage.removeItem('mbbc_applied_promo_code');
      setCode(prefillCode);
      setIsOpen(true);
      setTimeout(() => {
        handleApply(prefillCode);
      }, 300);
    }
  }, []);

  // Tải danh sách các voucher phù hợp cho giỏ hàng
  // QUY TẮC: Chỉ hiển thị (1) Khuyến mãi Tự động và (2) Voucher khách ĐÃ LƯU trong kho cá nhân
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const [publicRes, savedRes] = await Promise.all([
          getPublicPromotions({ limit: 20 }),
          isLoggedIn ? getMySavedPromotions() : Promise.resolve({ data: { success: false } }),
        ]);

        const pool = [];
        const seenIds = new Set();

        // 1. Voucher khách ĐÃ LƯU trong kho cá nhân
        if (savedRes.data?.success && Array.isArray(savedRes.data.data?.usable)) {
          savedRes.data.data.usable.forEach((p) => {
            if (!seenIds.has(p._id)) {
              seenIds.add(p._id);
              pool.push({ ...p, source: 'saved' });
            }
          });
        }

        // 2. Khuyến mãi TỰ ĐỘNG đang hoạt động (không lấy voucher nhập mã chưa lưu)
        if (publicRes.data?.success && Array.isArray(publicRes.data.data?.promotions)) {
          publicRes.data.data.promotions.forEach((p) => {
            if (!seenIds.has(p._id) && p.computedStatus === 'active' && p.type === 'automatic') {
              seenIds.add(p._id);
              pool.push({ ...p, source: 'automatic' });
            }
          });
        }

        setAvailablePromos(pool);
      } catch (err) {
        console.error('Lỗi tải ưu đãi gợi ý:', err);
      }
    };

    fetchPromos();
  }, [isLoggedIn]);

  // Đánh giá điều kiện áp dụng cho từng voucher đối với giỏ hàng hiện tại
  const evaluatedPromos = useMemo(() => {
    return availablePromos
      .map((promo) => {
        // 1. Trạng thái chương trình
        if (promo.computedStatus && promo.computedStatus !== 'active') {
          return {
            ...promo,
            isEligible: false,
            reason: 'Chương trình chưa diễn ra hoặc đã kết thúc',
          };
        }

        // 2. Phạm vi sản phẩm / danh mục
        let eligibleSubtotal = subtotal;
        if (promo.scope === 'product') {
          const eligibleItems = cart.filter((item) => {
            const prod = item.product || {};
            const pId = (prod._id || prod.id || '').toString();
            const pCat = (prod.category || '').toLowerCase().trim();

            const matchCat =
              Array.isArray(promo.applicableCategories) &&
              promo.applicableCategories.some((c) => c.toLowerCase().trim() === pCat);

            const matchProd =
              Array.isArray(promo.applicableProducts) &&
              promo.applicableProducts.some((ap) => (ap._id || ap).toString() === pId);

            if (promo.applicableCategories?.length > 0 && promo.applicableProducts?.length > 0) {
              return matchCat || matchProd;
            }
            if (promo.applicableCategories?.length > 0) return matchCat;
            if (promo.applicableProducts?.length > 0) return matchProd;
            return true;
          });

          if (eligibleItems.length === 0) {
            const catList = promo.applicableCategories?.join(', ');
            return {
              ...promo,
              isEligible: false,
              reason: catList ? `Chỉ áp dụng danh mục: ${catList}` : 'Chỉ áp dụng cho sản phẩm chỉ định',
            };
          }

          eligibleSubtotal = eligibleItems.reduce(
            (acc, it) => acc + (it.product?.price || 0) * it.quantity,
            0
          );
        }

        // 3. Đơn hàng tối thiểu
        if (promo.minOrderValue > 0) {
          const compareTotal = promo.scope === 'product' ? eligibleSubtotal : subtotal;
          if (compareTotal < promo.minOrderValue) {
            const diff = promo.minOrderValue - compareTotal;
            return {
              ...promo,
              isEligible: false,
              reason: `Đơn tối thiểu ${formatPrice(promo.minOrderValue)} (còn thiếu ${formatPrice(diff)})`,
            };
          }
        }

        // 4. Lượt sử dụng còn lại
        if (promo.remainingUses !== null && promo.remainingUses !== undefined && promo.remainingUses <= 0) {
          return {
            ...promo,
            isEligible: false,
            reason: 'Mã đã hết lượt sử dụng',
          };
        }

        // Tính ước tính mức giảm
        let estDiscount = 0;
        if (promo.discountType === 'percentage') {
          estDiscount = Math.round((eligibleSubtotal * promo.discountValue) / 100);
          if (promo.maxDiscount && estDiscount > promo.maxDiscount) {
            estDiscount = promo.maxDiscount;
          }
        } else {
          estDiscount = Math.min(promo.discountValue, eligibleSubtotal);
        }

        return {
          ...promo,
          isEligible: true,
          reason: 'Đủ điều kiện áp dụng',
          estimatedDiscount: estDiscount,
        };
      })
      .sort((a, b) => {
        // Đủ điều kiện lên trên đầu
        if (a.isEligible && !b.isEligible) return -1;
        if (!a.isEligible && b.isEligible) return 1;
        return (b.estimatedDiscount || 0) - (a.estimatedDiscount || 0);
      });
  }, [availablePromos, cart, subtotal]);

  // Hiệu ứng tween đếm số tiền khi giá thay đổi (Prompt 230 motion)
  const animateTotalChange = (fromVal, toVal) => {
    cancelAnimationFrame(rafRef.current);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayTotal(toVal);
      return;
    }

    const startTime = performance.now();
    const duration = 650; // ms

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromVal + (toVal - fromVal) * ease);
      setDisplayTotal(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayTotal(toVal);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  // Tự động kiểm tra lại khi cart hoặc subtotal thay đổi
  useEffect(() => {
    if (cart.length === 0) {
      handleRemovePromo();
      return;
    }

    const checkAutoPromo = async () => {
      try {
        const payloadItems = cart.map((it) => ({
          product: it.product?._id || it.product?.id || it.product,
          price: it.product?.price || 0,
          quantity: it.quantity || 1,
          category: it.product?.category || '',
        }));

        const res = await validatePromotion({
          items: payloadItems,
          voucherCode: appliedPromo?.code || '',
          promotionId: appliedPromo?._id || '',
        });

        if (res.data?.success) {
          const evalData = res.data.data;
          const newDiscount = evalData.discountAmount || 0;
          setDiscountAmount(newDiscount);
          setAppliedPromo(evalData.appliedPromotion);

          if (evalData.appliedPromotion) {
            setAppliedCodePill(
              evalData.appliedPromotion.code
                ? `${evalData.appliedPromotion.code} · Giảm ${formatPrice(newDiscount)}`
                : `${evalData.appliedPromotion.name} · Giảm ${formatPrice(newDiscount)}`
            );
          }

          if (onPromoChange) {
            onPromoChange({
              promotion: evalData.appliedPromotion,
              discountAmount: newDiscount,
              voucherCode: evalData.appliedPromotion?.code || '',
            });
          }

          const newTotal = Math.max(0, subtotal - newDiscount) + (shippingFee || 0);
          animateTotalChange(displayTotal, newTotal);
        }
      } catch (err) {
        console.error('Lỗi tính lại khuyến mãi giỏ hàng:', err);
      }
    };

    checkAutoPromo();
  }, [subtotal, shippingFee, cart.length]);

  const handleApply = async (codeToUse) => {
    const rawCode = (codeToUse || code || '').trim().toUpperCase();
    if (!rawCode) {
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    setIsApplying(true);
    setIsBad(false);
    setErrorMessage('');

    try {
      const payloadItems = cart.map((it) => ({
        product: it.product._id || it.product.id,
        price: it.product.price,
        quantity: it.quantity,
        category: it.product.category,
      }));

      const res = await validatePromotion({
        items: payloadItems,
        voucherCode: rawCode,
      });

      if (res.data?.success) {
        const evalData = res.data.data;

        if (evalData.voucherResult && !evalData.voucherResult.valid) {
          // Báo lỗi lắc đầu (u230-sh)
          setIsBad(true);
          setErrorMessage(evalData.voucherResult.message || 'Mã ưu đãi không hợp lệ');
          return;
        }

        const newDiscount = evalData.discountAmount || 0;
        setDiscountAmount(newDiscount);
        setAppliedPromo(evalData.appliedPromotion);

        const pillText = evalData.appliedPromotion?.code
          ? `${evalData.appliedPromotion.code} · Giảm ${formatPrice(newDiscount)}`
          : `${evalData.appliedPromotion?.name || 'Ưu đãi'} · Giảm ${formatPrice(newDiscount)}`;
        setAppliedCodePill(pillText);

        const newTotal = Math.max(0, subtotal - newDiscount) + (shippingFee || 0);
        animateTotalChange(displayTotal, newTotal);

        if (onPromoChange) {
          onPromoChange({
            promotion: evalData.appliedPromotion,
            discountAmount: newDiscount,
            voucherCode: rawCode,
          });
        }
      } else {
        throw new Error(res.data?.message || 'Không thể áp dụng mã');
      }
    } catch (err) {
      setIsBad(true);
      setErrorMessage(err.response?.data?.message || err.message || 'Mã ưu đãi không hợp lệ');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setAppliedCodePill('');
    setCode('');
    setIsBad(false);
    setErrorMessage('');

    const newTotal = subtotal + (shippingFee || 0);
    animateTotalChange(displayTotal, newTotal);

    if (onPromoChange) {
      onPromoChange({
        promotion: null,
        discountAmount: 0,
        voucherCode: '',
      });
    }

    setTimeout(() => {
      if (isOpen && inputRef.current) inputRef.current.focus();
    }, 50);
  };

  const handleSelectPromo = async (p) => {
    if (!p || !p.isEligible) return;

    setIsApplying(true);
    setIsBad(false);
    setErrorMessage('');

    try {
      const payloadItems = cart.map((it) => ({
        product: it.product?._id || it.product?.id || it.product,
        price: it.product?.price || 0,
        quantity: it.quantity || 1,
        category: it.product?.category || '',
      }));

      const res = await validatePromotion({
        items: payloadItems,
        voucherCode: p.code || '',
        promotionId: p._id,
      });

      if (res.data?.success) {
        const evalData = res.data.data;
        const newDiscount = evalData.discountAmount || 0;
        setDiscountAmount(newDiscount);
        setAppliedPromo(evalData.appliedPromotion);

        const pillText = evalData.appliedPromotion?.code
          ? `${evalData.appliedPromotion.code} · Giảm ${formatPrice(newDiscount)}`
          : `${evalData.appliedPromotion?.name || 'Ưu đãi'} · Giảm ${formatPrice(newDiscount)}`;
        setAppliedCodePill(pillText);

        if (p.code) {
          setCode(p.code);
        } else {
          setCode('');
        }

        const newTotal = Math.max(0, subtotal - newDiscount) + (shippingFee || 0);
        animateTotalChange(displayTotal, newTotal);

        if (onPromoChange) {
          onPromoChange({
            promotion: evalData.appliedPromotion,
            discountAmount: newDiscount,
            voucherCode: evalData.appliedPromotion?.code || '',
          });
        }
      }
    } catch (err) {
      console.error('Lỗi chọn ưu đãi:', err);
      setIsBad(true);
      setErrorMessage(err.response?.data?.message || 'Không thể áp dụng ưu đãi đã chọn');
    } finally {
      setIsApplying(false);
    }
  };

  const eligibleCount = evaluatedPromos.filter((p) => p.isEligible).length;

  return (
    <div className="font-['Montserrat',sans-serif]">
      {/* VÙNG NHẬP MÃ PROMO CODE (STYLE PROMPT 230) */}
      <div className="py-2.5 my-2 border-t border-b border-neutral-200">
        {/* BANNER ƯU ĐÃI ĐANG ĐƯỢC ÁP DỤNG */}
        {appliedPromo && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-lg mb-2.5 animate-scale-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-bold text-emerald-900 truncate">
                {appliedCodePill}
              </span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                Tiết kiệm {formatPrice(discountAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-[11px] font-bold text-neutral-600 hover:text-black underline transition-colors"
              >
                {isOpen ? 'Thu gọn' : 'Đổi mã'}
              </button>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-neutral-200 text-neutral-500 hover:text-black transition-colors"
                aria-label="Hủy áp dụng ưu đãi"
                title="Bỏ dùng ưu đãi này"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* NÚT BẬT/TẮT DRAWER NẾU CHƯA ÁP DỤNG */}
        {!appliedPromo && (
          <button
            type="button"
            onClick={() => {
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);
              if (nextOpen) {
                setTimeout(() => inputRef.current?.focus(), 150);
              }
            }}
            className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black py-1 focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M2 5.5V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1.5a2.5 2.5 0 0 0 0 5V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.5a2.5 2.5 0 0 0 0-5z" strokeLinejoin="round" />
                <path d="M9.5 3.5v9" strokeWidth="1.3" strokeDasharray="1.5 1.5" />
              </svg>
              <span>Bạn có mã giảm giá?</span>
            </span>
            <svg
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        )}

        {/* KHU VỰC NHẬP MÃ & DANH SÁCH GỢI Ý (HIỂN THỊ KHI ISOPEN HOẶC KHI CHƯA CHỌN MÃ) */}
        {(isOpen || !appliedPromo) && (
          <div className="mt-2.5 space-y-2 animate-slide-down">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={20}
                  value={code}
                  onChange={(e) => {
                    const clean = normalizePromoCode(e.target.value, code, 20);
                    setCode(clean);
                    setIsBad(false);
                    setErrorMessage('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApply();
                    }
                  }}
                  placeholder="NHẬP MÃ VOUCHER"
                  className={`w-full h-9 pl-3 pr-12 border rounded text-xs font-mono font-bold uppercase tracking-widest text-black focus:outline-none transition-all ${
                    isBad
                      ? 'border-red-500 bg-red-50/50 animate-shake'
                      : 'border-neutral-300 focus:border-black bg-white'
                  }`}
                />
                {code && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-gray-400 pointer-events-none tabular-nums">
                    {code.length}/20
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={isApplying || !code.trim()}
                onClick={() => handleApply()}
                className="px-4 h-9 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded transition-colors disabled:opacity-50 shrink-0"
              >
                {isApplying ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                ) : (
                  'ÁP DỤNG'
                )}
              </button>
            </div>

            {errorMessage && (
              <p className="text-[11px] font-bold text-red-600 mt-1" role="alert">
                {errorMessage}
              </p>
            )}

            {/* Gợi ý "Ưu đãi dành cho bạn" */}
            {evaluatedPromos.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromoList(!showPromoList)}
                  className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black flex items-center justify-between w-full py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Ưu đãi dành cho bạn ({evaluatedPromos.length})</span>
                    {eligibleCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        {eligibleCount} khả dụng
                      </span>
                    )}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showPromoList ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {showPromoList && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {evaluatedPromos.map((p) => {
                      const isCurrent = appliedPromo?._id === p._id;

                      if (p.isEligible) {
                        // THIẾT KẾ NỔI BẬT CHO VOUCHER ĐỦ ĐIỀU KIỆN
                        return (
                          <div
                            key={p._id}
                            onClick={() => handleSelectPromo(p)}
                            className={`p-2.5 rounded-lg transition-all flex items-center justify-between gap-2.5 border cursor-pointer active:scale-[0.99] ${
                              isCurrent
                                ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                                : 'bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/30 shadow-xs'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ĐỦ ĐIỀU KIỆN
                                </span>
                                <p className="text-[11px] font-bold text-neutral-900 truncate">{p.name}</p>
                              </div>
                              <p className="text-[10px] text-neutral-600 font-medium">
                                <span className="text-rose-600 font-bold">
                                  {p.discountType === 'percentage'
                                    ? `Giảm ${p.discountValue}%`
                                    : `Giảm ${formatPrice(p.discountValue)}`}
                                </span>
                                {p.minOrderValue > 0 ? ` · Đơn từ ${formatPrice(p.minOrderValue)}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-mono font-black text-purple-700 border border-purple-200 bg-purple-50 px-1.5 py-0.5 rounded">
                                {p.code || 'TỰ ĐỘNG'}
                              </span>

                              {isCurrent ? (
                                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded uppercase flex items-center gap-1 shadow-xs">
                                  ✓ ĐANG DÙNG
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectPromo(p);
                                  }}
                                  className="px-3 py-1 bg-black hover:bg-neutral-800 text-white rounded text-[10px] font-bold uppercase transition-transform active:scale-95 shadow-xs"
                                >
                                  Dùng
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // THIẾT KẾ LÀM MỜ CHO VOUCHER KHÔNG ĐỦ ĐIỀU KIỆN
                      return (
                        <div
                          key={p._id}
                          className="p-2.5 rounded-lg border border-dashed border-gray-300 bg-gray-50/70 opacity-45 cursor-not-allowed select-none flex items-center justify-between gap-2.5 transition-all"
                          title={p.reason}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-gray-700 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-500">
                              {p.discountType === 'percentage'
                                ? `Giảm ${p.discountValue}%`
                                : `Giảm ${formatPrice(p.discountValue)}`}
                              {p.minOrderValue > 0 ? ` · Đơn từ ${formatPrice(p.minOrderValue)}` : ''}
                            </p>
                            <p className="text-[10px] font-semibold text-rose-600 mt-0.5">
                              ⚠️ {p.reason}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                              {p.code || 'TỰ ĐỘNG'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold px-1.5 py-0.5 rounded border border-gray-200">
                              Chưa đủ ĐK
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHI TIẾT TÍNH TIỀN CÓ DÒNG GIẢM GIÁ VÀ GIÁ CŨ GẠCH NGANG */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-neutral-600">
          <span>Tiền hàng:</span>
          <span className="font-bold text-black tabular-nums">{formatPrice(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-700 font-bold animate-slide-down">
            <span className="flex items-center gap-1">
              <span>Ưu đãi giảm giá:</span>
              <span className="text-[10px] text-emerald-600 font-normal">
                ({appliedPromo?.name || 'Voucher'})
              </span>
            </span>
            <span className="tabular-nums font-black">-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-neutral-600">
          <span>Phí vận chuyển (GHN):</span>
          <span className="font-bold text-black tabular-nums">
            {shippingFee !== null ? formatPrice(shippingFee) : 'Chưa tính'}
          </span>
        </div>

        {/* TỔNG THANH TOÁN KÈM GIÁ CŨ GẠCH NGANG */}
        <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-black">TỔNG THANH TOÁN:</span>
            {discountAmount > 0 && (
              <span className="text-[10px] font-bold text-emerald-600">
                (Đã áp dụng mã tiết kiệm)
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            {discountAmount > 0 && (
              <s className="text-xs text-neutral-400 font-bold tabular-nums">
                {formatPrice(subtotal + (shippingFee || 0))}
              </s>
            )}
            <b className="text-base font-black text-red-600 tabular-nums">
              {formatPrice(displayTotal)}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPromoCode;

