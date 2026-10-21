import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../services/orderApi';
import { getMyReviews } from '../../services/reviewApi';
import { getVariantColorHex } from '../../components/VariantSelect';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
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

const getStatusBadge = (status) => {
  const map = {
    pending: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    processing: { label: 'Đang xử lý', cls: 'bg-blue-100 text-blue-800 border-blue-300' },
    shipping: { label: 'Đang giao hàng', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    delivered: { label: 'Giao thành công', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 border-red-300' },
  };
  const item = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const MyOrdersModal = ({ isOpen, onClose, onExploreClick }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [reviewedKeys, setReviewedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const [orderRes, reviewRes] = await Promise.allSettled([
        getMyOrders({ limit: 50 }),
        getMyReviews({ limit: 100 }),
      ]);

      if (orderRes.status === 'fulfilled' && orderRes.value.data?.success) {
        setOrders(orderRes.value.data.data?.orders || []);
      }

      if (reviewRes.status === 'fulfilled' && reviewRes.value.data?.success) {
        const revs = reviewRes.value.data.data?.reviews || [];
        const set = new Set();
        revs.forEach((r) => {
          const ordId = r.orderId?._id ? r.orderId._id.toString() : (r.orderId ? r.orderId.toString() : '');
          const prodId = r.productId?._id ? r.productId._id.toString() : (r.productId ? r.productId.toString() : '');
          if (ordId && prodId) {
            set.add(`${ordId}_${prodId}`);
          }
        });
        setReviewedKeys(set);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng:', err);
      setError(err.response?.data?.message || 'Không thể tải lịch sử đơn hàng. Vui lòng đăng nhập lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 z-10 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-900 text-white">
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-[0.16em] uppercase">
              ĐƠN HÀNG CỦA TÔI
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Theo dõi tình trạng đơn hàng & thông tin biến thể quần áo
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              title="Tải lại"
              className="p-1.5 text-neutral-400 hover:text-white transition-colors focus:outline-none"
            >
              <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin text-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors focus:outline-none"
              aria-label="Đóng modal"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-50/50">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Đang tải đơn hàng...
              </p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>
              <button
                onClick={fetchOrders}
                className="px-5 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex justify-center mb-4">
                <PackageIcon />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-neutral-900 mb-2">
                BẠN CHƯA CÓ ĐƠN HÀNG NÀO
              </h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
                Các sản phẩm bạn đặt mua sẽ hiển thị chi tiết tại đây kèm tình trạng vận chuyển và biến thể size, màu sắc.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onExploreClick) onExploreClick();
                }}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-[0.14em] uppercase hover:bg-neutral-800 transition-colors shadow-sm"
              >
                KHÁM PHÁ BỘ SƯU TẬP
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-white border border-neutral-200 p-4 sm:p-5 shadow-sm hover:border-black transition-colors"
                >
                  {/* Dòng đầu: Mã đơn + Badge trạng thái */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-neutral-900 tracking-wider">
                        {ord.orderCode}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        • {formatDate(ord.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-neutral-500">
                        {ord.paymentMethod === 'banking' ? 'Chuyển khoản' : 'COD'}:
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                          ord.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ord.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                      </span>
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  {/* Danh sách sản phẩm của đơn */}
                  <div className="py-3 divide-y divide-neutral-100">
                    {ord.items?.map((it, idx) => {
                      const itemImg =
                        it.image ||
                        it.product?.image ||
                        (Array.isArray(it.product?.images) && it.product.images[0]) ||
                        '';

                      return (
                        <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          {/* Hình ảnh mặt hàng */}
                          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-neutral-100 border border-neutral-200 rounded shrink-0 overflow-hidden flex items-center justify-center">
                            {itemImg ? (
                              <img
                                src={itemImg}
                                alt={it.name || 'Sản phẩm'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="text-[10px] text-neutral-400 font-bold uppercase">MBBC</div>
                            )}
                          </div>

                          {/* Thông tin sản phẩm & Biến thể */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-neutral-900 truncate uppercase tracking-tight">
                              {it.name || it.product?.name || 'Sản phẩm'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {it.size && (
                                <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold tracking-wider rounded border border-neutral-200">
                                  Size: {it.size}
                                </span>
                              )}
                              {it.color && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold tracking-wider rounded border border-neutral-200">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-neutral-300 shadow-2xs shrink-0"
                                    style={{ backgroundColor: getVariantColorHex(it.color) }}
                                  />
                                  <span>Màu: {it.color}</span>
                                </span>
                              )}
                              <span className="text-[11px] font-semibold text-neutral-500">
                                SL: x{it.quantity}
                              </span>
                            </div>
                          </div>

                          {/* Giá tiền & Nút đánh giá */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                            <div>
                              <p className="font-mono font-bold text-neutral-900 text-sm">
                                {formatPrice(it.total || it.price * it.quantity)}
                              </p>
                              <p className="text-[10px] text-neutral-400">
                                {formatPrice(it.price)}/cái
                              </p>
                            </div>

                            {ord.status === 'delivered' && it.product && (() => {
                              const prodId = it.product?._id ? it.product._id.toString() : (it.product ? it.product.toString() : '');
                              const isItemReviewed = it.isReviewed || reviewedKeys.has(`${ord._id}_${prodId}`);

                              return isItemReviewed ? (
                                <div
                                  className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 text-neutral-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 select-none"
                                  title="Bạn đã gửi đánh giá cho sản phẩm này"
                                >
                                  <span className="text-emerald-600 font-bold">✓</span>
                                  <span>ĐÃ ĐÁNH GIÁ</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    navigate(`/product/${prodId}`);
                                    setTimeout(() => {
                                      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 200);
                                  }}
                                  className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 shadow-2xs"
                                >
                                  <span className="text-amber-400">★</span>
                                  <span>Đánh giá</span>
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Thông tin nhận hàng & Tổng thanh toán */}
                  <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:px-5">
                    <div className="text-[11px] text-neutral-600 space-y-0.5">
                      <p>
                        <span className="font-semibold text-neutral-800">Người nhận:</span>{' '}
                        {ord.customer?.fullName} ({ord.customer?.phone})
                      </p>
                      <p className="text-neutral-500 truncate max-w-md">
                        <span className="font-semibold text-neutral-800">Địa chỉ:</span>{' '}
                        {ord.customer?.address || '—'}
                      </p>
                      {ord.notes && (
                        <p className="text-neutral-500 italic">
                          <span className="font-semibold text-neutral-800">Ghi chú:</span> {ord.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">
                        Tổng tiền thanh toán
                      </p>
                      <p className="font-mono text-base font-black text-black">
                        {formatPrice(ord.totalAmount)}
                      </p>
                      {ord.shippingFee > 0 && (
                        <p className="text-[10px] text-neutral-400">
                          (Đã gồm phí ship GHN: {formatPrice(ord.shippingFee)})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
  );
};

export default MyOrdersModal;
