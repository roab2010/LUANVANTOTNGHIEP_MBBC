import { useState, useEffect } from 'react';
import {
  getOverviewStats,
  getRevenueChart,
  getTopProducts,
  getOrderStatusDistribution,
} from '../../../services/statisticApi';

// ============================================
// ICONS
// ============================================
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const PackageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

const statusNameMap = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao hàng',
  delivered: 'Giao thành công',
  cancelled: 'Đã hủy',
};

const statusColorMap = {
  pending: 'bg-amber-500',
  processing: 'bg-blue-500',
  shipping: 'bg-indigo-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

const StatisticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const [ovRes, chartRes, topRes, distRes] = await Promise.all([
          getOverviewStats(),
          getRevenueChart(),
          getTopProducts(),
          getOrderStatusDistribution(),
        ]);

        setOverview(ovRes.data.data);
        setRevenueChart(chartRes.data.data.chartData);
        setTopProducts(topRes.data.data.topProducts);
        setDistribution(distRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải số liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Tìm mức doanh thu cao nhất để vẽ biểu đồ tỉ lệ cột
  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 100000);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Thống kê & Báo cáo doanh thu</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Phân tích tình hình kinh doanh, dòng tiền và hiệu quả bán hàng
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-danger-50 border border-red-200 rounded-lg text-sm text-danger-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-28 w-full rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-72 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Tổng doanh thu thực tế</span>
                  <p className="text-2xl font-bold text-teal-600 mt-1 tabular-nums">
                    {formatPrice(overview.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Từ các đơn giao thành công</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <CurrencyIcon />
                </div>
              </div>

              <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Doanh thu hôm nay</span>
                  <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">
                    {formatPrice(overview.todayRevenue)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Ghi nhận trong ngày</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ChartIcon />
                </div>
              </div>

              <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Tổng số đơn hàng</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
                    {overview.totalOrders}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    {overview.deliveredOrdersCount} đơn giao thành công
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <ShoppingBagIcon />
                </div>
              </div>

              <div className="p-5 bg-white border border-gray-200 rounded-[var(--radius-md)] flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500">Khách hàng & Sản phẩm</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
                    {overview.totalCustomers} <span className="text-xs font-normal text-gray-400">khách</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{overview.totalProducts} mặt hàng đang bán</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <UsersIcon />
                </div>
              </div>
            </div>
          )}

          {/* Biểu đồ doanh thu 7 ngày */}
          <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Biểu đồ doanh thu 7 ngày gần nhất</h2>
                <p className="text-xs text-gray-500 mt-0.5">Thống kê số tiền bán ra mỗi ngày</p>
              </div>
            </div>

            <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-gray-100">
              {revenueChart.map((d, idx) => {
                const heightPercent = Math.max(8, Math.round((d.revenue / maxRevenue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip khi hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20">
                      {formatPrice(d.revenue)} ({d.orderCount} đơn)
                    </div>
                    {/* Cột biểu đồ */}
                    <div
                      className="w-full max-w-[48px] bg-primary-600 rounded-t-md transition-all duration-300 group-hover:bg-primary-700"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs text-gray-500 font-medium mt-2">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: Top sản phẩm & Tỷ lệ đơn hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top sản phẩm */}
            <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Top 5 sản phẩm bán chạy nhất</h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Chưa có dữ liệu bán hàng</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topProducts.map((p, index) => (
                    <div key={index} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400">Đã bán: {p.totalQuantity} cái</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatPrice(p.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phân bổ trạng thái đơn hàng */}
            <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Phân bổ trạng thái đơn hàng</h2>
              {distribution && distribution.total > 0 ? (
                <div className="space-y-4">
                  {distribution.distribution.map((item) => (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-700">{statusNameMap[item.status]}</span>
                        <span className="text-gray-500 tabular-nums">
                          {item.count} đơn ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusColorMap[item.status]}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center">Chưa có đơn hàng để phân tích</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
