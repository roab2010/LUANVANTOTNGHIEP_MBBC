import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { createReturnRequest, checkReturnEligibility } from '../../services/returnApi';
import { getVariantColorHex } from '../VariantSelect';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PhotoIcon = () => (
  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

// Format VND currency
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

// Danh sách ngân hàng phổ biến tại Việt Nam
const POPULAR_BANKS = [
  'Vietcombank',
  'MB Bank (Quân Đội)',
  'Techcombank',
  'ACB (Á Châu)',
  'VietinBank',
  'BIDV',
  'TPBank',
  'VPBank',
  'Sacombank',
  'HDBank',
  'VIB',
  'Ngân hàng khác',
];

// Danh sách các lý do đổi trả
const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Hàng lỗi do sản xuất (rách, bẩn, bung chỉ, lỗi in)' },
  { value: 'WRONG_SIZE', label: 'Mặc không vừa size (quá chật hoặc quá rộng)' },
  { value: 'WRONG_ITEM', label: 'Shop giao nhầm mẫu hoặc sai màu sắc' },
  { value: 'DAMAGED_SHIPPING', label: 'Hàng bị hư hỏng / móp méo trong khi vận chuyển' },
  { value: 'NOT_AS_DESCRIBED', label: 'Sản phẩm thực tế khác với hình ảnh / mô tả' },
  { value: 'OTHER', label: 'Lý do khác' },
];

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', '2XL', 'Oversize'];

