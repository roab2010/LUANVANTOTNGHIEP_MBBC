import { useState, useEffect, useCallback } from 'react';
import { getInventory, getWarehouseStats } from '../../../services/warehouseApi';
import StockAdjustModal from './StockAdjustModal';

// ============================================
// ICON COMPONENTS
// ============================================
const WarehouseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.25A2.25 2.25 0 010 18.75V8.25A2.25 2.25 0 012.25 6h19.5A2.25 2.25 0 0124 8.25v10.5A2.25 2.25 0 0121.75 21h-8.25z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const AdjustIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
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

// Format tiền VND
const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

// ============================================
// WAREHOUSE PAGE COMPONENT
// ============================================
const WarehousePage = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal điều chỉnh tồn kho
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch dữ liệu tồn kho
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (stockStatus) params.stockStatus = stockStatus;

      const [invRes, statsRes] = await Promise.all([
        getInventory(params),
        getWarehouseStats(),
      ]);

      setInventory(invRes.data.data.inventory);
      setPagination(invRes.data.data.pagination);
      setStats(statsRes.data.data.stats);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải dữ liệu kho hàng';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, stockStatus]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleAdjustSuccess = () => {
    setSelectedProduct(null);
    fetchInventory();
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý kho hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Theo dõi số lượng tồn kho, cảnh báo hàng sắp hết và giá trị vốn tồn
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
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
            <p className="text-xl font-bold text-teal-600 mt-1 tabular-nums truncate" title={formatPrice(stats.totalCostValue)}>
              {formatPrice(stats.totalCostValue)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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
      </div>

      {/* Error alert */}
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
      ) : inventory.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-gray-200">
          <p className="text-gray-500 text-sm">Không có dữ liệu tồn kho phù hợp với bộ lọc</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá nhập</th>
                <th>Giá bán</th>
                <th>Số lượng tồn</th>
                <th>Tổng vốn tồn</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => {
                let badgeClass = 'badge-success';
                let statusText = 'Còn hàng';

                if (item.statusLabel === 'out_of_stock') {
                  badgeClass = 'badge-danger';
                  statusText = 'Hết hàng';
                } else if (item.statusLabel === 'low_stock') {
                  badgeClass = 'badge-warning';
                  statusText = 'Sắp hết';
                }

                return (
                  <tr key={item._id}>
                    <td>
                      <span className="text-gray-400 text-xs">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">{item.name}</p>
                    </td>
                    <td>
                      <span className="text-gray-600 text-sm">{item.category}</span>
                    </td>
                    <td>
                      <span className="text-gray-600 text-sm tabular-nums">{formatPrice(item.costPrice)}</span>
                    </td>
                    <td>
                      <span className="text-gray-900 font-medium text-sm tabular-nums">{formatPrice(item.price)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 tabular-nums">
                          {item.stock} <span className="text-xs font-normal text-gray-500">{item.unit}</span>
                        </span>
                        <span className={`badge ${badgeClass} text-[10px]`}>
                          {statusText}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-teal-700 font-medium text-sm tabular-nums">
                        {formatPrice(item.totalCostValue)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setSelectedProduct(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          title="Điều chỉnh số lượng kho"
                        >
                          <AdjustIcon />
                          Điều chỉnh
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
            Trang {pagination.page} / {pagination.totalPages}
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

      {/* Modal điều chỉnh kho */}
      {selectedProduct && (
        <StockAdjustModal
          item={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
};

export default WarehousePage;
