import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/orderApi';
import MyOrdersModal from '../../pages/customer/MyOrdersModal';

// Close Icon
const CloseIcon = () => (
  <svg className="w-5 h-5 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Format VND currency
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const StoreModals = ({ onOrderCompleted }) => {
  const { user } = useAuth();
  const {
    cart,
    clearCart,
    updateCartQty,
    totalCartCount,
    totalCartAmount,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    orderSuccess,
    setOrderSuccess,
    isMyOrdersOpen,
    setIsMyOrdersOpen,
    toastMessage,
    showToast,
  } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'cod',
    notes: '',
  });

  // Tự động điền thông tin nếu user đã đăng nhập
  useEffect(() => {
    if (user) {
      setCustomerInfo((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Xử lý submit đặt hàng
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerInfo.fullName.trim() || !customerInfo.phone.trim() || !customerInfo.address.trim()) {
      setCheckoutError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng');
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Giỏ hàng trống');
      return;
    }

    setCheckoutLoading(true);
    try {
      const orderItems = cart.map((it) => ({
        product: it.product._id || it.product.id,
        quantity: it.quantity,
        size: it.size || undefined,
        color: it.color || undefined,
      }));

      const res = await createOrder({
        customer: {
          fullName: customerInfo.fullName.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
        },
        items: orderItems,
        paymentMethod: customerInfo.paymentMethod,
        notes: customerInfo.notes.trim() || undefined,
      });

      if (res.data?.success) {
        setOrderSuccess(res.data.data.order);
        clearCart();
        setIsCheckoutOpen(false);
        showToast('Đặt hàng thành công!');
        if (onOrderCompleted) onOrderCompleted(res.data.data.order);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đặt hàng thất bại, vui lòng thử lại';
      setCheckoutError(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* CART DRAWER SLIDE-OVER */}
      {/* ========================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white text-black flex flex-col shadow-2xl">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-xs font-black tracking-[0.16em] uppercase">
                  GIỎ HÀNG ({totalCartCount})
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 hover:text-neutral-500 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-24 text-neutral-400 text-xs font-semibold uppercase tracking-widest space-y-3">
                    <svg className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p>Giỏ hàng của bạn đang trống.</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div
                      key={`${item.product._id || item.product.id}-${item.size}-${item.color}-${index}`}
                      className="flex gap-3.5 pb-4 border-b border-neutral-100"
                    >
                      <img
                        src={item.product.image || 'https://placehold.co/120x150/151515/ffffff?text=M.B.B.C'}
                        alt={item.product.name}
                        className="w-16 h-20 object-cover bg-neutral-100 shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide truncate">
                            {item.product.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-neutral-600">
                            {item.size && (
                              <span className="px-1.5 py-0.5 bg-neutral-100 font-semibold text-black rounded text-[10px]">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="px-1.5 py-0.5 bg-neutral-100 font-semibold text-black rounded text-[10px]">
                                Màu: {item.color}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-neutral-200">
                            <button
                              type="button"
                              onClick={() => updateCartQty(index, -1)}
                              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-neutral-100"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(index, 1)}
                              className="w-6 h-6 flex items-center justify-center text-xs hover:bg-neutral-100"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-black tabular-nums">
                            {formatPrice((item.product.price || 0) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-neutral-100 bg-[#fafafa] space-y-3">
                  <div className="flex justify-between text-xs text-neutral-600 font-bold uppercase tracking-wider">
                    <span>TỔNG TIỀN:</span>
                    <span className="font-black text-black text-sm tabular-nums">
                      {formatPrice(totalCartAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setCheckoutError('');
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3.5 bg-black text-white text-xs font-black tracking-widest uppercase hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    TIẾN HÀNH THANH TOÁN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHECKOUT THANH TOÁN */}
      {/* ========================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsCheckoutOpen(false)} />

          <div className="relative bg-white text-black max-w-lg w-full p-6 sm:p-8 z-10 shadow-2xl max-h-[92vh] overflow-y-auto border border-neutral-200 animate-scale-in">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 rounded transition-colors"
            >
              <CloseIcon />
            </button>

            {/* Header */}
            <div className="border-b border-neutral-100 pb-3 mb-5">
              <h3 className="text-sm font-black tracking-widest uppercase">ĐẶT HÀNG & THANH TOÁN</h3>
              <p className="text-xs text-neutral-500 mt-1">Cung cấp thông tin nhận hàng để hoàn tất đơn</p>
            </div>

            {checkoutError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded">
                {checkoutError}
              </div>
            )}

            {/* Tóm tắt giỏ hàng */}
            <div className="mb-5 p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                <span>SẢN PHẨM ({totalCartCount})</span>
                <span>TỔNG</span>
              </div>
              <div className="divide-y divide-neutral-200/60 max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {cart.map((it, idx) => (
                  <div key={idx} className="pt-1.5 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <span className="font-bold text-neutral-900">{it.product.name}</span>
                      <span className="text-neutral-500 ml-1.5 text-[11px]">
                        ({it.size ? `Size ${it.size}` : ''}{it.color ? `, Màu ${it.color}` : ''}) x{it.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-black tabular-nums shrink-0">
                      {formatPrice((it.product.price || 0) * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider">TỔNG THANH TOÁN:</span>
                <span className="text-base font-black text-red-600 tabular-nums">
                  {formatPrice(totalCartAmount)}
                </span>
              </div>
            </div>

            {/* Form thông tin giao hàng */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Họ và tên người nhận <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn Bảo"
                  className="w-full h-10 px-3 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={15}
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full h-10 px-3 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Hình thức thanh toán
                  </label>
                  <select
                    value={customerInfo.paymentMethod}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-300 rounded text-xs font-semibold text-black focus:outline-none focus:border-black"
                  >
                    <option value="cod">Thanh toán khi nhận (COD)</option>
                    <option value="banking">Chuyển khoản ngân hàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Địa chỉ nhận hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  className="w-full h-10 px-3 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Ghi chú đơn hàng (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                  placeholder="Ghi chú giao hàng nếu có..."
                  className="w-full p-2.5 border border-neutral-300 rounded text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={checkoutLoading || cart.length === 0}
                  className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-black tracking-widest uppercase transition-colors disabled:opacity-50"
                >
                  {checkoutLoading ? 'ĐANG TẠO ĐƠN HÀNG...' : `XÁC NHẬN ĐẶT HÀNG (${formatPrice(totalCartAmount)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THÔNG BÁO ĐẶT HÀNG THÀNH CÔNG */}
      {/* ========================================================= */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setOrderSuccess(null)} />
          <div className="relative bg-white text-black max-w-md w-full p-6 sm:p-8 z-10 shadow-2xl text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black tracking-widest uppercase">ĐẶT HÀNG THÀNH CÔNG!</h3>
              <p className="text-xs text-neutral-500 mt-1">Cảm ơn bạn đã tin tưởng mua sắm tại M.B.B.C.</p>
            </div>
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-black">{orderSuccess.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Người nhận:</span>
                <span className="font-semibold text-black">{orderSuccess.customer?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Số điện thoại:</span>
                <span className="font-semibold text-black">{orderSuccess.customer?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Địa chỉ:</span>
                <span className="font-semibold text-black truncate max-w-[200px]">{orderSuccess.customer?.address}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200">
                <span className="text-neutral-500">Tổng thanh toán:</span>
                <span className="font-black text-red-600">{formatPrice(orderSuccess.totalAmount)}</span>
              </div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              TIẾP TỤC MUA SẮM
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL ĐƠN HÀNG CỦA TÔI */}
      {/* ========================================================= */}
      <MyOrdersModal isOpen={isMyOrdersOpen} onClose={() => setIsMyOrdersOpen(false)} />

      {/* ========================================================= */}
      {/* TOAST THÔNG BÁO GÓC DƯỚI */}
      {/* ========================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-black text-white px-5 py-3 shadow-2xl flex items-center gap-3 border border-neutral-800 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-xs font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default StoreModals;
