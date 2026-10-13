import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ============================================
// ICON COMPONENTS
// ============================================
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

// ============================================
// SAMPLE DATA
// ============================================
const categories = [
  { name: 'Áo', count: 128 },
  { name: 'Quần', count: 96 },
  { name: 'Váy', count: 64 },
  { name: 'Phụ kiện', count: 48 },
  { name: 'Giày dép', count: 72 },
];

const featuredProducts = [
  { id: 1, name: 'Áo sơ mi Oxford trắng', price: '450,000₫', originalPrice: '520,000₫', rating: 4.8, reviews: 124, tag: 'Bán chạy', tagColor: 'bg-teal-500' },
  { id: 2, name: 'Quần jean slim fit xanh đậm', price: '680,000₫', originalPrice: null, rating: 4.6, reviews: 89, tag: null, tagColor: '' },
  { id: 3, name: 'Áo khoác denim oversize', price: '890,000₫', originalPrice: '1,050,000₫', rating: 4.9, reviews: 203, tag: 'Hot', tagColor: 'bg-rose-500' },
  { id: 4, name: 'Váy midi hoa nhí', price: '520,000₫', originalPrice: null, rating: 4.7, reviews: 67, tag: 'Mới', tagColor: 'bg-violet-500' },
  { id: 5, name: 'Áo polo cotton premium', price: '380,000₫', originalPrice: '420,000₫', rating: 4.5, reviews: 156, tag: null, tagColor: '' },
  { id: 6, name: 'Quần tây công sở slim', price: '550,000₫', originalPrice: null, rating: 4.4, reviews: 92, tag: null, tagColor: '' },
  { id: 7, name: 'Áo thun basic cotton', price: '180,000₫', originalPrice: '250,000₫', rating: 4.3, reviews: 312, tag: 'Sale', tagColor: 'bg-amber-500' },
  { id: 8, name: 'Chân váy chữ A', price: '420,000₫', originalPrice: null, rating: 4.6, reviews: 78, tag: null, tagColor: '' },
];

const newArrivals = [
  { id: 9, name: 'Set đồ công sở nữ', price: '1,200,000₫', category: 'Bộ sưu tập' },
  { id: 10, name: 'Áo blazer oversize', price: '950,000₫', category: 'Áo khoác' },
  { id: 11, name: 'Quần culottes', price: '480,000₫', category: 'Quần' },
];

