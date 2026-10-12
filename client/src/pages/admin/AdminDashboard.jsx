import { useState } from 'react';
import { Link } from 'react-router-dom';

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
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const WarehouseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
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

const ArrowUpIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
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

// ============================================
// MINI BAR CHART COMPONENT
// ============================================
const MiniBarChart = ({ data, color }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-500"
            style={{
              height: `${(d.value / max) * 100}%`,
              backgroundColor: color,
              opacity: 0.15 + (d.value / max) * 0.85,
              animationDelay: `${i * 60}ms`,
            }}
          />
          <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// SAMPLE DATA
// ============================================
const sampleStats = [
  {
    label: 'Tổng sản phẩm',
    value: '1,248',
    change: '+12.5%',
    trend: 'up',
    icon: PackageIcon,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    label: 'Đơn hàng tháng này',
    value: '356',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingBagIcon,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Khách hàng',
    value: '2,847',
    change: '+15.3%',
    trend: 'up',
    icon: UsersIcon,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    label: 'Doanh thu tháng',
    value: '45.2M',
    change: '-2.4%',
    trend: 'down',
    icon: CurrencyIcon,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const sampleOrders = [
  { id: 'DH-2048', customer: 'Nguyễn Văn An', items: 3, total: '1,250,000₫', status: 'Đang giao', statusColor: 'bg-blue-50 text-blue-700', time: '15 phút trước' },
  { id: 'DH-2047', customer: 'Trần Thị Mai', items: 1, total: '580,000₫', status: 'Hoàn thành', statusColor: 'bg-emerald-50 text-emerald-700', time: '42 phút trước' },
  { id: 'DH-2046', customer: 'Lê Hoàng Khôi', items: 5, total: '3,420,000₫', status: 'Chờ xử lý', statusColor: 'bg-amber-50 text-amber-700', time: '1 giờ trước' },
  { id: 'DH-2045', customer: 'Phạm Minh Tú', items: 2, total: '890,000₫', status: 'Hoàn thành', statusColor: 'bg-emerald-50 text-emerald-700', time: '2 giờ trước' },
  { id: 'DH-2044', customer: 'Võ Ngọc Hân', items: 4, total: '2,150,000₫', status: 'Đã hủy', statusColor: 'bg-red-50 text-red-600', time: '3 giờ trước' },
];

const sampleChartData = [
  { label: 'T2', value: 32 },
  { label: 'T3', value: 45 },
  { label: 'T4', value: 38 },
  { label: 'T5', value: 52 },
  { label: 'T6', value: 48 },
  { label: 'T7', value: 61 },
  { label: 'CN', value: 42 },
];

const lowStockProducts = [
  { name: 'Áo sơ mi trắng nam', sku: 'SM-001', stock: 3, threshold: 10 },
  { name: 'Quần jean nữ slim', sku: 'QJ-015', stock: 5, threshold: 15 },
  { name: 'Áo khoác denim', sku: 'AK-008', stock: 2, threshold: 8 },
  { name: 'Váy liền hoa nhí', sku: 'VL-022', stock: 4, threshold: 12 },
];

const modules = [
  { name: 'Sản phẩm', icon: PackageIcon, desc: 'Quản lý sản phẩm', path: '/admin/products', color: 'bg-teal-50 text-teal-600', ready: true },
  { name: 'Danh mục', icon: FolderIcon, desc: 'Phân loại sản phẩm', path: '/admin/categories', color: 'bg-blue-50 text-blue-600', ready: true },
  { name: 'Đơn hàng', icon: ShoppingBagIcon, desc: 'Xử lý đơn hàng', path: '/admin/orders', color: 'bg-violet-50 text-violet-600', ready: true },
  { name: 'Kho hàng', icon: WarehouseIcon, desc: 'Quản lý tồn kho', path: '/admin/warehouse', color: 'bg-amber-50 text-amber-600', ready: true },
  { name: 'Khách hàng', icon: UsersIcon, desc: 'Quản lý khách hàng', path: '/admin/customers', color: 'bg-rose-50 text-rose-600', ready: true },
  { name: 'Thống kê', icon: ChartIcon, desc: 'Phân tích doanh thu', path: '/admin/statistics', color: 'bg-cyan-50 text-cyan-600', ready: true },
];

// ============================================
// ADMIN DASHBOARD
// ============================================
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('week');

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống quản lý bán hàng</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ClockIcon />
          <span>Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        {sampleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}>
                  <Icon />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  stat.trend === 'up' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-red-50 text-red-500'
                }`}>
                  {stat.trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight animate-count-up">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[var(--radius-md)] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Đơn hàng theo tuần</h2>
              <p className="text-sm text-gray-500 mt-0.5">Số lượng đơn hàng 7 ngày qua</p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {['week', 'month'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'week' ? '7 ngày' : '30 ngày'}
                </button>
              ))}
            </div>
          </div>
          <MiniBarChart data={sampleChartData} color="#0d9488" />
        </div>

        {/* Low stock alert */}
        <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Sắp hết hàng</h2>
            <span className="badge badge-warning">{lowStockProducts.length} sản phẩm</span>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div key={product.sku} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                <div className="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-500">{product.stock}</p>
                  <p className="text-[10px] text-gray-400">/ {product.threshold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-white border border-gray-200 rounded-[var(--radius-md)] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Đơn hàng gần đây</h2>
            <p className="text-sm text-gray-500 mt-0.5">5 đơn hàng mới nhất</p>
          </div>
          <Link to="/admin/orders" className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Xem tất cả
            <ArrowRightIcon />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Số SP</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {sampleOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-150"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-gray-800">{order.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">{order.customer}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{order.items} sản phẩm</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gray-800 tabular-nums">{order.total}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-gray-400">{order.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quản lý hệ thống</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
          {modules.map((item) => {
            const Icon = item.icon;
            const CardWrapper = item.ready ? Link : 'div';
            const wrapperProps = item.ready ? { to: item.path } : {};

            return (
              <CardWrapper
                key={item.name}
                {...wrapperProps}
                className={`relative block p-4 bg-white border border-gray-200 rounded-[var(--radius-md)] transition-all duration-200 group ${
                  item.ready 
                    ? 'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 cursor-pointer' 
                    : 'opacity-75'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color} mb-2.5 transition-transform duration-200 group-hover:scale-105`}>
                  <Icon />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                {!item.ready && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400" title="Sắp triển khai" />
                )}
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
