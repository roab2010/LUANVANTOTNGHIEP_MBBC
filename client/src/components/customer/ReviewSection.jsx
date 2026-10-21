import React, { useState, useEffect, useCallback } from 'react';
import StarRatingDisplay from '../common/StarRatingDisplay';
import ReviewFormModal from './ReviewFormModal';
import { getPublicReviews, checkReviewEligibility } from '../../services/reviewApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getVariantColorHex } from '../VariantSelect';
import mbbcLogo from '../../assets/logo MBBC.png';

// Format ngày tháng tiếng Việt
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const ReviewSection = ({ productId, productName, productCategory, productImage }) => {
  const { user } = useAuth();
  const { showToast } = useCart();

  // Dữ liệu đánh giá từ API công khai
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    ratingAverage: 0,
    reviewCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    hasImagesCount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Bộ lọc & Sắp xếp
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL'); // 'ALL' | '5' | '4' | '3' | '2' | '1'
  const [filterHasImage, setFilterHasImage] = useState(false);
  const [sortOption, setSortOption] = useState('latest'); // 'latest' | 'oldest' | 'highest' | 'lowest'

  // Modal gửi đánh giá
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [eligibilityChecking, setEligibilityChecking] = useState(false);
  const [eligibilityModalInfo, setEligibilityModalInfo] = useState(null); // { title, message }

  // Lightbox xem ảnh lớn
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // Tải danh sách đánh giá công khai
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortOption,
      };

      if (selectedRatingFilter !== 'ALL') {
        params.rating = selectedRatingFilter;
      }

      if (filterHasImage) {
        params.hasImage = true;
      }

      const res = await getPublicReviews(productId, params);
      if (res.data?.success && res.data.data) {
        setReviews(res.data.data.reviews || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
        if (res.data.data.pagination) {
          setPagination(res.data.data.pagination);
        }
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, pagination.page, pagination.limit, selectedRatingFilter, filterHasImage, sortOption]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Kiểm tra điều kiện khi khách bấm "VIẾT ĐÁNH GIÁ"
  const handleOpenWriteReview = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để gửi đánh giá sản phẩm');
      return;
    }

    setEligibilityChecking(true);
    try {
      const res = await checkReviewEligibility(productId);
      if (res.data?.success && res.data.data) {
        const { eligible, reason, orders } = res.data.data;
        if (eligible && Array.isArray(orders) && orders.length > 0) {
          setEligibleOrders(orders);
          setIsFormModalOpen(true);
        } else {
          setEligibilityModalInfo({
            title: 'CHƯA ĐỦ ĐIỀU KIỆN ĐÁNH GIÁ',
            message: reason || 'Chỉ khách hàng đã mua sản phẩm này và nhận hàng thành công mới có thể gửi đánh giá.',
          });
        }
      }
    } catch (err) {
      console.error('Lỗi kiểm tra điều kiện đánh giá:', err);
      const errMsg = err.response?.data?.message || 'Không thể kiểm tra điều kiện đánh giá vào lúc này';
      setEligibilityModalInfo({
        title: 'THÔNG BÁO',
        message: errMsg,
      });
    } finally {
      setEligibilityChecking(false);
    }
  };

  // Tính % cho progress bar của từng mức sao
  const getPercentage = (count) => {
    if (!stats.reviewCount || stats.reviewCount === 0) return 0;
    return Math.round((count / stats.reviewCount) * 100);
  };

  return (
    <section id="reviews-section" className="mt-20 pt-16 border-t border-neutral-200 font-['Montserrat',sans-serif]">
      {/* TIÊU ĐỀ SECTION */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10 pb-4 border-b border-neutral-200">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase mb-1">
            CUSTOMER FEEDBACK
          </p>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950">
            ĐÁNH GIÁ SẢN PHẨM ({stats.reviewCount})
          </h2>
        </div>

        {/* Nút Viết đánh giá */}
        <button
          type="button"
          onClick={handleOpenWriteReview}
          disabled={eligibilityChecking}
          className="px-6 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-[0.15em] transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          {eligibilityChecking && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <span>{eligibilityChecking ? 'ĐANG KIỂM TRA...' : 'VIẾT ĐÁNH GIÁ'}</span>
        </button>
      </div>

      {/* TỔNG QUAN ĐIỂM SỐ & PHÂN BỐ SAO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-6 sm:p-8 bg-neutral-50/70 border border-neutral-200 mb-10">
        {/* Điểm trung bình lớn (Col 1-4) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-neutral-200 pb-6 md:pb-0 md:pr-8">
          <div className="text-5xl sm:text-6xl font-black font-mono text-neutral-950 tracking-tight mb-2">
            {stats.ratingAverage > 0 ? stats.ratingAverage.toFixed(1) : '0.0'}
          </div>
          <StarRatingDisplay rating={stats.ratingAverage} size="lg" />
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-2.5">
            Dựa trên {stats.reviewCount} đánh giá đã xác thực
          </p>
        </div>

        {/* Phân bố từng mức sao (Col 5-12) */}
        <div className="md:col-span-8 space-y-2.5">
          {[5, 4, 3, 2, 1].map((starLevel) => {
            const count = stats.distribution?.[starLevel] || 0;
            const percent = getPercentage(count);
            const isFilterActive = selectedRatingFilter === String(starLevel);

            return (
              <button
                key={starLevel}
                type="button"
                onClick={() => {
                  setSelectedRatingFilter(isFilterActive ? 'ALL' : String(starLevel));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`w-full flex items-center gap-3 text-xs group text-left transition-colors p-1 rounded ${
                  isFilterActive ? 'bg-neutral-200/60 font-bold' : 'hover:bg-neutral-100/60'
                }`}
              >
                <span className="w-12 font-bold text-neutral-700 flex items-center gap-1 shrink-0 text-[11px]">
                  <span>{starLevel} sao</span>
                  <span className="text-amber-500">★</span>
                </span>

                <div className="flex-1 h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <span className="w-10 text-right font-mono text-[11px] text-neutral-500 group-hover:text-black shrink-0">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* THANH BỘ LỌC & SẮP XẾP */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-neutral-100 text-xs">
        {/* Chips lọc sao */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1">
            LỌC THEO:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedRatingFilter('ALL');
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] border transition-colors ${
              selectedRatingFilter === 'ALL'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
            }`}
          >
            TẤT CẢ ({stats.reviewCount})
          </button>

          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSelectedRatingFilter(String(s));
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-2.5 py-1.5 font-bold uppercase tracking-wider text-[11px] border transition-colors flex items-center gap-1 ${
                selectedRatingFilter === String(s)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
              }`}
            >
              <span>{s}</span>
              <span className="text-amber-400">★</span>
              <span className="text-[10px] opacity-70">({stats.distribution?.[s] || 0})</span>
            </button>
          ))}

          {/* Lọc có ảnh */}
          <button
            type="button"
            onClick={() => {
              setFilterHasImage(!filterHasImage);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] border transition-colors flex items-center gap-1.5 ${
              filterHasImage
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
            }`}
          >
            <span>Có hình ảnh</span>
            <span className="text-[10px] opacity-70">({stats.hasImagesCount || 0})</span>
          </button>
        </div>

        {/* Dropdown sắp xếp */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            SẮP XẾP:
          </span>
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="border border-neutral-200 bg-white text-xs font-semibold px-2.5 py-1.5 text-neutral-900 focus:outline-none focus:border-black uppercase"
          >
            <option value="latest">MỚI NHẤT</option>
            <option value="oldest">CŨ NHẤT</option>
            <option value="highest">ĐIỂM CAO NHẤT</option>
            <option value="lowest">ĐIỂM THẤP NHẤT</option>
          </select>
        </div>
      </div>

      {/* DANH SÁCH ĐÁNH GIÁ */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400 space-y-3">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải đánh giá...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-200 p-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            {selectedRatingFilter !== 'ALL' || filterHasImage
              ? 'KHÔNG CÓ ĐÁNH GIÁ PHÙ HỢP BỘ LỌC'
              : 'CHƯA CÓ ĐÁNH GIÁ NÀO CHO SẢN PHẨM NÀY'}
          </p>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {selectedRatingFilter !== 'ALL' || filterHasImage
              ? 'Hãy thử thay đổi hoặc xóa bộ lọc để xem các đánh giá khác.'
              : 'Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận về sản phẩm này sau khi mua hàng!'}
          </p>
          {(selectedRatingFilter !== 'ALL' || filterHasImage) && (
            <button
              type="button"
              onClick={() => {
                setSelectedRatingFilter('ALL');
                setFilterHasImage(false);
              }}
              className="mt-2 px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black"
            >
              XÓA BỘ LỌC
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-neutral-200">
          {reviews.map((rev) => (
            <article key={rev._id} className="py-7 space-y-3.5 first:pt-0">
              {/* Header của từng đánh giá: Tên khách + Ngày + Huy hiệu */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase">
                    {rev.customerName?.slice(0, 1) || 'M'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-neutral-900">{rev.customerName}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider rounded">
                        ✓ ĐÃ MUA TẠI MBBC
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {formatDate(rev.createdAt)}
                      {rev.isEdited && ' • Đã chỉnh sửa'}
                    </span>
                  </div>
                </div>

                {/* Sao đánh giá */}
                <StarRatingDisplay rating={rev.rating} size="sm" showScore />
              </div>

              {/* Thông tin biến thể đã mua (Size & Màu sắc) */}
              {(rev.variant?.size || rev.variant?.color) && (
                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400">
                    Phân loại:
                  </span>
                  {rev.variant.size && (
                    <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold rounded border border-neutral-200">
                      Size: {rev.variant.size}
                    </span>
                  )}
                  {rev.variant.color && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-bold rounded border border-neutral-200">
                      <span
                        className="w-2 h-2 rounded-full border border-neutral-300"
                        style={{ backgroundColor: getVariantColorHex(rev.variant.color) }}
                      />
                      <span>Màu: {rev.variant.color}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Nội dung nhận xét */}
              <p className="text-xs text-neutral-800 leading-relaxed font-normal whitespace-pre-line">
                {rev.content}
              </p>

              {/* Ảnh thực tế đính kèm */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {rev.images.map((imgUrl, imgIdx) => (
                    <button
                      key={imgIdx}
                      type="button"
                      onClick={() => setActiveLightboxImg(imgUrl)}
                      className="w-18 h-18 sm:w-20 sm:h-20 border border-neutral-200 bg-neutral-100 overflow-hidden hover:opacity-90 transition-opacity shrink-0"
                    >
                      <img src={imgUrl} alt="Ảnh thực tế khách chụp" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Phản hồi chính thức từ MBBC/Admin */}
              {rev.adminReply && rev.adminReply.content && (
                <div className="mt-4 p-4 bg-neutral-100/80 border-l-2 border-black space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={mbbcLogo} alt="MBBC" className="h-3.5 w-auto object-contain" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-black">
                        Phản hồi từ M.B.B.C
                      </span>
                    </div>
                    {rev.adminReply.repliedAt && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {formatDate(rev.adminReply.repliedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-700 leading-relaxed italic">
                    "{rev.adminReply.content}"
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* PHÂN TRANG */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            className="px-3 py-1.5 border border-neutral-300 text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:border-black transition-colors"
          >
            TRƯỚC
          </button>
          <span className="px-3 py-1.5 text-xs font-mono font-bold text-neutral-700">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="px-3 py-1.5 border border-neutral-300 text-xs font-bold uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:border-black transition-colors"
          >
            SAU
          </button>
        </div>
      )}

      {/* MODAL GỬI ĐÁNH GIÁ */}
      <ReviewFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        product={{ _id: productId, name: productName, category: productCategory, image: productImage }}
        eligibleOrders={eligibleOrders}
        onSuccess={() => {
          showToast('Đánh giá của bạn đã được gửi thành công và đang chờ Admin duyệt!');
          fetchReviews();
        }}
      />

      {/* MODAL GIẢI THÍCH ĐIỀU KIỆN ĐÁNH GIÁ (NẾU CHƯA ĐỦ ĐIỀU KIỆN) */}
      {eligibilityModalInfo && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setEligibilityModalInfo(null)}
          />
          <div className="relative bg-white text-black max-w-md w-full p-6 z-10 shadow-2xl border border-neutral-200 animate-scale-in text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-black text-sm">
              !
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-900">
              {eligibilityModalInfo.title}
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {eligibilityModalInfo.message}
            </p>
            <button
              type="button"
              onClick={() => setEligibilityModalInfo(null)}
              className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors w-full"
            >
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHÓNG TO ẢNH THỰC TẾ */}
      {activeLightboxImg && (
        <div
          className="fixed inset-0 z-90 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeLightboxImg}
              alt="Ảnh phóng to"
              className="w-full h-full object-contain max-h-[85vh] border border-neutral-800"
            />
            <button
              type="button"
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReviewSection;