// ============================================
// PRODUCT CARD COMPONENT
// ============================================
const ProductCard = ({ product }) => {
  const [liked, setLiked] = useState(false);

  // Generate a subtle placeholder color for the "image" area
  const colorPairs = [
    { bg: '#f0fdfa', accent: '#99f6e4' },
    { bg: '#eff6ff', accent: '#bfdbfe' },
    { bg: '#fdf4ff', accent: '#e9d5ff' },
    { bg: '#fef7ee', accent: '#fed7aa' },
    { bg: '#f0fdf4', accent: '#bbf7d0' },
    { bg: '#fdf2f8', accent: '#fbcfe8' },
    { bg: '#f8fafc', accent: '#e2e8f0' },
    { bg: '#fefce8', accent: '#fef08a' },
  ];
  const pair = colorPairs[(product.id - 1) % colorPairs.length];

  return (
    <div className="group bg-white border border-gray-200 rounded-[var(--radius-md)] overflow-hidden transition-all duration-250 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
      {/* Product image placeholder */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: pair.bg }}>
        {/* Clothing silhouette placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-24 rounded-2xl opacity-40" style={{ backgroundColor: pair.accent }} />
        </div>
        <svg className="absolute inset-0 m-auto w-12 h-12 opacity-20 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>

        {/* Tag */}
        {product.tag && (
          <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 text-[11px] font-bold text-white rounded-md ${product.tagColor}`}>
            {product.tag}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={() => setLiked(!liked)}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${liked
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500'
            }`}
          aria-label="Yêu thích"
        >
          <HeartIcon filled={liked} />
        </button>

        {/* Quick add overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-250 ease-out">
          <button className="w-full py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-150 active:scale-[0.97]">
            Thêm vào giỏ
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-3.5">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} />
          ))}
          <span className="text-xs text-gray-400 ml-1">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// CUSTOMER HOME PAGE
// ============================================
const CustomerHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HEADER / NAVIGATION */}
      {/* ============================================ */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">SellStock</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {['Trang chủ', 'Sản phẩm', 'Bộ sưu tập', 'Khuyến mãi'].map((item, i) => (
                <button
                  key={item}
                  className={`text-sm font-medium transition-colors duration-150 ${i === 0 ? 'text-teal-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg px-3 py-2 gap-2 w-52 lg:w-64 transition-all duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-300 border border-transparent">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 w-full outline-none"
                />
              </div>

              {/* Cart */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Giỏ hàng">
                <CartIcon />
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </button>

              {/* User menu */}
              <div className="hidden sm:flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-semibold">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'K'}
                </div>
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-medium text-gray-800 leading-tight">{user?.fullName || 'Khách hàng'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogoutIcon />
                </button>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  }
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-1 animate-slide-down">
              {['Trang chủ', 'Sản phẩm', 'Bộ sưu tập', 'Khuyến mãi'].map((item, i) => (
                <button
                  key={item}
                  className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${i === 0 ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {item}
                </button>
              ))}
              {/* Mobile search */}
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2.5 gap-2 mt-2 sm:hidden">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 w-full outline-none"
                />
              </div>
              {/* Mobile user info */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 sm:hidden">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-semibold">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'K'}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{user?.fullName || 'Khách hàng'}</span>
                </div>
                <button onClick={handleLogout} className="text-sm text-red-500 font-medium">Đăng xuất</button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO LOOKBOOK BANNER — Full-width strip */}
      {/* ============================================ */}
      <section className="relative w-full bg-white overflow-hidden">
        {/* Full-width lookbook image strip — edge-to-edge like Bacykism */}
        <div className="w-full overflow-hidden">
          <div
            className="flex w-max animate-[bannerScroll_40s_linear_infinite] hover:[animation-play-state:paused]"
            style={{ willChange: 'transform' }}
          >
            {/* Two copies for seamless infinite loop */}
            {[0, 1].map((setIdx) => (
              <div key={setIdx} className="flex shrink-0">
                {[
                  { src: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop&q=80', alt: 'Áo khoác denim phong cách đường phố' },
                  { src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&h=600&fit=crop&q=80', alt: 'Phong cách nam tính hiện đại' },
                  { src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop&q=80', alt: 'Thời trang nữ thanh lịch' },
                  { src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=600&fit=crop&q=80', alt: 'Váy đầm thiết kế' },
                  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&q=80', alt: 'Phong cách street-wear' },
                  { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=600&fit=crop&q=80', alt: 'Trang phục casual nữ' },
                  { src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&q=80', alt: 'Áo thun nam basic' },
                  { src: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&h=600&fit=crop&q=80', alt: 'Polo cotton cao cấp' },
                  { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&h=600&fit=crop&q=80', alt: 'Phong cách công sở nữ' },
                  { src: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&h=600&fit=crop&q=80', alt: 'Outfit đường phố nam' },
                ].map((img, i) => (
                  <img
                    key={`${setIdx}-${i}`}
                    src={img.src}
                    alt={img.alt}
                    loading={setIdx === 0 && i < 5 ? 'eager' : 'lazy'}
                    className="h-[280px] sm:h-[340px] md:h-[420px] lg:h-[480px] w-auto object-cover shrink-0"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll-down chevron */}
        <div className="flex justify-center py-5">
          <button
            onClick={() => {
              const target = document.getElementById('categories-bar');
              target?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-gray-400 hover:text-gray-700 transition-colors animate-bounce"
            aria-label="Cuộn xuống xem sản phẩm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      </section>

      {/* ============================================ */}
      {/* CATEGORIES BAR */}
      {/* ============================================ */}
      <section id="categories-bar" className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            <button className="shrink-0 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg">
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                className="shrink-0 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-150"
              >
                {cat.name}
                <span className="ml-1.5 text-gray-400">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURED PRODUCTS */}
      {/* ============================================ */}
      <section className="py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sản phẩm nổi bật</h2>
              <p className="text-sm text-gray-500 mt-0.5">Được yêu thích nhất trong tuần</p>
            </div>
            <button className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              Xem tất cả
              <ArrowRightIcon />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 stagger-children">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PROMO BANNER */}
      {/* ============================================ */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center">
              <div className="p-8 lg:p-12">
                <span className="inline-flex items-center px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-md mb-4">
                  Ưu đãi đặc biệt
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                  Giảm đến 50%
                  <br />
                  toàn bộ sản phẩm mới
                </h2>
                <p className="text-gray-400 text-sm mb-6 max-w-sm">
                  Áp dụng cho đơn hàng từ 500,000₫. Thời gian có hạn, mua sắm ngay hôm nay.
                </p>
                <button className="px-6 py-3 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-150">
                  Khám phá ngay
                </button>
              </div>
              <div className="hidden md:flex items-center justify-center p-8">
                <div className="w-48 h-48 rounded-full bg-teal-500/10 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-teal-500/15 flex items-center justify-center">
                    <span className="text-4xl font-black text-teal-400">50%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* NEW ARRIVALS */}
      {/* ============================================ */}
      <section className="py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Hàng mới về</h2>
              <p className="text-sm text-gray-500 mt-0.5">Cập nhật mỗi tuần</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {newArrivals.map(item => (
              <div key={item.id} className="group relative p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.category}</span>
                <h3 className="text-lg font-semibold text-gray-900 mt-1.5 mb-2">{item.name}</h3>
                <p className="text-base font-bold text-teal-600">{item.price}</p>
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600">
                  <ArrowRightIcon />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SERVICE FEATURES */}
      {/* ============================================ */}
      <section className="border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: 'Giao hàng nhanh',
                desc: 'Miễn phí với đơn từ 300K'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'Đảm bảo chất lượng',
                desc: 'Cam kết hàng chính hãng'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                ),
                title: 'Đổi trả 30 ngày',
                desc: 'Miễn phí, không điều kiện'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: 'Hỗ trợ 24/7',
                desc: 'Luôn sẵn sàng giúp bạn'
              },
            ].map(feature => (
              <div key={feature.title} className="text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-50 text-teal-600 mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{feature.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-800">SellStock</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Hệ thống quản lý bán hàng và kho hàng trực tuyến.</p>
            </div>

            {/* Links */}
            {[
              { title: 'Sản phẩm', links: ['Áo', 'Quần', 'Váy', 'Phụ kiện'] },
              { title: 'Hỗ trợ', links: ['Liên hệ', 'Đổi trả', 'Vận chuyển', 'FAQ'] },
              { title: 'Công ty', links: ['Giới thiệu', 'Tuyển dụng', 'Blog'] },
            ].map(section => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link}>
                      <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-400">© 2026 SellStock. Đồ án tốt nghiệp CNTT.</p>
            <p className="text-xs text-gray-400">Dữ liệu minh họa</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerHome;
