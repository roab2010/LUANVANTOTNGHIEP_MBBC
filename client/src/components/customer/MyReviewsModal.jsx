import React, { useState, useEffect } from 'react';
import StarRatingDisplay from '../common/StarRatingDisplay';
import { getMyReviews, deleteMyReview } from '../../services/reviewApi';
import { useCart } from '../../context/CartContext';
import { getVariantColorHex } from '../VariantSelect';

// Icons
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status) => {
  const map = {
    PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REJECTED: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-800 border-red-300' },
    HIDDEN: { label: 'Đã ẩn', cls: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
  };
  const item = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const MyReviewsModal = ({ isOpen, onClose }) => {
  const { showToast } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Xóa đánh giá
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyReviews({ limit: 50 });
      if (res.data?.success && Array.isArray(res.data.data?.reviews)) {
        setReviews(res.data.data.reviews);
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá của tôi:', err);
      setError('Không thể tải danh sách đánh giá của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyReviews();
    }
  }, [isOpen]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }
    setDeletingId(reviewId);
    try {
      const res = await deleteMyReview(reviewId);
      if (res.data?.success) {
        showToast('Đã xóa đánh giá thành công');
        fetchMyReviews();
      }
    } catch (err) {
      console.error('Lỗi xóa đánh giá:', err);
      showToast(err.response?.data?.message || 'Không thể xóa đánh giá');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 md:p-6 font-['Montserrat',sans-serif]">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />

        {/* Modal Dialog */}
        <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 z-10 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">ĐÁNH GIÁ CỦA TÔI</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Quản lý lịch sử và trạng thái kiểm duyệt các đánh giá bạn đã gửi
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {loading ? (
              <div className="py-16 text-center text-neutral-400 space-y-2">
                <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold uppercase tracking-wider">Đang tải lịch sử đánh giá...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
                {error}
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-neutral-200 p-8 space-y-3">
                <p className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  BẠN CHƯA CÓ ĐÁNH GIÁ NÀO
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Sau khi nhận hàng thành công từ các đơn hàng MBBC, bạn có thể gửi đánh giá cho từng sản phẩm tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => {
                  const prod = rev.productId;
                  const ord = rev.orderId;

                  return (
                    <div
                      key={rev._id}
                      className="border border-neutral-200 p-4 sm:p-5 hover:border-black transition-colors space-y-3 bg-white"
                    >
                      {/* Dòng 1: Sản phẩm + Trạng thái */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod?.image || 'https://placehold.co/80x100/151515/ffffff?text=MBBC'}
                            alt={prod?.name || 'Sản phẩm'}
                            className="w-12 h-14 object-cover bg-neutral-100 shrink-0 border border-neutral-200"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                              {prod?.category || 'MBBC'}
                            </span>
                            <h4 className="text-xs font-black uppercase text-neutral-900 truncate max-w-xs sm:max-w-md">
                              {prod?.name || 'Sản phẩm MBBC'}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                              <span>Đơn hàng: <strong className="font-mono text-neutral-800">{ord?.orderCode || '—'}</strong></span>
                              <span>•</span>
                              <span>{formatDate(rev.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div>{getStatusBadge(rev.status)}</div>
                      </div>

                      {/* Dòng 2: Biến thể + Sao + Nội dung */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <StarRatingDisplay rating={rev.rating} size="sm" showScore />
                          {(rev.variant?.size || rev.variant?.color) && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-600">
                              {rev.variant.size && (
                                <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200">
                                  Size: {rev.variant.size}
                                </span>
                              )}
                              {rev.variant.color && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 border border-neutral-200">
                                  <span
                                    className="w-2 h-2 rounded-full border border-neutral-300"
                                    style={{ backgroundColor: getVariantColorHex(rev.variant.color) }}
                                  />
                                  <span>{rev.variant.color}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
                          {rev.content}
                        </p>

                        {/* Ảnh thực tế */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {rev.images.map((imgUrl, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgUrl}
                                alt="Ảnh đính kèm"
                                className="w-14 h-14 object-cover border border-neutral-200"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Thông báo lý do từ chối hoặc ẩn từ Admin (nếu có) */}
                      {(rev.status === 'REJECTED' || rev.status === 'HIDDEN') && rev.moderationReason && (
                        <div className="p-3 bg-red-50/80 border border-red-200 text-xs text-red-800 space-y-1">
                          <p className="font-bold uppercase tracking-wider text-[10px]">
                            LÝ DO TỪ CHỐI / ẨN TỪ ADMIN:
                          </p>
                          <p className="italic">"{rev.moderationReason}"</p>
                        </div>
                      )}

                      {/* Phản hồi từ MBBC nếu có */}
                      {rev.adminReply?.content && (
                        <div className="p-3 bg-neutral-50 border-l-2 border-black text-xs text-neutral-700 space-y-1">
                          <p className="font-bold uppercase tracking-wider text-[10px] text-black">
                            PHẢN HỒI TỪ BAN QUẢN TRỊ M.B.B.C:
                          </p>
                          <p className="italic">"{rev.adminReply.content}"</p>
                        </div>
                      )}

                      {/* Thao tác Xóa */}
                      <div className="pt-2 flex items-center justify-end border-t border-neutral-100">
                        <button
                          type="button"
                          disabled={deletingId === rev._id}
                          onClick={() => handleDelete(rev._id)}
                          className="text-[11px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === rev._id ? 'Đang xóa...' : 'Xóa đánh giá'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-neutral-200 bg-white flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyReviewsModal;
