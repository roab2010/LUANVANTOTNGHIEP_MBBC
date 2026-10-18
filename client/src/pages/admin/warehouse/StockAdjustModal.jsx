import { useState, useEffect } from 'react';
import { getSuppliers } from '../../../services/supplierApi';
import { createImportReceipt } from '../../../services/importReceiptApi';

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
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const StockAdjustModal = ({ item, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [importPrice, setImportPrice] = useState(item?.costPrice || '');
  const [qtyError, setQtyError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [reason, setReason] = useState('Nhập thêm hàng mới');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tải danh sách nhà cung cấp
  useEffect(() => {
    const fetchSupplierList = async () => {
      try {
        setSuppliersLoading(true);
        const res = await getSuppliers({ status: 'active', limit: 100 });
        const list = res.data?.data?.suppliers || [];
        setSuppliers(list);
        if (list.length > 0) {
          setSupplierId(list[0]._id);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách nhà cung cấp:', err);
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSupplierList();
  }, []);

  const currentStock = item?.stock || 0;
  const numQty = parseInt(quantity) || 0;
  const previewStock = currentStock + numQty;

  const handleQuantityChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setError('');

    if (raw === '') {
      setQuantity('');
      setQtyError('');
      return;
    }

    const num = Number(raw);
    if (num > 10000) {
      setQtyError('Số lượng nhập tối đa là 10.000 sản phẩm');
      return; // Chặn không cho nhập thêm
    }

    setQuantity(raw);
    setQtyError('');
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setError('');

    if (raw === '') {
      setImportPrice('');
      setPriceError('');
      return;
    }

    const num = Number(raw);
    if (num > 10000000) {
      setPriceError('Đơn giá nhập tối đa là 10.000.000 ₫');
      return; // Chặn không cho nhập thêm
    }

    setImportPrice(raw);
    setPriceError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Vui lòng chọn nhà cung cấp đối tác');
      return;
    }

    if (quantity === '' || isNaN(numQty) || numQty <= 0) {
      setQtyError('Vui lòng nhập số lượng cần nhập thêm (từ 1 trở lên)');
      return;
    }

    if (numQty > 10000) {
      setQtyError('Số lượng nhập tối đa là 10.000 sản phẩm');
      return;
    }

    const priceNum = Number(importPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setPriceError('Đơn giá nhập không hợp lệ');
      return;
    }

    if (priceNum > 10000000) {
      setPriceError('Đơn giá nhập tối đa là 10.000.000 ₫');
      return;
    }

    setLoading(true);
    try {
      // Tạo phiếu nhập hàng để tự động tăng tồn kho và lưu lịch sử nhà cung cấp
      await createImportReceipt({
        supplierId,
        items: [
          {
            product: item._id,
            quantity: numQty,
            importPrice: priceNum || item.costPrice || 0,
          },
        ],
        note: reason || `Nhập thêm hàng cho ${item.name}`,
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

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Thông tin tồn hiện tại */}
          <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between text-sm">
            <span className="text-gray-600">Tồn kho hiện tại:</span>
            <span className="font-bold text-gray-900 text-base">{currentStock} {item?.unit || 'cái'}</span>
          </div>

          {/* Chọn Nhà cung cấp */}
          <div>
            <label htmlFor="adjust-supplier" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nhà cung cấp đối tác <span className="text-danger-500">*</span>
            </label>
            <select
              id="adjust-supplier"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setError('');
              }}
              disabled={loading || suppliersLoading}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                </option>
              ))}
            </select>
            {suppliers.length === 0 && !suppliersLoading && (
              <p className="text-xs text-amber-600 mt-1">
                Chưa có nhà cung cấp nào. Vui lòng vào mục Nhà cung cấp để thêm trước.
              </p>
            )}
          </div>

          {/* Số lượng + Đơn giá nhập */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="adjust-qty" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Số lượng nhập <span className="text-danger-500">*</span></span>
                <span className="text-xs text-gray-400 font-normal">Tối đa 10.000</span>
              </label>
              <input
                id="adjust-qty"
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="Từ 1 đến 10.000..."
                autoFocus
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all duration-200 ${
                  qtyError
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-[3px] focus:ring-danger-500/15'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15'
                }`}
              />
              {qtyError && (
                <p className="mt-1 text-xs text-danger-600 font-medium">{qtyError}</p>
              )}
            </div>

            <div>
              <label htmlFor="adjust-price" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Đơn giá nhập (₫)</span>
                <span className="text-xs text-gray-400 font-normal">Tối đa 10 triệu</span>
              </label>
              <input
                id="adjust-price"
                type="text"
                inputMode="numeric"
                value={importPrice}
                onChange={handlePriceChange}
                placeholder="Tối đa 10.000.000"
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all duration-200 ${
                  priceError
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-[3px] focus:ring-danger-500/15'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15'
                }`}
              />
              {priceError && (
                <p className="mt-1 text-xs text-danger-600 font-medium">{priceError}</p>
              )}
            </div>
          </div>

          {/* Xem trước tồn sau khi nhập thêm */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-lg flex items-center justify-between text-sm">
            <span className="text-emerald-800 font-medium">Tồn kho sau khi nhập:</span>
            <span className="font-bold text-emerald-900 text-base">{previewStock} {item?.unit || 'cái'}</span>
          </div>

          {/* Lý do / Ghi chú */}
          <div>
            <label htmlFor="adjust-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
              Lý do / Ghi chú nhập hàng
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
              <option value="Đợt nhập bổ sung kho">Đợt nhập bổ sung kho</option>
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
              disabled={loading || suppliers.length === 0}
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
