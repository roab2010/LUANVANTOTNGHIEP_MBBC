import { useState, useEffect } from 'react';
import { getImportReceipts } from '../../../services/importReceiptApi';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DocumentTextIcon = () => (
  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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

const SupplierHistoryModal = ({ supplier, onClose, onOpenCreateReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'receipts'

  useEffect(() => {
    if (!supplier?._id) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getImportReceipts({
          supplierId: supplier._id,
          limit: 100,
        });
        setReceipts(res.data?.data?.receipts || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải lịch sử nhập hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [supplier]);

  if (!supplier) return null;

  // Tính toán tổng hợp từ danh sách phiếu nhập
  const completedReceipts = receipts.filter((r) => r.status === 'completed');
  const totalAmountImported = completedReceipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // Tổng hợp danh sách các sản phẩm đã từng nhập từ nhà cung cấp này
  const productMap = new Map();
  completedReceipts.forEach((r) => {
    r.items?.forEach((item) => {
      const prodId = item.product?._id || (typeof item.product === 'string' ? item.product : null);
      if (!prodId) return;

      const prodName = item.product?.name || 'Sản phẩm không xác định';
      const prodUnit = item.product?.unit || 'Cái';

      if (!productMap.has(prodId)) {
        productMap.set(prodId, {
          id: prodId,
          name: prodName,
          unit: prodUnit,
          totalQty: item.quantity,
          latestPrice: item.importPrice,
          totalSpent: item.total || item.quantity * item.importPrice,
        });
      } else {
        const exist = productMap.get(prodId);
        exist.totalQty += item.quantity;
        exist.totalSpent += item.total || item.quantity * item.importPrice;
        exist.latestPrice = item.importPrice; // Cập nhật đơn giá gần nhất
      }
    });
  });

  const suppliedProducts = Array.from(productMap.values());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800">
                  Lịch sử cung cấp: {supplier.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    supplier.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {supplier.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                SĐT: {supplier.phone} • Địa chỉ: {supplier.address || 'Chưa cập nhật'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Cards tóm tắt */}
          <div className="grid grid-cols-3 gap-4 px-6 pt-5">
            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="text-xs font-medium text-blue-600">Tổng phiếu nhập</div>
              <div className="text-xl font-bold text-blue-900 mt-1">
                {receipts.length} <span className="text-xs font-normal text-blue-700">phiếu</span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="text-xs font-medium text-indigo-600">Mặt hàng cung cấp</div>
              <div className="text-xl font-bold text-indigo-900 mt-1">
                {suppliedProducts.length} <span className="text-xs font-normal text-indigo-700">loại SP</span>
              </div>
            </div>

            <div className="p-3.5 bg-green-50 border border-green-100 rounded-lg">
              <div className="text-xs font-medium text-green-600">Tổng giá trị đã nhập</div>
              <div className="text-xl font-bold text-green-900 mt-1">
                {formatPrice(totalAmountImported)}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6 mt-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mặt hàng đã từng cung cấp ({suppliedProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'receipts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lịch sử các phiếu nhập ({receipts.length})
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="py-12 text-center text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mx-auto mb-2" />
                <span>Đang tải lịch sử nhập hàng...</span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
            ) : activeTab === 'products' ? (
              /* TAB SẢN PHẨM ĐÃ TỪNG CUNG CẤP */
              suppliedProducts.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <DocumentTextIcon />
                  <p className="text-sm font-medium text-gray-500">
                    Nhà cung cấp này chưa có lịch sử cung cấp sản phẩm nào
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                          Tên sản phẩm
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">
                          ĐVT
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                          Tổng số lượng đã nhập
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                          Đơn giá nhập gần nhất
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                          Tổng tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {suppliedProducts.map((p, index) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{p.unit}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {p.totalQty}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatPrice(p.latestPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                            {formatPrice(p.totalSpent)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* TAB CÁC PHIẾU NHẬP */
              receipts.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <DocumentTextIcon />
                  <p className="text-sm font-medium text-gray-500">
                    Chưa có phiếu nhập hàng nào từ nhà cung cấp này
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
                        <div>
                          <span className="font-bold text-indigo-600 text-sm">
                            {receipt.receiptCode}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(receipt.importDate || receipt.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              receipt.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {receipt.status === 'completed' ? 'Đã nhập kho' : 'Đã hủy'}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {formatPrice(receipt.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Chi tiết các sản phẩm trong phiếu */}
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="font-medium text-gray-700">
                          Mặt hàng trong phiếu ({receipt.items?.length || 0}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {receipt.items?.map((it, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                            >
                              {it.product?.name || 'SP'}: <span className="font-semibold">{it.quantity}</span> {it.product?.unit || 'cái'} x {formatPrice(it.importPrice)}
                            </span>
                          ))}
                        </div>
                        {receipt.note && (
                          <div className="italic text-gray-500 mt-1">
                            Ghi chú: {receipt.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
            {onOpenCreateReceipt && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateReceipt(supplier);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                + Tạo phiếu nhập mới cho NCC này
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierHistoryModal;
