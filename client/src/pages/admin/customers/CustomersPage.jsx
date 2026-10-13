import { useState, useEffect, useCallback } from 'react';
import { getCustomers, updateCustomer, deleteCustomer } from '../../../services/customerApi';
import CustomerFormModal from './CustomerFormModal';

// ============================================
// ICON COMPONENTS
// ============================================
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const UnlockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

const UsersEmptyIcon = () => (
  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const response = await getCustomers(params);
      const { customers: data, pagination: paginationData } = response.data.data;
      setCustomers(data);
      setPagination(paginationData);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải danh sách khách hàng';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleToggleBlock = async (cust) => {
    const nextStatus = cust.status === 'blocked' ? 'active' : 'blocked';
    try {
      await updateCustomer(cust._id, { status: nextStatus });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Thao tác thay đổi trạng thái thất bại');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteConfirm._id);
      setDeleteConfirm(null);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa tài khoản khách hàng thất bại');
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page header (KHÔNG có nút thêm mới, tài khoản tự động sinh khi khách đăng ký) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý khách hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total > 0
              ? `${pagination.total} tài khoản khách hàng đã đăng ký trên website`
              : 'Chưa có tài khoản khách hàng nào đăng ký'}
          </p>
        </div>
      </div>

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
            placeholder="Tìm theo tên, email, SĐT..."
            className="w-full h-10 pl-9 pr-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="blocked">Đã bị khóa</option>
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
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-gray-200">
          <UsersEmptyIcon />
          <p className="text-gray-500 text-sm">Chưa có tài khoản khách hàng nào được tạo</p>
          <p className="text-xs text-gray-400 mt-1">
            Khi người dùng đăng ký tài khoản trên website, thông tin khách hàng sẽ tự động xuất hiện tại đây
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Khách hàng</th>
                <th>Email đăng nhập</th>
                <th>Số điện thoại</th>
                <th>Trạng thái tài khoản</th>
                <th>Ngày đăng ký</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust, index) => (
                <tr key={cust._id}>
                  <td>
                    <span className="text-gray-400 text-xs">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs uppercase">
                        {cust.fullName ? cust.fullName.charAt(0) : 'U'}
                      </div>
                      <span className="font-semibold text-gray-900">{cust.fullName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-gray-700 text-sm">{cust.email}</span>
                  </td>
                  <td>
                    <span className="text-gray-600 text-sm tabular-nums">
                      {cust.phone || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${cust.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {cust.status === 'active' ? 'Hoạt động' : 'Đã bị khóa'}
                    </span>
                  </td>
                  <td>
                    <span className="text-gray-500 text-sm">{formatDate(cust.createdAt)}</span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleBlock(cust)}
                        className={`p-2 rounded-lg transition-all ${
                          cust.status === 'blocked'
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-amber-600 hover:bg-amber-50'
                        }`}
                        title={cust.status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {cust.status === 'blocked' ? <UnlockIcon /> : <LockIcon />}
                      </button>
                      <button
                        onClick={() => setEditingCustomer(cust)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Xem & Chỉnh sửa"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cust)}
                        className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                        title="Xóa tài khoản"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Modal chỉnh sửa / xem chi tiết */}
      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}

      {/* Modal xác nhận xóa */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-[var(--radius-md)] p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa tài khoản</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc muốn xóa tài khoản khách hàng <strong>{deleteConfirm.fullName}</strong> ({deleteConfirm.email})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="h-9 px-4 text-sm font-medium border border-gray-300 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-9 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
