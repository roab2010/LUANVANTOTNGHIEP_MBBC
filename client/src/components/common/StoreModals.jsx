import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/orderApi';
import {
  getProvinces,
  getDistricts,
  getWards,
  calculateShippingFee,
} from '../../services/shippingApi';
import MyOrdersModal from '../../pages/customer/MyOrdersModal';
import MyReviewsModal from '../customer/MyReviewsModal';
import { getVariantColorHex } from '../VariantSelect';

// Close Icon
const CloseIcon = () => (
  <svg className="w-5 h-5 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Format VND currency
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

// ============================================
// HELPER LOẠI BỎ DẤU TIẾNG VIỆT ĐỂ TÌM KIẾM NHANH
// ============================================
const removeVietnameseTones = (str = '') => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

// ============================================
// SEARCHABLE SELECT DROPDOWN (CÓ THANH GÕ GỢI Ý)
// ============================================
const SearchableSelect = ({
  label,
  required = false,
  placeholder = '— Chọn —',
  searchPlaceholder = 'Gõ để tìm kiếm nhanh...',
  value,
  displayValue,
  options = [],
  onChange,
  disabled = false,
  loading = false,
  loadingText = 'Đang tải...',
  emptyText = 'Không tìm thấy kết quả phù hợp',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus ô tìm kiếm khi mở
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Lọc real-time theo từ khóa (hỗ trợ tiếng Việt không dấu & có dấu)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const cleanQuery = removeVietnameseTones(searchTerm);
    return options.filter((opt) => {
      const cleanName = removeVietnameseTones(opt.name || '');
      return cleanName.includes(cleanQuery);
    });
  }, [options, searchTerm]);

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-9 px-2.5 border rounded text-xs font-medium text-left flex items-center justify-between transition-colors bg-white ${
          disabled
            ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
            : isOpen
            ? 'border-black ring-1 ring-black text-neutral-900'
            : 'border-neutral-300 hover:border-neutral-400 text-neutral-900'
        }`}
      >
        <span className="truncate">
          {loading ? (
            <span className="text-neutral-400 italic flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-neutral-400 border-t-black rounded-full animate-spin shrink-0" />
              <span>{loadingText}</span>
            </span>
          ) : displayValue ? (
            <span className="font-semibold text-neutral-900">{displayValue}</span>
          ) : (
            <span className="text-neutral-400 font-normal">{placeholder}</span>
          )}
        </span>

        <span className="ml-1 text-neutral-400 shrink-0">
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-black' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu có ô Search */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-300 rounded shadow-xl overflow-hidden text-xs">
          {/* Thanh input tìm kiếm gợi ý */}
          <div className="p-2 border-b border-neutral-200 bg-[#fafafa] flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs font-semibold text-black placeholder:text-neutral-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-neutral-400 hover:text-black p-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Danh sách kết quả gợi ý */}
          <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-neutral-400 italic text-[11px]">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-neutral-100 transition-colors ${
                      isSelected ? 'bg-neutral-100 font-bold text-black' : 'text-neutral-700'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && (
                      <span className="text-black font-black ml-2 shrink-0">✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StoreModals = ({ onOrderCompleted }) => {
  const { user } = useAuth();
  const {
    cart,
    clearCart,
    updateCartQty,
    totalCartCount,
    totalCartAmount,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    orderSuccess,
    setOrderSuccess,
    isMyOrdersOpen,
    setIsMyOrdersOpen,
    isMyReviewsOpen,
    setIsMyReviewsOpen,
    toastMessage,
    showToast,
  } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Thông tin cơ bản khách hàng
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    phone: '',
    paymentMethod: 'cod',
    notes: '',
  });

  // ============================================
  // ĐỊA CHỈ & TÍNH PHÍ GHN STAGING
  // ============================================
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedProvinceName, setSelectedProvinceName] = useState('');

  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');

  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [selectedWardName, setSelectedWardName] = useState('');

  const [streetAddress, setStreetAddress] = useState('');

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Phí vận chuyển từ GHN
  const [shippingFee, setShippingFee] = useState(null);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [shippingFeeError, setShippingFeeError] = useState('');

  // Ref chống race condition khi gọi API tính phí liên tục
  const feeRequestSeqRef = useRef(0);

  // Tự động điền thông tin nếu user đã đăng nhập
  useEffect(() => {
    if (user) {
      setCustomerInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Tải danh sách Tỉnh/Thành phố khi mở Modal Checkout
  useEffect(() => {
    if (isCheckoutOpen && provinces.length === 0) {
      const fetchProvincesList = async () => {
        setIsLoadingProvinces(true);
        try {
          const res = await getProvinces();
          if (res.data?.success && Array.isArray(res.data.data)) {
            setProvinces(res.data.data);
          }
        } catch (err) {
          console.error('Lỗi tải Tỉnh/Thành từ GHN:', err);
          setShippingFeeError('Không thể kết nối đến máy chủ GHN để tải danh mục Tỉnh/Thành.');
        } finally {
          setIsLoadingProvinces(false);
        }
      };
      fetchProvincesList();
    }
  }, [isCheckoutOpen, provinces.length]);

  // Hàm gọi backend tính phí vận chuyển GHN
  const fetchGHNFee = useCallback(
    async (distId, wardCode) => {
      if (!distId || !wardCode || cart.length === 0) {
        setShippingFee(null);
        return;
      }

      const currentSeq = ++feeRequestSeqRef.current;
      setIsCalculatingFee(true);
      setShippingFeeError('');

      try {
        const itemsPayload = cart.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: it.product.price,
        }));

        const res = await calculateShippingFee({
          toDistrictId: Number(distId),
          toWardCode: String(wardCode),
          items: itemsPayload,
          insuranceValue: totalCartAmount,
        });

        // Chỉ xử lý nếu đây là request mới nhất
        if (currentSeq === feeRequestSeqRef.current) {
          if (res.data?.success && res.data.data?.total !== undefined) {
            setShippingFee(res.data.data.total);
            setShippingFeeError('');
          } else {
            throw new Error(res.data?.message || 'GHN không thể tính phí');
          }
        }
      } catch (err) {
        if (currentSeq === feeRequestSeqRef.current) {
          setShippingFee(null);
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Tuyến đường hoặc địa chỉ không được GHN hỗ trợ tính phí.';
          setShippingFeeError(msg);
        }
      } finally {
        if (currentSeq === feeRequestSeqRef.current) {
          setIsCalculatingFee(false);
        }
      }
    },
    [cart, totalCartAmount]
  );

  // Khi chọn Tỉnh/Thành
  const handleProvinceSelect = async (opt) => {
    if (!opt) return;
    const provId = String(opt.id);
    const provName = opt.name;

    setSelectedProvinceId(provId);
    setSelectedProvinceName(provName);

    // Reset cấp dưới
    setSelectedDistrictId('');
    setSelectedDistrictName('');
    setDistricts([]);
    setSelectedWardCode('');
    setSelectedWardName('');
    setWards([]);
    setShippingFee(null);
    setShippingFeeError('');

    if (provId) {
      setIsLoadingDistricts(true);
      try {
        const res = await getDistricts(provId);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setDistricts(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi tải Quận/Huyện từ GHN:', err);
        setShippingFeeError('Không thể tải danh sách Quận/Huyện cho tỉnh thành này.');
      } finally {
        setIsLoadingDistricts(false);
      }
    }
  };

  // Khi chọn Quận/Huyện
  const handleDistrictSelect = async (opt) => {
    if (!opt) return;
    const distId = String(opt.id);
    const distName = opt.name;

    setSelectedDistrictId(distId);
    setSelectedDistrictName(distName);

    // Reset cấp dưới
    setSelectedWardCode('');
    setSelectedWardName('');
    setWards([]);
    setShippingFee(null);
    setShippingFeeError('');

    if (distId) {
      setIsLoadingWards(true);
      try {
        const res = await getWards(distId);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setWards(res.data.data);
        }
      } catch (err) {
        console.error('Lỗi tải Phường/Xã từ GHN:', err);
        setShippingFeeError('Không thể tải danh sách Phường/Xã cho quận huyện này.');
      } finally {
        setIsLoadingWards(false);
      }
    }
  };

  // Khi chọn Phường/Xã
  const handleWardSelect = (opt) => {
    if (!opt) return;
    const wardCode = String(opt.id);
    const wardName = opt.name;

    setSelectedWardCode(wardCode);
    setSelectedWardName(wardName);

    if (selectedDistrictId && wardCode) {
      fetchGHNFee(selectedDistrictId, wardCode);
    } else {
      setShippingFee(null);
      setShippingFeeError('');
    }
  };

  // Tự động khôi phục địa chỉ nhận hàng từ lần đặt trước khi mở Checkout
  useEffect(() => {
    if (!isCheckoutOpen) return;

    try {
      const raw = localStorage.getItem('mbbc_saved_shipping_address');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved) return;

      // Điền Họ tên và SĐT nếu chưa có
      setCustomerInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || saved.fullName || (user ? user.fullName : '') || '',
        phone: prev.phone || saved.phone || (user ? user.phone : '') || '',
      }));

      // Điền số nhà, tên đường
      if (saved.streetAddress) {
        setStreetAddress((prev) => prev || saved.streetAddress);
      }

      // Khôi phục Tỉnh/Thành
      if (saved.provinceId && saved.provinceName) {
        setSelectedProvinceId(String(saved.provinceId));
        setSelectedProvinceName(saved.provinceName);

        // Tải danh sách Quận/Huyện cho tỉnh này
        setIsLoadingDistricts(true);
        getDistricts(saved.provinceId)
          .then((resDist) => {
            if (resDist.data?.success && Array.isArray(resDist.data.data)) {
              setDistricts(resDist.data.data);

              // Khôi phục Quận/Huyện
              if (saved.districtId && saved.districtName) {
                setSelectedDistrictId(String(saved.districtId));
                setSelectedDistrictName(saved.districtName);

                // Tải danh sách Phường/Xã cho huyện này
                setIsLoadingWards(true);
                getWards(saved.districtId)
                  .then((resWard) => {
                    if (resWard.data?.success && Array.isArray(resWard.data.data)) {
                      setWards(resWard.data.data);

                      // Khôi phục Phường/Xã
                      if (saved.wardCode && saved.wardName) {
                        setSelectedWardCode(String(saved.wardCode));
                        setSelectedWardName(saved.wardName);

                        // Tự động kích hoạt tính phí ship GHN!
                        fetchGHNFee(saved.districtId, saved.wardCode);
                      }
                    }
                  })
                  .catch((err) => console.error('Lỗi khôi phục xã:', err))
                  .finally(() => setIsLoadingWards(false));
              }
            }
          })
          .catch((err) => console.error('Lỗi khôi phục huyện:', err))
          .finally(() => setIsLoadingDistricts(false));
      }
    } catch (e) {
      console.warn('Lỗi đọc địa chỉ đã lưu:', e);
    }
  }, [isCheckoutOpen, user, fetchGHNFee]);

  // Tính lại phí nếu số lượng giỏ hàng thay đổi trong lúc đang mở modal checkout
  useEffect(() => {
    if (isCheckoutOpen && selectedDistrictId && selectedWardCode) {
      fetchGHNFee(selectedDistrictId, selectedWardCode);
    }
  }, [cart, totalCartAmount, isCheckoutOpen, selectedDistrictId, selectedWardCode, fetchGHNFee]);

  // Xử lý submit đặt hàng
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerInfo.fullName.trim() || !customerInfo.phone.trim()) {
      setCheckoutError('Vui lòng điền đầy đủ họ tên và số điện thoại người nhận');
      return;
    }

    if (!selectedProvinceId || !selectedDistrictId || !selectedWardCode) {
      setCheckoutError('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã nhận hàng');
      return;
    }

    if (!streetAddress.trim()) {
      setCheckoutError('Vui lòng nhập số nhà, tên đường cụ thể');
      return;
    }

    if (shippingFee === null || isCalculatingFee || shippingFeeError) {
      setCheckoutError(
        shippingFeeError
          ? `Chưa thể đặt hàng do lỗi tính phí vận chuyển: ${shippingFeeError}`
          : 'Hệ thống đang tính phí vận chuyển từ GHN, vui lòng đợi trong giây lát'
      );
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Giỏ hàng trống');
      return;
    }

    setCheckoutLoading(true);
    try {
      const orderItems = cart.map((it) => ({
        product: it.product._id || it.product.id,
        quantity: it.quantity,
        size: it.size || undefined,
        color: it.color || undefined,
      }));

      const fullAddress = `${streetAddress.trim()}, ${selectedWardName}, ${selectedDistrictName}, ${selectedProvinceName}`;

      const res = await createOrder({
        customer: {
          fullName: customerInfo.fullName.trim(),
          phone: customerInfo.phone.trim(),
          province: selectedProvinceName,
          provinceId: Number(selectedProvinceId),
          district: selectedDistrictName,
          districtId: Number(selectedDistrictId),
          ward: selectedWardName,
          wardCode: String(selectedWardCode),
          streetAddress: streetAddress.trim(),
          address: fullAddress,
        },
        items: orderItems,
        paymentMethod: customerInfo.paymentMethod,
        notes: customerInfo.notes.trim() || undefined,
      });

      if (res.data?.success) {
        // Lưu lại địa chỉ giao hàng vào localStorage để lần sau khách không phải chọn lại
        try {
          const addressToSave = {
            fullName: customerInfo.fullName.trim(),
            phone: customerInfo.phone.trim(),
            provinceId: selectedProvinceId,
            provinceName: selectedProvinceName,
            districtId: selectedDistrictId,
            districtName: selectedDistrictName,
            wardCode: selectedWardCode,
            wardName: selectedWardName,
            streetAddress: streetAddress.trim(),
          };
          localStorage.setItem('mbbc_saved_shipping_address', JSON.stringify(addressToSave));
        } catch (storageErr) {
          console.warn('Không thể lưu địa chỉ vào localStorage:', storageErr);
        }

        setOrderSuccess(res.data.data.order);
        clearCart();
        setIsCheckoutOpen(false);
        showToast('Đặt hàng thành công với phí vận chuyển GHN!');
        if (onOrderCompleted) onOrderCompleted(res.data.data.order);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại';
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const finalGrandTotal = totalCartAmount + (shippingFee !== null ? shippingFee : 0);

  return (
    <>
      {/* ========================================================= */}
      {/* CART DRAWER SLIDE-OVER */}
      {/* ========================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Montserrat',sans-serif]">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col z-50 animate-slide-left">
              {/* Header Drawer */}
              <div className="p-5 flex items-center justify-between border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black tracking-widest uppercase">GIỎ HÀNG CỦA BẠN</h3>
                  <span className="text-xs font-bold text-neutral-400">({totalCartCount})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 hover:bg-neutral-100 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 divide-y divide-neutral-100 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                    <p className="text-xs uppercase font-bold tracking-wider mb-3">Chưa có sản phẩm nào</p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                      TIẾP TỤC MUA SẮM
                    </button>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="pt-4 first:pt-0 flex gap-4">
                      <img
                        src={item.product.image || 'https://placehold.co/100x120/111/fff?text=MBBC'}
                        alt={item.product.name}
                        className="w-16 h-20 object-cover bg-neutral-100 shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-neutral-600">
                            {item.size && (
                              <span className="px-1.5 py-0.5 bg-neutral-100 font-semibold text-black rounded text-[10px]">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="px-1.5 py-0.5 bg-neutral-100 font-semibold text-black rounded text-[10px]">
                                Màu: {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-neutral-200">
                            <button
                              type="button"
                              onClick={() => updateCartQty(index, -1)}
                              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-neutral-100"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(index, 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-neutral-100"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-black tabular-nums">
                            {formatPrice((item.product.price || 0) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-neutral-100 bg-[#fafafa] space-y-3">
                  <div className="flex justify-between text-xs text-neutral-600 font-bold uppercase tracking-wider">
                    <span>TỔNG TIỀN HÀNG:</span>
                    <span className="font-black text-black text-sm tabular-nums">
                      {formatPrice(totalCartAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutError('');
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3.5 bg-black text-white text-xs font-black tracking-widest uppercase hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    TIẾN HÀNH THANH TOÁN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHECKOUT THANH TOÁN TÍCH HỢP GHN STAGING */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-['Montserrat',sans-serif]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCheckoutOpen(false)} />

          <div className="relative bg-white text-black max-w-xl w-full p-6 sm:p-8 z-10 shadow-2xl max-h-[92vh] overflow-y-auto border border-neutral-200 animate-scale-in">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded transition-colors"
            >
              <CloseIcon />
            </button>

            {/* Header */}
            <div className="border-b border-neutral-100 pb-3 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black tracking-widest uppercase">ĐẶT HÀNG & THANH TOÁN</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Tích hợp tính phí vận chuyển chính xác từ GHN</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase tracking-wider">
                  GHN Staging
                </span>
              </div>
            </div>

            {checkoutError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded">
                {checkoutError}
              </div>
            )}

            {/* Tóm tắt giỏ hàng & Phí ship */}
            <div className="mb-5 p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                <span>SẢN PHẨM ({totalCartCount})</span>
                <span>TỔNG</span>
              </div>
              <div className="divide-y divide-neutral-200/60 max-h-44 overflow-y-auto space-y-2 pr-1">
                {cart.map((it, idx) => {
                  const itemImg =
                    it.product?.image ||
                    (Array.isArray(it.product?.images) && it.product.images[0]) ||
                    '';
                  const itemQty = parseInt(it.quantity) || 1;
                  const itemTotal = (it.product?.price || 0) * itemQty;

                  return (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-xs">
                      {/* Hình ảnh mặt hàng */}
                      <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
                        {itemImg ? (
                          <img
                            src={itemImg}
                            alt={it.product?.name || 'Sản phẩm'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-[9px] text-neutral-400 font-bold uppercase">MBBC</span>
                        )}
                      </div>

                      {/* Chi tiết tên, size, màu kèm chấm màu */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate uppercase tracking-tight">
                          {it.product?.name || 'Sản phẩm'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {it.size && (
                            <span className="inline-block px-1.5 py-0.5 bg-neutral-200/70 text-neutral-800 text-[10px] font-bold tracking-wider rounded">
                              Size: {it.size}
                            </span>
                          )}
                          {it.color && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-200/70 text-neutral-800 text-[10px] font-bold tracking-wider rounded">
                              <span
                                className="w-2 h-2 rounded-full border border-neutral-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: getVariantColorHex(it.color) }}
                              />
                              <span>Màu: {it.color}</span>
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-neutral-500">
                            x{itemQty}
                          </span>
                        </div>
                      </div>

                      {/* Thành tiền */}
                      <span className="font-bold text-black tabular-nums shrink-0">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bảng chi tiết tính tiền: Tiền hàng + Phí GHN */}
              <div className="pt-3 border-t border-neutral-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-neutral-600">
                  <span>Tiền hàng:</span>
                  <span className="font-bold text-black tabular-nums">{formatPrice(totalCartAmount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 flex items-center gap-1.5">
                    <span>Phí vận chuyển (GHN):</span>
                    {shippingFee !== null && !isCalculatingFee && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase rounded">
                        Giao chuẩn
                      </span>
                    )}
                  </span>

                  <span className="tabular-nums">
                    {isCalculatingFee ? (
                      <span className="text-neutral-500 italic flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-neutral-400 border-t-black rounded-full animate-spin inline-block" />
                        <span>Đang tính phí GHN...</span>
                      </span>
                    ) : shippingFee !== null ? (
                      <span className="font-bold text-neutral-900">{formatPrice(shippingFee)}</span>
                    ) : shippingFeeError ? (
                      <span className="text-red-500 font-semibold text-[11px]">Lỗi tính phí</span>
                    ) : (
                      <span className="text-neutral-400 italic text-[11px]">Chọn Phường/Xã để tính phí</span>
                    )}
                  </span>
                </div>

                {shippingFeeError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded mt-1">
                    {shippingFeeError}
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider">TỔNG THANH TOÁN:</span>
                    {shippingFee === null && !isCalculatingFee && (
                      <p className="text-[10px] text-neutral-400">(Chưa tính phí vận chuyển)</p>
                    )}
                  </div>
                  <span className="text-base font-black text-red-600 tabular-nums">
                    {formatPrice(finalGrandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form thông tin giao hàng GHN */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Họ và tên người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Bảo"
                  className="w-full h-10 px-3 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full h-10 px-3 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Hình thức thanh toán
                  </label>
                  <select
                    value={customerInfo.paymentMethod}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-300 rounded text-xs font-semibold text-black focus:outline-none focus:border-black"
                  >
                    <option value="cod">Thanh toán khi nhận (COD)</option>
                    <option value="banking">Chuyển khoản ngân hàng</option>
                  </select>
                </div>
              </div>

              {/* KHU VỰC CHỌN ĐỊA CHỈ GHN CHUẨN MÃ */}
              <div className="space-y-3 bg-[#fafafa] p-3.5 border border-neutral-200 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                    Địa chỉ nhận hàng (Đồng bộ GHN) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 italic">Dữ liệu Master Data GHN</span>
                </div>

                {/* 3 Dropdown Searchable Tỉnh/Thành -> Quận/Huyện -> Phường/Xã (có thanh gõ gợi ý nhanh) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Tỉnh / Thành phố */}
                  <SearchableSelect
                    label="Tỉnh / Thành phố"
                    required
                    placeholder="— Chọn Tỉnh/Thành —"
                    searchPlaceholder="Gõ tìm Tỉnh / Thành..."
                    value={selectedProvinceId}
                    displayValue={selectedProvinceName}
                    options={provinces.map((p) => ({ id: p.provinceId, name: p.provinceName }))}
                    onChange={handleProvinceSelect}
                    loading={isLoadingProvinces}
                    loadingText="Đang tải Tỉnh/Thành..."
                  />

                  {/* Quận / Huyện */}
                  <SearchableSelect
                    label="Quận / Huyện"
                    required
                    placeholder={!selectedProvinceId ? '— Chọn Tỉnh trước —' : '— Chọn Quận/Huyện —'}
                    searchPlaceholder="Gõ tìm Quận / Huyện..."
                    value={selectedDistrictId}
                    displayValue={selectedDistrictName}
                    options={districts.map((d) => ({ id: d.districtId, name: d.districtName }))}
                    onChange={handleDistrictSelect}
                    disabled={!selectedProvinceId || isLoadingDistricts}
                    loading={isLoadingDistricts}
                    loadingText="Đang tải Quận/Huyện..."
                  />

                  {/* Phường / Xã */}
                  <SearchableSelect
                    label="Phường / Xã"
                    required
                    placeholder={!selectedDistrictId ? '— Chọn Huyện trước —' : '— Chọn Phường/Xã —'}
                    searchPlaceholder="Gõ tìm Phường / Xã..."
                    value={selectedWardCode}
                    displayValue={selectedWardName}
                    options={wards.map((w) => ({ id: w.wardCode, name: w.wardName }))}
                    onChange={handleWardSelect}
                    disabled={!selectedDistrictId || isLoadingWards}
                    loading={isLoadingWards}
                    loadingText="Đang tải Phường/Xã..."
                  />
                </div>

                {/* Số nhà, tên đường cụ thể */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">
                    Số nhà, tên đường, ngõ ngách <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Ví dụ: 123 Bến Vân Đồn"
                    className="w-full h-9 px-3 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 bg-white focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Ghi chú đơn hàng (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="Ghi chú giao hàng nếu có..."
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    checkoutLoading ||
                    cart.length === 0 ||
                    isCalculatingFee ||
                    shippingFee === null ||
                    !!shippingFeeError
                  }
                  className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {checkoutLoading
                    ? 'ĐANG TẠO ĐƠN HÀNG...'
                    : isCalculatingFee
                    ? 'ĐANG TÍNH PHÍ VẬN CHUYỂN GHN...'
                    : shippingFee !== null
                    ? `XÁC NHẬN ĐẶT HÀNG (${formatPrice(finalGrandTotal)})`
                    : 'VUI LÒNG CHỌN ĐỊA CHỈ GIAO HÀNG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THÔNG BÁO ĐẶT HÀNG THÀNH CÔNG */}
      {/* ========================================================= */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-['Montserrat',sans-serif]">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setOrderSuccess(null)} />

          <div className="relative bg-white text-black max-w-md w-full p-6 sm:p-8 z-10 shadow-2xl text-center space-y-4 border border-neutral-200 animate-scale-in">
            <div className="w-12 h-12 bg-black text-white rounded-full mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black tracking-widest uppercase">ĐẶT HÀNG THÀNH CÔNG!</h3>
              <p className="text-xs text-neutral-500 mt-1">Cảm ơn bạn đã tin tưởng mua sắm tại M.B.B.C.</p>
            </div>
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-black">{orderSuccess.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Người nhận:</span>
                <span className="font-semibold text-black">{orderSuccess.customer?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Số điện thoại:</span>
                <span className="font-semibold text-black">{orderSuccess.customer?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Địa chỉ giao:</span>
                <span className="font-semibold text-black truncate max-w-[220px]" title={orderSuccess.customer?.address}>
                  {orderSuccess.customer?.address}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200 text-neutral-600">
                <span>Phí ship GHN:</span>
                <span className="font-bold text-black">{formatPrice(orderSuccess.shippingFee || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200">
                <span className="text-neutral-500 font-bold">Tổng thanh toán:</span>
                <span className="font-black text-red-600 text-sm">{formatPrice(orderSuccess.totalAmount)}</span>
              </div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              TIẾP TỤC MUA SẮM
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL ĐƠN HÀNG CỦA TÔI */}
      {/* ========================================================= */}
      <MyOrdersModal isOpen={isMyOrdersOpen} onClose={() => setIsMyOrdersOpen(false)} />

      {/* ========================================================= */}
      {/* MODAL ĐÁNH GIÁ CỦA TÔI */}
      {/* ========================================================= */}
      <MyReviewsModal isOpen={isMyReviewsOpen} onClose={() => setIsMyReviewsOpen(false)} />

      {/* ========================================================= */}
      {/* TOAST THÔNG BÁO GÓC DƯỚI */}
      {/* ========================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-black text-white px-5 py-3 shadow-2xl flex items-center gap-3 border border-neutral-800 animate-slide-up font-['Montserrat',sans-serif]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}
    </>
  );
};

// Helper tính cost của item
const itemTotalCost = (it) => {
  return it.quantity || 1;
};

export default StoreModals;
