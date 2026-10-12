import { useState } from 'react';
import { updateOrderStatus } from '../../../services/orderApi';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

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
    pending: { label: 'Chờ xác nhận', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    processing: { label: 'Đang xử lý', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    shipping: { label: 'Đang giao hàng', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    delivered: { label: 'Giao thành công', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Đã hủy', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const item = map[status] || { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const OrderDetailModal = ({ order, onClose, onStatusUpdated }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateStatus = async (newStatus) => {
    setLoading(true);
    setError('');
    try {
      await updateOrderStatus(order._id, {
        status: newStatus,
        paymentStatus: newStatus === 'delivered' ? 'paid' : paymentStatus,
      });
      setCurrentStatus(newStatus);
      if (newStatus === 'delivered') setPaymentStatus('paid');
      onStatusUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật trạng thái thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentToggle = async () => {
    const nextPay = paymentStatus === 'paid' ? 'unpaid' : 'paid';
    setLoading(true);
    setError('');
    try {
      await updateOrderStatus(order._id, {
        status: currentStatus,
        paymentStatus: nextPay,
      });
      setPaymentStatus(nextPay);
      onStatusUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật thanh toán thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !loading && onClose()} />

      <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{order.orderCode}</h2>
            {getStatusBadge(currentStatus)}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger-50 border border-red-200 rounded-lg text-sm text-danger-700">
            {error}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Thông tin đặt hàng & khách hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase mb-1">Khách hàng</p>
              <p className="text-sm font-semibold text-gray-900">{order.customer?.fullName}</p>
              <p className="text-sm text-gray-600 mt-0.5">SĐT: {order.customer?.phone}</p>
              <p className="text-sm text-gray-600 mt-0.5">Địa chỉ: {order.customer?.address || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase mb-1">Thông tin đơn</p>
              <p className="text-sm text-gray-600">Thời gian: <span className="font-medium text-gray-800">{formatDate(order.createdAt)}</span></p>
              <p className="text-sm text-gray-600 mt-0.5">
                Phương thức: <span className="font-medium text-gray-800">{order.paymentMethod === 'banking' ? 'Chuyển khoản' : 'Thanh toán khi nhận (COD)'}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">Thanh toán:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
                <button
                  type="button"
                  onClick={handlePaymentToggle}
                  disabled={loading}
                  className="text-xs text-primary-600 underline hover:text-primary-800 ml-1"
                >
                  Đổi
                </button>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {order.notes && (
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-900">
              <span className="font-semibold">Ghi chú:</span> {order.notes}
            </div>
          )}

          {/* Danh sách sản phẩm */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Chi tiết sản phẩm</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs">
                    <th className="py-2.5 px-4 text-left font-semibold">Tên sản phẩm</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Đơn giá</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Số lượng</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-right text-gray-600 tabular-nums">{formatPrice(item.price)}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900 tabular-nums">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold text-gray-900">
                    <td colSpan={3} className="py-3 px-4 text-right">Tổng thanh toán:</td>
                    <td className="py-3 px-4 text-right text-base text-teal-600 tabular-nums">
                      {formatPrice(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Thay đổi trạng thái xử lý đơn hàng */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Chuyển trạng thái đơn hàng</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('pending')}
                disabled={loading || currentStatus === 'pending'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  currentStatus === 'pending'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Chờ xác nhận
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('processing')}
                disabled={loading || currentStatus === 'processing'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  currentStatus === 'processing'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Đang xử lý
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('shipping')}
                disabled={loading || currentStatus === 'shipping'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  currentStatus === 'shipping'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Đang giao hàng
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('delivered')}
                disabled={loading || currentStatus === 'delivered'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  currentStatus === 'delivered'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Giao thành công
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('cancelled')}
                disabled={loading || currentStatus === 'cancelled'}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  currentStatus === 'cancelled'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                }`}
              >
                Hủy đơn
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
