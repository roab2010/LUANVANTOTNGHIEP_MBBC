import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, getProducts } from '../../services/productApi';
import { getPublicCategories } from '../../services/categoryApi';
import { useCart } from '../../context/CartContext';
import StoreHeader from '../../components/common/StoreHeader';
import StoreModals from '../../components/common/StoreModals';
import { getVariantColorHex } from '../../components/VariantSelect';

// ============================================
// FORMAT CURRENCY VND
// ============================================
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

// ============================================
// MINIMAL VECTOR ICONS (PRECISE, NO EMOJIS)
// ============================================
const CheckIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const CopyIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const RulerIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

const BagIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const CloseIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MinusIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

const PlusIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow, showToast } = useCart();

  // Dữ liệu sản phẩm & trạng thái tải
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tùy chọn mua hàng
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Ảnh hiển thị chính & Size guide modal
  const [activeImage, setActiveImage] = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState('details'); // 'details' | 'care' | 'shipping' | null

  // Sản phẩm liên quan & Danh mục
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);

  // Lịch sử sản phẩm đã xem (Recently Viewed)
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [hasRealHistory, setHasRealHistory] = useState(false);

  // Refs & state cho Sticky Add-to-Cart Bottom Bar
  const mainBuySectionRef = useRef(null);
  const footerRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Scroll listener điều khiển hiện/ẩn Sticky Bottom Bar
  useEffect(() => {
    const handleScroll = () => {
      if (!mainBuySectionRef.current) return;

      // 1. Vị trí khối mua hàng chính trên giao diện
      const buyRect = mainBuySectionRef.current.getBoundingClientRect();
      // Khi khối mua hàng chính đã cuộn qua khỏi màn hình (mép dưới cách đỉnh viewport < 20px)
      const passedMainSection = buyRect.bottom < 20;

      // 2. Vị trí của Footer
      let reachedFooter = false;
      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        // Khi mép trên của footer chạm hoặc vượt qua đáy viewport
        reachedFooter = footerRect.top <= window.innerHeight;
      }

      // Hiện thanh khi đã cuộn qua sản phẩm chính VÀ chưa chạm tới footer
      setShowStickyBar(passedMainSection && !reachedFooter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Tải danh mục active cho header
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getPublicCategories();
        if (res.data?.success && Array.isArray(res.data.data?.categories)) {
          setActiveCategories(res.data.data.categories.map((c) => c.name));
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };
    fetchCats();
  }, []);

  // Tải chi tiết sản phẩm từ backend
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await getProductById(id);
        if (res.data?.success && res.data.data?.product) {
          const prod = res.data.data.product;
          setProduct(prod);
          setActiveImage(prod.image || '');

          // Tự động chọn biến thể đầu tiên còn hàng nếu có
          if (prod.variants && prod.variants.length > 0) {
            const inStockVariant = prod.variants.find((v) => v.stock > 0) || prod.variants[0];
            setSelectedColor(inStockVariant.color || '');
            setSelectedSize(inStockVariant.size || '');
          } else {
            setSelectedColor('');
            setSelectedSize('');
          }
          setQuantity(1);
          setValidationError('');

          // Tải sản phẩm liên quan cùng danh mục
          if (prod.category) {
            try {
              const relRes = await getProducts({ category: prod.category, limit: 5, status: 'active' });
              if (relRes.data?.success && Array.isArray(relRes.data.data?.products)) {
                setRelatedProducts(relRes.data.data.products.filter((p) => (p._id || p.id) !== id));
              }
            } catch (relErr) {
              console.error('Lỗi tải sản phẩm liên quan:', relErr);
            }
          }
        } else {
          setError('Không tìm thấy thông tin sản phẩm');
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', err);
        const msg = err.response?.data?.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Quản lý lưu và hiển thị lịch sử sản phẩm đã xem (Recently Viewed)
  useEffect(() => {
    if (!product || !product._id) return;

    const prodId = product._id;
    const currentItem = {
      _id: prodId,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock || 0,
    };

    try {
      const stored = localStorage.getItem('mbbc_recently_viewed');
      let parsed = [];
      if (stored) {
        try {
          parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) parsed = [];
        } catch {
          parsed = [];
        }
      }

      // Lọc bỏ sản phẩm hiện tại để hiển thị danh sách các sản phẩm đã xem trước đó
      const historyExceptCurrent = parsed.filter((item) => (item._id || item.id) !== prodId);

      // Cập nhật lại localStorage với sản phẩm hiện tại đứng đầu tiên (tối đa 10 mục)
      const newHistory = [currentItem, ...historyExceptCurrent].slice(0, 10);
      localStorage.setItem('mbbc_recently_viewed', JSON.stringify(newHistory));

      if (historyExceptCurrent.length > 0) {
        setRecentlyViewed(historyExceptCurrent.slice(0, 4));
        setHasRealHistory(true);
      } else {
        // Fallback: nếu chưa có lịch sử trước đó, lấy gợi ý từ các sản phẩm đang bán để người dùng thấy ngay khu vực này
        getProducts({ limit: 6, status: 'active' })
          .then((res) => {
            if (res.data?.success && Array.isArray(res.data.data?.products)) {
              const others = res.data.data.products.filter((p) => (p._id || p.id) !== prodId);
              setRecentlyViewed(others.slice(0, 4));
              setHasRealHistory(false);
            }
          })
          .catch((err) => console.error('Lỗi tải sản phẩm đã xem fallback:', err));
      }
    } catch (err) {
      console.error('Lỗi quản lý lịch sử sản phẩm đã xem:', err);
    }
  }, [product]);

  // Xóa lịch sử đã xem
  const handleClearHistory = () => {
    localStorage.removeItem('mbbc_recently_viewed');
    setRecentlyViewed([]);
    setHasRealHistory(false);
    showToast('Đã xóa lịch sử xem sản phẩm');
  };

  // Kiểm tra biến thể
  const hasVariants = Boolean(product?.variants && product.variants.length > 0);

  // Danh sách các màu độc nhất của sản phẩm
  const availableColors = useMemo(() => {
    if (!product || !hasVariants) return [];
    return [...new Set(product.variants.map((v) => v.color))].filter(Boolean);
  }, [product, hasVariants]);

  // Danh sách các size độc nhất của sản phẩm
  const availableSizes = useMemo(() => {
    if (!product) return [];
    if (hasVariants) {
      return [...new Set(product.variants.map((v) => v.size))].filter(Boolean);
    }
    return product.sizes && product.sizes.length > 0 ? product.sizes : [];
  }, [product, hasVariants]);

  // Tìm biến thể đang được chọn hiện tại
  const currentVariant = useMemo(() => {
    if (!product || !hasVariants) return null;
    return product.variants.find((v) => v.color === selectedColor && v.size === selectedSize) || null;
  }, [product, hasVariants, selectedColor, selectedSize]);

  // Tồn kho khả dụng của lựa chọn hiện tại
  const availableStock = useMemo(() => {
    if (!product) return 0;
    if (hasVariants) {
      return currentVariant ? currentVariant.stock : 0;
    }
    return product.stock || 0;
  }, [product, hasVariants, currentVariant]);

  // Kiểm tra size có còn hàng ứng với màu đang chọn hay không
  const isSizeAvailableForColor = (size) => {
    if (!hasVariants) return (product?.stock || 0) > 0;
    if (!selectedColor) return true;
    const v = product.variants.find((item) => item.color === selectedColor && item.size === size);
    return Boolean(v && v.stock > 0);
  };

  // Kiểm tra màu có còn bất kỳ size nào có hàng hay không
  const isColorAvailable = (color) => {
    if (!hasVariants) return true;
    return product.variants.some((v) => v.color === color && v.stock > 0);
  };

  // Danh sách thumbnails ảnh
  const galleryImages = useMemo(() => {
    if (!product?.image) return [];
    return [product.image];
  }, [product]);

  // Mã sản phẩm chuẩn
  const productCode = product?._id ? `#MBBC-${product._id.slice(-6).toUpperCase()}` : '—';

  // Sao chép mã sản phẩm
  const handleCopyCode = () => {
    if (product?._id) {
      navigator.clipboard?.writeText(productCode);
      setCopiedCode(true);
      showToast(`Đã sao chép: ${productCode}`);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Xử lý đổi số lượng
  const handleQuantityChange = (delta) => {
    setValidationError('');
    const newQty = quantity + delta;
    if (newQty < 1) return;
    if (newQty > availableStock) {
      showToast(`Kho chỉ còn ${availableStock} ${product?.unit || 'cái'}`);
      return;
    }
    setQuantity(newQty);
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    setValidationError('');
    if (hasVariants) {
      if (!selectedColor || !selectedSize) {
        setValidationError('Vui lòng chọn màu sắc và kích cỡ (size) trước khi thêm');
        return;
      }
      if (!currentVariant || currentVariant.stock <= 0) {
        setValidationError('Biến thể đã chọn hiện đang tạm hết hàng');
        return;
      }
    } else if ((product?.stock || 0) <= 0) {
      setValidationError('Sản phẩm hiện đang tạm hết hàng');
      return;
    }

    addToCart(product, selectedSize, selectedColor, quantity);
  };

  // Mua ngay
  const handleBuyNow = () => {
    setValidationError('');
    if (hasVariants) {
      if (!selectedColor || !selectedSize) {
        setValidationError('Vui lòng chọn màu sắc và kích cỡ (size) trước khi mua');
        return;
      }
      if (!currentVariant || currentVariant.stock <= 0) {
        setValidationError('Biến thể đã chọn hiện đang tạm hết hàng');
        return;
      }
    } else if ((product?.stock || 0) <= 0) {
      setValidationError('Sản phẩm hiện đang tạm hết hàng');
      return;
    }

    buyNow(product, selectedSize, selectedColor, quantity);
  };

  // Toggle accordion
  const toggleAccordion = (section) => {
    setOpenAccordion((prev) => (prev === section ? null : section));
  };

  // ============================================
  // SKELETON LOADING
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col font-['Montserrat',sans-serif]">
        <StoreHeader isSolid={true} categories={activeCategories} />
        <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-8 w-full flex-1">
          <div className="h-4 bg-neutral-100 w-52 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7 aspect-[3/4] bg-neutral-100 animate-pulse" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-4 bg-neutral-100 w-24 animate-pulse" />
              <div className="h-10 bg-neutral-100 w-4/5 animate-pulse" />
              <div className="h-7 bg-neutral-100 w-1/3 animate-pulse" />
              <div className="h-20 bg-neutral-100 w-full animate-pulse" />
              <div className="h-12 bg-neutral-100 w-full animate-pulse" />
              <div className="h-14 bg-neutral-100 w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR / 404 STATE
  // ============================================
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col font-['Montserrat',sans-serif]">
        <StoreHeader isSolid={true} categories={activeCategories} />
        <div className="pt-32 pb-24 max-w-md mx-auto px-6 text-center flex-1 flex flex-col justify-center items-center space-y-5">
          <span className="text-3xl font-mono text-neutral-300">404</span>
          <h2 className="text-sm font-black tracking-[0.25em] uppercase text-black">
            SẢN PHẨM KHÔNG TỒN TẠI
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {error || 'Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không còn chính xác.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-8 py-3.5 bg-[#b91c1c] text-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[#991b1b] transition-colors"
          >
            QUAY LẠI TRANG CHỦ
          </button>
        </div>
      </div>
    );
  }

  const isTotalOutOfStock = (product.stock || 0) <= 0;
  const isCurrentSelectionOutOfStock = hasVariants
    ? !currentVariant || currentVariant.stock <= 0
    : isTotalOutOfStock;

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-['Montserrat',sans-serif] selection:bg-[#b91c1c] selection:text-white antialiased">
      {/* STORE HEADER */}
      <StoreHeader isSolid={true} categories={activeCategories} />

      {/* MAIN CONTAINER */}
      <main className="pt-24 sm:pt-28 pb-20 flex-1 max-w-7xl mx-auto px-4 sm:px-8 w-full">
        {/* TYPOGRAPHIC BREADCRUMB (NO SVG OVERFLOW) */}
        <nav aria-label="Breadcrumb" className="py-4 mb-4 sm:mb-8 flex items-center text-[10px] tracking-[0.22em] font-semibold uppercase text-neutral-400 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-black transition-colors shrink-0">
            TRANG CHỦ
          </Link>
          <span className="mx-2.5 text-neutral-300 shrink-0">/</span>
          {product.category && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/?category=${encodeURIComponent(product.category)}`)}
                className="hover:text-black transition-colors uppercase shrink-0"
              >
                {product.category}
              </button>
              <span className="mx-2.5 text-neutral-300 shrink-0">/</span>
            </>
          )}
          <span className="text-neutral-900 font-bold truncate max-w-[200px] sm:max-w-md">
            {product.name}
          </span>
        </nav>

        {/* 2-COLUMN EDITORIAL SHOWCASE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* ========================================================= */}
          {/* CỘT TRÁI (COL 1-7): STUDIO MEDIA GALLERY (STICKY) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 space-y-4">
            {/* Main Stage */}
            <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden group">
              <img
                src={activeImage || product.image || 'https://placehold.co/900x1200/151515/ffffff?text=M.B.B.C'}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {isTotalOutOfStock ? (
                  <span className="px-3 py-1 bg-black text-white text-[10px] font-black tracking-[0.25em] uppercase">
                    HẾT HÀNG
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-white/95 text-[#b91c1c] text-[10px] font-black tracking-[0.2em] uppercase border border-red-200 shadow-2xs">
                    M.B.B.C EDITION
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails (nếu có nhiều ảnh) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-20 aspect-[3/4] bg-[#f5f5f5] overflow-hidden transition-all shrink-0 ${
                      activeImage === img ? 'ring-2 ring-[#b91c1c]' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* CỘT PHẢI (COL 8-12): PRODUCT DOSSIER & PURCHASING */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 space-y-7">
            {/* 1. PRODUCT HEADER */}
            <div className="space-y-2.5 pb-6 border-b border-neutral-200">
              <div className="flex items-center justify-between text-[11px] tracking-[0.25em] uppercase font-bold text-neutral-400">
                <span>{product.category || 'CONTEMPORARY STREETWEAR'}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 font-mono text-neutral-400 hover:text-black transition-colors"
                  title="Sao chép mã sản phẩm"
                >
                  <span className="tracking-wider">{copiedCode ? 'ĐÃ SAO CHÉP' : productCode}</span>
                  <CopyIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-neutral-950 leading-[1.08]">
                {product.name}
              </h1>

              {/* Price & Stock status - ĐỔI MÀU GIÁ SANG ĐỎ MBBC */}
              <div className="flex items-baseline justify-between pt-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#b91c1c]">
                  {formatPrice(product.price)}
                </span>

                {isTotalOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    Tạm hết hàng
                  </span>
                ) : isCurrentSelectionOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Biến thể hết hàng
                  </span>
                ) : availableStock <= 5 ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Chỉ còn {availableStock} {product.unit || 'cái'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Còn hàng ({availableStock})
                  </span>
                )}
              </div>
            </div>

            {/* 2. MÔ TẢ NGẮN */}
            {product.description && (
              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                {product.description}
              </p>
            )}

            {/* 3. LỰA CHỌN MÀU SẮC */}
            {hasVariants && availableColors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs tracking-wider">
                  <span className="text-[11px] font-bold uppercase text-neutral-500">
                    MÀU SẮC:{' '}
                    <strong className="text-black font-extrabold">{selectedColor || 'CHƯA CHỌN'}</strong>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono tracking-wider">
                    {availableColors.length} TÙY CHỌN
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {availableColors.map((colorName) => {
                    const isSelected = selectedColor === colorName;
                    const colorHex = getVariantColorHex(colorName);
                    const isAvailable = isColorAvailable(colorName);

                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => {
                          setSelectedColor(colorName);
                          setValidationError('');
                          if (selectedSize) {
                            const v = product.variants.find(
                              (item) => item.color === colorName && item.size === selectedSize
                            );
                            if (!v || v.stock <= 0) {
                              const alternative = product.variants.find(
                                (item) => item.color === colorName && item.stock > 0
                              );
                              if (alternative) setSelectedSize(alternative.size);
                            }
                          }
                        }}
                        className={`group inline-flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : isAvailable
                            ? 'border-neutral-300 bg-white text-neutral-800 hover:border-black'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-300 opacity-60 line-through'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/20"
                          style={{ backgroundColor: colorHex }}
                        />
                        <span>{colorName}</span>
                        {isSelected && <CheckIcon className="w-3 h-3 text-white ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. LỰA CHỌN KÍCH CỠ (SIZE) */}
            {availableSizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs tracking-wider">
                  <span className="text-[11px] font-bold uppercase text-neutral-500">
                    KÍCH THƯỚC:{' '}
                    <strong className="text-black font-extrabold">{selectedSize || 'CHƯA CHỌN'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-300"
                  >
                    <RulerIcon className="w-3.5 h-3.5" />
                    <span>BẢNG SIZE</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availableSizes.map((sizeName) => {
                    const isSelected = selectedSize === sizeName;
                    const isAvailable = isSizeAvailableForColor(sizeName);

                    return (
                      <button
                        key={sizeName}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => {
                          setSelectedSize(sizeName);
                          setValidationError('');
                        }}
                        className={`h-12 text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center relative ${
                          isSelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                            : isAvailable
                            ? 'bg-white text-black border-neutral-300 hover:border-black'
                            : 'bg-neutral-50 text-neutral-300 border-neutral-200 cursor-not-allowed before:absolute before:inset-0 before:m-auto before:h-[1px] before:w-full before:bg-neutral-300 before:rotate-[-25deg]'
                        }`}
                      >
                        <span>{sizeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. THÔNG BÁO LỖI (NẾU CHƯA CHỌN SIZE/MÀU) */}
            {validationError && (
              <div className="p-3 border border-red-600 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-600 animate-shake">
                {validationError}
              </div>
            )}

            {/* 6. SỐ LƯỢNG & CÁC NÚT MUA HÀNG (MÀU SẮC TƯƠI MỚI, KHÔNG CÒN BỊ ĐEN TOÀN DIỆN) */}
            <div ref={mainBuySectionRef} className="space-y-3 pt-2">
              <div className="flex items-stretch gap-3">
                {/* Quantity Stepper */}
                <div className="w-32 h-13 border border-neutral-300 flex items-center justify-between px-2 bg-white shrink-0">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isCurrentSelectionOutOfStock}
                    onClick={() => handleQuantityChange(-1)}
                    className="w-8 h-full flex items-center justify-center text-neutral-600 hover:text-black disabled:opacity-20 transition-colors"
                  >
                    <MinusIcon className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono font-bold select-none text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= availableStock || isCurrentSelectionOutOfStock}
                    onClick={() => handleQuantityChange(1)}
                    className="w-8 h-full flex items-center justify-center text-neutral-600 hover:text-black disabled:opacity-20 transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Primary CTA: THÊM VÀO GIỎ HÀNG (NỀN TRẮNG VIỀN ĐỎ CHỮ ĐỎ THỜI TRANG MBBC) */}
                <button
                  type="button"
                  disabled={isCurrentSelectionOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 h-13 border-2 border-[#b91c1c] bg-white text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.99] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#b91c1c] disabled:cursor-not-allowed shadow-2xs"
                >
                  <BagIcon className="w-4 h-4" />
                  <span>THÊM VÀO GIỎ HÀNG</span>
                </button>
              </div>

              {/* Secondary CTA: MUA NGAY (NỀN ĐỎ THƯƠNG HIỆU M.B.B.C NỔI BẬT & CUỐN HÚT) */}
              <button
                type="button"
                disabled={isCurrentSelectionOutOfStock}
                onClick={handleBuyNow}
                className="w-full h-13 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs tracking-[0.22em] uppercase flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-30 disabled:hover:bg-[#b91c1c] disabled:cursor-not-allowed"
              >
                <span>{isCurrentSelectionOutOfStock ? 'TẠM HẾT HÀNG' : 'MUA NGAY'}</span>
              </button>
            </div>

            {/* 7. BRAND GUARANTEES (EDITORIAL HIGHLIGHTS VỚI ACCENT ĐỎ MBBC) */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 py-5 border-t border-b border-neutral-200 text-[10px] uppercase tracking-[0.18em] font-bold text-neutral-700">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#b91c1c] rounded-none shrink-0" />
                <span>MIỄN PHÍ GIAO HÀNG ĐƠN TỪ 500K</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#b91c1c] rounded-none shrink-0" />
                <span>ĐỔI SIZE 30 NGÀY TẬN NƠI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#b91c1c] rounded-none shrink-0" />
                <span>100% HEAVYWEIGHT COTTON</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#b91c1c] rounded-none shrink-0" />
                <span>ĐỒNG KIỂM COD KHI NHẬN HÀNG</span>
              </div>
            </div>

            {/* 8. EDITORIAL ACCORDIONS */}
            <div className="space-y-0 divide-y divide-neutral-200 text-xs">
              {/* Accordion 1: Details */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('details')}
                  className="w-full flex items-center justify-between py-2 text-left text-xs font-bold uppercase tracking-[0.18em] text-neutral-900 hover:text-neutral-600 transition-colors"
                >
                  <span>CHI TIẾT THIẾT KẾ & FORM DÁNG</span>
                  <span className="font-mono text-sm">{openAccordion === 'details' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'details' && (
                  <div className="pt-2 pb-3 text-xs text-neutral-600 leading-relaxed space-y-2">
                    <p>{product.description || 'Sản phẩm nằm trong bộ sưu tập đương đại mới nhất từ M.B.B.C.'}</p>
                    <ul className="space-y-1.5 text-neutral-500 pt-1">
                      <li>• Form dáng: Boxy Oversize chuẩn tỉ lệ đường phố đương đại.</li>
                      <li>• Chất liệu: 100% Heavyweight Cotton 320GSM, bề mặt đanh mịn.</li>
                      <li>• Đường may: Trần đôi gia cố viền cổ áo và gấu chống giãn sau nhiều lần giặt.</li>
                      <li>• Chi tiết: Tag dệt nhận diện thương hiệu M.B.B.C và tem barcode xác thực.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 2: Care */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('care')}
                  className="w-full flex items-center justify-between py-2 text-left text-xs font-bold uppercase tracking-[0.18em] text-neutral-900 hover:text-neutral-600 transition-colors"
                >
                  <span>HƯỚNG DẪN BẢO QUẢN & GIẶT ỦI</span>
                  <span className="font-mono text-sm">{openAccordion === 'care' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'care' && (
                  <div className="pt-2 pb-3 text-xs text-neutral-600 leading-relaxed">
                    <ul className="space-y-1.5 text-neutral-500">
                      <li>• Giặt máy ở chế độ nhẹ hoặc giặt tay với nước lạnh dưới 30°C.</li>
                      <li>• Lộn trái mặt trong của áo trước khi giặt và phơi để giữ màu sắc bền lâu.</li>
                      <li>• Không sử dụng hóa chất tẩy rửa mạnh hoặc chất có chứa clo.</li>
                      <li>• Là/ủi ở nhiệt độ trung bình, tránh là trực tiếp lên bề mặt in hoặc thêu.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Accordion 3: Shipping */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between py-2 text-left text-xs font-bold uppercase tracking-[0.18em] text-neutral-900 hover:text-neutral-600 transition-colors"
                >
                  <span>CHÍNH SÁCH VẬN CHUYỂN & ĐỔI TRẢ</span>
                  <span className="font-mono text-sm">{openAccordion === 'shipping' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pt-2 pb-3 text-xs text-neutral-600 leading-relaxed space-y-2">
                    <p>• Thời gian vận chuyển toàn quốc từ 2 đến 4 ngày làm việc.</p>
                    <p>• Quý khách có quyền mở bưu phẩm đồng kiểm ngoại quan trước khi thanh toán cho bưu tá.</p>
                    <p>• Hỗ trợ đổi size linh hoạt trong vòng 30 ngày (sản phẩm còn nguyên tem tag, chưa qua sử dụng hoặc giặt tẩy).</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* SẢN PHẨM LIÊN QUAN / CÙNG DANH MỤC */}
        {/* ========================================================= */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 pt-16 border-t border-neutral-200">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase mb-1">
                  DISCOVER MORE
                </p>
                <h3 className="text-lg sm:text-xl font-black tracking-[0.15em] uppercase text-black">
                  SẢN PHẨM CÙNG DANH MỤC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/?category=${encodeURIComponent(product.category || 'ALL')}`)}
                className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-600 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-300"
              >
                XEM TẤT CẢ
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((rel) => {
                const relId = rel._id || rel.id;
                const relStockOut = (rel.stock || 0) <= 0;
                return (
                  <div
                    key={relId}
                    onClick={() => navigate(`/product/${relId}`)}
                    className="group cursor-pointer flex flex-col text-left space-y-2.5"
                  >
                    <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden">
                      <img
                        src={rel.image || 'https://placehold.co/600x800/151515/ffffff?text=M.B.B.C'}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      {relStockOut && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-wider">
                          HẾT HÀNG
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{rel.category || 'MBBC'}</p>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase truncate group-hover:underline">
                        {rel.name}
                      </h4>
                      <p className="text-xs font-bold text-[#b91c1c]">{formatPrice(rel.price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SẢN PHẨM ĐÃ XEM (RECENTLY VIEWED) */}
        {/* ========================================================= */}
        {recentlyViewed.length > 0 && (
          <section className="mt-16 sm:mt-20 pt-16 border-t border-neutral-200">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase mb-1">
                  RECENTLY VIEWED
                </p>
                <h3 className="text-lg sm:text-xl font-black tracking-[0.15em] uppercase text-black">
                  SẢN PHẨM ĐÃ XEM
                </h3>
              </div>
              {hasRealHistory && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-bold tracking-[0.15em] uppercase text-neutral-400 hover:text-black transition-colors underline underline-offset-4 decoration-neutral-200"
                >
                  XÓA LỊCH SỬ
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {recentlyViewed.slice(0, 4).map((viewedItem) => {
                const vId = viewedItem._id || viewedItem.id;
                const vStockOut = (viewedItem.stock || 0) <= 0;
                return (
                  <div
                    key={vId}
                    onClick={() => {
                      navigate(`/product/${vId}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group cursor-pointer flex flex-col text-left space-y-2.5"
                  >
                    <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden">
                      <img
                        src={viewedItem.image || 'https://placehold.co/600x800/151515/ffffff?text=M.B.B.C'}
                        alt={viewedItem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      {vStockOut && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-wider">
                          HẾT HÀNG
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">
                        {viewedItem.category || 'M.B.B.C ARCHIVE'}
                      </p>
                      <h4 className="text-xs font-bold text-neutral-900 uppercase truncate group-hover:underline">
                        {viewedItem.name}
                      </h4>
                      <p className="text-xs font-bold text-[#b91c1c]">{formatPrice(viewedItem.price)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL HƯỚNG DẪN CHỌN SIZE (CLEAN ARCHITECTURAL MODAL) */}
      {/* ========================================================= */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowSizeGuide(false)} />
          <div className="relative bg-white text-black max-w-lg w-full p-6 sm:p-8 z-10 shadow-2xl border border-neutral-300 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <RulerIcon className="w-4 h-4 text-black" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em]">BẢNG QUY CHUẨN SIZE M.B.B.C</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="p-1 text-neutral-400 hover:text-black transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              Thông số tham khảo chuẩn form <strong>Boxy Oversize</strong> đặc trưng của thương hiệu M.B.B.C. Nếu quý khách muốn mặc vừa vặn (Regular Fit), có thể chọn lùi 1 size.
            </p>

            <div className="overflow-x-auto border border-neutral-200">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-200">
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Chiều cao</th>
                    <th className="py-2.5 px-3">Cân nặng</th>
                    <th className="py-2.5 px-3">Dài áo (cm)</th>
                    <th className="py-2.5 px-3">Rộng ngực (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-black bg-neutral-50 font-sans">S</td>
                    <td className="py-2.5 px-3">1m55 - 1m65</td>
                    <td className="py-2.5 px-3">45 - 55 kg</td>
                    <td className="py-2.5 px-3">68</td>
                    <td className="py-2.5 px-3">54</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-black bg-neutral-50 font-sans">M</td>
                    <td className="py-2.5 px-3">1m65 - 1m72</td>
                    <td className="py-2.5 px-3">55 - 65 kg</td>
                    <td className="py-2.5 px-3">71</td>
                    <td className="py-2.5 px-3">57</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-black bg-neutral-50 font-sans">L</td>
                    <td className="py-2.5 px-3">1m70 - 1m78</td>
                    <td className="py-2.5 px-3">65 - 75 kg</td>
                    <td className="py-2.5 px-3">74</td>
                    <td className="py-2.5 px-3">60</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-black bg-neutral-50 font-sans">XL</td>
                    <td className="py-2.5 px-3">1m75 - 1m85</td>
                    <td className="py-2.5 px-3">75 - 85 kg</td>
                    <td className="py-2.5 px-3">77</td>
                    <td className="py-2.5 px-3">63</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-black bg-neutral-50 font-sans">2XL</td>
                    <td className="py-2.5 px-3">&gt; 1m80</td>
                    <td className="py-2.5 px-3">&gt; 85 kg</td>
                    <td className="py-2.5 px-3">80</td>
                    <td className="py-2.5 px-3">66</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setShowSizeGuide(false)}
              className="w-full py-3 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}

      {/* FOOTER STREETWEAR M.B.B.C */}
      <footer ref={footerRef} className="w-full bg-black text-white pt-12 sm:pt-16 pb-8 px-6 sm:px-12 border-t border-neutral-900 select-none overflow-hidden mt-auto">
        <div className="w-full flex flex-col justify-between">
          <div className="w-full overflow-hidden mb-8 sm:mb-12">
            <h2 className="font-condensed text-[#b91c1c] text-[20vw] sm:text-[18vw] lg:text-[17.5vw] font-black leading-[0.82] tracking-[-0.02em] whitespace-nowrap select-none hover:text-[#d62020] transition-colors duration-300">
              M.B.B.C.
            </h2>
          </div>
          <div className="w-full border-t border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
            <div className="flex items-center gap-2 text-[11px] tracking-wider text-neutral-400">
              <span>© 2026 M.B.B.C.</span>
              <span className="text-neutral-700">•</span>
              <span className="uppercase text-neutral-400">All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-neutral-400 font-bold uppercase text-[11px] tracking-wider">
              <button onClick={() => showToast('Chính sách đổi trả')} className="hover:text-white transition-colors">
                Chính sách đổi trả
              </button>
              <button onClick={() => setShowSizeGuide(true)} className="hover:text-white transition-colors">
                Hướng dẫn size
              </button>
              <button onClick={() => showToast('Liên hệ hỗ trợ')} className="hover:text-white transition-colors">
                Liên hệ
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* THANH THÊM VÀO GIỎ STICKY DƯỚI ĐÁY MÀN HÌNH (CHUẨN MẪU BACYKISM) */}
      {/* Tự động hiện khi lướt qua sản phẩm chính & biến mất khi đến Footer hoặc cuộn ngược lên */}
      {/* ========================================================= */}
      <div
        className={`fixed bottom-0 left-0 w-full z-40 bg-white/98 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out font-['Montserrat',sans-serif] ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
          {/* CỘT TRÁI: ẢNH NHỎ & GIÁ SẢN PHẨM */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 bg-[#f5f5f5] border border-neutral-200 overflow-hidden shrink-0">
              <img
                src={activeImage || product.image || 'https://placehold.co/100x133/151515/ffffff?text=MBBC'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-xs font-bold text-neutral-900 uppercase truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px] leading-tight">
                {product.name}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#b91c1c] tracking-tight">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>

          {/* CỘT GIỮA: MÀU SẮC & KÍCH THƯỚC (DESKTOP & TABLET) */}
          <div className="hidden md:flex items-center gap-5">
            {/* Bộ chọn màu sắc */}
            {hasVariants && availableColors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Màu sắc:</span>
                <div className="relative">
                  <select
                    value={selectedColor}
                    onChange={(e) => {
                      const newCol = e.target.value;
                      setSelectedColor(newCol);
                      setValidationError('');
                      if (selectedSize) {
                        const v = product.variants?.find((item) => item.color === newCol && item.size === selectedSize);
                        if (!v || v.stock <= 0) {
                          const alt = product.variants?.find((item) => item.color === newCol && item.stock > 0);
                          if (alt) setSelectedSize(alt.size);
                        }
                      }
                    }}
                    className="h-9 pl-3 pr-8 border border-neutral-300 text-xs font-bold uppercase bg-white focus:outline-none focus:border-black appearance-none cursor-pointer"
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">▼</div>
                </div>
                {selectedColor && (
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: getVariantColorHex(selectedColor) }}
                    title={selectedColor}
                  />
                )}
              </div>
            )}

            {/* Bộ chọn kích thước */}
            {availableSizes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Kích thước:</span>
                <div className="relative">
                  <select
                    value={selectedSize}
                    onChange={(e) => {
                      setSelectedSize(e.target.value);
                      setValidationError('');
                    }}
                    className="h-9 pl-3 pr-8 border border-neutral-300 text-xs font-bold uppercase bg-white focus:outline-none focus:border-black appearance-none cursor-pointer"
                  >
                    {availableSizes.map((s) => {
                      const isAvail = isSizeAvailableForColor(s);
                      return (
                        <option key={s} value={s} disabled={!isAvail}>
                          {s} {!isAvail ? '(Hết hàng)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">▼</div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: BỘ ĐẾM SỐ LƯỢNG & NÚT THÊM VÀO GIỎ */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Chọn size nhanh trên Mobile */}
            <div className="md:hidden">
              {availableSizes.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedSize}
                    onChange={(e) => {
                      setSelectedSize(e.target.value);
                      setValidationError('');
                    }}
                    className="h-9 pl-2.5 pr-6 border border-neutral-300 text-xs font-bold uppercase bg-white focus:outline-none appearance-none cursor-pointer"
                  >
                    {availableSizes.map((s) => {
                      const isAvail = isSizeAvailableForColor(s);
                      return (
                        <option key={s} value={s} disabled={!isAvail}>
                          {s}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[9px]">▼</div>
                </div>
              )}
            </div>

            {/* Quantity Stepper (hiện trên màn hình sm trở lên) */}
            <div className="hidden sm:flex h-9 border border-neutral-300 items-center justify-between px-1.5 bg-white shrink-0">
              <button
                type="button"
                disabled={quantity <= 1 || isCurrentSelectionOutOfStock}
                onClick={() => handleQuantityChange(-1)}
                className="w-6 h-full flex items-center justify-center text-neutral-600 hover:text-black disabled:opacity-20 transition-colors"
              >
                <MinusIcon className="w-2.5 h-2.5" />
              </button>
              <span className="text-xs font-mono font-bold select-none text-neutral-900 px-2">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= availableStock || isCurrentSelectionOutOfStock}
                onClick={() => handleQuantityChange(1)}
                className="w-6 h-full flex items-center justify-center text-neutral-600 hover:text-black disabled:opacity-20 transition-colors"
              >
                <PlusIcon className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Nút THÊM VÀO GIỎ (ĐỎ THƯƠNG HIỆU MBBC NỔI BẬT CHUẨN MẪU BACYKISM) */}
            <button
              type="button"
              disabled={isCurrentSelectionOutOfStock}
              onClick={handleAddToCart}
              className="h-9 sm:h-10 px-4 sm:px-7 bg-[#b91c1c] hover:bg-[#991b1b] text-white text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase transition-colors shrink-0 shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <BagIcon className="w-3.5 h-3.5 hidden sm:inline-block" />
              <span>{isCurrentSelectionOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GIỎ HÀNG, THANH TOÁN & ĐƠN MUA */}
      <StoreModals />
    </div>
  );
};

export default ProductDetailPage;
