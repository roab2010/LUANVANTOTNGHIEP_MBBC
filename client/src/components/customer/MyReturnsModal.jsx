import React, { useState, useEffect } from 'react';
import { getMyReturns, cancelReturnRequest } from '../../services/returnApi';
import { useCart } from '../../context/CartContext';
import { getVariantColorHex } from '../VariantSelect';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// Format VND currency
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

// Format Date
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Trạng thái yêu cầu đổi trả
const getStatusBadge = (status) => {
  const map = {
    PENDING: { label: 'Chờ tiếp nhận', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    APPROVED: { label: 'Shop đã duyệt', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
    PROCESSING: { label: 'Đang kiểm tra kho', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    COMPLETED: { label: 'Đã hoàn tất', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REJECTED: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-800 border-red-300' },
    CANCELLED: { label: 'Đã hủy', cls: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
  };
  const item = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const getReasonLabel = (reason) => {
  const map = {
    DEFECTIVE: 'Hàng lỗi do sản xuất (bung chỉ, rách, in lỗi)',
    WRONG_SIZE: 'Mặc không vừa size',
    WRONG_ITEM: 'Shop giao nhầm mẫu hoặc sai màu',
    DAMAGED_SHIPPING: 'Hư hỏng khi vận chuyển',
    NOT_AS_DESCRIBED: 'Khác mô tả / hình ảnh',
    OTHER: 'Lý do khác',
  };
  return map[reason] || reason;
};

const MyReturnsModal = ({ isOpen, onClose }) => {
  const { showToast } = useCart();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchReturns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyReturns({ limit: 50 });
      if (res.data?.success && res.data.data?.returns) {
        setReturns(res.data.data.returns);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu đổi trả:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách đổi trả. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReturns();
    }
  }, [isOpen]);

  const handleCancelRequest = async (returnId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu đổi trả này không?')) {
      return;
    }

    setCancellingId(returnId);
    try {
      const res = await cancelReturnRequest(returnId);
      if (res.data?.success) {
        showToast('Đã hủy yêu cầu đổi trả thành công');
        fetchReturns();
      }
    } catch (err) {
      console.error('Lỗi khi hủy yêu cầu đổi trả:', err);
      showToast(err.response?.data?.message || 'Không thể hủy yêu cầu');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 md:p-6 font-['Montserrat',sans-serif]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 z-10 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-widest uppercase">
              YÊU CẦU ĐỔI / TRẢ CỦA TÔI
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Theo dõi tiến độ duyệt đổi size, đổi mẫu và hoàn tiền
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReturns}
              disabled={loading}
              title="Tải lại"
              className="p-1.5 text-neutral-400 hover:text-white transition-colors focus:outline-none"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin text-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors focus:outline-none"
              aria-label="Đóng"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-50/50 space-y-4">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Đang tải yêu cầu đổi trả...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>
              <button
                onClick={fetchReturns}
                className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : returns.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                📦
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-neutral-900 mb-2">
                BẠN CHƯA CÓ YÊU CẦU ĐỔI TRẢ NÀO
              </h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Nếu sản phẩm đã nhận gặp lỗi hoặc không vừa size, bạn có thể tạo yêu cầu đổi/trả trực tiếp tại phần "Đơn hàng của tôi".
              </p>
            </div>
          ) : (
            returns.map((ret) => (
              <div
                key={ret._id}
                className="bg-white border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-3 hover:border-black transition-colors"
              >
                {/* Header card: Mã yêu cầu + Đơn hàng + Trạng thái */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-neutral-900 tracking-wider">
                      {ret.returnCode}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-neutral-200 bg-neutral-100 text-neutral-800">
                      {ret.requestType === 'EXCHANGE' ? 'Đổi hàng' : 'Trả hàng'}
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      • {formatDate(ret.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ret.orderId?.orderCode && (
                      <span className="text-[11px] text-neutral-500 font-mono">
                        Đơn gốc: <b className="text-neutral-800">#{ret.orderId.orderCode}</b>
                      </span>
                    )}
                    {getStatusBadge(ret.status)}
                  </div>
                </div>

                {/* Danh sách sản phẩm đổi trả */}
                <div className="divide-y divide-neutral-100">
                  {ret.items?.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      {/* Image */}
                      <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-neutral-400 font-bold">MBBC</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate uppercase">
                          {it.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-500">
                          {it.size && <span>Size cũ: <b className="text-neutral-800">{it.size}</b></span>}
                          {it.color && <span>Màu: <b className="text-neutral-800">{it.color}</b></span>}
                          <span>• SL: x{it.quantity}</span>
                        </div>

                        {/* Đổi sang size nào (nếu có) */}
                        {ret.requestType === 'EXCHANGE' && it.exchangeSize && (
                          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase rounded">
                            <span>➔ Đổi sang size:</span>
                            <span className="underline">{it.exchangeSize}</span>
                            {it.exchangeColor && <span>({it.exchangeColor})</span>}
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-neutral-900">
                          {formatPrice(it.price * it.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lý do & Mô tả của khách */}
                <div className="bg-neutral-50 p-3 rounded text-xs space-y-1 border border-neutral-100">
                  <p className="text-[11px] text-neutral-500">
                    <span className="font-bold text-neutral-700 uppercase">Lý do:</span>{' '}
                    {getReasonLabel(ret.reason)}
                  </p>
                  <p className="text-neutral-700">
                    <span className="font-bold text-neutral-700 uppercase text-[11px]">Chi tiết:</span>{' '}
                    {ret.reasonDetail}
                  </p>
                </div>

                {/* Hình ảnh minh chứng (nếu có) */}
                {ret.images && ret.images.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Ảnh minh chứng đính kèm ({ret.images.length} ảnh):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ret.images.map((imgUrl, i) => (
                        <a
                          key={i}
                          href={imgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-14 h-14 border border-neutral-200 rounded overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img src={imgUrl} alt="minh-chung" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nếu là Trả hàng -> Hiện thông tin STK hoàn tiền */}
                {ret.requestType === 'RETURN' && ret.bankInfo?.accountNumber && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-emerald-800">
                      <span className="font-bold uppercase">Tài khoản nhận tiền hoàn:</span>{' '}
                      {ret.bankInfo.bankName} - <b>{ret.bankInfo.accountNumber}</b> ({ret.bankInfo.accountHolder})
                    </div>
                    <div className="font-mono text-xs font-bold text-emerald-900">
                      Hoàn: {formatPrice(ret.refundAmount)}
                    </div>
                  </div>
                )}

                {/* Phản hồi / Hướng dẫn từ Admin MBBC (nếu có) */}
                {ret.adminNote && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
                    <p className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>📢</span>
                      <span>Hướng dẫn / Phản hồi từ MBBC Store:</span>
                    </p>
                    <p className="text-blue-800 whitespace-pre-line leading-relaxed">
                      {ret.adminNote}
                    </p>
                  </div>
                )}

                {/* Lý do từ chối (nếu REJECTED) */}
                {ret.status === 'REJECTED' && ret.rejectReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs space-y-1">
                    <p className="font-bold text-red-900 uppercase tracking-wider text-[11px]">
                      Lý do từ chối:
                    </p>
                    <p className="text-red-800">
                      {ret.rejectReason}
                    </p>
                  </div>
                )}

                {/* Action: Nút Hủy yêu cầu (chỉ khi PENDING) */}
                {ret.status === 'PENDING' && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={cancellingId === ret._id}
                      onClick={() => handleCancelRequest(ret._id)}
                      className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    >
                      {cancellingId === ret._id ? 'Đang hủy...' : 'Hủy yêu cầu này'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-white flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
          >
            ĐÓNG
          </button>
        </div>

      </div>
    </div>
  );
};

export default MyReturnsModal;
