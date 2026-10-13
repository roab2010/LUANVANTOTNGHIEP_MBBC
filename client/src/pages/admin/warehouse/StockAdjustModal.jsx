import { useState } from 'react';
import { adjustStock } from '../../../services/warehouseApi';

// ============================================
// ICON COMPONENTS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const StockAdjustModal = ({ item, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Nhập thêm hàng mới');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStock = item?.stock || 0;
  const numQty = parseInt(quantity) || 0;

  // Tính tồn kho sau khi nhập thêm
  const previewStock = currentStock + numQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (quantity === '' || isNaN(numQty) || numQty <= 0) {
      setError('Vui lòng nhập số lượng cần nhập thêm (từ 1 trở lên)');
      return;
    }

    setLoading(true);
    try {
      await adjustStock({
        productId: item._id,
        actionType: 'add',
        quantity: numQty,
        reason,
      });

      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'Nhập thêm hàng thất bại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !loading && onClose()} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nhập thêm hàng vào kho</h2>
            <p className="text-xs text-gray-500 truncate max-w-xs">{item?.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông tin tồn hiện tại */}
          <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between text-sm">
            <span className="text-gray-600">Tồn kho hiện tại:</span>
            <span className="font-bold text-gray-900 text-base">{currentStock} {item?.unit || 'cái'}</span>
          </div>

          {/* Số lượng cần nhập thêm */}
          <div>
            <label htmlFor="adjust-qty" className="block text-sm font-medium text-gray-700 mb-1.5">
              Số lượng nhập thêm <span className="text-danger-500">*</span>
            </label>
            <input
              id="adjust-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Nhập số lượng cần thêm..."
              autoFocus
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Xem trước tồn sau khi nhập thêm */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-lg flex items-center justify-between text-sm">
            <span className="text-emerald-800 font-medium">Tồn kho sau khi nhập thêm:</span>
            <span className="font-bold text-emerald-900 text-base">{previewStock} {item?.unit || 'cái'}</span>
          </div>

          {/* Lý do */}
          <div>
            <label htmlFor="adjust-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
              Lý do nhập hàng
            </label>
            <select
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            >
              <option value="Nhập thêm hàng mới">Nhập thêm hàng mới</option>
              <option value="Bổ sung hàng bán chạy">Bổ sung hàng bán chạy</option>
              <option value="Nhập hàng theo lô">Nhập hàng theo lô</option>
              <option value="Khác">Lý do khác</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <SpinnerIcon />}
              Xác nhận nhập kho
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
