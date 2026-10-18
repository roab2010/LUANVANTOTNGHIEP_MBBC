import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../../../services/productApi';
import { getWarehouseStats } from '../../../services/warehouseApi';
import ProductFormModal from './ProductFormModal';
import StockAdjustModal from '../warehouse/StockAdjustModal';

// ============================================
// ICON COMPONENTS
// ============================================
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const AdjustIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

// ============================================
// FORMAT HELPERS
// ============================================
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

// ============================================
// PRODUCTS PAGE COMPONENT (HỢP NHẤT SẢN PHẨM & KHO HÀNG)
// ============================================
const ProductsPage = () => {
  // State
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal thêm/sửa sản phẩm
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Modal nhập thêm tồn kho
  const [selectedAdjustProduct, setSelectedAdjustProduct] = useState(null);

  // ============================================
  // FETCH PRODUCTS & STATS
  // ============================================
  const fetchProductsAndStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (stockStatus) params.stockStatus = stockStatus;

      const [prodRes, statsRes] = await Promise.all([
        getProducts(params),
        getWarehouseStats(),
      ]);

      const { products: data, pagination: paginationData } = prodRes.data.data;
      setProducts(data);
      setPagination(paginationData);
      setStats(statsRes.data?.data?.stats || null);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách sản phẩm và tồn kho';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, stockStatus]);

  useEffect(() => {
    fetchProductsAndStats();
  }, [fetchProductsAndStats]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingProduct(null);
    fetchProductsAndStats();
  };

  const handleAdjustSuccess = () => {
    setSelectedAdjustProduct(null);
    fetchProductsAndStats();
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý sản phẩm</h1>

        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm"
        >
          <PlusIcon />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* KPI Stats Cards Kho hàng */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-[var(--radius-md)]">
            <span className="text-xs font-medium text-gray-500">Tổng sản phẩm tồn kho</span>
            <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
              {stats.totalStock} <span className="text-xs font-normal text-gray-400">cái</span>
            </p>
          </div>

          <div className="p-4 bg-white border border-amber-200 rounded-[var(--radius-md)] bg-amber-50/20">
            <span className="text-xs font-medium text-amber-700">Sắp hết hàng (&le; 10 cái)</span>
            <p className="text-xl font-bold text-amber-600 mt-1 tabular-nums">
              {stats.lowStockCount} <span className="text-xs font-normal text-gray-400">mặt hàng</span>
            </p>
          </div>

          <div className="p-4 bg-white border border-rose-200 rounded-[var(--radius-md)] bg-rose-50/20">
            <span className="text-xs font-medium text-rose-700">Hết hàng (0 cái)</span>
            <p className="text-xl font-bold text-rose-600 mt-1 tabular-nums">
              {stats.outOfStockCount} <span className="text-xs font-normal text-gray-400">mặt hàng</span>
            </p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-[var(--radius-md)]">
            <span className="text-xs font-medium text-gray-500">Tổng giá trị vốn tồn</span>
            <p className="text-xl font-bold text-teal-600 mt-1 tabular-nums truncate" title={formatCurrency(stats.totalCostValue)}>
              {formatCurrency(stats.totalCostValue)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full h-10 pl-9 pr-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
          />
        </form>

        {/* Lọc tình trạng tồn kho */}
        <select
          value={stockStatus}
          onChange={(e) => {
            setStockStatus(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả tình trạng tồn</option>
          <option value="in_stock">Còn hàng (&gt; 10 cái)</option>
          <option value="low_stock">Sắp hết hàng (1 - 10 cái)</option>
          <option value="out_of_stock">Đã hết hàng (0 cái)</option>
        </select>

        {/* Lọc trạng thái kinh doanh */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả trạng thái bán</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
          <p className="text-sm text-danger-700 font-medium">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p className="text-gray-500 text-sm">Chưa có sản phẩm nào phù hợp</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-14">Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá nhập</th>
                <th>Giá bán</th>
                <th>Số lượng tồn</th>
                <th>Tổng vốn tồn</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                let badgeClass = 'badge-success';
                let statusText = 'Còn hàng';

                if (product.stock <= 0) {
                  badgeClass = 'badge-danger';
                  statusText = 'Hết hàng';
                } else if (product.stock <= 10) {
                  badgeClass = 'badge-warning';
                  statusText = 'Sắp hết';
                }

                const totalCostVal = (product.stock || 0) * (product.costPrice || 0);

                return (
                  <tr key={product._id}>
                    <td>
                      <div className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon />
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {product.supplier?.name && (
                            <span className="text-[11px] font-medium text-primary-700 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded">
                              NCC: {product.supplier.name}
                            </span>
                          )}
                          {product.description && (
                            <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-gray-600 text-sm">{product.category || '—'}</span>
                    </td>
                    <td>
                      <span className="text-gray-600 text-sm tabular-nums">{formatCurrency(product.costPrice)}</span>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900 text-sm tabular-nums">{formatCurrency(product.price)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm tabular-nums">
                          {product.stock} <span className="text-xs font-normal text-gray-500">{product.unit || 'cái'}</span>
                        </span>
                        <span className={`badge ${badgeClass} text-[10px]`}>
                          {statusText}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-teal-700 font-semibold text-sm tabular-nums">
                        {formatCurrency(totalCostVal)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Nhập thêm tồn kho */}
                        <button
                          onClick={() => setSelectedAdjustProduct(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          title="Nhập thêm hàng vào kho"
                        >
                          <AdjustIcon />
                          <span>Nhập thêm</span>
                        </button>

                        {/* Nút Sửa */}
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          title="Sửa thông tin sản phẩm"
                        >
                          <EditIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-gray-500">
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} sản phẩm)
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}



      {/* Product form modal (Thêm / Sửa sản phẩm) */}
      {showModal && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Stock adjust modal (Nhập thêm hàng vào kho) */}
      {selectedAdjustProduct && (
        <StockAdjustModal
          item={selectedAdjustProduct}
          onClose={() => setSelectedAdjustProduct(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
};

export default ProductsPage;
