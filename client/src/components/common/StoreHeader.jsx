import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import mbbcLogo from '../../assets/logo MBBC.png';

// Icons
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

const ChevronDownIcon = ({ className = 'w-3 h-3' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const MenuIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const OrderBoxIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const ReviewStarIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const ShieldAdminIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ChevronRightMiniIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const StoreHeader = ({
  isSolid = true, // true: nền trắng chữ đen, false: trong suốt trên hero banner
  categories: propCategories,
  onSelectCategory,
  onSearch,
}) => {
  const { user, logout } = useAuth();
  const { totalCartCount, setIsCartOpen, setIsMyOrdersOpen, setIsMyReviewsOpen, showToast } = useCart();
  const navigate = useNavigate();

  const [isHovered, setIsHovered] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [desktopShopOpen, setDesktopShopOpen] = useState(false);

  // Mobile drawer states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShopExpanded, setMobileShopExpanded] = useState(true);

  const searchBoxRef = useRef(null);
  const shopMenuRef = useRef(null);

  // Danh mục chuẩn yêu cầu: TOPS, OUTWEAR, BOTTOMS, ACCESSORIES, NEW ARRIVALS
  const categoryList = useMemo(() => {
    const standard = ['TOPS', 'OUTWEAR', 'BOTTOMS', 'ACCESSORIES'];
    const extra = (propCategories || []).filter(
      (c) => c && !standard.includes(c.toUpperCase()) && c.toUpperCase() !== 'NEW ARRIVALS'
    );
    return [...standard, ...extra, 'NEW ARRIVALS'];
  }, [propCategories]);

  // Click outside search box & desktop shop menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
        setUserDropdownOpen(false);
      }
      if (shopMenuRef.current && !shopMenuRef.current.contains(e.target)) {
        setDesktopShopOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll state khi dùng header trong suốt trên banner
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isHeaderActive = isSolid || isHovered || desktopShopOpen || isScrolled || searchOpen;

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    showToast('Đã đăng xuất tài khoản');
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        navigate(`/category?search=${encodeURIComponent(searchQuery.trim())}`);
      }
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleCategoryClick = (cat) => {
    setDesktopShopOpen(false);
    setMobileMenuOpen(false);
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      navigate(`/category/${encodeURIComponent(cat)}`);
    }
  };

  return (
    <>
      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setDesktopShopOpen(false);
        }}
        className={`fixed top-0 left-0 w-full z-50 font-['Montserrat',sans-serif] transition-all duration-300 ease-out ${
          isHeaderActive
            ? 'bg-white text-black shadow-[0_4px_20px_rgba(0,0,0,0.06)] border-b border-neutral-100'
            : 'bg-transparent text-white border-b border-transparent'
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-14 xl:px-16 flex items-center justify-between h-18 sm:h-20 md:h-22">
          {/* CỘT TRÁI: MOBILE HAMBURGER & LOGO */}
          <div className="flex items-center gap-3">
            {/* Hamburger button on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 md:hidden focus:outline-none transition-colors ${
                isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
              }`}
              aria-label="Mở menu di động"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            {/* Logo MBBC */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 py-1">
              <img
                src={mbbcLogo}
                alt="M.B.B.C Logo"
                className="h-8 sm:h-10 md:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
              <span
                className={`font-brand text-xl sm:text-2xl md:text-3xl uppercase transition-colors select-none tracking-wider ${
                  isHeaderActive ? 'text-black' : 'text-white'
                }`}
              >
                M.B.B.C
              </span>
            </Link>
          </div>

          {/* CỘT GIỮA: NAVIGATION DESKTOP */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-11" aria-label="Menu chính">
            {/* ABOUT US */}
            <div className="group relative py-2">
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`text-[12px] lg:text-[13px] font-bold tracking-[0.14em] uppercase transition-colors flex items-center gap-1.5 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>ABOUT US</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[220px]">
                  {['BRAND STORY', 'STREETWEAR PHILOSOPHY', 'SHOWROOM'].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        navigate('/');
                        setTimeout(() => {
                          document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SHOP MENU (Hỗ trợ cả rê chuột hover và bấm click) */}
            <div className="group relative py-2" ref={shopMenuRef}>
              <button
                type="button"
                onClick={() => setDesktopShopOpen(!desktopShopOpen)}
                className={`text-[12px] lg:text-[13px] font-bold tracking-[0.14em] uppercase transition-colors flex items-center gap-1.5 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>SHOP</span>
                <ChevronDownIcon
                  className={`w-3 h-3 transition-transform duration-200 ${
                    desktopShopOpen ? 'rotate-180' : 'group-hover:rotate-180'
                  }`}
                />
              </button>
              <div
                className={`absolute top-full left-0 pt-2 z-50 transition-all duration-200 ease-out ${
                  desktopShopOpen
                    ? 'opacity-100 visible pointer-events-auto translate-y-0'
                    : 'opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0'
                }`}
              >
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_14px_40px_rgba(0,0,0,0.14)] border border-neutral-100 py-3 px-5 min-w-[220px]">
                  {categoryList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className={`block w-full text-left py-2.5 text-[12px] font-bold tracking-[0.14em] uppercase border-b border-neutral-50 last:border-b-0 transition-all flex items-center justify-between ${
                        cat === 'NEW ARRIVALS'
                          ? 'text-[#b91c1c] hover:text-[#991b1b] hover:translate-x-1'
                          : 'text-neutral-800 hover:text-black hover:translate-x-1'
                      }`}
                    >
                      <span>{cat}</span>
                      {cat === 'NEW ARRIVALS' && (
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
                type="button"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('hero-banner')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`text-[12px] lg:text-[13px] font-bold tracking-[0.14em] uppercase transition-colors flex items-center gap-1.5 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>CAMPAIGN</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[220px]">
                  {['BA SON METRO DROP', 'CYBER UNDERGROUND'].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => navigate('/')}
                      className="block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* WOLRWIDE SHIPPING */}
            <div className="group relative py-2">
              <button
                type="button"
                onClick={() => {
                  navigate('/');
                  setTimeout(() => {
                    document.getElementById('shipping-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className={`text-[12px] lg:text-[13px] font-bold tracking-[0.14em] uppercase transition-colors flex items-center gap-1.5 focus:outline-none ${
                  isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
                }`}
              >
                <span>WOLRWIDE SHIPPING</span>
                <ChevronDownIcon className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 z-50 opacity-0 invisible pointer-events-none -translate-y-1.5 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-out">
                <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
                <div className="bg-white text-black shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-neutral-100 py-3.5 px-6 min-w-[240px]">
                  {['GIAO HÀNG TOÀN QUỐC', 'CHÍNH SÁCH ĐỔI SIZE 30 NGÀY', 'QUY CHUẨN ĐÓNG HỘP'].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => navigate('/')}
                      className="block w-full text-left py-2 text-[12px] font-bold tracking-[0.14em] uppercase text-neutral-800 hover:text-black hover:translate-x-1.5 transition-all"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* CỘT PHẢI: 3 ICONS TỐI GIẢN (KÍNH LÚP, USER, GIỎ HÀNG) */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 relative" ref={searchBoxRef}>
            {/* SEARCH ICON */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-1.5 transition-colors focus:outline-none ${
                isHeaderActive ? 'text-black hover:text-neutral-600' : 'text-white hover:text-white/80'
              }`}
              aria-label="Tìm kiếm sản phẩm"
            >
              <SearchIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>

            {/* SEARCH POPOVER */}
            {searchOpen && (
              <div className="absolute top-full right-0 mt-3 w-76 sm:w-96 bg-white text-black shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-neutral-100 p-5 z-50 animate-slide-down">
                <div className="absolute -top-2 right-2 w-4 h-4 bg-white border-t border-l border-neutral-100 transform rotate-45" />
                <h4 className="text-center text-xs font-bold tracking-[0.2em] text-neutral-900 uppercase mb-4">
                  TÌM KIẾM
                </h4>
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
              </div>
            )}

            {/* USER ICON */}
            <div className="relative">
              <button
                type="button"
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

              {user && userDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white text-black shadow-xl border border-neutral-100 p-4 min-w-[210px] z-50 animate-slide-down">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Xin chào,</p>
                  <p className="text-xs font-black text-black truncate mb-2.5">
                    {user.fullName || user.email || 'Khách hàng'}
                  </p>
                  <div className="space-y-1 mb-3 border-t border-neutral-100 pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMyOrdersOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left py-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:text-black hover:bg-neutral-50 transition-colors flex items-center justify-between group rounded"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded flex items-center justify-center bg-neutral-100 text-neutral-800 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                          <OrderBoxIcon className="w-3.5 h-3.5" />
                        </span>
                        <span>Đơn hàng của tôi</span>
                      </div>
                      <ChevronRightMiniIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-black transition-all" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMyReviewsOpen(true);
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left py-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:text-black hover:bg-neutral-50 transition-colors flex items-center justify-between group rounded"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200/60 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-colors shrink-0">
                          <ReviewStarIcon className="w-3.5 h-3.5" />
                        </span>
                        <span>Đánh giá của tôi</span>
                      </div>
                      <ChevronRightMiniIcon className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-black transition-all" />
                    </button>

                    {user.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left py-2 px-2.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/70 transition-colors flex items-center justify-between group rounded"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-200/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shrink-0">
                            <ShieldAdminIcon className="w-3.5 h-3.5" />
                          </span>
                          <span>Trang quản trị</span>
                        </div>
                        <ChevronRightMiniIcon className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:text-indigo-700 transition-all" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-1.5 text-center bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* CART ICON */}
            <button
              type="button"
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
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (Thao tác chạm 100% trên điện thoại di động) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden font-['Montserrat',sans-serif]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[84%] max-w-[340px] bg-white text-black shadow-2xl flex flex-col z-50 animate-slide-right overflow-y-auto">
            {/* Header drawer */}
            <div className="p-5 flex items-center justify-between border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <img src={mbbcLogo} alt="M.B.B.C" className="h-8 w-auto object-contain" />
                <span className="font-brand text-xl font-bold tracking-wider">M.B.B.C</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-neutral-600 hover:text-black"
                aria-label="Đóng menu"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Quick search input */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-neutral-200 px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none pr-8 font-medium"
                />
                <button type="submit" className="absolute right-2.5 text-neutral-400 hover:text-black">
                  <SearchIcon className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Navigation links */}
            <div className="p-5 space-y-4 flex-1">
              {/* SHOP SECTION (Accordion cảm ứng) */}
              <div className="border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => setMobileShopExpanded(!mobileShopExpanded)}
                  className="w-full flex items-center justify-between py-2 text-[13px] font-bold uppercase tracking-[0.14em] text-black"
                >
                  <span className="flex items-center gap-2">
                    <span>SHOP</span>
                    <span className="text-[10px] font-normal text-neutral-400 lowercase">
                      ({categoryList.length} mục)
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileShopExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {mobileShopExpanded && (
                  <div className="mt-2 pl-3 space-y-2 border-l-2 border-black">
                    {categoryList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
                        className={`block w-full text-left py-1.5 text-[12px] font-bold tracking-[0.12em] uppercase transition-colors ${
                          cat === 'NEW ARRIVALS' ? 'text-[#b91c1c]' : 'text-neutral-700 hover:text-black'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ABOUT US */}
              <div className="border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full text-left py-2 text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-800 hover:text-black"
                >
                  ABOUT US
                </button>
              </div>

              {/* CAMPAIGN */}
              <div className="border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-left py-2 text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-800 hover:text-black"
                >
                  CAMPAIGN
                </button>
              </div>

              {/* WOLRWIDE SHIPPING */}
              <div className="border-b border-neutral-100 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('shipping-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full text-left py-2 text-[13px] font-bold uppercase tracking-[0.14em] text-neutral-800 hover:text-black"
                >
                  WOLRWIDE SHIPPING
                </button>
              </div>
            </div>

            {/* Bottom drawer: User info */}
            <div className="p-5 border-t border-neutral-100 bg-neutral-50 space-y-3">
              {user ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase">Tài khoản</p>
                      <p className="text-xs font-bold text-black truncate max-w-[180px]">
                        {user.fullName || user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsMyOrdersOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-neutral-200 rounded text-[11px] font-bold text-neutral-800 hover:border-black transition-colors"
                      >
                        <OrderBoxIcon className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Đơn hàng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsMyReviewsOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/70 border border-amber-200 rounded text-[11px] font-bold text-neutral-800 hover:border-amber-400 transition-colors"
                      >
                        <ReviewStarIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đánh giá</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 text-center bg-black text-white text-xs font-bold uppercase tracking-wider"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full py-2.5 text-center bg-black text-white text-xs font-bold uppercase tracking-wider"
                >
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreHeader;
