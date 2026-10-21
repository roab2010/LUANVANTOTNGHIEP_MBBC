import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getProducts, getFilterOptions } from '../../services/productApi';
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
// VECTOR ICONS (MINIMAL, CLEAN, NO EMOJIS)
// ============================================
const FilterIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const SortIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </svg>
);

const ChevronDownIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const CloseIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// 9 tiêu chí sắp xếp theo đúng quy chuẩn
const SORT_OPTIONS = [
  { value: 'featured', label: 'Sản phẩm nổi bật' },
  { value: 'price_asc', label: 'Giá: Thấp đến cao' },
  { value: 'price_desc', label: 'Giá: Cao đến thấp' },
  { value: 'name_asc', label: 'Tên: A–Z' },
  { value: 'name_desc', label: 'Tên: Z–A' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'best_seller', label: 'Bán chạy nhất' },
  { value: 'stock_desc', label: 'Tồn kho giảm dần' },
];

// Các khoảng giá mẫu nhanh
const PRICE_PRESETS = [
  { label: 'Dưới 300.000₫', min: 0, max: 300000 },
  { label: '300.000₫ - 500.000₫', min: 300000, max: 500000 },
  { label: '500.000₫ - 1.000.000₫', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000₫', min: 1000000, max: 10000000 },
];

const CategoryPage = () => {
  const { category: rawCategoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useCart();

  // Giải mã tên danh mục từ URL param (mặc định: 'ALL')
  const currentCategory = useMemo(() => {
    if (!rawCategoryParam) return 'ALL';
    const decoded = decodeURIComponent(rawCategoryParam).trim();
    return decoded || 'ALL';
  }, [rawCategoryParam]);

  // Bộ lọc options lấy từ backend
  const [filterOptions, setFilterOptions] = useState({
    colors: [],
    sizes: [],
    minPrice: 0,
    maxPrice: 2000000,
  });

  // Danh mục public từ backend
  const [dbCategories, setDbCategories] = useState(['TOPS', 'OUTWEAR', 'BOTTOMS', 'ACCESSORIES']);

  // Trạng thái sản phẩm
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Phân trang
  const [page, setPage] = useState(1);
  const limit = 12;

  // Drawer bộ lọc
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Đọc state từ URL query params
  const activeSort = searchParams.get('sort') || (currentCategory === 'NEW ARRIVALS' ? 'newest' : 'featured');
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeColors = useMemo(() => {
    const c = searchParams.get('colors');
    return c
      ? c
          .split(',')
          .map((x) => x.trim())
          .filter((x) => Boolean(x) && x !== 'null' && x !== 'undefined')
      : [];
  }, [searchParams]);
  const activeSizes = useMemo(() => {
    const s = searchParams.get('sizes');
    return s
      ? s
          .split(',')
          .map((x) => x.trim())
          .filter((x) => Boolean(x) && x !== 'null' && x !== 'undefined')
      : [];
  }, [searchParams]);
  const activeInStock = searchParams.get('inStock') === 'true';
  const searchQuery = searchParams.get('search') || '';

  // State tạm trong Filter Drawer (được cập nhật khi người dùng chỉnh sửa trong Drawer)
  const [draftCategory, setDraftCategory] = useState(currentCategory);
  const [draftMinPrice, setDraftMinPrice] = useState(activeMinPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(activeMaxPrice);
  const [draftColors, setDraftColors] = useState(activeColors);
  const [draftSizes, setDraftSizes] = useState(activeSizes);
  const [draftInStock, setDraftInStock] = useState(activeInStock);

  // Đồng bộ draft state khi mở Filter Drawer hoặc URL thay đổi
  useEffect(() => {
    setDraftCategory(currentCategory);
    setDraftMinPrice(activeMinPrice);
    setDraftMaxPrice(activeMaxPrice);
    setDraftColors(activeColors);
    setDraftSizes(activeSizes);
    setDraftInStock(activeInStock);
  }, [currentCategory, activeMinPrice, activeMaxPrice, activeColors, activeSizes, activeInStock, isFilterDrawerOpen]);

  // Ngăn cuộn trang nền khi mở Filter Drawer
  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterDrawerOpen]);

  // Tải danh mục thực tế từ backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getPublicCategories();
        if (res.data?.success && Array.isArray(res.data.data)) {
          const names = res.data.data.map((c) => c.name);
          setDbCategories(names);
        }
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, []);

  // Bộ nhớ đệm options theo danh mục để chuyển đổi tức thì (0ms delay)
  const optionsCacheRef = useRef({});
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);

  // Tự động tải options bộ lọc (màu sắc, size, khoảng giá) theo draftCategory ngay khi click trong Drawer
  useEffect(() => {
    let isMounted = true;
    const loadCategoryOptions = async (targetCat) => {
      const cacheKey = targetCat || 'ALL';
      if (optionsCacheRef.current[cacheKey]) {
        const cached = optionsCacheRef.current[cacheKey];
        setFilterOptions(cached);
        // Tự động giữ lại các màu/size hợp lệ thuộc danh mục mới
        setDraftColors((prev) => prev.filter((c) => (cached.colors || []).includes(c)));
        setDraftSizes((prev) => prev.filter((s) => (cached.sizes || []).includes(s)));
        return;
      }

      try {
        setIsOptionsLoading(true);
        const params = {};
        if (targetCat && targetCat !== 'ALL' && targetCat !== 'NEW ARRIVALS') {
          params.category = targetCat;
        }
        const res = await getFilterOptions(params);
        if (isMounted && res.data?.success && res.data.data) {
          const data = res.data.data;
          optionsCacheRef.current[cacheKey] = data;
          setFilterOptions(data);
          // Tự động giữ lại các màu/size hợp lệ thuộc danh mục mới
          setDraftColors((prev) => prev.filter((c) => (data.colors || []).includes(c)));
          setDraftSizes((prev) => prev.filter((s) => (data.sizes || []).includes(s)));
        }
      } catch (err) {
        console.error('Lỗi tải tùy chọn bộ lọc cho danh mục:', err);
      } finally {
        if (isMounted) setIsOptionsLoading(false);
      }
    };

    loadCategoryOptions(draftCategory);

    return () => {
      isMounted = false;
    };
  }, [draftCategory]);

  // Hàm tải sản phẩm từ backend dựa trên query params
  const fetchProducts = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setFetchError(null);

        const params = {
          page: targetPage,
          limit,
          status: 'active',
          sort: activeSort,
        };

        if (currentCategory && currentCategory !== 'ALL') {
          params.category = currentCategory;
        }

        if (activeMinPrice) params.minPrice = activeMinPrice;
        if (activeMaxPrice) params.maxPrice = activeMaxPrice;
        if (activeColors.length > 0) params.colors = activeColors.join(',');
        if (activeSizes.length > 0) params.sizes = activeSizes.join(',');
        if (activeInStock) params.inStock = true;
        if (searchQuery) params.search = searchQuery;

        const res = await getProducts(params);

        if (res.data?.success) {
          const items = res.data.data.products || [];
          const total = res.data.data.pagination?.total || 0;

          if (append) {
            setProducts((prev) => [...prev, ...items]);
          } else {
            setProducts(items);
          }
          setTotalProducts(total);
          setPage(targetPage);
        } else {
          throw new Error(res.data?.message || 'Không thể tải danh sách sản phẩm');
        }
      } catch (err) {
        console.error('Lỗi fetchProducts:', err);
        setFetchError(err.message || 'Đã xảy ra lỗi khi tải danh sách sản phẩm.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentCategory, activeSort, activeMinPrice, activeMaxPrice, activeColors, activeSizes, activeInStock, searchQuery]
  );

  // Tải lại sản phẩm khi điều kiện lọc hoặc sort thay đổi
  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  // Đếm số lượng bộ lọc đang hoạt động
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeMinPrice || activeMaxPrice) count += 1;
    if (activeColors.length > 0) count += activeColors.length;
    if (activeSizes.length > 0) count += activeSizes.length;
    if (activeInStock) count += 1;
    return count;
  }, [activeMinPrice, activeMaxPrice, activeColors, activeSizes, activeInStock]);

  // Helper: Tạo URLSearchParams sạch, loại bỏ các giá trị null / undefined / 'null' / rỗng
  const computeNextSearchParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === '' ||
        value === 'null' ||
        value === 'undefined' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        nextParams.delete(key);
      } else if (Array.isArray(value)) {
        const cleanArr = value
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v) && v !== 'null' && v !== 'undefined');
        if (cleanArr.length > 0) {
          nextParams.set(key, cleanArr.join(','));
        } else {
          nextParams.delete(key);
        }
      } else {
        const strVal = String(value).trim();
        if (strVal === '' || strVal === 'null' || strVal === 'undefined') {
          nextParams.delete(key);
        } else {
          nextParams.set(key, strVal);
        }
      }
    });

    return nextParams;
  };

  // Cập nhật URL Query Params
  const updateQueryParams = (updates) => {
    const nextParams = computeNextSearchParams(updates);
    setSearchParams(nextParams);
  };

  // Thay đổi tiêu chí sắp xếp
  const handleSortChange = (newSort) => {
    updateQueryParams({ sort: newSort });
  };

  // Áp dụng bộ lọc từ Filter Drawer
  const handleApplyFilterDrawer = () => {
    const cleanColors = draftColors.filter((c) => Boolean(c) && c !== 'null' && c !== 'undefined');
    const cleanSizes = draftSizes.filter((s) => Boolean(s) && s !== 'null' && s !== 'undefined');

    const updates = {
      minPrice: draftMinPrice || null,
      maxPrice: draftMaxPrice || null,
      colors: cleanColors.length > 0 ? cleanColors : null,
      sizes: cleanSizes.length > 0 ? cleanSizes : null,
      inStock: draftInStock ? 'true' : null,
    };

    setIsFilterDrawerOpen(false);

    const nextParams = computeNextSearchParams(updates);
    const searchString = nextParams.toString();
    const targetSearch = searchString ? `?${searchString}` : '';

    // Nếu người dùng chọn đổi danh mục bên trong bộ lọc
    if (draftCategory !== currentCategory) {
      if (draftCategory === 'ALL') {
        navigate(`/category${targetSearch}`);
      } else {
        navigate(`/category/${encodeURIComponent(draftCategory)}${targetSearch}`);
      }
    } else {
      setSearchParams(nextParams);
    }

    showToast('Đã áp dụng bộ lọc');
  };

  // Xóa toàn bộ bộ lọc
  const handleResetFilters = () => {
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftColors([]);
    setDraftSizes([]);
    setDraftInStock(false);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('minPrice');
    nextParams.delete('maxPrice');
    nextParams.delete('colors');
    nextParams.delete('sizes');
    nextParams.delete('inStock');

    setSearchParams(nextParams);
    setIsFilterDrawerOpen(false);
    showToast('Đã xóa tất cả bộ lọc');
  };

  // Xóa 1 màu cụ thể khỏi bộ lọc
  const handleRemoveColorFilter = (color) => {
    const newColors = activeColors.filter((c) => c !== color);
    updateQueryParams({ colors: newColors.length > 0 ? newColors : null });
  };

  // Xóa 1 size cụ thể khỏi bộ lọc
  const handleRemoveSizeFilter = (size) => {
    const newSizes = activeSizes.filter((s) => s !== size);
    updateQueryParams({ sizes: newSizes.length > 0 ? newSizes : null });
  };

  // Xóa bộ lọc giá
  const handleRemovePriceFilter = () => {
    updateQueryParams({ minPrice: null, maxPrice: null });
  };

  // Xóa bộ lọc còn hàng
  const handleRemoveInStockFilter = () => {
    updateQueryParams({ inStock: null });
  };

  // Tải thêm sản phẩm (Phân trang mượt mà)
  const handleLoadMore = () => {
    if (isLoadingMore || products.length >= totalProducts) return;
    const nextPage = page + 1;
    fetchProducts(nextPage, true);
  };

  // Đổi danh mục nhanh trên thanh Tabs
  const handleSelectCategory = (cat) => {
    if (cat === 'ALL') {
      navigate('/category');
    } else {
      navigate(`/category/${encodeURIComponent(cat)}`);
    }
  };

  // Tiêu đề hiển thị cho trang danh mục
  const displayTitle = useMemo(() => {
    if (searchQuery) return `KẾT QUẢ CHO "${searchQuery.toUpperCase()}"`;
    if (currentCategory === 'ALL') return 'TẤT CẢ SẢN PHẨM';
    return currentCategory.toUpperCase();
  }, [currentCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-['Montserrat',sans-serif] flex flex-col antialiased selection:bg-neutral-900 selection:text-white">
      {/* 1. HEADER CHUẨN MBBC (Solid nền trắng) */}
      <StoreHeader isSolid={true} categories={dbCategories} onSelectCategory={handleSelectCategory} />

      {/* 2. NỘI DUNG CHÍNH */}
      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* BREADCRUMB */}
          <nav className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-neutral-400 py-3 mb-2">
            <Link to="/" className="hover:text-black transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-black">{displayTitle}</span>
          </nav>

          {/* TIÊU ĐỀ DANH MỤC LỚN */}
          <div className="mb-8 sm:mb-10 border-b border-neutral-100 pb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-neutral-950">
                  {displayTitle}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-neutral-500 max-w-xl font-medium">
                  {currentCategory === 'NEW ARRIVALS'
                    ? 'Khám phá các thiết kế mới nhất vừa được phát hành trong bộ sưu tập đương đại MBBC.'
                    : currentCategory === 'TOPS'
                    ? 'Bộ sưu tập áo thun, hoodie, sweater và sơ mi mang phong cách streetwear phóng khoáng.'
                    : currentCategory === 'OUTWEAR'
                    ? 'Áo khoác bomber, varsity, jacket với phom dáng oversize và chất liệu cao cấp.'
                    : currentCategory === 'BOTTOMS'
                    ? 'Quần jean, cargo pants, short và jogger thiết kế chuẩn phom dáng đường phố.'
                    : currentCategory === 'ACCESSORIES'
                    ? 'Phụ kiện mũ, nón, túi đeo chéo và thắt lưng hoàn thiện set đồ street style.'
                    : 'Tổng hợp toàn bộ các sản phẩm chính hãng thuộc thương hiệu thời trang MBBC.'}
                </p>
              </div>

              {/* TỔNG SỐ SẢN PHẨM PHÙ HỢP */}
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400">
                {isLoading ? (
                  <span>Đang tải...</span>
                ) : (
                  <span>
                    Hiển thị <span className="text-black font-extrabold">{totalProducts}</span> sản phẩm
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* THANH CÔNG CỤ TOOLBAR (BỘ LỌC BÊN TRÁI, SẮP XẾP BÊN PHẢI) */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-4 bg-[#fafafa] border border-neutral-200/80 mb-6">
            {/* NÚT MỞ BỘ LỌC */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeFiltersCount > 0
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-neutral-900 border-neutral-300 hover:border-black'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                <span>BỘ LỌC</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Nút reset nhanh nếu đang có bộ lọc */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-neutral-500 hover:text-[#b91c1c] underline tracking-wider uppercase transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* SẮP XẾP DROPDOWN (9 TIÊU CHÍ) */}
            <div className="flex items-center gap-2.5 ml-auto">
              <label htmlFor="sort-select" className="text-xs font-bold uppercase tracking-wider text-neutral-500 hidden sm:inline-block">
                SẮP XẾP:
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={activeSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-neutral-300 text-neutral-900 text-xs font-bold uppercase tracking-wider py-2 pl-3 pr-8 focus:outline-none focus:border-black cursor-pointer transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* CHIPS BỘ LỌC ĐANG HOẠT ĐỘNG (ACTIVE FILTER PILLS) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1">Đang lọc:</span>

              {/* Chip khoảng giá */}
              {(activeMinPrice || activeMaxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800">
                  <span>
                    Giá: {activeMinPrice ? formatPrice(activeMinPrice) : '0₫'} - {activeMaxPrice ? formatPrice(activeMaxPrice) : 'Max'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePriceFilter}
                    className="text-neutral-400 hover:text-black ml-1"
                    aria-label="Xóa lọc giá"
                  >
                    ×
                  </button>
                </span>
              )}

              {/* Chip màu sắc */}
              {activeColors.map((col) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: getVariantColorHex(col) }}
                  />
                  <span>Màu: {col}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColorFilter(col)}
                    className="text-neutral-400 hover:text-black ml-1"
                    aria-label={`Xóa màu ${col}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Chip kích thước */}
              {activeSizes.map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800"
                >
                  <span>Size: {size}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSizeFilter(size)}
                    className="text-neutral-400 hover:text-black ml-1"
                    aria-label={`Xóa size ${size}`}
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Chip còn hàng */}
              {activeInStock && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Còn hàng</span>
                  <button
                    type="button"
                    onClick={handleRemoveInStockFilter}
                    className="text-neutral-400 hover:text-black ml-1"
                    aria-label="Xóa lọc còn hàng"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* 3. LƯỚI SẢN PHẨM & TRẠNG THÁI */}
          {isLoading ? (
            /* SKELETON LOADING GRID */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="animate-pulse space-y-3">
                  <div className="aspect-[3/4] bg-neutral-100 border border-neutral-200/60" />
                  <div className="h-3 bg-neutral-100 w-1/3" />
                  <div className="h-4 bg-neutral-100 w-3/4" />
                  <div className="h-4 bg-neutral-100 w-1/2" />
                </div>
              ))}
            </div>
          ) : fetchError ? (
            /* ERROR STATE */
            <div className="py-20 text-center border border-red-100 bg-red-50/50 p-8">
              <p className="text-sm font-bold text-red-600 uppercase tracking-wider mb-2">Lỗi tải dữ liệu</p>
              <p className="text-xs text-neutral-600 mb-5">{fetchError}</p>
              <button
                type="button"
                onClick={() => fetchProducts(1, false)}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : products.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-24 text-center border border-dashed border-neutral-200 p-8 sm:p-12">
              <div className="w-14 h-14 mx-auto mb-4 text-neutral-300">
                <FilterIcon className="w-full h-full" />
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-neutral-900 mb-2">
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mb-6">
                Rất tiếc, không có sản phẩm nào thỏa mãn tất cả các điều kiện lọc và sắp xếp hiện tại. Bạn vui lòng thử
                thay đổi khoảng giá, màu sắc hoặc bỏ bớt tiêu chí lọc.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            /* PRODUCT GRID (3:4 CHUẨN THỜI TRANG STREETWEAR) */
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {products.map((p) => {
                  const isOutOfStock = (p.stock || 0) <= 0;
                  const colors = Array.isArray(p.variants)
                    ? Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean)))
                    : [];
                  const sizes = Array.isArray(p.variants)
                    ? Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean)))
                    : [];

                  return (
                    <article key={p._id} className="group flex flex-col">
                      {/* CONTAINER ẢNH 3:4 */}
                      <Link
                        to={`/product/${p._id}`}
                        className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden border border-neutral-200/60 block"
                      >
                        <img
                          src={p.image || 'https://placehold.co/600x800/18181b/ffffff?text=MBBC'}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* BADGES NỔI BẬT & TRẠNG THÁI */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 bg-black/85 text-white text-[10px] font-black uppercase tracking-wider">
                              HẾT HÀNG
                            </span>
                          ) : p.isFeatured ? (
                            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider">
                              NỔI BẬT
                            </span>
                          ) : null}

                          {p.category && (
                            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-neutral-800 text-[9px] font-bold uppercase tracking-wider border border-neutral-200/50">
                              {p.category}
                            </span>
                          )}
                        </div>

                        {/* HOVER OVERLAY NỀN MỜ */}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </Link>

                      {/* THÔNG TIN SẢN PHẨM */}
                      <div className="pt-3 pb-1 flex flex-col flex-1">
                        {/* HÀNG MÀU SẮC & SIZE NHỎ */}
                        <div className="flex items-center justify-between gap-2 mb-1.5 min-h-4">
                          {/* MÀU SẮC DẠNG CHẤM TRÒN */}
                          {colors.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {colors.slice(0, 5).map((col) => (
                                <span
                                  key={col}
                                  title={col}
                                  className="w-2.5 h-2.5 rounded-full border border-neutral-300 shrink-0 shadow-xs"
                                  style={{ backgroundColor: getVariantColorHex(col) }}
                                />
                              ))}
                              {colors.length > 5 && (
                                <span className="text-[10px] text-neutral-400 font-bold">+{colors.length - 5}</span>
                              )}
                            </div>
                          ) : (
                            <span />
                          )}

                          {/* SIZES */}
                          {sizes.length > 0 && (
                            <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
                              {sizes.slice(0, 3).join(' • ')}
                              {sizes.length > 3 ? '...' : ''}
                            </span>
                          )}
                        </div>

                        {/* TÊN SẢN PHẨM */}
                        <Link
                          to={`/product/${p._id}`}
                          className="text-xs sm:text-[13px] font-bold uppercase tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2 leading-snug mb-1"
                        >
                          {p.name}
                        </Link>

                        {/* GIÁ SẢN PHẨM (MÀU ĐỎ #b91c1c THỐNG NHẤT NHẬN DIỆN THƯƠNG HIỆU MBBC) */}
                        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
                          <span className="text-sm sm:text-base font-extrabold text-[#b91c1c] tracking-tight">
                            {formatPrice(p.price)}
                          </span>

                          <span className="text-[10px] uppercase font-semibold text-neutral-400">
                            {isOutOfStock ? (
                              <span className="text-neutral-400">Hết hàng</span>
                            ) : (
                              <span className="text-emerald-600">Còn hàng</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* NÚT TẢI THÊM / XEM THÊM SẢN PHẨM */}
              {products.length < totalProducts && (
                <div className="mt-12 sm:mt-16 text-center border-t border-neutral-100 pt-8">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                    Đang hiển thị {products.length} trên tổng số {totalProducts} sản phẩm
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center justify-center min-w-[200px] px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-[0.16em] hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang tải...</span>
                      </span>
                    ) : (
                      <span>Xem thêm sản phẩm</span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 4. FILTER DRAWER / SIDEBAR (Mượt mà trên cả máy tính & điện thoại) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 font-['Montserrat',sans-serif]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Drawer container trượt từ bên trái */}
          <div className="fixed inset-y-0 left-0 w-[88%] max-w-md bg-white text-black shadow-2xl flex flex-col z-50 animate-slide-right">
            {/* Header Drawer */}
            <div className="p-5 flex items-center justify-between border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <FilterIcon className="w-5 h-5 text-neutral-900" />
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-neutral-900">
                  BỘ LỌC SẢN PHẨM
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-black transition-colors"
                aria-label="Đóng bộ lọc"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung cuộn các tiêu chí lọc */}
            <div className="p-6 overflow-y-auto flex-1 space-y-7">
              {/* TIÊU CHÍ 1: DANH MỤC */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-900 mb-3 flex items-center justify-between">
                  <span>DANH MỤC</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Chọn 1 danh mục</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'TOPS', 'OUTWEAR', 'BOTTOMS', 'ACCESSORIES', 'NEW ARRIVALS'].map((cat) => {
                    const isSelected = draftCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDraftCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-xs'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                        }`}
                      >
                        {cat === 'ALL' ? 'TẤT CẢ' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIÊU CHÍ 2: KHOẢNG GIÁ */}
              <div className="border-t border-neutral-100 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-900 mb-3 flex items-center justify-between">
                  <span>GIÁ BÁN</span>
                  {(draftMinPrice || draftMaxPrice) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftMinPrice('');
                        setDraftMaxPrice('');
                      }}
                      className="text-[10px] text-neutral-400 hover:text-black underline uppercase font-bold"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </h3>

                {/* Hiển thị khoảng giá thực tế của danh mục */}
                {filterOptions.maxPrice > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium mb-3">
                    <span>Khoảng giá trong danh mục:</span>
                    <span className="font-bold text-neutral-900">
                      {formatPrice(filterOptions.minPrice)} – {formatPrice(filterOptions.maxPrice)}
                    </span>
                  </div>
                )}

                {/* Nút chọn nhanh khoảng giá */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PRICE_PRESETS.map((preset) => {
                    const isSelected =
                      Number(draftMinPrice) === preset.min && Number(draftMaxPrice) === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftMinPrice('');
                            setDraftMaxPrice('');
                          } else {
                            setDraftMinPrice(preset.min);
                            setDraftMaxPrice(preset.max);
                          }
                        }}
                        className={`p-2 text-left text-[11px] font-bold border transition-all leading-tight ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Nhập giá tối thiểu / tối đa tùy chỉnh */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Từ (VNĐ)
                    </label>
                    <input
                      type="number"
                      placeholder={filterOptions.minPrice ? String(filterOptions.minPrice) : '0'}
                      min={0}
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="w-full border border-neutral-300 p-2 text-xs font-semibold focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">
                      Đến (VNĐ)
                    </label>
                    <input
                      type="number"
                      placeholder={filterOptions.maxPrice ? String(filterOptions.maxPrice) : 'Không giới hạn'}
                      min={0}
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="w-full border border-neutral-300 p-2 text-xs font-semibold focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* TIÊU CHÍ 3: MÀU SẮC (MULTI-SELECT THỰC TẾ THEO DANH MỤC) */}
              <div className="border-t border-neutral-100 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-900 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>MÀU SẮC</span>
                    {isOptionsLoading && (
                      <span className="w-3 h-3 border-2 border-neutral-400 border-t-black rounded-full animate-spin inline-block" />
                    )}
                  </span>
                  {draftColors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftColors([])}
                      className="text-[10px] text-neutral-400 hover:text-black underline uppercase font-bold"
                    >
                      Bỏ chọn ({draftColors.length})
                    </button>
                  )}
                </h3>
                <div className={`grid grid-cols-2 gap-2 transition-opacity duration-150 ${isOptionsLoading ? 'opacity-40' : 'opacity-100'}`}>
                  {(filterOptions.colors || []).map((col) => {
                    const isSelected = draftColors.includes(col);
                    const hex = getVariantColorHex(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftColors(draftColors.filter((c) => c !== col));
                          } else {
                            setDraftColors([...draftColors, col]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 text-xs font-bold border transition-all text-left ${
                          isSelected
                            ? 'bg-neutral-100 text-black border-black font-extrabold ring-1 ring-black'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-neutral-300 shrink-0 shadow-xs flex items-center justify-center"
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <span className={hex === '#FFFFFF' ? 'text-black' : 'text-white'}>
                              <CheckIcon className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </span>
                        <span className="truncate">{col}</span>
                      </button>
                    );
                  })}
                </div>
                {(!filterOptions.colors || filterOptions.colors.length === 0) && !isOptionsLoading && (
                  <p className="text-xs text-neutral-400 italic">Không có tùy chọn màu cho danh mục này</p>
                )}
              </div>

              {/* TIÊU CHÍ 4: KÍCH THƯỚC (SIZE - MULTI-SELECT THỰC TẾ THEO DANH MỤC) */}
              <div className="border-t border-neutral-100 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-900 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>KÍCH THƯỚC (SIZE)</span>
                    {isOptionsLoading && (
                      <span className="w-3 h-3 border-2 border-neutral-400 border-t-black rounded-full animate-spin inline-block" />
                    )}
                  </span>
                  {draftSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDraftSizes([])}
                      className="text-[10px] text-neutral-400 hover:text-black underline uppercase font-bold"
                    >
                      Bỏ chọn ({draftSizes.length})
                    </button>
                  )}
                </h3>
                <div className={`flex flex-wrap gap-2 transition-opacity duration-150 ${isOptionsLoading ? 'opacity-40' : 'opacity-100'}`}>
                  {(filterOptions.sizes || []).map((size) => {
                    const isSelected = draftSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftSizes(draftSizes.filter((s) => s !== size));
                          } else {
                            setDraftSizes([...draftSizes, size]);
                          }
                        }}
                        className={`min-w-10 h-10 px-3 text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-black text-white border-black font-extrabold shadow-xs'
                            : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {(!filterOptions.sizes || filterOptions.sizes.length === 0) && !isOptionsLoading && (
                  <p className="text-xs text-neutral-400 italic">Không có tùy chọn size cho danh mục này</p>
                )}
              </div>

              {/* TIÊU CHÍ 5: TÌNH TRẠNG HÀNG */}
              <div className="border-t border-neutral-100 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-900 mb-3">
                  TÌNH TRẠNG KHO
                </h3>
                <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
                  <input
                    type="checkbox"
                    checked={draftInStock}
                    onChange={(e) => setDraftInStock(e.target.checked)}
                    className="w-4 h-4 text-black border-neutral-300 rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Chỉ hiển thị sản phẩm còn hàng
                  </span>
                </label>
              </div>
            </div>

            {/* Sticky Drawer Footer: Nút Áp dụng & Xóa */}
            <div className="p-5 border-t border-neutral-200 bg-neutral-50 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-3 text-center border border-neutral-300 bg-white text-neutral-800 text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-100 transition-colors"
              >
                XÓA BỘ LỌC
              </button>
              <button
                type="button"
                onClick={handleApplyFilterDrawer}
                className="w-full py-3 text-center bg-black text-white text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-800 transition-colors shadow-xs"
              >
                ÁP DỤNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER STREETWEAR ĐỒNG BỘ THƯƠNG HIỆU */}
      <footer className="w-full bg-black text-white pt-12 sm:pt-16 pb-8 px-6 sm:px-12 border-t border-neutral-900 select-none overflow-hidden mt-auto">
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
              <button onClick={() => showToast('Chính sách đổi trả trong 30 ngày')} className="hover:text-white transition-colors">
                Chính sách đổi trả
              </button>
              <button onClick={() => showToast('Hướng dẫn chọn size chuẩn')} className="hover:text-white transition-colors">
                Hướng dẫn size
              </button>
              <button onClick={() => showToast('Liên hệ hỗ trợ MBBC')} className="hover:text-white transition-colors">
                Liên hệ
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. MODALS TOÀN CỤC (Giỏ hàng drawer, Đơn hàng của tôi, Toast) */}
      <StoreModals />
    </div>
  );
};

export default CategoryPage;
