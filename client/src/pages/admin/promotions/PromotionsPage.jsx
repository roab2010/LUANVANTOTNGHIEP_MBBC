import { useState, useEffect } from 'react';
import {
  getAdminPromotions,
  getAdminPromotionStatistics,
  toggleAdminPromotionStatus,
  deleteAdminPromotion,
} from '../../../services/promotionApi';
import PromotionFormModal from './PromotionFormModal';
import PromotionUsagesModal from './PromotionUsagesModal';

// ============================================
// ICONS
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

const HistoryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
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

const BoltIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

// Format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [usagesModalOpen, setUsagesModalOpen] = useState(false);
  const [selectedForUsageId, setSelectedForUsageId] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const res = await getAdminPromotionStatistics();
      if (res.data?.success) {
        setStatistics(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê khuyến mãi:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    setActionError('');
    try {
      const params = {
        page,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (scopeFilter) params.scope = scopeFilter;

      const res = await getAdminPromotions(params);
      if (res.data?.success) {
        setPromotions(res.data.data.promotions || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Lỗi tải danh sách khuyến mãi Admin:', err);
      setActionError('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [page, statusFilter, typeFilter, scopeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPromotions();
  };

  const handleToggleStatus = async (promo) => {
    const nextStatus = promo.status === 'active' ? 'paused' : 'active';
    try {
      const res = await toggleAdminPromotionStatus(promo._id, nextStatus);
      if (res.data?.success) {
        fetchPromotions();
        fetchStatistics();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể đổi trạng thái chương trình');
    }
  };

  const handleDelete = async (promo) => {
    if (promo.usedCount > 0) {
      alert(`Không thể xóa chương trình "${promo.name}" vì đã có ${promo.usedCount} lượt sử dụng thực tế. Bạn có thể chọn Tạm dừng chương trình.`);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn chương trình "${promo.name}"?`)) {
      return;
    }

    try {
      const res = await deleteAdminPromotion(promo._id);
      if (res.data?.success) {
        fetchPromotions();
        fetchStatistics();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Không thể xóa chương trình');
    }
  };

  const openCreateModal = () => {
    setSelectedPromotion(null);
    setFormModalOpen(true);
  };

  const openEditModal = (promo) => {
    setSelectedPromotion(promo);
    setFormModalOpen(true);
  };

  const openUsagesModal = (promoId = null) => {
    setSelectedForUsageId(promoId);
    setUsagesModalOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* HEADER QUẢN TRỊ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Quản lý khuyến mãi & voucher
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các chương trình giảm giá tự động, mã voucher và theo dõi hiệu quả kinh doanh
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openUsagesModal(null)}
            className="inline-flex items-center gap-2 h-10 px-4 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all shadow-xs"
          >
            <HistoryIcon />
            <span>Lịch sử sử dụng</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <PlusIcon />
            <span>Tạo chương trình mới</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
          <p className="text-sm text-danger-700 font-medium">{actionError}</p>
        </div>
      )}

      {/* DASHBOARD THỐNG KÊ THỰC TẾ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-[var(--radius-md)]">
          <span className="text-xs font-medium text-gray-500">Tổng chương trình</span>
          <p className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
            {statsLoading ? '...' : statistics?.totalPromotions || 0}{' '}
            <span className="text-xs font-normal text-gray-400">chương trình</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              Đang chạy: {statistics?.activeCount || 0}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
              Sắp chạy: {statistics?.scheduledCount || 0}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-[var(--radius-md)]">
          <span className="text-xs font-medium text-gray-500">Đã hết hạn / Tạm dừng</span>
          <p className="text-xl font-bold text-gray-700 mt-1 tabular-nums">
            {statsLoading ? '...' : (statistics?.expiredCount || 0) + (statistics?.pausedCount || 0)}{' '}
            <span className="text-xs font-normal text-gray-400">chương trình</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
              Hết hạn: {statistics?.expiredCount || 0}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
              Tạm dừng: {statistics?.pausedCount || 0}
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-indigo-200 rounded-[var(--radius-md)] bg-indigo-50/20">
          <span className="text-xs font-medium text-indigo-700">Lượt dùng voucher</span>
          <p className="text-xl font-bold text-indigo-600 mt-1 tabular-nums">
            {statsLoading ? '...' : statistics?.totalUsageCount || 0}{' '}
            <span className="text-xs font-normal text-gray-400">lượt</span>
          </p>
          <p className="mt-2 text-xs text-gray-400">Ghi nhận từ các đơn hàng thực tế</p>
        </div>

        <div className="p-4 bg-white border border-rose-200 rounded-[var(--radius-md)] bg-rose-50/20">
          <span className="text-xs font-medium text-rose-700">Tổng tiền đã giảm</span>
          <p className="text-xl font-bold text-rose-600 mt-1 tabular-nums truncate" title={formatCurrency(statistics?.totalDiscountGiven || 0)}>
            {statsLoading ? '...' : formatCurrency(statistics?.totalDiscountGiven || 0)}
          </p>
          <p className="mt-2 text-xs text-gray-500 truncate" title={statistics?.topUsedPromotions?.[0]?.name}>
            {statistics?.topUsedPromotions?.[0]
              ? `Hot: ${statistics.topUsedPromotions[0].name}`
              : 'Chưa có dữ liệu'}
          </p>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã voucher..."
            className="w-full h-10 pl-9 pr-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
          />
        </form>

        {/* Lọc hình thức */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả hình thức</option>
          <option value="voucher">Voucher nhập mã</option>
          <option value="automatic">Khuyến mãi tự động</option>
        </select>

        {/* Lọc phạm vi */}
        <select
          value={scopeFilter}
          onChange={(e) => {
            setScopeFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả phạm vi</option>
          <option value="order">Theo đơn hàng</option>
          <option value="product">Theo sản phẩm</option>
        </select>

        {/* Lọc trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="draft">Bản nháp</option>
          <option value="paused">Tạm dừng</option>
        </select>
      </div>

      {/* BẢNG DANH SÁCH CHƯƠNG TRÌNH */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
          <p className="text-gray-700 font-semibold text-sm">Chưa có chương trình khuyến mãi nào phù hợp</p>
          <p className="text-gray-400 text-xs mt-1">Hãy nhấn "Tạo chương trình mới" để bắt đầu thiết lập ưu đãi cho cửa hàng.</p>
        </div>
      ) : (
        <div className="table-container shadow-xs">
          <table>
            <thead>
              <tr>
                <th>Tên chương trình / Mã</th>
                <th>Hình thức</th>
                <th>Phạm vi</th>
                <th>Mức giảm</th>
                <th>Thời gian hiệu lực</th>
                <th className="text-center">Đã dùng / Giới hạn</th>
                <th className="text-center">Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => {
                const cStatus = promo.computedStatus;
                const isVoucher = promo.type === 'voucher';

                return (
                  <tr key={promo._id}>
                    <td>
                      <div>
                        <button
                          type="button"
                          onClick={() => openEditModal(promo)}
                          className="font-semibold text-gray-900 text-left hover:text-primary-600 transition-colors cursor-pointer block line-clamp-1"
                          title={promo.name}
                        >
                          {promo.name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-1">
                          {promo.code ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 tracking-wider">
                              {promo.code}
                            </span>
                          ) : (
                            <span className="text-[11px] text-blue-600/80 font-medium italic">
                              Tự động áp dụng khi đủ điều kiện
                            </span>
                          )}
                          {promo.description && (
                            <span className="text-xs text-gray-400 line-clamp-1 truncate max-w-xs" title={promo.description}>
                              · {promo.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* HÌNH THỨC KHUYẾN MÃI: ĐỔI MÀU DỄ PHÂN BIỆT */}
                    <td>
                      {isVoucher ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <TicketIcon />
                          <span>Voucher</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <BoltIcon />
                          <span>Tự động</span>
                        </span>
                      )}
                    </td>

                    <td>
                      {promo.scope === 'product' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          Theo sản phẩm
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                          Toàn đơn hàng
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="font-bold text-rose-600 text-sm tabular-nums">
                        {promo.discountType === 'percentage'
                          ? `${promo.discountValue}%`
                          : formatCurrency(promo.discountValue)}
                      </span>
                      {promo.maxDiscount && (
                        <span className="block text-[11px] text-gray-400">
                          Tối đa: {formatCurrency(promo.maxDiscount)}
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="text-xs text-gray-600 tabular-nums">
                        {new Date(promo.startAt).toLocaleDateString('vi-VN')} &rarr; {new Date(promo.endAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>

                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1 font-medium text-xs">
                        <span className="font-bold text-gray-900 tabular-nums">{promo.usedCount || 0}</span>
                        <span className="text-gray-400">/ {promo.usageLimit !== null ? promo.usageLimit : '∞'}</span>
                      </div>
                    </td>

                    <td className="text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          cStatus === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cStatus === 'scheduled'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : cStatus === 'paused'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : cStatus === 'draft'
                            ? 'bg-gray-100 text-gray-600 border border-gray-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {cStatus === 'active'
                          ? 'Đang chạy'
                          : cStatus === 'scheduled'
                          ? 'Sắp diễn ra'
                          : cStatus === 'paused'
                          ? 'Tạm dừng'
                          : cStatus === 'draft'
                          ? 'Bản nháp'
                          : 'Hết hạn'}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút Xem lịch sử sử dụng */}
                        <button
                          type="button"
                          onClick={() => openUsagesModal(promo._id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Xem lịch sử sử dụng của chương trình này"
                        >
                          <HistoryIcon />
                        </button>

                        {/* Nút Sửa */}
                        <button
                          type="button"
                          onClick={() => openEditModal(promo)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                          title="Chỉnh sửa chương trình"
                        >
                          <EditIcon />
                        </button>

                        {/* Nút Tạm dừng / Kích hoạt */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(promo)}
                          className={`p-1.5 rounded-lg transition-all ${
                            promo.status === 'active'
                              ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={promo.status === 'active' ? 'Tạm dừng chương trình' : 'Kích hoạt chương trình'}
                        >
                          {promo.status === 'active' ? <PauseIcon /> : <PlayIcon />}
                        </button>

                        {/* Nút Xóa (chỉ xóa khi chưa có lượt dùng) */}
                        {promo.usedCount === 0 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(promo)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Xóa chương trình chưa có lượt dùng"
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200 rounded-[var(--radius-md)] text-sm">
          <p className="text-xs text-gray-500">
            Hiển thị <span className="font-semibold text-gray-800">{promotions.length}</span> trên{' '}
            <span className="font-semibold text-gray-800">{pagination.total}</span> chương trình (Trang {pagination.page} / {pagination.totalPages})
          </p>
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

      {/* Modal Form Tạo/Sửa */}
      <PromotionFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        promotion={selectedPromotion}
        onSuccess={() => {
          fetchPromotions();
          fetchStatistics();
        }}
      />

      {/* Modal Lịch sử sử dụng */}
      <PromotionUsagesModal
        isOpen={usagesModalOpen}
        onClose={() => setUsagesModalOpen(false)}
        selectedPromotionId={selectedForUsageId}
      />
    </div>
  );
};

export default PromotionsPage;
