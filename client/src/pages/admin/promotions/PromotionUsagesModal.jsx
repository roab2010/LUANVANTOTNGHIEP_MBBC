import { useState, useEffect } from 'react';
import { getAdminPromotionUsages } from '../../../services/promotionApi';

const CloseIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const PromotionUsagesModal = ({ isOpen, onClose, selectedPromotionId = null }) => {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchUsages = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
      };
      if (selectedPromotionId) params.promotionId = selectedPromotionId;
      if (statusFilter) params.status = statusFilter;

      const res = await getAdminPromotionUsages(params);
      if (res.data?.success) {
        setUsages(res.data.data.usages || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Lỗi tải lịch sử sử dụng khuyến mãi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsages();
    }
  }, [isOpen, page, statusFilter, selectedPromotionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={onClose} />

      <div className="relative bg-white text-gray-900 max-w-4xl w-full z-10 shadow-2xl rounded-xl max-h-[92vh] overflow-y-auto border border-gray-100 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Lịch sử sử dụng voucher & khuyến mãi
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Theo dõi chi tiết các lượt áp dụng voucher và số tiền giảm giá trên đơn hàng thực tế
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Used">Đã áp dụng (Used)</option>
              <option value="Restored">Đã hoàn lại (Restored)</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3 py-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : usages.length === 0 ? (
            <div className="py-16 text-center bg-gray-50/50 border border-gray-200 rounded-xl">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-gray-700">Chưa có lượt sử dụng nào được ghi nhận</p>
              <p className="text-xs text-gray-400 mt-1">Lịch sử sẽ xuất hiện khi có khách hàng hoàn tất đơn hàng với voucher hoặc khuyến mãi.</p>
            </div>
          ) : (
            <div className="table-container shadow-xs">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn hàng</th>
                    <th>Khách hàng</th>
                    <th>Khuyến mãi / Mã</th>
                    <th className="text-right">Số tiền giảm</th>
                    <th>Thời gian</th>
                    <th className="text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {usages.map((u) => {
                    const isRestored = u.status === 'Restored';
                    return (
                      <tr key={u._id}>
                        <td className="font-mono font-bold text-gray-900 text-xs">
                          {u.orderId?.orderCode || 'N/A'}
                        </td>
                        <td>
                          <p className="font-semibold text-gray-900 text-sm">{u.userId?.fullName || 'Khách vãng lai'}</p>
                          <p className="text-xs text-gray-400">{u.userId?.email || u.userId?.phone || ''}</p>
                        </td>
                        <td>
                          <p className="font-medium text-gray-900 truncate max-w-[200px] text-sm" title={u.promotionId?.name}>
                            {u.promotionId?.name || 'Khuyến mãi'}
                          </p>
                          {u.promotionId?.code && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 mt-0.5">
                              {u.promotionId.code}
                            </span>
                          )}
                        </td>
                        <td className="text-right font-bold text-rose-600 tabular-nums text-sm">
                          -{formatCurrency(u.discountAmount)}
                        </td>
                        <td>
                          <p className="text-xs text-gray-700 tabular-nums">{new Date(u.usedAt).toLocaleDateString('vi-VN')}</p>
                          <p className="text-[11px] text-gray-400 tabular-nums">{new Date(u.usedAt).toLocaleTimeString('vi-VN')}</p>
                        </td>
                        <td className="text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isRestored
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isRestored ? 'Đã hoàn lại' : 'Đã sử dụng'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-xs font-medium">
              <span className="text-gray-500">
                Hiển thị trang <span className="font-semibold text-gray-800">{pagination.page}</span> / {pagination.totalPages} ({pagination.total} lượt dùng)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon />
                  <span>Trước</span>
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Sau</span>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionUsagesModal;
