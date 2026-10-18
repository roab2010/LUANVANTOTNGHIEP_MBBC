import { useState, useEffect, useCallback } from 'react';
import { getStockHistoryByProduct } from '../../../services/warehouseApi';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ImportIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================
// FORMAT HELPERS
// ============================================
const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProductDetailModal = ({ product, onClose, onOpenImport, onOpenExport }) => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!product?._id) return;
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const res = await getStockHistoryByProduct(product._id);
      setHistory(res.data?.data?.history || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử kho sản phẩm:', err);
      setHistoryError(err.response?.data?.message || 'Không thể tải lịch sử giao dịch kho');
    } finally {
      setLoadingHistory(false);
    }
  }, [product?._id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!product) return null;

  const productCode = `#MBBC-${product._id.slice(-6).toUpperCase()}`;
  const totalCostValue = (product.stock || 0) * (product.costPrice || 0);
  const totalRetailValue = (product.stock || 0) * (product.price || 0);

  // Tính trạng thái tồn kho
  let stockBadge = { label: 'Còn hàng', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (product.stock <= 0) {
    stockBadge = { label: 'Hết hàng', bg: 'bg-red-50 text-red-700 border-red-200' };
  } else if (product.stock <= 10) {
    stockBadge = { label: 'Sắp hết hàng', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col z-10 animate-scale-in overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
              {productCode}
            </span>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight truncate max-w-md">
              Chi tiết sản phẩm & Lịch sử kho
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
              title="Đóng (Esc)"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card: Thông tin tổng quan sản phẩm */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            {/* Ảnh sản phẩm */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="w-full aspect-square rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center relative">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon />
                    <span className="text-xs text-gray-400">Không có ảnh</span>
                  </div>
                )}
                {/* Trạng thái kinh doanh */}
                <span
                  className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${
                    product.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                </span>
              </div>

              {/* Thao tác kho nhanh */}
              <div className="grid grid-cols-2 gap-2 w-full mt-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenImport) onOpenImport(product);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-all active:scale-[0.98]"
                  title="Nhập thêm hàng vào kho"
                >
                  <ImportIcon />
                  <span>Nhập kho</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenExport) onOpenExport(product);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-all active:scale-[0.98]"
                  title="Xuất kho hàng lỗi / nội bộ"
                >
                  <ExportIcon />
                  <span>Xuất kho</span>
                </button>
              </div>
            </div>

            {/* Chi tiết thông số sản phẩm */}
            <div className="md:col-span-8 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-md border border-primary-100">
                    {product.category || 'Chưa phân loại'}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${stockBadge.bg}`}>
                    {stockBadge.label}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                  {product.name}
                </h3>

                {product.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Bảng chỉ số tài chính & kho hàng */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-500 block">Tồn kho hiện tại</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-bold text-gray-900 tabular-nums">{product.stock}</span>
                    <span className="text-xs text-gray-500 font-normal">{product.unit || 'cái'}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-500 block">Giá bán niêm yết</span>
                  <span className="text-lg font-bold text-gray-900 tabular-nums block mt-0.5">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-teal-800">Giá vốn nội bộ</span>
                    <span className="text-[9px] uppercase font-bold text-teal-600 bg-teal-100/70 px-1 py-0.2 rounded">
                      Admin
                    </span>
                  </div>
                  <span className="text-lg font-bold text-teal-900 tabular-nums block mt-0.5">
                    {formatCurrency(product.costPrice)}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 col-span-2 sm:col-span-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 block">Tổng giá trị vốn tồn kho</span>
                    <span className="text-base font-bold text-teal-700 tabular-nums">
                      {formatCurrency(totalCostValue)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-gray-500 block">Nhà cung cấp đối tác</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {product.supplier?.name || (
                        <span className="text-gray-400 font-normal italic">Chưa liên kết</span>
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-medium text-gray-500 block">Cập nhật gần nhất</span>
                    <span className="text-xs text-gray-600 tabular-nums font-mono">
                      {formatDate(product.updatedAt || product.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Lịch sử nhập / xuất kho */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon />
                <h4 className="text-sm font-bold text-gray-900 tracking-tight">
                  Lịch sử nhập / xuất kho của sản phẩm
                </h4>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full tabular-nums">
                  {history.length} giao dịch
                </span>
              </div>

              <button
                type="button"
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                title="Làm mới lịch sử"
              >
                <RefreshIcon />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Bảng lịch sử */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              {loadingHistory ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-gray-500">Đang tải lịch sử kho từ hệ thống...</span>
                </div>
              ) : historyError ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-sm text-red-600 font-medium">{historyError}</p>
                  <button
                    type="button"
                    onClick={fetchHistory}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Thử lại
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                    <ClockIcon />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Chưa phát sinh lịch sử kho</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Sản phẩm này chưa có giao dịch nhập kho hoặc xuất kho nào được ghi nhận.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3">Loại giao dịch</th>
                        <th className="px-4 py-3 text-right">Số lượng</th>
                        <th className="px-4 py-3 text-right">Tồn sau GD</th>
                        <th className="px-4 py-3">Nhà cung cấp / Lý do</th>
                        <th className="px-4 py-3 text-right">Đơn giá nhập</th>
                        <th className="px-4 py-3">Người thực hiện</th>
                        <th className="px-4 py-3">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((item) => {
                        const isImport = item.type === 'import';
                        return (
                          <tr key={item._id} className="hover:bg-gray-50/80 transition-colors">
                            {/* Thời gian */}
                            <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">
                              {formatDate(item.createdAt)}
                            </td>

                            {/* Loại giao dịch */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isImport ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                  <ImportIcon />
                                  <span>Nhập kho</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <ExportIcon />
                                  <span>Xuất kho</span>
                                </span>
                              )}
                            </td>

                            {/* Số lượng */}
                            <td className="px-4 py-3 text-right font-bold tabular-nums whitespace-nowrap">
                              <span className={isImport ? 'text-teal-700' : 'text-amber-700'}>
                                {isImport ? `+${item.quantity}` : `-${item.quantity}`}
                              </span>{' '}
                              <span className="text-[10px] font-normal text-gray-400">
                                {product.unit || 'cái'}
                              </span>
                            </td>

                            {/* Tồn sau GD */}
                            <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                              {item.stockAfter}{' '}
                              <span className="text-[10px] font-normal text-gray-400">
                                {product.unit || 'cái'}
                              </span>
                            </td>

                            {/* Nhà cung cấp / Lý do */}
                            <td className="px-4 py-3 text-gray-700">
                              {isImport ? (
                                item.supplier?.name ? (
                                  <span className="font-medium text-gray-900">{item.supplier.name}</span>
                                ) : (
                                  <span className="text-gray-400 italic">—</span>
                                )
                              ) : (
                                <span className="font-medium text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                                  {item.reason || 'Khác'}
                                </span>
                              )}
                            </td>

                            {/* Đơn giá nhập */}
                            <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                              {isImport && item.unitPrice > 0 ? (
                                <span className="text-gray-700 font-medium">
                                  {formatCurrency(item.unitPrice)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>

                            {/* Người thực hiện */}
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              {item.performer?.fullName || item.performer?.email || (
                                <span className="text-gray-400 italic">Quản trị viên</span>
                              )}
                            </td>

                            {/* Ghi chú */}
                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={item.note || ''}>
                              {item.note || <span className="text-gray-300 italic">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
