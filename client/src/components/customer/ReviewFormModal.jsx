import React, { useState, useEffect } from 'react';
import StarRatingInput from '../common/StarRatingInput';
import { createReview, updateMyReview } from '../../services/reviewApi';
import { getVariantColorHex } from '../VariantSelect';

// Icons
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PhotoIcon = () => (
  <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const ReviewFormModal = ({
  isOpen,
  onClose,
  product,
  eligibleOrders = [],
  reviewToEdit = null, // Nếu có thì là chế độ chỉnh sửa
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // File objects
  const [previewUrls, setPreviewUrls] = useState([]); // URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Khởi tạo state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      if (reviewToEdit) {
        setRating(reviewToEdit.rating || 5);
        setContent(reviewToEdit.content || '');
        setSelectedOrderId(reviewToEdit.orderId?._id || reviewToEdit.orderId || '');
        setSelectedFiles([]);
        setPreviewUrls(reviewToEdit.images || []);
      } else {
        setRating(5);
        setContent('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        if (eligibleOrders && eligibleOrders.length > 0) {
          setSelectedOrderId(eligibleOrders[0].orderId);
        } else {
          setSelectedOrderId('');
        }
      }
    }
  }, [isOpen, reviewToEdit, eligibleOrders]);

  if (!isOpen) return null;

  // Xử lý chọn ảnh thực tế
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - previewUrls.length;
    if (files.length > remainingSlots) {
      setError(`Bạn chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (tổng tối đa 5 ảnh)`);
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      // Validate loại file
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        setError('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP');
        return;
      }
      // Validate dung lượng (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`Ảnh "${file.name}" vượt quá dung lượng tối đa 5MB`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setError('');
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = (index) => {
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit đánh giá
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!content.trim() || content.trim().length < 5) {
      setError('Nội dung nhận xét tối thiểu 5 ký tự');
      return;
    }

    if (content.trim().length > 1000) {
      setError('Nội dung nhận xét không được vượt quá 1,000 ký tự');
      return;
    }

    if (!reviewToEdit && !selectedOrderId) {
      setError('Vui lòng chọn đơn hàng đã mua sản phẩm này');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('content', content.trim());

      if (!reviewToEdit) {
        formData.append('productId', product._id || product.id);
        formData.append('orderId', selectedOrderId);
      }

      // Thêm các file mới
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Nếu là edit và có giữ ảnh cũ dạng URL
      if (reviewToEdit) {
        const retainedUrls = previewUrls.filter((url) => typeof url === 'string' && url.startsWith('http'));
        if (retainedUrls.length > 0) {
          formData.append('images', JSON.stringify(retainedUrls));
        }
      }

      let res;
      if (reviewToEdit) {
        res = await updateMyReview(reviewToEdit._id, formData);
      } else {
        res = await createReview(formData);
      }

      if (res.data?.success) {
        const msg = reviewToEdit
          ? 'Đánh giá của bạn đã được cập nhật và đang chờ Admin duyệt lại'
          : 'Đánh giá của bạn đã được gửi và đang chờ Admin duyệt';
        setSuccessMessage(msg);

        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1800);
      }
    } catch (err) {
      console.error('Lỗi gửi đánh giá:', err);
      const errMsg = err.response?.data?.message || 'Không thể gửi đánh giá, vui lòng thử lại';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedOrderObj = (eligibleOrders || []).find((o) => o.orderId === selectedOrderId);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 md:p-6 font-['Montserrat',sans-serif]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 z-10 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">
              {reviewToEdit ? 'CHỈNH SỬA ĐÁNH GIÁ' : 'GỬI ĐÁNH GIÁ SẢN PHẨM'}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Đánh giá của bạn sẽ được Admin kiểm duyệt trước khi hiển thị công khai
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Thông tin sản phẩm */}
          <div className="flex items-center gap-3.5 p-3 bg-neutral-50 border border-neutral-200">
            <img
              src={product?.image || 'https://placehold.co/100x120/151515/ffffff?text=MBBC'}
              alt={product?.name || 'Sản phẩm'}
              className="w-14 h-16 object-cover bg-neutral-200 shrink-0 border border-neutral-300"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                {product?.category || 'STREETWEAR'}
              </span>
              <h4 className="text-xs font-black uppercase text-neutral-900 truncate">
                {product?.name || 'Sản phẩm MBBC'}
              </h4>
              {selectedOrderObj && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-600 bg-neutral-200/70 px-1.5 py-0.5">
                    Đơn: {selectedOrderObj.orderCode}
                  </span>
                  {selectedOrderObj.variant?.size && (
                    <span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                      Size: {selectedOrderObj.variant.size}
                    </span>
                  )}
                  {selectedOrderObj.variant?.color && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                      <span
                        className="w-2 h-2 rounded-full border border-neutral-300"
                        style={{ backgroundColor: getVariantColorHex(selectedOrderObj.variant.color) }}
                      />
                      <span>Màu: {selectedOrderObj.variant.color}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-fade-in flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">
                ✓
              </div>
              <p>{successMessage}</p>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Chọn đơn hàng nếu có nhiều đơn */}
              {!reviewToEdit && eligibleOrders.length > 1 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Chọn đơn hàng bạn đã mua sản phẩm này:
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full text-xs font-medium border border-neutral-300 p-2.5 bg-white text-black focus:outline-none focus:border-black"
                  >
                    {eligibleOrders.map((ord) => (
                      <option key={ord.orderId} value={ord.orderId}>
                        Mã đơn: {ord.orderCode} (Mua ngày {new Date(ord.orderDate).toLocaleDateString('vi-VN')})
                        {ord.variant?.size ? ` - Size: ${ord.variant.size}` : ''}
                        {ord.variant?.color ? ` - Màu: ${ord.variant.color}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* STAR RATING INTERACTIVE ELEMENT (LUCIAN PROMPT #016) */}
              <div className="py-2 border-y border-neutral-100">
                <StarRatingInput
                  value={rating}
                  onChange={(newRating) => setRating(newRating)}
                  question="Bạn cảm nhận thế nào về sản phẩm này?"
                />
              </div>

              {/* Nhập nội dung nhận xét */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Nội dung nhận xét <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {content.length}/1000 ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={1000}
                  placeholder="Hãy chia sẻ trải nghiệm về chất liệu, form dáng, độ vừa vặn và màu sắc thực tế..."
                  className="w-full text-xs p-3 border border-neutral-300 focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
                />
                <p className="text-[10px] text-neutral-400 mt-1 italic">
                  * Tối thiểu 5 ký tự. Vui lòng không sử dụng từ ngữ thô tục hoặc spam.
                </p>
              </div>

              {/* Tải ảnh thực tế */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Hình ảnh thực tế (Tối đa 5 ảnh)
                </label>

                <div className="grid grid-cols-5 gap-2.5">
                  {/* Thumbnails các ảnh đã chọn */}
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square border border-neutral-200 bg-neutral-100 group overflow-hidden">
                      <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/80 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-black transition-colors"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Nút thêm ảnh */}
                  {previewUrls.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-neutral-300 hover:border-black flex flex-col items-center justify-center cursor-pointer transition-colors text-center p-2 bg-neutral-50/50 hover:bg-neutral-50">
                      <PhotoIcon />
                      <span className="text-[10px] font-bold text-neutral-600 mt-1 uppercase">Thêm ảnh</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5">
                  Hỗ trợ định dạng JPG, PNG, WEBP. Dung lượng tối đa 5MB mỗi ảnh.
                </p>
              </div>

              {/* Nút gửi */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>{loading ? 'ĐANG GỬI...' : reviewToEdit ? 'CẬP NHẬT ĐÁNH GIÁ' : 'GỬI ĐÁNH GIÁ'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewFormModal;
