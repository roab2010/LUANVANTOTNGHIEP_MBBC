import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Assets
import slideImg from '../../assets/slide.jpg';
import mbbcLogo from '../../assets/logo MBBC.png';

// Service API Backend
import { getProducts } from '../../services/productApi';
import { getPublicCategories } from '../../services/categoryApi';
import { useCart } from '../../context/CartContext';
import StoreModals from '../../components/common/StoreModals';

// ============================================
// ICONS (Clean, Precision SVG)
// ============================================
const SearchIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const UserIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const CartWireIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg className="w-4 h-4" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth={1.6} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const ChevronDownIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const BigChevronDownIcon = () => (
  <svg className="w-6 h-6 text-neutral-400 hover:text-black transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5 text-neutral-800" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Format VND currency
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

// ============================================
// COMPONENT CHÍNH
// ============================================
const CustomerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Header Hover & Scroll State
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Search Popover State (Hình 1)
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Cart & Global State từ CartContext
  const {
    cart,
    addToCart,
    totalCartCount,
    setIsCartOpen,
    showToast,
  } = useCart();

  // Product Filter & QuickView State
  const [products, setProducts] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewSize, setQuickViewSize] = useState('M');
  const [quickViewColor, setQuickViewColor] = useState('Đen');

  const searchBoxRef = useRef(null);

  // Tải danh sách danh mục đang hoạt động từ Backend (ẩn danh mục đã bị khóa)
  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        const res = await getPublicCategories();
        if (res.data?.success && Array.isArray(res.data.data?.categories)) {
          setActiveCategories(res.data.data.categories.map((c) => c.name));
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục active:', err);
      }
    };
    fetchActiveCategories();
  }, []);

  // Danh mục tabs động (chỉ hiển thị các danh mục đang hoạt động)
  const categoryTabs = useMemo(() => {
    if (activeCategories.length > 0) {
      return ['ALL', ...activeCategories];
    }
    return ['ALL', 'TOPS', 'OUTWEAR', 'BOTTOMS', 'ACCESSORIES'];
  }, [activeCategories]);

  // Dropdown menu SHOP động (đầy đủ TOPS, OUTWEAR, BOTTOMS, ACCESSORIES, NEW ARRIVALS, không trùng lặp)
  const shopDropdownItems = useMemo(() => {
    const base = ['TOPS', 'OUTWEAR', 'BOTTOMS', 'ACCESSORIES'];
    const extra = (activeCategories || []).filter(
      (cat) => cat && !base.includes(cat.toUpperCase()) && cat.toUpperCase() !== 'NEW ARRIVALS'
    );
    const combined = [...base, ...extra, 'NEW ARRIVALS'];
    return combined.map((cat) => ({ label: cat, filter: cat }));
  }, [activeCategories]);

  // Tự động chuyển về ALL nếu danh mục đang chọn bị Admin khóa
  useEffect(() => {
    if (selectedCategory !== 'ALL' && activeCategories.length > 0) {
      const exists = activeCategories.some(
        (c) => c.toUpperCase() === selectedCategory.toUpperCase()
      );
      if (!exists) {
        setSelectedCategory('ALL');
      }
    }
  }, [activeCategories, selectedCategory]);

  // Tải danh sách sản phẩm thật từ Backend MongoDB (backend tự động ẩn sản phẩm thuộc danh mục bị khóa)
  const fetchBackendProducts = async () => {
    try {
      setIsLoading(true);
      const res = await getProducts({ limit: 100, status: 'active' });
      if (res.data?.success && Array.isArray(res.data.data?.products)) {
        setProducts(res.data.data.products);
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm từ backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendProducts();
  }, []);

  // Lắng nghe scroll để trượt thanh trắng
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng Search Popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  // Header active khi hover, scroll, hoặc mở search popover
  const isHeaderActive = isHeaderHovered || isScrolled || searchOpen;


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleWishlist = (id) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((item) => item !== id));
      showToast('Đã xóa khỏi danh sách yêu thích');
    } else {
      setWishlist([...wishlist, id]);
      showToast('Đã thêm vào danh sách yêu thích');
    }
  };

  const openQuickView = (product) => {
    const hasVars = Boolean(product.variants && product.variants.length > 0);
    if (hasVars) {
      const inStockVar = product.variants.find((v) => (v.stock || 0) > 0) || product.variants[0];
      setQuickViewSize(inStockVar?.size || product.variants[0]?.size || 'M');
      setQuickViewColor(inStockVar?.color || product.variants[0]?.color || 'Đen');
    } else {
      setQuickViewSize('M');
      setQuickViewColor('');
    }
    setQuickViewProduct(product);
  };


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reset số lượng hiển thị khi đổi danh mục
  useEffect(() => {
    setVisibleLimit(10);
  }, [selectedCategory]);

  // Lọc sản phẩm thật theo danh mục và từ khóa tìm kiếm (chỉ hiển thị sản phẩm đang bán)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Loại bỏ các sản phẩm có trạng thái ngừng bán
      if (p.status && p.status !== 'active') return false;

      const pCat = (p.category || '').toUpperCase().trim();
      const matchCat =
        selectedCategory === 'ALL' ||
        pCat === selectedCategory.toUpperCase();
      const matchSearch =
        !searchQuery.trim() ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pCat.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleLimit);
  }, [filteredProducts, visibleLimit]);

  return (
    <div className="min-h-screen bg-white text-black font-['Montserrat',sans-serif] antialiased">

      {/* ========================================================= */}
      {/* HEADER BACYKISM CHUẨN (HÌNH 2): LOGO TRÁI, MENU GIỮA, ICONS PHẢI */}
      {/* Lúc chưa hover: chữ trắng nổi trên banner. Lúc hover: trượt trắng chữ đen */}
      {/* ========================================================= */}
      <header
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-out ${
          isHeaderActive
            ? 'bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-b border-neutral-100 translate-y-0'
            : 'bg-transparent text-white border-b border-transparent'
        }`}
      >
        <div className="w-full px-6 sm:px-10 lg:px-14 xl:px-16 flex items-center justify-between h-20 sm:h-22">
          
          {/* CỘT TRÁI: LOGO BÊN TRÁI (KHÔNG CÒN KHUNG NỀN ĐEN, TĂNG KÍCH THƯỚC TO ĐẸP) */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0 py-1"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              src={mbbcLogo}
              alt="M.B.B.C Logo"
              className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
            <span
              className={`font-brand text-2xl sm:text-[26px] md:text-3xl uppercase transition-colors select-none ${
                isHeaderActive ? 'text-black' : 'text-white'
              }`}
            >
              M.B.B.C
            </span>
          </div>

          {/* CỘT GIỮA: MENU NAVIGATION (ABOUT US ⌵, SHOP ⌵, CAMPAIGN ⌵, WOLRWIDE SHIPPING ⌵) */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12" aria-label="Menu chính">
            
            {/* ABOUT US */}
            <div className="group relative py-2">
              <button
                onClick={() => {
                  document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`text-[12px] sm:text-[13px] font-bold tracking-[0.12em] uppercase transition-colors flex items-center gap-1 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>ABOUT US</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                {/* Hit-box bridge giúp lướt chuột mượt mà 100% không bao giờ rớt hover */}
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[210px]">
                  {['BRAND STORY', 'STREETWEAR PHILOSOPHY', 'SHOWROOM'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SHOP (DROPDOWN NHƯ HÌNH 5) */}
            <div className="group relative py-2">
              <button
                onClick={() => {
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`text-[12px] sm:text-[13px] font-bold tracking-[0.12em] uppercase transition-colors flex items-center gap-1 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>SHOP</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* DROPDOWN MENU CHUẨN HÌNH 5 */}
              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                {/* Hit-box bridge */}
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[210px]">
                  {shopDropdownItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(`/category/${encodeURIComponent(item.filter)}`);
                      }}
                      className={`block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase hover:translate-x-1.5 transition-all flex items-center justify-between ${
                        item.label === 'NEW ARRIVALS'
                          ? 'text-[#b91c1c] hover:text-[#991b1b]'
                          : 'text-neutral-800 hover:text-black'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.label === 'NEW ARRIVALS' && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-red-100 text-[#b91c1c] tracking-normal">
                          HOT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CAMPAIGN */}
            <div className="group relative py-2">
              <button
                onClick={() => {
                  document.getElementById('hero-banner')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`text-[12px] sm:text-[13px] font-bold tracking-[0.12em] uppercase transition-colors flex items-center gap-1 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>CAMPAIGN</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                {/* Hit-box bridge */}
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[220px]">
                  {['BA SON METRO DROP', 'CYBER UNDERGROUND'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        document.getElementById('hero-banner')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* WOLRWIDE SHIPPING (CHÍNH XÁC NHƯ HÌNH 2) */}
            <div className="group relative py-2">
              <button
                onClick={() => {
                  document.getElementById('shipping-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`text-[12px] sm:text-[13px] font-bold tracking-[0.12em] uppercase transition-colors flex items-center gap-1 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>WOLRWIDE SHIPPING</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                {/* Hit-box bridge */}
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[230px]">
                  {['GIAO HÀNG TOÀN QUỐC', 'CHÍNH SÁCH ĐỔI SIZE 30 NGÀY', 'QUY CHUẨN ĐÓNG HỘP'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        document.getElementById('shipping-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* CỘT PHẢI: CHỈ 3 ICON TỐI GIẢN (KÍNH LÚP, USER, GIỎ HÀNG CHẤM ĐỎ) - KHÔNG CHỮ, KHÔNG TIẾNG VIỆT */}
          <div className="flex items-center gap-5 sm:gap-6 shrink-0 relative" ref={searchBoxRef}>
            
            {/* 1. NÚT SEARCH (MỞ POPOVER CHUẨN HÌNH 1) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-1.5 transition-colors focus:outline-none ${
                isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
              }`}
              aria-label="Tìm kiếm sản phẩm"
            >
              <SearchIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>

            {/* POPOVER TÌM KIẾM CHUẨN HÌNH 1 (CÓ MŨI TÊN CHỈ LÊN NÚT SEARCH) */}
            {searchOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white text-black shadow-[0_10px_35px_rgba(0,0,0,0.15)] border border-neutral-100 p-5 z-50 animate-slide-down">
                {/* Mũi tên tam giác chỉ thẳng vào icon kính lúp */}
                <div className="absolute -top-2 right-1.5 sm:right-2 w-4 h-4 bg-white border-t border-l border-neutral-100 transform rotate-45" />

                {/* Tiêu đề TÌM KIẾM căn giữa */}
                <h4 className="text-center text-xs font-bold tracking-[0.2em] text-neutral-900 uppercase mb-4">
                  TÌM KIẾM
                </h4>

                {/* Ô input nền xám nhạt với icon kính lúp bên trong */}
                <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-[#f5f5f5] px-3.5 py-2.5">
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 outline-none pr-7 font-medium"
                  />
                  <button type="submit" className="absolute right-3 text-neutral-400 hover:text-black">
                    <SearchIcon className="w-4 h-4" />
                  </button>
                </form>

                {searchQuery && (
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[11px] text-neutral-400 hover:text-black underline"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. NÚT USER (CHỈ ICON NGƯỜI NHƯ HÌNH 2) */}
            <div className="relative">
              <button
                onClick={() => {
                  if (user) {
                    setUserDropdownOpen(!userDropdownOpen);
                  } else {
                    navigate('/login');
                  }
                }}
                className={`p-1.5 transition-colors focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
                aria-label="Tài khoản"
              >
                <UserIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </button>

              {/* Menu tài khoản nhỏ khi user đã đăng nhập */}
              {user && userDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white text-black shadow-xl border border-neutral-100 p-4 min-w-[200px] z-50 animate-slide-down">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Xin chào,</p>
                  <p className="text-xs font-black text-black truncate mb-2.5">{user.fullName || user.email || 'Khách hàng'}</p>
                  
                  <div className="space-y-1 mb-3 border-t border-neutral-100 pt-2">
                    <button
                      onClick={() => {
                        setIsMyOrdersOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-black hover:bg-neutral-50 transition-colors flex items-center justify-between"
                    >
                      <span>Đơn hàng của tôi</span>
                      <span className="text-[10px] text-neutral-400">→</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left py-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors flex items-center justify-between"
                      >
                        <span>Trang quản trị</span>
                        <span className="text-[10px] text-indigo-400">→</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-1.5 text-center bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* 3. NÚT GIỎ HÀNG (CHỈ ICON XE ĐẨY VỚI CHẤM ĐỎ '0' NHƯ HÌNH 2) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-1.5 transition-colors focus:outline-none ${
                isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
              }`}
              aria-label="Giỏ hàng"
            >
              <CartWireIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {totalCartCount}
              </span>
            </button>

            {/* Mobile menu icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-1 focus:outline-none ${isHeaderActive ? 'text-black' : 'text-white'}`}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu xổ xuống */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white text-black border-t border-neutral-100 px-6 py-5 space-y-3">
            {shopDropdownItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(`/category/${encodeURIComponent(item.filter)}`);
                }}
                className={`block w-full text-left py-2 text-xs font-black tracking-widest uppercase flex items-center justify-between ${
                  item.label === 'NEW ARRIVALS' ? 'text-[#b91c1c]' : 'text-neutral-900'
                }`}
              >
                <span>{item.label}</span>
                {item.label === 'NEW ARRIVALS' && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-red-100 text-[#b91c1c] tracking-normal">
                    HOT
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* HERO BANNER SECTION (CHỨA ẢNH slide.jpg) */}
      {/* ========================================================= */}
      <section id="hero-banner" className="relative w-full bg-black overflow-hidden">
        <div className="relative w-full h-[85vh] sm:h-[92vh] min-h-[580px]">
          <img
            src={slideImg}
            alt="M.B.B.C Streetwear Hero Lookbook"
            className="w-full h-full object-cover object-center block"
          />

          {/* Lớp gradient mỏng ở đỉnh để chữ trắng header luôn hiển thị rõ */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 via-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Mũi tên chỉ xuống (chevron) ở giữa như hình Bacykism */}
        <div className="flex justify-center py-6 sm:py-8 bg-white">
          <button
            onClick={() => {
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-2 animate-bounce cursor-pointer focus:outline-none"
            aria-label="Cuộn xuống xem sản phẩm"
          >
            <BigChevronDownIcon />
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* PHÂN MỤC: NEW ARRIVALS & GRID THẺ SẢN PHẨM */}
      {/* ========================================================= */}
      <main id="products-section" className="w-full bg-white px-4 sm:px-8 lg:px-12 xl:px-16 pb-24">
        {/* TIÊU ĐỀ NEW ARRIVALS */}
        <div className="text-center mb-10 pt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[0.24em] text-black uppercase">
            NEW ARRIVALS
          </h2>

          {/* Category Tabs tối giản */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-6 border-b border-neutral-100 pb-4">
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[12px] sm:text-[13px] font-bold tracking-[0.14em] uppercase transition-colors relative pb-1 ${
                  selectedCategory === cat
                    ? 'text-black font-black'
                    : 'text-neutral-400 hover:text-black'
                }`}
              >
                {cat}
                {selectedCategory === cat && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* GRID SẢN PHẨM CHUẨN FORM TỪ BACKEND DATABASE (5 CỘT DESKTOP NHƯ HÌNH 2) */}
        {isLoading ? (
          <div className="py-24 text-center text-neutral-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
            Đang tải dữ liệu sản phẩm từ hệ thống...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-xs font-semibold uppercase tracking-widest">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-12">
              {displayedProducts.map((product) => {
                const prodId = product._id || product.id;
                const prodImg = product.image || 'https://placehold.co/600x800/151515/ffffff?text=M.B.B.C';
                const hasVariants = product.variants && product.variants.length > 0;
                const variantSizes = hasVariants ? [...new Set(product.variants.map((v) => v.size))] : (product.sizes || []);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div key={prodId} className="group flex flex-col text-left">
                    {/* Khung ảnh sạch tinh tế - bấm để xem chi tiết sản phẩm */}
                    <div
                      onClick={() => navigate(`/product/${prodId}`)}
                      className="relative aspect-[3/4] bg-[#f7f7f7] overflow-hidden cursor-pointer"
                    >
                      <img
                        src={prodImg}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      {isOutOfStock && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-black uppercase tracking-wider">
                          HẾT HÀNG
                        </div>
                      )}
                    </div>

                    {/* Dòng metadata kích thước / biến thể */}
                    <p className="text-[12px] text-neutral-400 font-normal mt-3 text-left">
                      {hasVariants ? `+${variantSizes.length} Kích thước (${product.variants.length} biến thể)` : (product.stock > 0 ? `Còn ${product.stock} ${product.unit || 'cái'}` : 'Hết hàng')}
                    </p>

                    {/* Tên sản phẩm - bấm để xem chi tiết */}
                    <h3
                      onClick={() => navigate(`/product/${prodId}`)}
                      className="text-[13px] font-semibold text-neutral-900 uppercase tracking-wide cursor-pointer hover:underline mt-1 line-clamp-1 text-left"
                    >
                      {product.name}
                    </h3>

                    {/* Hàng giá tiền & nút THÊM VÀO GIỎ */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[14px] font-bold text-black tracking-tight">
                        {product.price ? product.price.toLocaleString('vi-VN') : 0}<u>đ</u>
                      </span>

                      <button
                        onClick={() => openQuickView(product)}
                        disabled={isOutOfStock}
                        className="flex items-center gap-1.5 group/btn text-black hover:opacity-75 transition-opacity focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="text-[11px] font-bold tracking-wider uppercase">
                          {isOutOfStock ? 'HẾT HÀNG' : 'CHỌN SIZE'}
                        </span>
                        <div className="w-7 h-7 bg-[#111111] hover:bg-black rounded-full flex items-center justify-center text-white shrink-0 group-hover/btn:scale-105 transition-transform active:scale-95 shadow-sm">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NÚT XEM THÊM SẢN PHẨM CHUẨN MẪU HÌNH 2 & 3 */}
            {visibleLimit < filteredProducts.length && (
              <div className="mt-12 sm:mt-16 text-center">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 10)}
                  className="group inline-flex items-center justify-center gap-2.5 px-8 sm:px-12 py-3 border border-black bg-white text-black text-xs sm:text-[13px] font-medium tracking-wide hover:bg-[#222222] hover:text-white transition-all duration-300 ease-out focus:outline-none shadow-xs active:scale-[0.98]"
                >
                  <span>Xem thêm sản phẩm</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* ABOUT US SECTION */}
      {/* ========================================================= */}
      <section id="about-section" className="w-full border-t border-neutral-100 py-16 px-6 sm:px-12 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-[0.24em] text-black uppercase mb-4">
            VỀ M.B.B.C
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
            M.B.B.C là thương hiệu thời trang đường phố đương đại, tập trung vào cấu trúc phom dáng Boxy Oversize, chất liệu Heavyweight Cotton dệt độc quyền và tinh thần tự do không rào cản.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* WORLDWIDE SHIPPING SECTION */}
      {/* ========================================================= */}
      <section id="shipping-section" className="w-full border-t border-neutral-100 py-12 px-6 sm:px-12 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <h4 className="text-xs font-black tracking-widest text-black uppercase mb-1">GIAO HÀNG TOÀN QUỐC</h4>
            <p className="text-xs text-neutral-500 font-medium">Miễn phí giao hàng cho mọi đơn từ 500.000₫</p>
          </div>
          <div>
            <h4 className="text-xs font-black tracking-widest text-black uppercase mb-1">ĐỔI SIZE 30 NGÀY</h4>
            <p className="text-xs text-neutral-500 font-medium">Hỗ trợ đổi size tận nơi, thủ tục nhanh chóng</p>
          </div>
          <div>
            <h4 className="text-xs font-black tracking-widest text-black uppercase mb-1">CHÍNH HÃNG 100%</h4>
            <p className="text-xs text-neutral-500 font-medium">Đóng gói hộp signature bảo vệ form áo</p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER STREETWEAR (NỀN ĐEN CHỮ ĐỎ M.B.B.C. CHUẨN MẪU) */}
      {/* ========================================================= */}
      <footer className="w-full bg-black text-white pt-12 sm:pt-16 pb-8 px-6 sm:px-12 border-t border-neutral-900 select-none overflow-hidden">
        <div className="w-full flex flex-col justify-between">
          {/* CHỮ M.B.B.C. TO KHỔNG LỒ MÀU ĐỎ NẰM TRÊN NỀN ĐEN */}
          <div className="w-full overflow-hidden mb-8 sm:mb-12">
            <h2 className="font-condensed text-[#b91c1c] text-[20vw] sm:text-[18vw] lg:text-[17.5vw] font-black leading-[0.82] tracking-[-0.02em] whitespace-nowrap select-none hover:text-[#d62020] transition-colors duration-300">
              M.B.B.C.
            </h2>
          </div>

          {/* DÒNG THÔNG TIN CUỐI TRANG */}
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
              <button onClick={() => showToast('Hướng dẫn chọn size')} className="hover:text-white transition-colors">
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
      {/* QUICK VIEW MODAL (CHỌN SIZE & MÀU SẮC) */}
      {/* ========================================================= */}
      {quickViewProduct && (() => {
        const qvHasVariants = Boolean(quickViewProduct.variants && quickViewProduct.variants.length > 0);
        const qvSizes = qvHasVariants
          ? [...new Set(quickViewProduct.variants.map((v) => v.size))]
          : (quickViewProduct.sizes && quickViewProduct.sizes.length > 0 ? quickViewProduct.sizes : ['S', 'M', 'L', 'XL']);
        const qvColors = qvHasVariants
          ? [...new Set(quickViewProduct.variants.map((v) => v.color))]
          : [];

        // Tìm biến thể khớp với size và màu hiện chọn
        const currentVariant = qvHasVariants
          ? quickViewProduct.variants.find((v) => v.size === quickViewSize && v.color === quickViewColor)
          : null;

        const currentStock = qvHasVariants
          ? (currentVariant?.stock || 0)
          : (quickViewProduct.stock || 0);

        const isOutOfStock = qvHasVariants
          ? (!currentVariant || currentStock <= 0)
          : (currentStock <= 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setQuickViewProduct(null)} />
            <div className="relative bg-white text-black max-w-2xl w-full p-6 sm:p-8 z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-black">
                <CloseIcon />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative">
                  <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                  {isOutOfStock && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/85 text-white text-[11px] font-black uppercase tracking-wider">
                      HẾT HÀNG
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-black uppercase leading-tight tracking-wider">{quickViewProduct.name}</h3>
                      <p className="text-base font-black text-neutral-900 mt-2">{formatPrice(quickViewProduct.price)}</p>
                      {quickViewProduct.description && (
                        <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed font-medium line-clamp-3">{quickViewProduct.description}</p>
                      )}
                    </div>

                    {/* CHỌN SIZE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider">KÍCH THƯỚC (SIZE):</span>
                        <span className="text-xs font-bold text-black">{quickViewSize}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {qvSizes.map((sz) => {
                          const sizeStock = qvHasVariants
                            ? quickViewProduct.variants.filter((v) => v.size === sz).reduce((s, v) => s + v.stock, 0)
                            : quickViewProduct.stock;
                          const isSizeEmpty = sizeStock <= 0;

                          return (
                            <button
                              key={sz}
                              onClick={() => {
                                setQuickViewSize(sz);
                                if (qvHasVariants) {
                                  // Tự chọn màu đầu tiên còn hàng của size này nếu có
                                  const matchingInStock = quickViewProduct.variants.find((v) => v.size === sz && v.stock > 0);
                                  if (matchingInStock) {
                                    setQuickViewColor(matchingInStock.color);
                                  }
                                }
                              }}
                              className={`px-3.5 py-2 text-xs font-extrabold border transition-all ${
                                quickViewSize === sz
                                  ? 'bg-black text-white border-black shadow-xs'
                                  : isSizeEmpty
                                  ? 'border-neutral-200 text-neutral-300 bg-neutral-50 line-through'
                                  : 'border-neutral-300 text-black hover:border-black'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CHỌN MÀU SẮC (NẾU CÓ BIẾN THỂ) */}
                    {qvColors.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">MÀU SẮC:</span>
                          <span className="text-xs font-bold text-black">{quickViewColor}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {qvColors.map((cl) => {
                            const variantForColor = quickViewProduct.variants.find(
                              (v) => v.size === quickViewSize && v.color === cl
                            );
                            const isColorEmpty = !variantForColor || variantForColor.stock <= 0;

                            return (
                              <button
                                key={cl}
                                onClick={() => setQuickViewColor(cl)}
                                className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                                  quickViewColor === cl
                                    ? 'bg-black text-white border-black shadow-xs'
                                    : isColorEmpty
                                    ? 'border-neutral-200 text-neutral-300 bg-neutral-50 line-through'
                                    : 'border-neutral-300 text-black hover:border-black'
                                }`}
                              >
                                {cl}
                                {isColorEmpty && <span className="text-[10px] ml-1 text-red-500 font-normal">(Hết)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* THÔNG BÁO TÌNH TRẠNG TỒN KHO */}
                    <div className="pt-2">
                      {isOutOfStock ? (
                        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded text-center">
                          Biến thể ({quickViewSize}{quickViewColor ? ` - ${quickViewColor}` : ''}) hiện đã HẾT HÀNG
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500 font-medium">
                          Tồn kho khả dụng: <strong className="text-black">{currentStock}</strong> {quickViewProduct.unit || 'cái'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 space-y-2">
                    <button
                      onClick={() => {
                        addToCart(quickViewProduct, quickViewSize, quickViewColor, 1);
                        setQuickViewProduct(null);
                      }}
                      disabled={isOutOfStock}
                      className="w-full py-3.5 bg-black text-white text-xs font-black tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isOutOfStock ? 'HẾT HÀNG' : 'THÊM VÀO GIỎ HÀNG'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetId = quickViewProduct._id || quickViewProduct.id;
                        setQuickViewProduct(null);
                        navigate(`/product/${targetId}`);
                      }}
                      className="w-full py-2.5 border border-neutral-300 text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors text-center"
                    >
                      XEM TRANG CHI TIẾT SẢN PHẨM →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL GIỎ HÀNG, THANH TOÁN & ĐƠN HÀNG DÙNG CHUNG */}
      {/* ========================================================= */}
      <StoreModals onOrderCompleted={fetchBackendProducts} />
    </div>
  );
};

export default CustomerHome;
