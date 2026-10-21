import React, { useState } from 'react';
import StarRatingDisplay from '../../../components/common/StarRatingDisplay';
import { moderateReview, replyReview } from '../../../services/reviewApi';
import { getVariantColorHex } from '../../../components/VariantSelect';
import mbbcLogo from '../../../assets/logo MBBC.png';

// Format ngày giờ tiếng Việt
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const getStatusBadge = (status) => {
  const map = {
    PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    APPROVED: { label: 'Đã duyệt (Công khai)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REJECTED: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-800 border-red-300' },
    HIDDEN: { label: 'Đã ẩn', cls: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
    DELETED: { label: 'Khách đã xóa', cls: 'bg-gray-100 text-gray-500 border-gray-300' },
  };
  const item = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase border rounded ${item.cls}`}>
      {item.label}
    </span>
  );
};

const ReviewDetailModal = ({
  isOpen,
  onClose,
  review,
  onActionCompleted,
}) => {
  // State nhập lý do khi từ chối hoặc ẩn
  const [reasonModalAction, setReasonModalAction] = useState(null); // 'reject' | 'hide'
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State phản hồi MBBC
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // Lightbox ảnh phóng to
  const [lightboxImg, setLightboxImg] = useState(null);

  if (!isOpen || !review) return null;

  const prod = review.productId || {};
  const cust = review.userId || {};
  const ord = review.orderId || {};

  // Xử lý kiểm duyệt (approve, reject, hide, restore)
  const handleModerate = async (action, customReason = '') => {
    setErrorMessage('');
    setActionLoading(true);
    try {
      const res = await moderateReview(review._id, {
        action,
        reason: customReason,
      });

      if (res.data?.success) {
        setReasonModalAction(null);
        setModerationReason('');
        if (onActionCompleted) onActionCompleted(res.data.data?.review);
      }
    } catch (err) {
      console.error('Lỗi kiểm duyệt đánh giá:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể thực hiện kiểm duyệt');
    } finally {
      setActionLoading(false);
    }
  };

  // Xử lý gửi hoặc sửa phản hồi từ MBBC
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setErrorMessage('Vui lòng nhập nội dung phản hồi của MBBC');
      return;
    }

    setReplyLoading(true);
    setErrorMessage('');
    try {
      const res = await replyReview(review._id, { content: replyContent.trim() });
      if (res.data?.success) {
        setIsReplying(false);
        setReplyContent('');
        if (onActionCompleted) onActionCompleted({ ...review, adminReply: res.data.data?.adminReply });
      }
    } catch (err) {
      console.error('Lỗi gửi phản hồi:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể gửi phản hồi');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 font-['Montserrat',sans-serif]">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />

        {/* Modal Dialog */}
        <div className="relative bg-white w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 z-10 animate-scale-in rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black uppercase tracking-widest">
                CHI TIẾT & KIỂM DUYỆT ĐÁNH GIÁ
              </span>
              <span className="font-mono text-xs text-neutral-400">
                #{review._id?.toString().slice(-6).toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded animate-shake">
                {errorMessage}
              </div>
            )}

            {/* Dòng trạng thái hiện tại & Thao tác kiểm duyệt */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Trạng thái hiện tại:
                </span>
                {getStatusBadge(review.status)}
              </div>

              {/* Nút hành động theo trạng thái */}
              <div className="flex flex-wrap items-center gap-2">
                {review.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleModerate('approve')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                    >
                      Duyệt công khai
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        setReasonModalAction('reject');
                        setModerationReason('');
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </>
                )}

                {review.status === 'APPROVED' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      setReasonModalAction('hide');
                      setModerationReason('');
                    }}
                    className="px-4 py-2 bg-neutral-800 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                  >
                    Ẩn đánh giá
                  </button>
                )}

                {(review.status === 'REJECTED' || review.status === 'HIDDEN') && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleModerate('restore')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                  >
                    Khôi phục hiển thị
                  </button>
                )}
              </div>
            </div>

            {/* Khung lý do từ chối hoặc ẩn trước đó nếu có */}
            {review.moderationReason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                <p className="font-bold uppercase tracking-wider text-[11px]">
                  LÝ DO KIỂM DUYỆT (TỪ CHỐI / ẨN):
                </p>
                <p className="leading-relaxed italic">{review.moderationReason}</p>
                {review.moderatedAt && (
                  <p className="text-[10px] text-red-600 font-mono pt-1">
                    Kiểm duyệt lúc: {formatDateTime(review.moderatedAt)}
                    {review.moderatedBy?.fullName && ` • Bởi: ${review.moderatedBy.fullName}`}
                  </p>
                )}
              </div>
            )}

            {/* Grid 2 cột: Thông tin đối soát đơn hàng & khách hàng (Col 1) và Nội dung đánh giá (Col 2) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* CỘT TRÁI (COL 1-5): THÔNG TIN ĐỐI SOÁT GIAO DỊCH */}
              <div className="md:col-span-5 space-y-4">
                {/* Sản phẩm */}
                <div className="p-4 border border-neutral-200 rounded-lg space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    SẢN PHẨM ĐƯỢC ĐÁNH GIÁ
                  </h4>
                  <div className="flex gap-3">
                    <img
                      src={prod.image || 'https://placehold.co/80x100/151515/ffffff?text=MBBC'}
                      alt={prod.name}
                      className="w-16 h-20 object-cover bg-neutral-100 rounded border border-neutral-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <p className="font-black text-neutral-900 uppercase truncate" title={prod.name}>
                        {prod.name || 'Sản phẩm'}
                      </p>
                      <p className="text-neutral-500 text-[11px] uppercase tracking-wider">
                        {prod.category || 'Streetwear'}
                      </p>
                      <p className="font-mono font-bold text-red-600">
                        {formatPrice(prod.price)}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Đánh giá TB: <strong>{prod.ratingAverage || 0}★</strong> ({prod.reviewCount || 0} lượt)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Khách hàng */}
                <div className="p-4 border border-neutral-200 rounded-lg space-y-2 text-xs">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    KHÁCH HÀNG GỬI ĐÁNH GIÁ
                  </h4>
                  <div className="space-y-1 text-neutral-700">
                    <p>
                      <span className="font-semibold text-neutral-500">Họ và tên:</span>{' '}
                      <strong className="text-black">{cust.fullName || '—'}</strong>
                    </p>
                    <p>
                      <span className="font-semibold text-neutral-500">Email:</span>{' '}
                      <strong className="font-mono text-black">{cust.email || '—'}</strong>
                    </p>
                    {cust.phone && (
                      <p>
                        <span className="font-semibold text-neutral-500">Số điện thoại:</span>{' '}
                        <strong className="font-mono text-black">{cust.phone}</strong>
                      </p>
                    )}
                    <p className="text-[10px] text-neutral-400 pt-1">
                      Thành viên từ: {formatDateTime(cust.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Đơn hàng đối soát */}
                <div className="p-4 border border-neutral-200 rounded-lg space-y-2 text-xs">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    ĐƠN HÀNG XÁC THỰC MUA HÀNG
                  </h4>
                  <div className="space-y-1.5 text-neutral-700">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-neutral-500">Mã đơn hàng:</span>
                      <strong className="font-mono text-black bg-neutral-100 px-2 py-0.5 rounded">
                        {ord.orderCode || '—'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-500">Ngày đặt hàng:</span>
                      <span className="font-mono text-[11px]">{formatDateTime(ord.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-500">Trạng thái đơn:</span>
                      <span className="font-bold text-emerald-700 uppercase text-[11px]">
                        {ord.status === 'delivered' ? 'Giao thành công' : ord.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-neutral-500">Tổng thanh toán:</span>
                      <strong className="font-mono font-black text-black">
                        {formatPrice(ord.totalAmount)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI (COL 6-12): NỘI DUNG ĐÁNH GIÁ & PHẢN HỒI MBBC */}
              <div className="md:col-span-7 space-y-5">
                {/* Khung nội dung đánh giá */}
                <div className="p-5 border border-neutral-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <StarRatingDisplay rating={review.rating} size="md" showScore />
                      <span className="text-xs font-bold text-neutral-500">
                        ({review.rating} trên 5 sao)
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      Gửi lúc: {formatDateTime(review.createdAt)}
                    </span>
                  </div>

                  {/* Biến thể mua */}
                  {(review.variant?.size || review.variant?.color) && (
                    <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded">
                      <span className="font-bold uppercase text-[10px] text-neutral-400">
                        Biến thể đã mua:
                      </span>
                      {review.variant.size && (
                        <span className="font-bold bg-white px-2 py-0.5 border border-neutral-200 rounded text-[11px]">
                          Size: {review.variant.size}
                        </span>
                      )}
                      {review.variant.color && (
                        <span className="inline-flex items-center gap-1.5 font-bold bg-white px-2 py-0.5 border border-neutral-200 rounded text-[11px]">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                            style={{ backgroundColor: getVariantColorHex(review.variant.color) }}
                          />
                          <span>Màu: {review.variant.color}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nội dung nhận xét */}
                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                      NỘI DUNG NHẬN XÉT:
                    </h5>
                    <p className="text-xs text-neutral-900 leading-relaxed p-3 bg-neutral-50/70 rounded border border-neutral-100 whitespace-pre-line font-normal">
                      {review.content}
                    </p>
                  </div>

                  {/* Ảnh thực tế khách tải lên */}
                  {review.images && review.images.length > 0 && (
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                        HÌNH ẢNH THỰC TẾ ({review.images.length} ẢNH - BẤM ĐỂ PHÓNG TO):
                      </h5>
                      <div className="flex flex-wrap gap-2.5">
                        {review.images.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => setLightboxImg(imgUrl)}
                            className="w-20 h-20 border border-neutral-200 rounded overflow-hidden hover:opacity-90 hover:ring-2 hover:ring-black transition-all shrink-0"
                          >
                            <img
                              src={imgUrl}
                              alt={`Ảnh thực tế ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* KHU VỰC PHẢN HỒI CỦA BAN QUẢN TRỊ MBBC */}
                <div className="p-5 border border-neutral-200 rounded-lg space-y-3 bg-[#fafafa]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={mbbcLogo} alt="MBBC" className="h-4 w-auto object-contain" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                        PHẢN HỒI TỪ BAN QUẢN TRỊ M.B.B.C
                      </h4>
                    </div>

                    {review.status === 'APPROVED' && !isReplying && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsReplying(true);
                          setReplyContent(review.adminReply?.content || '');
                        }}
                        className="text-xs font-bold text-black hover:underline uppercase tracking-wider"
                      >
                        {review.adminReply?.content ? 'Chỉnh sửa phản hồi' : '+ Viết phản hồi'}
                      </button>
                    )}
                  </div>

                  {review.status !== 'APPROVED' && (
                    <p className="text-[11px] text-neutral-500 italic">
                      * Đánh giá phải ở trạng thái "Đã duyệt" (APPROVED) mới có thể gửi phản hồi công khai đến khách hàng.
                    </p>
                  )}

                  {review.adminReply?.content && !isReplying && (
                    <div className="p-3.5 bg-white border-l-3 border-black text-xs text-neutral-800 space-y-1">
                      <p className="italic leading-relaxed">"{review.adminReply.content}"</p>
                      {review.adminReply.repliedAt && (
                        <p className="text-[10px] text-neutral-400 font-mono pt-1">
                          Đã gửi lúc: {formatDateTime(review.adminReply.repliedAt)}
                          {review.adminReply.repliedBy?.fullName && ` • Bởi: ${review.adminReply.repliedBy.fullName}`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Form viết phản hồi */}
                  {isReplying && (
                    <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                      <textarea
                        rows={3}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Nhập nội dung phản hồi chính thức từ thương hiệu MBBC..."
                        maxLength={1000}
                        className="w-full text-xs p-3 border border-neutral-300 rounded focus:outline-none focus:border-black resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsReplying(false)}
                          disabled={replyLoading}
                          className="px-3 py-1.5 text-xs font-bold uppercase text-neutral-600 hover:text-black"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={replyLoading}
                          className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                        >
                          {replyLoading ? 'Đang lưu...' : 'Lưu phản hồi'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black rounded transition-colors"
            >
              ĐÓNG
            </button>
          </div>
        </div>
      </div>

      {/* MODAL NHẬP LÝ DO TỪ CHỐI HOẶC ẨN */}
      {reasonModalAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setReasonModalAction(null)}
          />
          <div className="relative bg-white text-black max-w-md w-full p-6 z-10 shadow-2xl border border-neutral-200 rounded-lg animate-scale-in space-y-4">
            <h4 className="text-sm font-black uppercase tracking-wider text-neutral-900">
              {reasonModalAction === 'reject' ? 'LÝ DO TỪ CHỐI ĐÁNH GIÁ' : 'LÝ DO ẨN ĐÁNH GIÁ'}
            </h4>
            <p className="text-xs text-neutral-600">
              Vui lòng nhập lý do cụ thể để lưu vết kiểm duyệt và hiển thị minh bạch cho khách hàng:
            </p>
            <textarea
              rows={3}
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              placeholder={
                reasonModalAction === 'reject'
                  ? 'Ví dụ: Đánh giá chứa từ ngữ không phù hợp, hình ảnh không liên quan đến sản phẩm...'
                  : 'Ví dụ: Vi phạm quy chuẩn cộng đồng MBBC...'
              }
              className="w-full text-xs p-3 border border-neutral-300 rounded focus:outline-none focus:border-black resize-none"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReasonModalAction(null)}
                className="px-4 py-2 text-xs font-bold uppercase text-neutral-600 hover:text-black"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                disabled={actionLoading || !moderationReason.trim()}
                onClick={() => handleModerate(reasonModalAction, moderationReason)}
                className={`px-5 py-2 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 ${
                  reasonModalAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-900 hover:bg-black'
                }`}
              >
                {actionLoading ? 'Đang xử lý...' : 'XÁC NHẬN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHÓNG TO ẢNH THỰC TẾ */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImg}
              alt="Ảnh phóng to"
              className="w-full h-full object-contain max-h-[85vh] rounded"
            />
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReviewDetailModal;
