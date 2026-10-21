import React, { useState, useEffect, useCallback } from 'react';
import StarRatingDisplay from '../../../components/common/StarRatingDisplay';
import ReviewDetailModal from './ReviewDetailModal';
import { getAdminReviews, moderateReview } from '../../../services/reviewApi';

// Format ngày giờ
const formatDateTime = (dateStr) => {
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
    PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
    APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REJECTED: { label: 'Bị từ chối', cls: 'bg-red-100 text-red-800 border-red-300' },
    HIDDEN: { label: 'Đã ẩn', cls: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
  };
  const item = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-800 border-neutral-300' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase border rounded ${item.cls}`}>
      {item.label}
    </span>
  );
};

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [kpi, setKpi] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejectedOrHidden: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc
  const [currentTab, setCurrentTab] = useState('PENDING'); // 'PENDING' ưu tiên lên đầu theo yêu cầu! | 'ALL' | 'APPROVED' | 'REJECTED' | 'HIDDEN'
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal chi tiết & kiểm duyệt
  const [selectedReview, setSelectedReview] = useState(null);

  // Tải danh sách
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (currentTab !== 'ALL') {
        params.status = currentTab;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      if (ratingFilter) {
        params.rating = ratingFilter;
      }

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getAdminReviews(params);
      if (res.data?.success && res.data.data) {
        setReviews(res.data.data.reviews || []);
        if (res.data.data.kpi) {
          setKpi(res.data.data.kpi);
        }
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đánh giá Admin:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, currentTab, search, ratingFilter, startDate, endDate]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Duyệt nhanh 1 click
  const handleQuickApprove = async (reviewId) => {
    try {
      const res = await moderateReview(reviewId, { action: 'approve' });
      if (res.data?.success) {
        fetchReviews();
      }
    } catch (err) {
      console.error('Lỗi duyệt nhanh đánh giá:', err);
      alert(err.response?.data?.message || 'Không thể duyệt đánh giá');
    }
  };

  return (
    <div className="space-y-6">
      {/* TIÊU ĐỀ TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý đánh giá sản phẩm
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm duyệt đánh giá của khách hàng, phản hồi chính thức từ MBBC và quản lý hiển thị công khai
          </p>
        </div>
      </div>

      {/* 4 THẺ KPI TỔNG QUAN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Chờ duyệt (Ưu tiên xử lý) */}
        <div
          onClick={() => {
            setCurrentTab('PENDING');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'PENDING'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400'
              : 'bg-white border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Chờ duyệt
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-2 font-mono">
            {kpi.pending}
          </div>
          <p className="text-xs text-amber-700/80 mt-1">Cần kiểm duyệt để hiển thị</p>
        </div>

        {/* KPI 2: Đã duyệt */}
        <div
          onClick={() => {
            setCurrentTab('APPROVED');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'APPROVED'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400'
              : 'bg-white border-gray-200 hover:border-emerald-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Đã duyệt công khai
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-2 font-mono">
            {kpi.approved}
          </div>
          <p className="text-xs text-emerald-700/80 mt-1">Đang hiển thị trên Storefront</p>
        </div>

        {/* KPI 3: Bị từ chối / Đã ẩn */}
        <div
          onClick={() => {
            setCurrentTab('REJECTED');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'REJECTED' || currentTab === 'HIDDEN'
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400'
              : 'bg-white border-gray-200 hover:border-red-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-red-800">
            Từ chối / Đã ẩn
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-900 mt-2 font-mono">
            {kpi.rejectedOrHidden}
          </div>
          <p className="text-xs text-red-700/80 mt-1">Không xuất hiện công khai</p>
        </div>

        {/* KPI 4: Tổng đánh giá */}
        <div
          onClick={() => {
            setCurrentTab('ALL');
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-5 rounded-xl border transition-all cursor-pointer ${
            currentTab === 'ALL'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400'
              : 'bg-white border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Tổng đánh giá
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 font-mono">
            {kpi.total}
          </div>
          <p className="text-xs text-gray-500 mt-1">Toàn bộ trên hệ thống</p>
        </div>
      </div>

      {/* KHỐI BỘ LỌC & DANH SÁCH BẢNG */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        {/* TABS LỌC TRẠNG THÁI */}
        <div className="flex border-b border-gray-200 px-6 pt-3 gap-6 overflow-x-auto">
          {[
            { id: 'PENDING', label: 'Chờ duyệt', count: kpi.pending },
            { id: 'APPROVED', label: 'Đã duyệt', count: kpi.approved },
            { id: 'REJECTED', label: 'Bị từ chối' },
            { id: 'HIDDEN', label: 'Đã ẩn' },
            { id: 'ALL', label: 'Tất cả', count: kpi.total },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCurrentTab(tab.id);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                currentTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab.id === 'PENDING' && tab.count > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* CÁC Ô TÌM KIẾM VÀ LỌC PHỤ */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center gap-3">
          {/* Ô tìm kiếm nội dung */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Tìm theo nội dung nhận xét..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black"
            />
          </div>

          {/* Lọc số sao */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-black"
          >
            <option value="">Tất cả số sao</option>
            <option value="5">5 sao ★★★★★</option>
            <option value="4">4 sao ★★★★☆</option>
            <option value="3">3 sao ★★★☆☆</option>
            <option value="2">2 sao ★★☆☆☆</option>
            <option value="1">1 sao ★☆☆☆☆</option>
          </select>

          {/* Khoảng ngày */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Từ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
            />
            <span className="text-gray-500">Đến:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
            />
          </div>

          {(search || ratingFilter || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRatingFilter('');
                setStartDate('');
                setEndDate('');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-black transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* BẢNG DANH SÁCH */}
        {loading ? (
          <div className="p-16 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-black rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">Đang tải danh sách đánh giá...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-bold">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2">
            <p className="text-sm font-bold uppercase tracking-wider text-gray-800">
              Không có đánh giá nào
            </p>
            <p className="text-xs text-gray-500">
              Không tìm thấy đánh giá nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Đánh giá</th>
                  <th className="py-3 px-4">Nội dung nhận xét</th>
                  <th className="py-3 px-4">Hình ảnh</th>
                  <th className="py-3 px-4">Ngày gửi</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((rev) => {
                  const prod = rev.productId;
                  const cust = rev.userId;

                  return (
                    <tr key={rev._id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Sản phẩm */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={prod?.image || 'https://placehold.co/60x80/151515/ffffff?text=MBBC'}
                            alt={prod?.name}
                            className="w-10 h-12 object-cover rounded border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0 max-w-[180px]">
                            <p className="font-bold text-gray-900 truncate" title={prod?.name}>
                              {prod?.name || 'Sản phẩm'}
                            </p>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                              {prod?.category || 'Streetwear'}
                            </span>
                            {rev.variant?.size && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                Size: {rev.variant.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3 px-4">
                        <div className="min-w-0 max-w-[160px]">
                          <p className="font-bold text-gray-900 truncate">
                            {cust?.fullName || 'Khách hàng'}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono truncate">
                            {cust?.email || '—'}
                          </p>
                          {rev.orderId?.orderCode && (
                            <span className="text-[10px] font-mono text-indigo-600 block">
                              #{rev.orderId.orderCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Số sao */}
                      <td className="py-3 px-4">
                        <StarRatingDisplay rating={rev.rating} size="xs" showScore />
                      </td>

                      {/* Nội dung nhận xét rút gọn */}
                      <td className="py-3 px-4">
                        <p
                          className="text-xs text-gray-800 line-clamp-2 max-w-xs"
                          title={rev.content}
                        >
                          {rev.content}
                        </p>
                        {rev.adminReply?.content && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            ✓ Đã phản hồi
                          </span>
                        )}
                      </td>

                      {/* Ảnh thực tế */}
                      <td className="py-3 px-4">
                        {rev.images && rev.images.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={rev.images[0]}
                              alt="Thumbnail"
                              className="w-8 h-8 rounded object-cover border border-gray-200"
                            />
                            {rev.images.length > 1 && (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                                +{rev.images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Ngày gửi */}
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {formatDateTime(rev.createdAt)}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(rev.status)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        {/* Nút Duyệt nhanh nếu PENDING */}
                        {rev.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(rev._id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded transition-colors"
                            title="Duyệt công khai ngay"
                          >
                            Duyệt
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedReview(rev)}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-black text-white text-[11px] font-bold rounded transition-colors"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PHÂN TRANG */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Hiển thị trang {pagination.page} trên tổng số {pagination.totalPages} trang ({pagination.total} đánh giá)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold disabled:opacity-50 hover:bg-white transition-colors"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold disabled:opacity-50 hover:bg-white transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT & KIỂM DUYỆT */}
      {selectedReview && (
        <ReviewDetailModal
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          review={selectedReview}
          onActionCompleted={(updatedRev) => {
            setSelectedReview(null);
            fetchReviews();
          }}
        />
      )}
    </div>
  );
};

export default ReviewsPage;