const ReturnRequestModal = ({ isOpen, onClose, order, onSuccess }) => {
  const { showToast, setIsMyReturnsOpen } = useCart();

  // State
  const [requestType, setRequestType] = useState('EXCHANGE'); // 'EXCHANGE' | 'RETURN'
  const [selectedItems, setSelectedItems] = useState({}); // { [productId]: { selected: bool, quantity: num, exchangeSize: str, exchangeColor: str } }
  const [reason, setReason] = useState('DEFECTIVE');
  const [reasonDetail, setReasonDetail] = useState('');
  const [images, setImages] = useState([]); // file objects
  const [imagePreviews, setImagePreviews] = useState([]); // data URLs
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Vietcombank',
    accountNumber: '',
    accountHolder: '',
  });

  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ineligibleMsg, setIneligibleMsg] = useState('');

  // Khi modal mở với đơn hàng cụ thể, khởi tạo dữ liệu
  useEffect(() => {
    if (isOpen && order?._id) {
      setErrorMsg('');
      setIneligibleMsg('');
      setRequestType('EXCHANGE');
      setReason('DEFECTIVE');
      setReasonDetail('');
      setImages([]);
      setImagePreviews([]);
      setBankInfo({
        bankName: 'Vietcombank',
        accountNumber: '',
        accountHolder: '',
      });

      // Mặc định chọn tất cả sản phẩm trong đơn
      const initialMap = {};
      (order.items || []).forEach((it) => {
        const pId = it.product?._id || it.product || it._id;
        initialMap[pId] = {
          selected: true,
          quantity: it.quantity || 1,
          maxQuantity: it.quantity || 1,
          exchangeSize: it.size || 'M',
          exchangeColor: it.color || '',
          price: it.price || 0,
          name: it.name || it.product?.name || 'Sản phẩm',
          image: it.image || it.product?.image || '',
          size: it.size || '',
          color: it.color || '',
        };
      });
      setSelectedItems(initialMap);

      // Kiểm tra eligibility từ backend
      checkEligibility(order._id);
    }
  }, [isOpen, order]);

  const checkEligibility = async (orderId) => {
    setChecking(true);
    try {
      const res = await checkReturnEligibility(orderId);
      if (res.data?.success && res.data.data) {
        if (!res.data.data.eligible) {
          setIneligibleMsg(res.data.data.reason || 'Đơn hàng không đủ điều kiện đổi trả.');
        }
      }
    } catch (err) {
      console.error('Lỗi kiểm tra điều kiện đổi trả:', err);
      // Không chặn cứng UI nếu server tạm lỗi mạng
    } finally {
      setChecking(false);
    }
  };

  // Xử lý chọn/bỏ chọn item
  const handleToggleItem = (productId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: !prev[productId]?.selected,
      },
    }));
  };

  // Cập nhật số lượng đổi trả cho từng item
  const handleItemQtyChange = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    setSelectedItems((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const validQty = Math.max(1, Math.min(item.maxQuantity, isNaN(qty) ? 1 : qty));
      return {
        ...prev,
        [productId]: {
          ...item,
          quantity: validQty,
        },
      };
    });
  };

  // Cập nhật size muốn đổi sang
  const handleExchangeSizeChange = (productId, size) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        exchangeSize: size,
      },
    }));
  };

  // Xử lý chọn ảnh minh chứng (tối đa 5 ảnh)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg('Bạn chỉ được chọn tối đa 5 hình ảnh minh chứng');
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const validFiles = [];
    const validPreviews = [];

    for (const f of selectedFiles) {
      if (f.size > 5 * 1024 * 1024) {
        setErrorMsg(`Ảnh ${f.name} vượt quá dung lượng 5MB`);
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...validPreviews]);
    e.target.value = '';
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Tính tổng tiền hoàn tạm tính (nếu RETURN)
  const estimatedRefundAmount = Object.values(selectedItems)
    .filter((it) => it.selected)
    .reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

  // Xử lý Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Kiểm tra có chọn sản phẩm không
    const activeItems = Object.entries(selectedItems)
      .filter(([_, it]) => it.selected)
      .map(([productId, it]) => ({
        product: productId,
        name: it.name,
        image: it.image,
        size: it.size,
        color: it.color,
        price: it.price,
        quantity: it.quantity,
        exchangeSize: requestType === 'EXCHANGE' ? it.exchangeSize : '',
        exchangeColor: requestType === 'EXCHANGE' ? it.exchangeColor : '',
      }));

    if (activeItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 sản phẩm bạn muốn đổi hoặc trả');
      return;
    }

    // 2. Validate lý do chi tiết
    if (!reasonDetail.trim() || reasonDetail.trim().length < 5) {
      setErrorMsg('Vui lòng nhập mô tả chi tiết lý do (tối thiểu 5 ký tự) để nhân viên hỗ trợ nhanh nhất');
      return;
    }

    // 3. Nếu là RETURN -> validate tài khoản ngân hàng
    if (requestType === 'RETURN') {
      if (!bankInfo.bankName.trim() || !bankInfo.accountNumber.trim() || !bankInfo.accountHolder.trim()) {
        setErrorMsg('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('requestType', requestType);
      formData.append('reason', reason);
      formData.append('reasonDetail', reasonDetail.trim());
      formData.append('items', JSON.stringify(activeItems));

      if (requestType === 'RETURN') {
        formData.append('bankInfo', JSON.stringify(bankInfo));
      }

      // Đính kèm các file ảnh
      images.forEach((imgFile) => {
        formData.append('images', imgFile);
      });

      const res = await createReturnRequest(formData);

      if (res.data?.success) {
        showToast('Gửi yêu cầu đổi trả thành công!');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
        // Mở popup theo dõi yêu cầu của tôi
        setTimeout(() => {
          setIsMyReturnsOpen(true);
        }, 300);
      }
    } catch (err) {
      console.error('Lỗi khi gửi yêu cầu đổi trả:', err);
      setErrorMsg(err.response?.data?.message || 'Không thể gửi yêu cầu đổi trả. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 md:p-6 font-['Montserrat',sans-serif]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 z-10 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded text-white">
                MBBC SUPPORT
              </span>
              <span className="text-[11px] font-mono text-neutral-300">
                #{order?.orderCode || 'ĐƠN HÀNG'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black tracking-wider uppercase mt-1">
              YÊU CẦU ĐỔI / TRẢ HÀNG
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors focus:outline-none"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Cảnh báo không đủ điều kiện (nếu có) */}
        {ineligibleMsg ? (
          <div className="p-6 text-center overflow-y-auto">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              !
            </div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase mb-2">
              Thông Báo Đổi Trả
            </h4>
            <p className="text-xs text-neutral-600 max-w-md mx-auto mb-6">
              {ineligibleMsg}
            </p>
            <button
              onClick={() => {
                onClose();
                setIsMyReturnsOpen(true);
              }}
              className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              Xem các yêu cầu đổi trả của tôi
            </button>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-neutral-50/50">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium flex items-center gap-2">
                <span className="font-bold text-sm">⚠</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Bước 1: Chọn loại yêu cầu (EXCHANGE hoặc RETURN) */}
            <div className="bg-white p-4 border border-neutral-200 shadow-2xs">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5">
                1. Chọn hình thức hỗ trợ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('EXCHANGE')}
                  className={`p-3 text-left border transition-all ${
                    requestType === 'EXCHANGE'
                      ? 'border-black bg-neutral-900 text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔄</span>
                    <span>ĐỔI HÀNG / SIZE</span>
                  </p>
                  <p className={`text-[10px] mt-1 ${requestType === 'EXCHANGE' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Đổi sang size khác hoặc đổi sản phẩm lỗi lấy hàng mới
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('RETURN')}
                  className={`p-3 text-left border transition-all ${
                    requestType === 'RETURN'
                      ? 'border-black bg-neutral-900 text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>💸</span>
                    <span>TRẢ HÀNG & HOÀN TIỀN</span>
                  </p>
                  <p className={`text-[10px] mt-1 ${requestType === 'RETURN' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Trả lại sản phẩm và nhận hoàn tiền qua tài khoản ngân hàng
                  </p>
                </button>
              </div>
            </div>

            {/* Bước 2: Chọn sản phẩm trong đơn cần đổi/trả */}
            <div className="bg-white p-4 border border-neutral-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  2. Chọn sản phẩm cần {requestType === 'EXCHANGE' ? 'đổi' : 'trả'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-neutral-500">
                  (Tích chọn mặt hàng)
                </span>
              </div>

              <div className="divide-y divide-neutral-100">
                {(order?.items || []).map((it, idx) => {
                  const pId = it.product?._id || it.product || it._id;
                  const itemState = selectedItems[pId] || { selected: false, quantity: 1, exchangeSize: it.size || 'M' };
                  const itemImg = it.image || it.product?.image || '';

                  return (
                    <div
                      key={idx}
                      className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        itemState.selected ? 'bg-neutral-50/80 -mx-2 px-2' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={itemState.selected}
                          onChange={() => handleToggleItem(pId)}
                          className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-black cursor-pointer"
                        />

                        {/* Thumbnail */}
                        <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
                          {itemImg ? (
                            <img src={itemImg} alt={it.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-bold">MBBC</span>
                          )}
                        </div>

                        {/* Name & variant */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-neutral-900 truncate uppercase">
                            {it.name || it.product?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                            {it.size && <span>Size: <b className="text-neutral-800">{it.size}</b></span>}
                            {it.color && (
                              <span className="flex items-center gap-1">
                                Màu: <b className="text-neutral-800">{it.color}</b>
                              </span>
                            )}
                            <span>• Mua: x{it.quantity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tùy chọn số lượng & size muốn đổi */}
                      {itemState.selected && (
                        <div className="flex items-center gap-3 shrink-0 pl-7 sm:pl-0">
                          {/* Số lượng */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">SL:</span>
                            <select
                              value={itemState.quantity}
                              onChange={(e) => handleItemQtyChange(pId, e.target.value)}
                              className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white font-semibold focus:outline-none focus:border-black"
                            >
                              {Array.from({ length: itemState.maxQuantity || 1 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Chọn size đổi sang (nếu EXCHANGE) */}
                          {requestType === 'EXCHANGE' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-neutral-500 uppercase">Đổi sang size:</span>
                              <select
                                value={itemState.exchangeSize}
                                onChange={(e) => handleExchangeSizeChange(pId, e.target.value)}
                                className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white font-bold text-neutral-900 focus:outline-none focus:border-black"
                              >
                                {STANDARD_SIZES.map((sz) => (
                                  <option key={sz} value={sz}>
                                    Size {sz}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Đơn giá */}
                          <div className="text-right min-w-[70px]">
                            <span className="font-mono text-xs font-bold text-neutral-900">
                              {formatPrice(it.price * itemState.quantity)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bước 3: Lý do & Mô tả */}
            <div className="bg-white p-4 border border-neutral-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                3. Lý do yêu cầu đổi/trả <span className="text-red-500">*</span>
              </label>

              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded p-2.5 bg-white text-neutral-800 font-medium focus:outline-none focus:border-black"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-neutral-600 uppercase">
                    Mô tả chi tiết vấn đề bạn gặp phải <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {reasonDetail.length}/1000 ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value.slice(0, 1000))}
                  placeholder="Ví dụ: Sản phẩm bị bung đường chỉ nách áo bên trái, muốn đổi sang size L..."
                  className="w-full text-xs border border-neutral-300 rounded p-3 focus:outline-none focus:border-black resize-none"
                />
              </div>
            </div>

            {/* Bước 4: Tải ảnh minh chứng (tối đa 5 ảnh) */}
            <div className="bg-white p-4 border border-neutral-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  4. Hình ảnh minh chứng sản phẩm <span className="text-[10px] text-neutral-400 lowercase font-normal">(tùy chọn, tối đa 5 ảnh)</span>
                </label>
                <span className="text-[10px] font-bold text-neutral-400">
                  {images.length}/5 ảnh
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {imagePreviews.map((previewUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 border border-neutral-200 rounded overflow-hidden group shadow-2xs"
                  >
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-opacity opacity-90 group-hover:opacity-100"
                      title="Xóa ảnh này"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {images.length < 5 && (
                  <label className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-neutral-300 hover:border-black rounded flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-50/50">
                    <PhotoIcon />
                    <span className="text-[9px] font-bold text-neutral-500 uppercase mt-1">Thêm ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 italic">
                * Khuyến khích gửi ảnh chụp cận cảnh tem mác hoặc phần lỗi để được duyệt nhanh trong ngày.
              </p>
            </div>

            {/* Bước 5: Thông tin tài khoản hoàn tiền (Chỉ hiện khi RETURN) */}
            {requestType === 'RETURN' && (
              <div className="bg-white p-4 border border-neutral-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    5. Thông tin tài khoản nhận tiền hoàn <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    Tạm tính hoàn: {formatPrice(estimatedRefundAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Ngân hàng <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankInfo.bankName}
                      onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                      className="w-full text-xs border border-neutral-300 rounded p-2 bg-white focus:outline-none focus:border-black font-medium"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Số tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 0123456789"
                      value={bankInfo.accountNumber}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value.replace(/\s+/g, '') })}
                      className="w-full text-xs border border-neutral-300 rounded p-2 focus:outline-none focus:border-black font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Tên chủ tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="NGUYEN VAN A"
                      value={bankInfo.accountHolder}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value.toUpperCase() })}
                      className="w-full text-xs border border-neutral-300 rounded p-2 focus:outline-none focus:border-black font-bold uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin liên hệ lấy hàng */}
            <div className="text-[11px] text-neutral-500 bg-neutral-100 p-3 rounded space-y-1">
              <p className="font-bold text-neutral-700 uppercase tracking-wider">
                Địa chỉ nhận hàng / thu hồi từ đơn hàng:
              </p>
              <p>
                <span className="font-semibold text-neutral-800">{order?.customer?.fullName}</span> ({order?.customer?.phone}) - {order?.customer?.address}
              </p>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        {!ineligibleMsg && (
          <div className="px-6 py-3.5 border-t border-neutral-200 bg-white flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors"
            >
              HỦY BỎ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || checking}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ĐANG GỬI...</span>
                </>
              ) : (
                <span>GỬI YÊU CẦU ĐỔI TRẢ</span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReturnRequestModal;
