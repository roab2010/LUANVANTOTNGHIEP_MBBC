import { useState } from 'react';
import { exportStock } from '../../../services/warehouseApi';
import VariantSelect, { getVariantColorHex } from '../../../components/VariantSelect';

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

const ExportIcon = () => (
  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const EXPORT_REASONS = [
  'Hàng lỗi/hư hỏng',
  'Sử dụng nội bộ/chụp ảnh sản phẩm',
  'Điều chỉnh tồn kho',
  'Khác',
];

const StockExportModal = ({ item, onClose, onSuccess }) => {
  const hasVariants = Boolean(item?.variants && item.variants.length > 0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(EXPORT_REASONS[0]);
  const [note, setNote] = useState('');
  const [qtyError, setQtyError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVariant = hasVariants ? item.variants[selectedVariantIndex] : null;
  const currentStock = hasVariants ? (selectedVariant?.stock || 0) : (item?.stock || 0);
  const numQty = parseInt(quantity, 10) || 0;
  const previewStock = Math.max(0, currentStock - numQty);
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

    // Kiểm tra không được xuất vượt quá tồn kho hiện tại
    if (num > currentStock) {
      setQtyError(`Số lượng xuất không được vượt quá tồn kho hiện tại (${currentStock})`);
      setQuantity(raw);
      return;
    }

    setQuantity(raw);
    setQtyError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (currentStock <= 0) {
      setError(hasVariants ? `Biến thể "${selectedVariant?.size} / ${selectedVariant?.color}" đã hết hàng trong kho` : 'Sản phẩm đã hết hàng trong kho, không thể thực hiện xuất kho');
      return;
    }

    if (quantity === '' || isNaN(numQty) || numQty <= 0) {
      setQtyError('Vui lòng nhập số lượng cần xuất (lớn hơn 0)');
      return;
    }

    if (numQty > currentStock) {
      setQtyError(`Số lượng xuất (${numQty}) vượt quá tồn kho khả dụng (${currentStock})`);
      return;
    }

    if (!reason || !EXPORT_REASONS.includes(reason)) {
      setError('Vui lòng chọn lý do xuất kho hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await exportStock({
        productId: item._id,
        quantity: numQty,
        reason,
        note: note.trim() || undefined,
        variantSize: selectedVariant ? selectedVariant.size : undefined,
        variantColor: selectedVariant ? selectedVariant.color : undefined,
      });

      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'Xuất kho sản phẩm thất bại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-fade-in"
        onClick={() => !loading && onClose()}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <ExportIcon />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Xuất kho sản phẩm</h2>
              <p className="text-xs text-gray-500">Giảm tồn kho & ghi nhận lịch sử</p>
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
              <div className="flex items-center gap-1.5 text-gray-500">
                {hasVariants && (
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-black/15 shrink-0"
                    style={{ backgroundColor: getVariantColorHex(selectedVariant?.color) }}
                  />
                )}
                <span>
                  {hasVariants ? `Tồn biến thể (${selectedVariant?.size} / ${selectedVariant?.color}):` : 'Tồn kho khả dụng hiện tại:'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold tabular-nums text-sm ${currentStock <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {currentStock} <span className="font-normal text-gray-500">{item?.unit || 'cái'}</span>
                </span>
                {hasVariants && (
                  currentStock <= 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                      Hết hàng
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Còn hàng
                    </span>
                  )
                )}
              </div>
            </div>
            {hasVariants ? (
              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                <span>Tổng tồn toàn bộ biến thể:</span>
                <span className="font-semibold text-gray-700">{item?.stock || 0} {item?.unit || 'cái'}</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded border border-amber-200/70">
                ℹ️ Sản phẩm này chưa chia Size/Màu nên áp dụng xuất trực tiếp từ <strong>Tồn kho chung</strong>. (Vào mục "Sửa sản phẩm" nếu bạn muốn chia tồn kho theo từng Size/Màu).
              </div>
            )}
          </div>

          {/* Chọn Biến thể cần xuất (nếu có) */}
          {hasVariants && (
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Chọn biến thể xuất <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-amber-600 font-semibold">{item.variants.length} biến thể</span>
              </div>
              <VariantSelect
                variants={item.variants}
                selectedIndex={selectedVariantIndex}
                onSelect={(idx) => {
                  setSelectedVariantIndex(idx);
                  setQuantity('');
                  setQtyError('');
                }}
                unit={item?.unit || 'cái'}
                disabled={loading}
                accent="amber"
              />
            </div>
          )}

          {/* Cảnh báo nếu tồn kho = 0 */}
          {currentStock <= 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {hasVariants
                ? `Biến thể "${selectedVariant?.size} / ${selectedVariant?.color}" hiện đang có tồn kho bằng 0. Không thể xuất biến thể này.`
                : 'Sản phẩm hiện đang có tồn kho bằng 0. Không thể xuất thêm sản phẩm từ kho.'}
            </div>
          )}

          {/* Số lượng cần xuất */}
          <div>
            <label htmlFor="export-qty" className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Số lượng cần xuất <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-gray-400 font-normal">
                Tối đa: {currentStock} {item?.unit || 'cái'}
              </span>
            </label>
            <input
              id="export-qty"
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={loading || currentStock <= 0}
              placeholder={`Nhập từ 1 đến ${currentStock}...`}
              autoFocus
              className={`w-full h-10 px-3 bg-white border rounded-lg text-sm text-gray-900 focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 ${
                qtyError
                  ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
              }`}
            />
            {qtyError && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">{qtyError}</p>
            )}
          </div>

          {/* Lý do xuất kho */}
          <div>
            <label htmlFor="export-reason" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Lý do xuất kho <span className="text-red-500">*</span>
            </label>
            <select
              id="export-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading || currentStock <= 0}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:bg-gray-100"
            >
              {EXPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Xem trước tồn kho sau khi xuất */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-lg flex items-center justify-between text-xs">
            <span className="text-amber-900 font-medium">Tồn kho dự kiến sau xuất:</span>
            <span className="font-bold text-amber-950 text-sm tabular-nums">
              {previewStock} <span className="font-normal text-amber-700">{item?.unit || 'cái'}</span>
            </span>
          </div>

          {/* Ghi chú bổ sung */}
          <div>
            <label htmlFor="export-note" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ghi chú bổ sung <span className="text-gray-400 font-normal">(Không bắt buộc)</span>
            </label>
            <input
              id="export-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading || currentStock <= 0}
              placeholder="Chi tiết lý do xuất, tình trạng sản phẩm..."
              maxLength={200}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all disabled:bg-gray-100"
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
              disabled={loading || currentStock <= 0 || numQty <= 0 || numQty > currentStock}
              className="h-9.5 px-4 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
            >
              {loading && <SpinnerIcon />}
              <span>Xác nhận xuất kho</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockExportModal;
