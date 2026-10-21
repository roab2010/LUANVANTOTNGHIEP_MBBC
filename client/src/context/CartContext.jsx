import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'mbbc_cart_v1';

export const CartProvider = ({ children }) => {
  // Khởi tạo giỏ hàng từ localStorage nếu có
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Lỗi đọc giỏ hàng từ localStorage:', e);
      return [];
    }
  });

  // State các modal dùng chung
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Lưu giỏ hàng vào localStorage mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Lỗi lưu giỏ hàng vào localStorage:', e);
    }
  }, [cart]);

  // Hiển thị toast thông báo
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Thêm vào giỏ hàng
  const addToCart = (product, size = '', color = '', qty = 1) => {
    if (!product) return;
    const prodId = product._id || product.id;
    const quantityToAdd = Math.max(1, parseInt(qty, 10) || 1);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          (item.product._id || item.product.id) === prodId &&
          (item.size || '') === (size || '') &&
          (item.color || '') === (color || '')
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product,
            size: size || '',
            color: color || '',
            quantity: quantityToAdd,
          },
        ];
      }
    });

    const detailsStr = [size ? `Size ${size}` : '', color ? `Màu ${color}` : ''].filter(Boolean).join(' - ');
    showToast(`Đã thêm "${product.name}" ${detailsStr ? `(${detailsStr})` : ''} vào giỏ hàng`);
  };

  // Cập nhật số lượng món trong giỏ
  const updateCartQty = (index, delta) => {
    setCart((prevCart) => {
      if (index < 0 || index >= prevCart.length) return prevCart;
      const updated = [...prevCart];
      const newQty = updated[index].quantity + delta;

      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
        return updated;
      }
    });
  };

  // Xóa món khỏi giỏ
  const removeFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  // Xóa toàn bộ giỏ hàng
  const clearCart = () => {
    setCart([]);
  };

  // Mua ngay (Thêm vào giỏ và mở thẳng Checkout)
  const buyNow = (product, size = '', color = '', qty = 1) => {
    addToCart(product, size, color, qty);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Tổng số lượng item trong giỏ (hiển thị trên badge icon giỏ hàng)
  const totalCartCount = useMemo(() => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }, [cart]);

  // Tổng tiền giỏ hàng (VND)
  const totalCartAmount = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + price * (item.quantity || 1);
    }, 0);
  }, [cart]);

  const value = {
    cart,
    setCart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    buyNow,
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};

export default CartContext;
