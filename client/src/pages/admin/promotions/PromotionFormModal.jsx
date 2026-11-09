import { useState, useEffect } from 'react';
import { getPublicCategories } from '../../../services/categoryApi';
import { getProducts } from '../../../services/productApi';
import { createAdminPromotion, updateAdminPromotion } from '../../../services/promotionApi';
import { normalizePromoCode } from '../../../utils/promoCodeHelper';

const CloseIcon = () => (
  <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Hạn mức và giới hạn ký tự chuẩn
const LIMITS = {
  NAME_MAX: 100,
  DESC_MAX: 250,
  CODE_MIN: 3,
  CODE_MAX: 20,
  PERCENT_MAX: 100,
  MONEY_MAX: 100000000, // 100 triệu VNĐ
  MIN_ORDER_MAX: 500000000, // 500 triệu VNĐ
  USAGE_LIMIT_MAX: 1000000, // 1 triệu lượt
  PER_USER_MAX: 100, // Tối đa 100 lượt / khách
};

// Hàm định dạng số có dấu phẩy phân tách hàng nghìn (VD: 500000 -> "500,000")
const formatNumberWithCommas = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('en-US').format(Number(clean));
};

const PromotionFormModal = ({ isOpen, onClose, promotion = null, onSuccess }) => {
  const isEdit = !!promotion;

  // Kiểm tra quy tắc C.4: Nếu đã Active hoặc đã có lượt sử dụng -> Khóa các thông tin thương mại
  const hasBeenUsed = promotion ? (promotion.usedCount || 0) > 0 : false;
  const wasActive = promotion ? promotion.status === 'active' || promotion.computedStatus === 'active' : false;
  const isRestricted = isEdit && (hasBeenUsed || wasActive);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'voucher',
    code: '',
    scope: 'order',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderValue: '',
    applicableProducts: [],
    applicableCategories: [],
    startAt: '',
    endAt: '',
    usageLimit: '',
    perUserLimit: 1,
    status: 'draft',
    isPublic: true,
    allowSaving: true,
  });

  const [categories, setCategories] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tải danh mục và sản phẩm để chọn phạm vi khi scope === 'product'
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          getPublicCategories(),
          getProducts({ limit: 100 }),
        ]);

        const cats = catRes.data?.data?.categories || (Array.isArray(catRes.data?.data) ? catRes.data.data : []);
        setCategories(cats.map((c) => (typeof c === 'string' ? c : c.name)));

        const prods = prodRes.data?.data?.products || [];
        setProductsList(prods);
      } catch (err) {
        console.error('Lỗi tải danh mục hoặc sản phẩm:', err);
      }
    };

    loadOptions();
  }, [isOpen]);

  // Khởi tạo form khi sửa hoặc tạo mới
  useEffect(() => {
    if (promotion) {
      const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
      };

      setFormData({
        name: promotion.name || '',
        description: promotion.description || '',
        type: promotion.type || 'voucher',
        code: promotion.code || '',
        scope: promotion.scope || 'order',
        discountType: promotion.discountType || 'percentage',
        discountValue: promotion.discountValue !== undefined ? promotion.discountValue : '',
        maxDiscount: promotion.maxDiscount || '',
        minOrderValue: promotion.minOrderValue || '',
        applicableProducts: Array.isArray(promotion.applicableProducts)
          ? promotion.applicableProducts.map((p) => p._id || p)
          : [],
        applicableCategories: Array.isArray(promotion.applicableCategories)
          ? promotion.applicableCategories
          : [],
        startAt: formatDateForInput(promotion.startAt),
        endAt: formatDateForInput(promotion.endAt),
        usageLimit: promotion.usageLimit || '',
        perUserLimit: promotion.perUserLimit || 1,
        status: promotion.status || 'draft',
        isPublic: promotion.isPublic !== undefined ? promotion.isPublic : true,
        allowSaving: promotion.allowSaving !== undefined ? promotion.allowSaving : true,
      });
    } else {
      // Giá trị mặc định khi tạo mới
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const nowStr = now.toISOString().slice(0, 16);

      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      nextMonth.setMinutes(nextMonth.getMinutes() - nextMonth.getTimezoneOffset());
      const nextMonthStr = nextMonth.toISOString().slice(0, 16);

      setFormData({
        name: '',
        description: '',
        type: 'voucher',
        code: '',
        scope: 'order',
        discountType: 'percentage',
        discountValue: '',
        maxDiscount: '',
        minOrderValue: '',
        applicableProducts: [],
        applicableCategories: [],
        startAt: nowStr,
        endAt: nextMonthStr,
        usageLimit: '',
        perUserLimit: 1,
        status: 'draft',
        isPublic: true,
        allowSaving: true,
      });
    }
    setError('');
  }, [promotion, isOpen]);

  // Các hàm xử lý nhập liệu an toàn & tự động format
  const handleNameChange = (e) => {
    const clean = e.target.value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, LIMITS.NAME_MAX);
    setFormData((prev) => ({ ...prev, name: clean }));
  };

  const handleDescriptionChange = (e) => {
    const clean = e.target.value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, LIMITS.DESC_MAX);
    setFormData((prev) => ({ ...prev, description: clean }));
  };

  const handleCodeChange = (e) => {
    const clean = normalizePromoCode(e.target.value, formData.code, LIMITS.CODE_MAX);
    setFormData((prev) => ({ ...prev, code: clean }));
  };

  const handleDiscountTypeChange = (newType) => {
    setFormData((prev) => {
      let nextVal = prev.discountValue;
      if (newType === 'percentage' && Number(nextVal) > LIMITS.PERCENT_MAX) {
        nextVal = 10;
      }
      return {
        ...prev,
        discountType: newType,
        discountValue: nextVal,
        maxDiscount: newType === 'fixed' ? '' : prev.maxDiscount,
      };
    });
  };

  const handleDiscountValueChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setFormData((prev) => ({ ...prev, discountValue: '' }));
      return;
    }
    let num = Number(rawDigits);
    if (formData.discountType === 'percentage') {
      if (num > LIMITS.PERCENT_MAX) num = LIMITS.PERCENT_MAX;
    } else {
      if (num > LIMITS.MONEY_MAX) num = LIMITS.MONEY_MAX;
    }
    setFormData((prev) => ({ ...prev, discountValue: num }));
  };

  const handleMinOrderChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setFormData((prev) => ({ ...prev, minOrderValue: '' }));
      return;
    }
    let num = Number(rawDigits);
    if (num > LIMITS.MIN_ORDER_MAX) num = LIMITS.MIN_ORDER_MAX;
    setFormData((prev) => ({ ...prev, minOrderValue: num }));
  };

  const handleMaxDiscountChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setFormData((prev) => ({ ...prev, maxDiscount: '' }));
      return;
    }
    let num = Number(rawDigits);
    if (num > LIMITS.MONEY_MAX) num = LIMITS.MONEY_MAX;
    setFormData((prev) => ({ ...prev, maxDiscount: num }));
  };

  const handleUsageLimitChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setFormData((prev) => ({ ...prev, usageLimit: '' }));
      return;
    }
    let num = Number(rawDigits);
    if (num > LIMITS.USAGE_LIMIT_MAX) num = LIMITS.USAGE_LIMIT_MAX;
    setFormData((prev) => ({ ...prev, usageLimit: num }));
  };

  const handlePerUserLimitChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setFormData((prev) => ({ ...prev, perUserLimit: '' }));
      return;
    }
    let num = Number(rawDigits);
    if (num > LIMITS.PER_USER_MAX) num = LIMITS.PER_USER_MAX;
    if (num < 1) num = 1;
    setFormData((prev) => ({ ...prev, perUserLimit: num }));
  };

  const isDateInvalid = formData.startAt && formData.endAt && new Date(formData.endAt) <= new Date(formData.startAt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError('Tên chương trình phải có từ 3 đến 100 ký tự');
      return;
    }

    if (formData.type === 'voucher' && !isRestricted) {
      const cleanCode = formData.code.trim();
      if (!cleanCode) {
        setError('Vui lòng nhập mã voucher');
        return;
      }
      if (cleanCode.length < LIMITS.CODE_MIN || cleanCode.length > LIMITS.CODE_MAX) {
        setError(`Mã voucher phải có từ ${LIMITS.CODE_MIN} đến ${LIMITS.CODE_MAX} ký tự`);
        return;
      }
      if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
        setError('Mã voucher chỉ được chứa chữ cái in hoa không dấu, số, gạch nối hoặc gạch dưới');
        return;
      }
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      setError('Vui lòng nhập giá trị giảm hợp lệ lớn hơn 0');
      return;
    }

    if (formData.discountType === 'percentage') {
      const val = Number(formData.discountValue);
      if (val < 1 || val > 100) {
        setError('Tỷ lệ phần trăm giảm giá phải từ 1% đến 100%');
        return;
      }
    }

    if (!formData.startAt || !formData.endAt) {
      setError('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }

    if (isDateInvalid) {
      setError('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        name: trimmedName,
        description: formData.description.trim(),
        code: formData.type === 'voucher' ? formData.code.trim().toUpperCase() : undefined,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        perUserLimit: Number(formData.perUserLimit) || 1,
      };

      if (isEdit) {
        await updateAdminPromotion(promotion._id, payload);
      } else {
        await createAdminPromotion(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Lỗi lưu khuyến mãi:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu chương trình khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat) => {
    if (isRestricted) return;
    setFormData((prev) => {
      const exists = prev.applicableCategories.includes(cat);
      return {
        ...prev,
        applicableCategories: exists
          ? prev.applicableCategories.filter((c) => c !== cat)
          : [...prev.applicableCategories, cat],
      };
    });
  };

  const toggleProduct = (prodId) => {
    if (isRestricted) return;
    setFormData((prev) => {
      const exists = prev.applicableProducts.includes(prodId);
      return {
        ...prev,
        applicableProducts: exists
          ? prev.applicableProducts.filter((p) => p !== prodId)
          : [...prev.applicableProducts, prodId],
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => !loading && onClose()} />

      <div className="relative bg-white text-gray-900 max-w-2xl w-full z-10 shadow-2xl rounded-xl max-h-[92vh] overflow-y-auto border border-gray-100 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEdit ? 'Chỉnh sửa chương trình khuyến mãi' : 'Tạo mới chương trình khuyến mãi'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isRestricted
                ? 'Chương trình đã kích hoạt hoặc có lượt dùng thực tế: Các thông tin thương mại được khóa để bảo vệ quyền lợi khách hàng.'
                : 'Thiết lập đầy đủ các thông tin, điều kiện và phạm vi áp dụng cho chương trình.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-danger-50 border border-red-200 text-danger-700 text-sm font-medium rounded-lg">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TÊN CHƯƠNG TRÌNH */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Tên chương trình khuyến mãi <span className="text-red-500">*</span>
              </label>
              <span className={`text-[11px] font-medium tabular-nums ${formData.name.length >= LIMITS.NAME_MAX ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {formData.name.length}/{LIMITS.NAME_MAX}
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={LIMITS.NAME_MAX}
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Ví dụ: Ưu đãi đầu mùa giảm 20% cho toàn bộ áo thun"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all"
            />
          </div>

          {/* MÔ TẢ */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Mô tả ngắn
              </label>
              <span className={`text-[11px] font-medium tabular-nums ${formData.description.length >= LIMITS.DESC_MAX ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {formData.description.length}/{LIMITS.DESC_MAX}
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={LIMITS.DESC_MAX}
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Mô tả quyền lợi hoặc ghi chú dành cho khách hàng..."
              className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all leading-relaxed"
            />
          </div>

          {/* HÌNH THỨC & MÃ VOUCHER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50/70 border border-gray-200 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Hình thức khuyến mãi <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isRestricted}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="voucher">Voucher nhập mã</option>
                <option value="automatic">Khuyến mãi tự động (Không cần mã)</option>
              </select>
            </div>

            {formData.type === 'voucher' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Mã Voucher <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-medium tabular-nums ${formData.code.length >= LIMITS.CODE_MAX ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {formData.code.length}/{LIMITS.CODE_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  disabled={isRestricted}
                  maxLength={LIMITS.CODE_MAX}
                  value={formData.code}
                  onChange={handleCodeChange}
                  placeholder="Ví dụ: MBBC2004"
                  className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm font-mono font-bold tracking-wider uppercase text-purple-700 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Chỉ gồm chữ in hoa không dấu, số (3 - 20 ký tự, không dấu cách).
                </p>
              </div>
            ) : (
              <div className="flex items-center text-blue-600/90 text-xs font-medium pt-5">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-blue-700">
                  ⚡ Hệ thống sẽ tự động kiểm tra và áp dụng khi đủ điều kiện
                </span>
              </div>
            )}
          </div>

          {/* PHẠM VI ÁP DỤNG & LOẠI GIẢM & GIÁ TRỊ GIẢM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phạm vi áp dụng
              </label>
              <select
                disabled={isRestricted}
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="order">Toàn đơn hàng</option>
                <option value="product">Theo sản phẩm / danh mục</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Loại giảm giá
              </label>
              <select
                disabled={isRestricted}
                value={formData.discountType}
                onChange={(e) => handleDiscountTypeChange(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Giá trị giảm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={isRestricted}
                  value={
                    formData.discountType === 'percentage'
                      ? formData.discountValue
                      : formatNumberWithCommas(formData.discountValue)
                  }
                  onChange={handleDiscountValueChange}
                  placeholder={formData.discountType === 'percentage' ? '1 – 100' : 'Ví dụ: 50,000'}
                  className="w-full h-10 pl-3.5 pr-12 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  {formData.discountType === 'percentage' ? '%' : 'VNĐ'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {formData.discountType === 'percentage'
                  ? 'Mức giảm từ 1% đến 100%'
                  : `Tối đa ${formatNumberWithCommas(LIMITS.MONEY_MAX)} VNĐ`}
              </p>
            </div>
          </div>

          {/* ĐƠN TỐI THIỂU & GIẢM TỐI ĐA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Đơn hàng tối thiểu (VNĐ)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isRestricted}
                  value={formatNumberWithCommas(formData.minOrderValue)}
                  onChange={handleMinOrderChange}
                  placeholder="0 (Không yêu cầu)"
                  className="w-full h-10 pl-3.5 pr-12 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  VNĐ
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Để trống hoặc 0 nếu không yêu cầu giá trị tối thiểu
              </p>
            </div>

            {formData.discountType === 'percentage' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mức giảm tối đa (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={isRestricted}
                    value={formatNumberWithCommas(formData.maxDiscount)}
                    onChange={handleMaxDiscountChange}
                    placeholder="Không giới hạn"
                    className="w-full h-10 pl-3.5 pr-12 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500 tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                    VNĐ
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Chặn trần số tiền được giảm khi tính theo %
                </p>
              </div>
            ) : null}
          </div>

          {/* PHẠM VI SẢN PHẨM / DANH MỤC (KHI SCOPE === 'PRODUCT') */}
          {formData.scope === 'product' && (
            <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Danh mục áp dụng ({formData.applicableCategories.length})
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-white border border-gray-200 rounded-lg">
                  {categories.map((cat) => {
                    const selected = formData.applicableCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        disabled={isRestricted}
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                          selected
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Sản phẩm cụ thể ({formData.applicableProducts.length})
                </label>
                <div className="divide-y divide-gray-100 max-h-36 overflow-y-auto bg-white border border-gray-200 rounded-lg p-1">
                  {productsList.map((prod) => {
                    const selected = formData.applicableProducts.includes(prod._id);
                    return (
                      <div
                        key={prod._id}
                        onClick={() => toggleProduct(prod._id)}
                        className={`flex items-center justify-between p-2 cursor-pointer text-xs rounded-md transition-colors ${
                          selected ? 'bg-primary-50 font-semibold text-primary-900' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <span className="truncate max-w-[360px]">{prod.name}</span>
                        <input
                          type="checkbox"
                          disabled={isRestricted}
                          checked={selected}
                          onChange={() => { }}
                          className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* THỜI GIAN HIỆU LỰC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                disabled={isRestricted}
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Thời gian kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                disabled={isRestricted}
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-[3px] transition-all disabled:bg-gray-100 disabled:text-gray-500 ${
                  isDateInvalid
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15 text-red-600'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/15'
                }`}
              />
              {isDateInvalid && (
                <p className="text-[11px] text-red-600 font-medium mt-1">
                  Thời gian kết thúc phải diễn ra sau thời gian bắt đầu
                </p>
              )}
            </div>
          </div>

          {/* GIỚI HẠN SỬ DỤNG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tổng lượt sử dụng tối đa
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isRestricted}
                  value={formatNumberWithCommas(formData.usageLimit)}
                  onChange={handleUsageLimitChange}
                  placeholder="Không giới hạn"
                  className="w-full h-10 pl-3.5 pr-12 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  lượt
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Tối đa {formatNumberWithCommas(LIMITS.USAGE_LIMIT_MAX)} lượt
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Lượt dùng tối đa / mỗi khách
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={isRestricted}
                  value={formData.perUserLimit}
                  onChange={handlePerUserLimitChange}
                  className="w-full h-10 pl-3.5 pr-12 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all disabled:bg-gray-100 disabled:text-gray-500 tabular-nums"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                  lượt
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Từ 1 đến {LIMITS.PER_USER_MAX} lần / khách hàng
              </p>
            </div>
          </div>

          {/* TRẠNG THÁI & HIỂN THỊ */}
          <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Trạng thái chương trình
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all"
              >
                {!isRestricted && <option value="draft">Bản nháp (Draft)</option>}
                <option value="active">Kích hoạt (Active)</option>
                <option value="paused">Tạm dừng (Paused)</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Hiển thị công khai tại Trung tâm ưu đãi</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.allowSaving}
                  onChange={(e) => setFormData({ ...formData, allowSaving: e.target.checked })}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <span>Cho phép khách hàng lưu vào Kho ưu đãi</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || isDateInvalid}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEdit ? 'Cập nhật chương trình' : 'Tạo chương trình'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};

export default PromotionFormModal;

