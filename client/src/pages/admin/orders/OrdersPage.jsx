import { useState, useEffect, useCallback } from 'react';
import { getOrders, deleteOrder } from '../../../services/orderApi';
import OrderDetailModal from './OrderDetailModal';
import { getVariantColorHex } from '../../../components/VariantSelect';

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

const ShoppingBagIcon = () => (
  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const formatPrice = (val) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(val || 0);
};

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

const getStatusBadge = (status) => {
  const map = {
    pending: { label: 'Chờ xác nhận', cls: 'badge-warning' },
    processing: { label: 'Đang xử lý', cls: 'badge-info bg-blue-50 text-blue-700' },
    shipping: { label: 'Đang giao', cls: 'badge-info bg-indigo-50 text-indigo-700' },
    delivered: { label: 'Giao thành công', cls: 'badge-success' },
    cancelled: { label: 'Đã hủy', cls: 'badge-danger' },
  };
  const item = map[status] || { label: status, cls: 'badge-default' };
  return <span className={`badge ${item.cls}`}>{item.label}</span>;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;

      const response = await getOrders(params);
      const { orders: data, pagination: pData } = response.data.data;
      setOrders(data);
      setPagination(pData);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải danh sách đơn hàng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteOrder(deleteConfirm._id);
      setDeleteConfirm(null);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa đơn hàng thất bại');
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total > 0 ? `${pagination.total} đơn hàng trong hệ thống` : 'Chưa có đơn hàng nào'}
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
            placeholder="Tìm theo mã đơn, tên khách, SĐT..."
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
          <option value="pending">Chờ xác nhận</option>
          <option value="processing">Đang xử lý</option>
          <option value="shipping">Đang giao hàng</option>
          <option value="delivered">Giao thành công</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="unpaid">Chưa thanh toán</option>
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
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-gray-200">
          <ShoppingBagIcon />
          <p className="text-gray-700 font-medium text-sm">Chưa có đơn hàng nào từ khách hàng</p>
          <p className="text-gray-400 text-xs mt-1">Đơn hàng sẽ tự động xuất hiện tại đây khi khách hàng tiến hành đặt mua sản phẩm.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th className="min-w-[190px]">Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order._id}>
                  <td>
                    <span className="text-gray-400 text-xs">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-gray-900 font-mono">{order.orderCode}</span>
                  </td>
                  <td>
                    <p className="font-medium text-gray-900">{order.customer?.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{order.customer?.phone}</p>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar preview stack */}
                      <div className="flex -space-x-2 overflow-hidden py-0.5 shrink-0">
                        {order.items?.slice(0, 3).map((it, idx) => {
                          const img =
                            it.image ||
                            it.product?.image ||
                            (Array.isArray(it.product?.images) && it.product.images[0]) ||
                            '';
                          return (
                            <div
                              key={idx}
                              className="w-9 h-9 rounded-lg bg-gray-100 border-2 border-white shadow-2xs overflow-hidden shrink-0 flex items-center justify-center relative group"
                              title={`${it.name || 'Sản phẩm'} - SL: ${it.quantity}${it.size ? ` - Size: ${it.size}` : ''}${it.color ? ` - Màu: ${it.color}` : ''}`}
                            >
                              {img ? (
                                <img src={img} alt={it.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] font-bold text-gray-400">MBBC</span>
                              )}
                              {it.color && (
                                <span
                                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                                  style={{ backgroundColor: getVariantColorHex(it.color) }}
                                />
                              )}
                            </div>
                          );
                        })}
                        {order.items?.length > 3 && (
                          <div className="w-9 h-9 rounded-lg bg-gray-100 border-2 border-white text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Tên & biến thể ngắn gọn */}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]" title={order.items?.[0]?.name}>
                          {order.items?.[0]?.name || 'Sản phẩm'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-500 font-medium">
                            <strong className="text-gray-800">{order.items?.reduce((s, it) => s + it.quantity, 0)}</strong> cái
                          </span>
                          {order.items?.[0]?.color && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-600 font-medium bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                              <span
                                className="w-2 h-2 rounded-full border border-gray-300 shrink-0"
                                style={{ backgroundColor: getVariantColorHex(order.items[0].color) }}
                              />
                              <span className="truncate max-w-[55px]">{order.items[0].color}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                  </td>
                  <td>
                    <span className="text-gray-500 text-xs">{formatDate(order.createdAt)}</span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Xem chi tiết & Cập nhật"
                      >
                        <EyeIcon />
                      </button>
                      {order.status === 'cancelled' && (
                        <button
                          onClick={() => setDeleteConfirm(order)}
                          className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all"
                          title="Xóa đơn hàng hủy"
                        >
                          <TrashIcon />
                        </button>
                      )}
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

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-[var(--radius-md)] p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa đơn hàng</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc muốn xóa đơn hàng <strong>{deleteConfirm.orderCode}</strong>?
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

export default OrdersPage;
