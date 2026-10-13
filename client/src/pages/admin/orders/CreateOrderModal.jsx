import { useState, useEffect } from 'react';
import { createOrder } from '../../../services/orderApi';
import { getProducts } from '../../../services/productApi';
import { getCustomers } from '../../../services/customerApi';

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

const CreateOrderModal = ({ onClose, onSuccess }) => {
  // Danh sách sản phẩm & khách hàng có sẵn
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCustomers, setAvailableCustomers] = useState([]);

  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load danh sách sản phẩm và khách hàng
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          getProducts({ limit: 100, status: 'active' }),
          getCustomers({ limit: 100, status: 'active' }),
        ]);
        setAvailableProducts(prodRes.data?.data?.products || []);
        setAvailableCustomers(custRes.data?.data?.customers || []);
      } catch (err) {
        console.error('Không thể tải dữ liệu sản phẩm/khách hàng', err);
      }
    };
    fetchData();
  }, []);

  // Chọn nhanh khách hàng có sẵn
  const handleSelectCustomer = (e) => {
    const custId = e.target.value;
    if (!custId) return;
    const cust = availableCustomers.find((c) => c._id === custId);
    if (cust) {
      setCustomerInfo({
        fullName: cust.fullName,
        phone: cust.phone,
        address: cust.address || '',
      });
    }
  };

  // Thêm sản phẩm vào danh sách đơn
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = availableProducts.find((p) => p._id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity) || 1;
    if (qty <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    if (product.stock < qty) {
      setError(`Sản phẩm "${product.name}" chỉ còn ${product.stock} cái trong kho`);
      return;
    }

    // Kiểm tra xem sản phẩm đã có trong danh sách chưa
    const existingIndex = orderItems.findIndex((item) => item.product === product._id);
    if (existingIndex > -1) {
      const updated = [...orderItems];
      const newQty = updated[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        setError(`Tổng số lượng vượt quá tồn kho hiện tại (${product.stock})`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * product.price;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: qty,
          total: qty * product.price,
        },
      ]);
    }

    setError('');
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  // Tổng tiền đơn hàng
  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerInfo.fullName.trim()) {
      setError('Vui lòng nhập họ tên khách hàng');
      return;
    }

    if (!customerInfo.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (orderItems.length === 0) {
      setError('Đơn hàng phải có ít nhất 1 sản phẩm');
      return;
    }

    setLoading(true);
    try {
      await createOrder({
        customer: customerInfo,
        items: orderItems,
        paymentMethod,
        notes,
      });

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Tạo đơn hàng thất bại';
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
          <h2 className="text-lg font-bold text-gray-900">Tạo đơn hàng mới</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger-50 border border-red-200 rounded-lg text-sm text-danger-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Chọn khách hàng mẫu nếu có */}
          {availableCustomers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Chọn nhanh từ khách hàng đã có
              </label>
              <select
                onChange={handleSelectCustomer}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:bg-white focus:outline-none focus:border-primary-500"
              >
                <option value="">-- Chọn khách hàng sẵn có (hoặc nhập bên dưới) --</option>
                {availableCustomers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.fullName} - {c.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Thông tin khách hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên khách hàng <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={customerInfo.fullName}
                onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                placeholder="Ví dụ: Nguyễn Thị Mai"
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-danger-500">*</span>
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="0912345678"
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
              <input
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                placeholder="Số nhà, đường, quận/huyện..."
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Chọn sản phẩm */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Thêm sản phẩm vào đơn</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {availableProducts.map((p) => (
                  <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                    {p.name} - {formatPrice(p.price)} (Tồn: {p.stock})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-20 h-10 px-3 text-center bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="h-10 px-4 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shrink-0"
                >
                  + Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách mặt hàng đã thêm */}
          {orderItems.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="py-2 px-3 text-left">Sản phẩm</th>
                    <th className="py-2 px-3 text-right">Đơn giá</th>
                    <th className="py-2 px-3 text-center">SL</th>
                    <th className="py-2 px-3 text-right">Thành tiền</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-gray-800">{item.name}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{formatPrice(item.price)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-800 tabular-nums">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900 tabular-nums">{formatPrice(item.total)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={3} className="py-2.5 px-3 text-right text-gray-900">Tổng thanh toán:</td>
                    <td className="py-2.5 px-3 text-right text-base text-teal-600 tabular-nums" colSpan={2}>
                      {formatPrice(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Phương thức thanh toán & Ghi chú */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                <option value="banking">Chuyển khoản ngân hàng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đơn hàng</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Giao trong giờ hành chính..."
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || orderItems.length === 0}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <SpinnerIcon />}
              Tạo đơn hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
