import { useState, useEffect } from 'react';
import { createImportReceipt } from '../../../services/importReceiptApi';
import { getSuppliers } from '../../../services/supplierApi';
import { getProducts } from '../../../services/productApi';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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

const CreateImportReceiptModal = ({ initialSupplierId = '', onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState(initialSupplierId || '');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([
    { product: '', quantity: 1, importPrice: 0 },
  ]);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tải danh sách nhà cung cấp và sản phẩm
  useEffect(() => {
    const loadInitData = async () => {
      try {
        setLoadingData(true);
        const [supRes, prodRes] = await Promise.all([
          getSuppliers({ status: 'active', limit: 100 }),
          getProducts({ limit: 100 }),
        ]);
        setSuppliers(supRes.data?.data?.suppliers || []);
        setProducts(prodRes.data?.data?.products || []);
      } catch (err) {
        setError('Không thể tải danh sách nhà cung cấp hoặc sản phẩm');
      } finally {
        setLoadingData(false);
      }
    };
    loadInitData();
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { product: '', quantity: 1, importPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      setError('Phiếu nhập phải có ít nhất 1 sản phẩm');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleProductChange = (index, prodId) => {
    const selectedProd = products.find((p) => p._id === prodId);
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        product: prodId,
        importPrice: selectedProd ? selectedProd.costPrice || 0 : 0,
      };
      return newItems;
    });
    setError('');
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return newItems;
    });
    setError('');
  };

  // Tính tổng tiền
  const totalAmount = items.reduce((sum, it) => {
    const q = parseInt(it.quantity) || 0;
    const p = Number(it.importPrice) || 0;
    return sum + q * p;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!supplierId) {
      setError('Vui lòng chọn nhà cung cấp');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product) {
        setError(`Vui lòng chọn sản phẩm cho dòng số ${i + 1}`);
        return;
      }
      if (!it.quantity || parseInt(it.quantity) <= 0) {
        setError(`Số lượng của dòng số ${i + 1} phải từ 1 trở lên`);
        return;
      }
      if (it.importPrice === '' || Number(it.importPrice) < 0) {
        setError(`Giá nhập của dòng số ${i + 1} không hợp lệ`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await createImportReceipt({
        supplierId,
        items: items.map((it) => ({
          product: it.product,
          quantity: parseInt(it.quantity),
          importPrice: Number(it.importPrice),
        })),
        note,
      });

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Tạo phiếu nhập hàng thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !submitting && onClose()} />

      {/* Modal */}
      <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tạo phiếu nhập hàng mới</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Hàng hóa nhập vào sẽ tự động được cộng vào số lượng tồn kho tương ứng
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-danger-50 border border-red-200 rounded-lg animate-slide-down shrink-0">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Thông tin nhà cung cấp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ir-supplier" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nhà cung cấp <span className="text-danger-500">*</span>
              </label>
              <select
                id="ir-supplier"
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  setError('');
                }}
                disabled={loadingData || submitting}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 disabled:opacity-60"
              >
                <option value="">-- Chọn nhà cung cấp đối tác --</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && !loadingData && (
                <p className="text-xs text-amber-600 mt-1">
                  Chưa có nhà cung cấp nào. Vui lòng vào mục <strong>Nhà cung cấp</strong> để thêm trước.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ir-note" className="block text-sm font-medium text-gray-700 mb-1.5">
                Ghi chú phiếu nhập
              </label>
              <input
                id="ir-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đợt nhập hàng số 1 tháng 10..."
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>
          </div>

          {/* Danh sách hàng nhập */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Danh sách sản phẩm nhập kho <span className="text-danger-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                <PlusIcon />
                Thêm sản phẩm
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3 w-28">Số lượng</th>
                    <th className="py-2.5 px-3 w-36">Giá nhập (₫)</th>
                    <th className="py-2.5 px-3 w-36 text-right">Thành tiền</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => {
                    const rowTotal = (parseInt(item.quantity) || 0) * (Number(item.importPrice) || 0);
                    return (
                      <tr key={index} className="hover:bg-gray-50/50">
                        {/* Sản phẩm */}
                        <td className="p-2.5">
                          <select
                            value={item.product}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:border-primary-500 transition-all"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name} (Hiện tồn: {p.stock} {p.unit || 'cái'}){p.status === 'inactive' ? ' - [Ngừng bán]' : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Số lượng */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 text-center focus:outline-none focus:border-primary-500 transition-all"
                          />
                        </td>

                        {/* Đơn giá nhập */}
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={item.importPrice}
                            onChange={(e) => handleItemChange(index, 'importPrice', e.target.value)}
                            className="w-full h-9 px-2.5 bg-white border border-gray-300 rounded-md text-sm text-gray-900 text-right focus:outline-none focus:border-primary-500 transition-all"
                          />
                        </td>

                        {/* Thành tiền */}
                        <td className="p-2.5 text-right font-medium text-gray-900 tabular-nums">
                          {formatPrice(rowTotal)}
                        </td>

                        {/* Xóa dòng */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-gray-400 hover:text-danger-600 transition-colors"
                            title="Xóa dòng này"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tổng tiền thanh toán */}
          <div className="p-4 bg-primary-50/60 border border-primary-100 rounded-lg flex items-center justify-between">
            <span className="text-sm font-semibold text-primary-900">Tổng giá trị phiếu nhập:</span>
            <span className="text-xl font-bold text-primary-700 tabular-nums">{formatPrice(totalAmount)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <SpinnerIcon />}
              Xác nhận nhập kho & Lưu phiếu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateImportReceiptModal;
