import { useState, useEffect } from 'react';
import { getSuppliers } from '../../../services/supplierApi';
import { importStock } from '../../../services/warehouseApi';

// ============================================
// ICONS
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

const ImportIcon = () => (
  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const StockAdjustModal = ({ item, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [importPrice, setImportPrice] = useState(item?.costPrice || '');
  const [note, setNote] = useState('');
  const [qtyError, setQtyError] = useState('');
  const [priceError, setPriceError] = useState('');
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

        // Ưu tiên chọn nhà cung cấp đang gắn với sản phẩm
        const currentSupId = typeof item?.supplier === 'object' ? item?.supplier?._id : item?.supplier;
        if (currentSupId && list.some((s) => s._id === currentSupId)) {
          setSupplierId(currentSupId);
        } else if (list.length > 0) {
          setSupplierId(list[0]._id);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách nhà cung cấp:', err);
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSupplierList();
  }, [item]);

  const currentStock = item?.stock || 0;
  const numQty = parseInt(quantity, 10) || 0;
  const previewStock = currentStock + numQty;
  const productCode = item?._id ? `#MBBC-${item._id.slice(-6).toUpperCase()}` : '—';

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
      return; // Chặn nhập thêm
    }

    if (currentStock + num > 10000) {
      setQtyError(`Tồn kho sau nhập (${currentStock + num}) vượt quá giới hạn 10.000`);
      return;
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
      return; // Chặn nhập thêm
    }

    setImportPrice(raw);
    setPriceError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (quantity === '' || isNaN(numQty) || numQty <= 0) {
      setQtyError('Vui lòng nhập số lượng cần nhập (lớn hơn 0)');
      return;
    }

    if (numQty > 10000) {
      setQtyError('Số lượng nhập tối đa là 10.000 sản phẩm');
      return;
    }

    if (currentStock + numQty > 10000) {
      setQtyError(`Tồn kho sau nhập (${currentStock + numQty}) vượt quá giới hạn 10.000`);
      return;
    }

    let priceNum = undefined;
    if (importPrice !== '') {
      priceNum = Number(importPrice);
      if (isNaN(priceNum) || priceNum < 10000 || priceNum > 10000000) {
        setPriceError('Đơn giá nhập hợp lệ từ 10.000 ₫ đến 10.000.000 ₫');
        return;
      }
    }

    setLoading(true);
    try {
      // Gọi API nhập kho trực tiếp tại sản phẩm (Lưu StockHistory thực tế)
      await importStock({
        productId: item._id,
        quantity: numQty,
        supplierId: supplierId || undefined,
        unitPrice: priceNum,
        note: note.trim() || undefined,
      });

      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'Nhập kho sản phẩm thất bại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => !loading && onClose()} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <ImportIcon />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nhập kho sản phẩm</h2>
              <p className="text-xs text-gray-500">Tăng tồn kho & ghi nhận lịch sử</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Thông tin sản phẩm (Chỉ đọc) */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Sản phẩm (Chỉ đọc)
                </span>
                <span className="text-sm font-bold text-gray-900 line-clamp-1">
                  {item?.name}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded shrink-0">
                {productCode}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
              <span className="text-gray-500">Tồn kho hiện tại:</span>
              <span className="font-bold text-gray-900 tabular-nums text-sm">
                {currentStock} <span className="font-normal text-gray-500">{item?.unit || 'cái'}</span>
              </span>
            </div>
          </div>

          {/* Chọn Nhà cung cấp */}
          <div>
            <label htmlFor="import-supplier" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Nhà cung cấp đối tác <span className="text-gray-400 font-normal">(Tùy chọn)</span>
            </label>
            <select
              id="import-supplier"
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setError('');
              }}
              disabled={loading || suppliersLoading}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            >
              <option value="">-- Chọn nhà cung cấp (nếu có) --</option>
              {suppliers.map((sup) => (
                <option key={sup._id} value={sup._id}>
                  {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Số lượng + Đơn giá nhập */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="import-qty" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Số lượng nhập <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-gray-400 font-normal">Tối đa 10k</span>
              </label>
              <input
                id="import-qty"
                type="text"
                inputMode="numeric"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="Ví dụ: 10..."
                autoFocus
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                  qtyError
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                }`}
              />
              {qtyError && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">{qtyError}</p>
              )}
            </div>

            <div>
              <label htmlFor="import-price" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Đơn giá nhập (₫)</span>
                <span className="text-[10px] text-gray-400 font-normal">Tối đa 10 tr</span>
              </label>
              <input
                id="import-price"
                type="text"
                inputMode="numeric"
                value={importPrice}
                onChange={handlePriceChange}
                placeholder="10.000 - 10.000.000"
                className={`w-full h-10 px-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all ${
                  priceError
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                }`}
              />
              {priceError && (
                <p className="mt-1 text-[11px] text-red-600 font-medium">{priceError}</p>
              )}
            </div>
          </div>

          {/* Xem trước tồn kho sau nhập */}
          <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-lg flex items-center justify-between text-xs">
            <span className="text-teal-900 font-medium">Tồn kho dự kiến sau nhập:</span>
            <span className="font-bold text-teal-950 text-sm tabular-nums">
              {previewStock} <span className="font-normal text-teal-700">{item?.unit || 'cái'}</span>
            </span>
          </div>

          {/* Ghi chú */}
          <div>
            <label htmlFor="import-note" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ghi chú bổ sung <span className="text-gray-400 font-normal">(Không bắt buộc)</span>
            </label>
            <input
              id="import-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Nhập bổ sung đợt mới, lô hàng hè..."
              maxLength={200}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9.5 px-4 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || numQty <= 0}
              className="h-9.5 px-4 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {loading && <SpinnerIcon />}
              <span>Xác nhận nhập kho</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
