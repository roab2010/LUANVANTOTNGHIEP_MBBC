import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'mbbc_cart_v1';

// Helper tính tồn kho tối đa của biến thể hoặc sản phẩm
export const getItemStock = (product, size = '', color = '') => {
  if (!product) return 0;
  if (product.variants && product.variants.length > 0) {
    const v = product.variants.find(
      (item) =>
        (size ? item.size === size : true) &&
        (color ? item.color === color : true)
    );
    return v ? (v.stock || 0) : 0;
  }
  return product.stock !== undefined ? product.stock : 9999;
};

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
  const [isMyReviewsOpen, setIsMyReviewsOpen] = useState(false);
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

  // Thêm vào giỏ hàng (Bẫy lỗi sớm kiểm tra tồn kho tối đa)
  const addToCart = (product, size = '', color = '', qty = 1) => {
    if (!product) return false;
    const prodId = product._id || product.id;
    const quantityToAdd = Math.max(1, parseInt(qty, 10) || 1);
    const maxStock = getItemStock(product, size, color);

    if (maxStock <= 0) {
      showToast(`Sản phẩm này hiện đang tạm hết hàng`);
      return false;
    }

    let isSuccess = true;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) =>
          (item.product._id || item.product.id) === prodId &&
          (item.size || '') === (size || '') &&
          (item.color || '') === (color || '')
      );

      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        if (currentQty >= maxStock) {
          showToast(`Bạn đã có tối đa ${maxStock} sản phẩm này trong giỏ hàng!`);
          isSuccess = false;
          return prevCart;
        }

        const newQty = Math.min(maxStock, currentQty + quantityToAdd);
        const actualAdded = newQty - currentQty;
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };

        if (actualAdded < quantityToAdd) {
          showToast(`Kho chỉ còn ${maxStock} sản phẩm. Đã thêm ${actualAdded} cái (đạt tối đa)!`);
        } else {
          const detailsStr = [size ? `Size ${size}` : '', color ? `Màu ${color}` : ''].filter(Boolean).join(' - ');
          showToast(`Đã thêm "${product.name}" ${detailsStr ? `(${detailsStr})` : ''} vào giỏ hàng`);
        }
        return updated;
      } else {
        const finalQty = Math.min(maxStock, quantityToAdd);
        if (finalQty < quantityToAdd) {
          showToast(`Kho chỉ còn ${maxStock} sản phẩm. Đã thêm tối đa ${finalQty} cái vào giỏ!`);
        } else {
          const detailsStr = [size ? `Size ${size}` : '', color ? `Màu ${color}` : ''].filter(Boolean).join(' - ');
          showToast(`Đã thêm "${product.name}" ${detailsStr ? `(${detailsStr})` : ''} vào giỏ hàng`);
        }

        return [
          ...prevCart,
          {
            product,
            size: size || '',
            color: color || '',
            quantity: finalQty,
          },
        ];
      }
    });

    return isSuccess;
  };

  // Cập nhật số lượng món trong giỏ (Có kiểm tra giới hạn tồn kho)
  const updateCartQty = (index, delta) => {
    setCart((prevCart) => {
      if (index < 0 || index >= prevCart.length) return prevCart;
      const item = prevCart[index];
      const maxStock = getItemStock(item.product, item.size, item.color);
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        showToast(`Đã xóa "${item.product?.name || 'sản phẩm'}" khỏi giỏ hàng`);
        return prevCart.filter((_, i) => i !== index);
      }

      if (delta > 0 && newQty > maxStock) {
        showToast(`Kho chỉ còn ${maxStock} sản phẩm, không thể thêm tiếp`);
        return prevCart;
      }

      const updated = [...prevCart];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  // Xóa món khỏi giỏ
  const removeFromCart = (index) => {
    setCart((prevCart) => {
      const item = prevCart[index];
      if (item) {
        showToast(`Đã xóa "${item.product?.name || 'sản phẩm'}" khỏi giỏ hàng`);
      }
      return prevCart.filter((_, i) => i !== index);
    });
  };

  // Xóa toàn bộ giỏ hàng
  const clearCart = () => {
    setCart([]);
    showToast('Đã xóa toàn bộ giỏ hàng');
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
    isMyReviewsOpen,
    setIsMyReviewsOpen,
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
