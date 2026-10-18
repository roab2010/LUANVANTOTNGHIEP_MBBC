import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOverviewStats, getRevenueChart } from '../../services/statisticApi';
import { getWarehouseStats } from '../../services/warehouseApi';
import { getOrders } from '../../services/orderApi';
import { getProducts } from '../../services/productApi';

// ============================================
// ICON COMPONENTS
// ============================================
const PackageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const TruckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);


const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// ============================================
// FORMAT HELPERS
// ============================================
const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const orderStatusMap = {
  pending: { label: 'Chờ xác nhận', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  processing: { label: 'Đang xử lý', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  shipping: { label: 'Đang giao', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  delivered: { label: 'Hoàn thành', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Đã hủy', badgeClass: 'bg-red-50 text-red-600 border-red-200' },
};

// ============================================
// SYSTEM MODULES QUICK ACCESS
// ============================================
const systemModules = [
  { name: 'Sản phẩm', icon: PackageIcon, desc: 'Sản phẩm, tồn kho & vốn tồn', path: '/admin/products', color: 'bg-teal-50 text-teal-600' },
  { name: 'Danh mục', icon: FolderIcon, desc: 'Phân loại nhóm mặt hàng', path: '/admin/categories', color: 'bg-blue-50 text-blue-600' },
  { name: 'Nhà cung cấp', icon: TruckIcon, desc: 'Đối tác & lịch sử nhập', path: '/admin/suppliers', color: 'bg-amber-50 text-amber-600' },
  { name: 'Đơn hàng', icon: ShoppingBagIcon, desc: 'Theo dõi & xử lý đơn đặt', path: '/admin/orders', color: 'bg-violet-50 text-violet-600' },
  { name: 'Khách hàng', icon: UsersIcon, desc: 'Tài khoản khách hàng', path: '/admin/customers', color: 'bg-rose-50 text-rose-600' },
  { name: 'Thống kê', icon: ChartIcon, desc: 'Báo cáo doanh thu bán hàng', path: '/admin/statistics', color: 'bg-cyan-50 text-cyan-600' },
];

// ============================================
// ADMIN DASHBOARD COMPONENT (REAL DATA 100%)
// ============================================
const AdminDashboard = () => {
  const [activeChartTab, setActiveChartTab] = useState('revenue'); // 'revenue' | 'orders'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real data states
  const [overview, setOverview] = useState(null);
  const [warehouseStats, setWarehouseStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, whRes, chartRes, ordersRes, lowStockRes] = await Promise.all([
        getOverviewStats(),
        getWarehouseStats(),
        getRevenueChart(),
        getOrders({ limit: 5 }),
        getProducts({ stockStatus: 'low_stock', limit: 4 }),
      ]);

      setOverview(ovRes.data?.data || null);
      setWarehouseStats(whRes.data?.data?.stats || null);
      setRevenueChart(chartRes.data?.data?.chartData || []);
      setRecentOrders(ordersRes.data?.data?.orders || []);
      setLowStockList(lowStockRes.data?.data?.products || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Dashboard:', err);
      setError(err.response?.data?.message || 'Không thể kết nối đến server để tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Tính giá trị lớn nhất cho biểu đồ
  const maxChartValue = Math.max(
    ...revenueChart.map((d) => (activeChartTab === 'revenue' ? d.revenue : d.orderCount)),
    activeChartTab === 'revenue' ? 100000 : 1
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard tổng quan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dữ liệu thời gian thực từ cơ sở dữ liệu hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
            <ClockIcon />
            <span>Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RefreshIcon />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stat KPI Cards (Dữ liệu thật 100%) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Doanh thu */}
        <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-50 text-teal-600">
              <CurrencyIcon />
            </div>
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
              Thực tế
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
            {loading ? '—' : formatCurrency(overview?.totalRevenue)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Tổng doanh thu</span>
            <span className="text-emerald-600 font-medium">
              +{formatCurrency(overview?.todayRevenue)} hôm nay
            </span>
          </div>
        </div>

        {/* Đơn hàng */}
        <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <ShoppingBagIcon />
            </div>
            {overview?.pendingOrdersCount > 0 ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                {overview.pendingOrdersCount} chờ xử lý
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                Ổn định
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
            {loading ? '—' : overview?.totalOrders || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Tổng đơn đặt hàng</span>
            <span className="text-blue-600 font-medium">
              {overview?.deliveredOrdersCount || 0} đã giao
            </span>
          </div>
        </div>

        {/* Sản phẩm & Tồn kho */}
        <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
              <PackageIcon />
            </div>
            {warehouseStats?.lowStockCount > 0 ? (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                {warehouseStats.lowStockCount} sắp hết
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Tồn đủ
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
            {loading ? '—' : overview?.totalProducts || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Mặt hàng đang quản lý</span>
            <span className="text-gray-600 font-medium truncate max-w-[140px]" title={formatCurrency(warehouseStats?.totalCostValue)}>
              Vốn: {formatCurrency(warehouseStats?.totalCostValue)}
            </span>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
              <UsersIcon />
            </div>
            <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
              Khách hàng
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
            {loading ? '—' : overview?.totalCustomers || 0}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Tài khoản đã đăng ký</span>
            <span className="text-violet-600 font-medium">Bảo mật</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Biểu đồ & Cảnh báo tồn kho */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Revenue / Orders Chart 7 ngày */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[var(--radius-md)] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {activeChartTab === 'revenue' ? 'Biểu đồ doanh thu 7 ngày gần nhất' : 'Số lượng đơn hàng 7 ngày gần nhất'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Số liệu tự động thống kê từ các đơn hàng thực tế</p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeChartTab === 'revenue'
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Doanh thu (₫)
              </button>
              <button
                onClick={() => setActiveChartTab('orders')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeChartTab === 'orders'
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Số đơn hàng
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end gap-2 sm:gap-4 pt-6 border-b border-gray-100">
            {revenueChart.length > 0 ? (
              revenueChart.map((d, i) => {
                const currentVal = activeChartTab === 'revenue' ? d.revenue : d.orderCount;
                const heightPercent = maxChartValue > 0 ? Math.max((currentVal / maxChartValue) * 100, 4) : 4;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip khi hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gray-900 text-white text-[10px] font-medium py-1 px-2 rounded shadow-lg whitespace-nowrap z-10">
                      {activeChartTab === 'revenue' ? formatCurrency(d.revenue) : `${d.orderCount} đơn hàng`}
                    </div>

                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${currentVal > 0
                        ? activeChartTab === 'revenue'
                          ? 'bg-teal-600 hover:bg-teal-700'
                          : 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-gray-100'
                        }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[11px] text-gray-500 font-medium mt-2 shrink-0">{d.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                Chưa có dữ liệu giao dịch trong 7 ngày qua
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert (Dữ liệu thật từ kho) */}
        <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Sản phẩm sắp hết hàng</h2>
              <span className={`badge ${lowStockList.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                {lowStockList.length} mặt hàng
              </span>
            </div>

            <div className="space-y-2.5">
              {lowStockList.length > 0 ? (
                lowStockList.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{product.category || 'Chưa phân loại'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-amber-600 tabular-nums">
                        {product.stock} {product.unit || 'cái'}
                      </span>
                      <p className="text-[10px] text-gray-400">&le; 10 cái</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-800">Kho hàng an toàn</p>
                  <p className="text-xs text-gray-400 mt-1">Tất cả sản phẩm hiện đều còn đủ số lượng tồn kho</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <Link
              to="/admin/products"
              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <span>Vào quản lý kho & nhập thêm hàng</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Table (Dữ liệu thật 100%) */}
      <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Đơn hàng mới nhất</h2>
            <p className="text-sm text-gray-500 mt-0.5">5 đơn hàng gần nhất được khách hàng đặt mua</p>
          </div>
          <Link
            to="/admin/orders"
            className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <span>Xem tất cả đơn hàng</span>
            <ArrowRightIcon />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Số SP</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Thời gian đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const statusInfo = orderStatusMap[order.status] || {
                    label: order.status,
                    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
                  };

                  return (
                    <tr key={order._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900 font-mono">
                          {order.orderCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customer?.fullName || 'Khách vãng lai'}</p>
                          {order.customer?.phone && (
                            <p className="text-xs text-gray-400 font-mono">{order.customer.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-gray-600">
                          {order.items?.length || 0} mặt hàng
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-gray-500 tabular-nums">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                    Chưa có đơn hàng nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Modules Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Quản lý hệ thống</h2>
          <span className="text-xs text-gray-400">{systemModules.length} phân hệ quản trị</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {systemModules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className="p-3.5 bg-white border border-gray-200 rounded-[var(--radius-md)] transition-all duration-200 hover:shadow-sm hover:border-gray-300 hover:-translate-y-0.5 group block"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color} mb-2.5 transition-transform duration-200 group-hover:scale-105`}>
                  <Icon />
                </div>
                <h3 className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
