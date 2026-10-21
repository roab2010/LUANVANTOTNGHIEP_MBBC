import { useState, useEffect, useCallback } from 'react';
import { getActivityLogs } from '../../../services/activityLogApi';
import ActivityLogDetailModal from './ActivityLogDetailModal';

// ============================================
// ICONS
// ============================================
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RefreshIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

// Formatters
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getActionBadge = (action) => {
  const map = {
    CREATE: { label: 'Thêm mới', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    UPDATE: { label: 'Cập nhật', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    DELETE: { label: 'Xóa dữ liệu', cls: 'bg-red-50 text-red-700 border-red-200' },
    LOGIN: { label: 'Đăng nhập', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    LOGOUT: { label: 'Đăng xuất', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    STATUS_CHANGE: { label: 'Đổi trạng thái', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    STOCK_IN: { label: 'Nhập kho', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    STOCK_OUT: { label: 'Xuất kho', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const item = map[action] || { label: action, cls: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const getModuleBadge = (mod) => {
  const map = {
    AUTH: 'Xác thực',
    USER: 'Khách hàng',
    PRODUCT: 'Sản phẩm',
    CATEGORY: 'Danh mục',
    SUPPLIER: 'Nhà cung cấp',
    ORDER: 'Đơn hàng',
    INVENTORY: 'Kho hàng',
    SHIPPING: 'Vận chuyển',
    SYSTEM: 'Hệ thống',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
      {map[mod] || mod}
    </span>
  );
};

const getRoleBadge = (role) => {
  const map = {
    admin: { label: 'Admin', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    system: { label: 'Hệ thống', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  };
  const item = map[role] || { label: 'Admin', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination & stats
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getActivityLogs({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
        status: statusFilter || undefined,
        actorRole: roleFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        if (res.data.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.data.data.pagination.total,
            totalPages: res.data.data.pagination.totalPages,
          }));
        }
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Lỗi tải nhật ký hoạt động:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu nhật ký hoạt động.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, moduleFilter, actionFilter, statusFilter, roleFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setModuleFilter('');
    setActionFilter('');
    setStatusFilter('');
    setRoleFilter('');
    setFromDate('');
    setToDate('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Nhật ký hoạt động</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Lưu vết kiểm toán Admin MBBC – theo dõi thao tác người quản trị, làm chứng từ đối chiếu biến động kho hàng và đơn hàng
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng số lượt lưu vết</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{stats.total.toLocaleString('vi-VN')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Hoạt động thành công</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{stats.success.toLocaleString('vi-VN')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-2xs">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Thất bại / Bị chặn</p>
          <p className="text-2xl font-bold text-red-700 mt-1 tabular-nums">{stats.failed.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Tìm theo mô tả, đối tượng, người làm..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50/50 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          {/* Lọc Phân hệ */}
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="h-9 px-3 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả phân hệ</option>
            <option value="AUTH">Xác thực (Đăng nhập/Đăng xuất/Đăng ký)</option>
            <option value="USER">Khách hàng / Người dùng</option>
            <option value="PRODUCT">Sản phẩm & Biến thể</option>
            <option value="CATEGORY">Danh mục sản phẩm</option>
            <option value="SUPPLIER">Nhà cung cấp</option>
            <option value="ORDER">Đơn hàng</option>
            <option value="INVENTORY">Kho hàng (Nhập/Xuất kho)</option>
            <option value="SHIPPING">Vận chuyển GHN</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>

          {/* Lọc Hành động */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="h-9 px-3 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE">Thêm mới</option>
            <option value="UPDATE">Cập nhật</option>
            <option value="DELETE">Xóa dữ liệu</option>
            <option value="STATUS_CHANGE">Đổi trạng thái</option>
            <option value="STOCK_IN">Nhập kho</option>
            <option value="STOCK_OUT">Xuất kho</option>
            <option value="LOGIN">Đăng nhập</option>
            <option value="LOGOUT">Đăng xuất</option>
          </select>

          {/* Lọc Kết quả */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="h-9 px-3 text-xs bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tất cả kết quả</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="FAILED">Thất bại / Bị chặn (FAILED)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Khoảng ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-8 px-2 text-xs border border-gray-300 rounded-lg text-gray-700"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-8 px-2 text-xs border border-gray-300 rounded-lg text-gray-700"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-gray-600 hover:text-red-600 underline transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-white rounded-lg border border-gray-200 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-700">Chưa có nhật ký hoạt động nào phù hợp</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Hệ thống sẽ tự động ghi nhận khi Admin hoặc khách hàng thực hiện các thao tác quan trọng.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-left w-10 font-semibold">#</th>
                  <th className="py-3 px-3.5 text-left font-semibold min-w-[130px]">Thời gian</th>
                  <th className="py-3 px-3.5 text-left font-semibold min-w-[150px]">Người thực hiện</th>
                  <th className="py-3 px-3.5 text-left font-semibold min-w-[170px]">Hành động & Phân hệ</th>
                  <th className="py-3 px-3.5 text-left font-semibold min-w-[160px]">Đối tượng</th>
                  <th className="py-3 px-3.5 text-left font-semibold min-w-[240px]">Mô tả thao tác</th>
                  <th className="py-3 px-3.5 text-center font-semibold w-24">Kết quả</th>
                  <th className="py-3 px-3.5 text-right font-semibold w-16">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log, idx) => (
                  <tr key={log._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3.5 text-gray-400 font-mono text-[11px]">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-gray-600 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-gray-900 truncate max-w-[140px]" title={log.actorName}>
                        {log.actorName}
                      </div>
                      <div className="mt-0.5">{getRoleBadge(log.actorRole)}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getActionBadge(log.action)}
                        {getModuleBadge(log.module)}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-gray-800 truncate max-w-[150px]" title={log.targetName}>
                        {log.targetName || '—'}
                      </div>
                      <div className="text-[10px] text-gray-400">{log.targetType || 'Hệ thống'}</div>
                    </td>
                    <td className="py-3 px-3.5 text-gray-700 leading-snug">
                      <p className="line-clamp-2" title={log.description}>
                        {log.description}
                      </p>
                      {Array.isArray(log.changes) && log.changes.length > 0 && (
                        <span className="inline-block mt-1 text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {log.changes.length} thay đổi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                        title="Xem chi tiết biến động dữ liệu"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40 text-xs">
              <span className="text-gray-500">
                Hiển thị trang <strong className="text-gray-800">{pagination.page}</strong> / {pagination.totalPages} (Tổng {pagination.total} bản ghi)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết */}
      {selectedLog && (
        <ActivityLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};

export default ActivityLogsPage;
