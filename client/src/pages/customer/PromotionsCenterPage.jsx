import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getPublicPromotions, savePromotion } from '../../services/promotionApi';
import StoreHeader from '../../components/common/StoreHeader';
import StoreModals from '../../components/common/StoreModals';
import TearOffCoupon from '../../components/customer/TearOffCoupon';

const PromotionsCenterPage = () => {
  const { isAuthenticated } = useAuth();
  const { setIsCartOpen, showToast } = useCart();
  const navigate = useNavigate();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | voucher | automatic
  const [filterScope, setFilterScope] = useState('all'); // all | order | product
  const [search, setSearch] = useState('');

  const fetchPromotions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterScope !== 'all') params.scope = filterScope;
      if (search.trim()) params.search = search.trim();

      const res = await getPublicPromotions(params);
      if (res.data?.success) {
        setPromotions(res.data.data.promotions || []);
      } else {
        throw new Error(res.data?.message || 'Không thể tải danh sách ưu đãi');
      }
    } catch (err) {
      console.error('Lỗi tải ưu đãi:', err);
      setError('Đã xảy ra lỗi khi tải danh sách ưu đãi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [filterType, filterScope]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPromotions();
  };

  const handleSaveVoucher = async (promotionId) => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để lưu voucher vào Kho ưu đãi');
      navigate('/login');
      return;
    }

    try {
      const res = await savePromotion(promotionId);
      if (res.data?.success) {
        showToast('Đã lưu voucher vào Kho ưu đãi của bạn!');
        // Cập nhật trạng thái isSaved cục bộ
        setPromotions((prev) =>
          prev.map((p) => (p._id === promotionId ? { ...p, isSaved: true } : p))
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể lưu voucher');
    }
  };

  const handleUseNow = (promo) => {
    // Mở giỏ hàng hoặc dẫn đến cửa hàng
    showToast(`Đã chọn ưu đãi: ${promo.name}`);
    setIsCartOpen(true);
  };

  const handleRequireLogin = () => {
    showToast('Vui lòng đăng nhập để lưu ưu đãi vào tài khoản');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-['Montserrat',sans-serif]">
      <StoreHeader />
      <StoreModals />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* BANNER HEADER */}
        <div className="bg-black text-white p-8 sm:p-12 mb-8 relative overflow-hidden rounded-xs">
          <div className="relative z-10 max-w-2xl">
            <span className="text-[11px] font-black tracking-[0.25em] text-red-500 uppercase block mb-2">
              M.B.B.C OFFERS & REWARDS
            </span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight">
              KHO ƯU ĐÃI & VOUCHER MBBC
            </h1>
            <p className="text-sm text-neutral-400 mt-2 font-medium">
              Khám phá và nhận ngay các mã giảm giá hấp dẫn dành riêng cho bộ sưu tập thời trang đường phố M.B.B.C.
            </p>

            {isAuthenticated && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/my-vouchers')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                >
                  <span>Kho voucher của tôi &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div className="bg-white p-4 sm:p-5 border border-neutral-200 mb-8 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="flex flex-wrap gap-2">
            {/* Filter Type */}
            <div className="flex rounded border border-neutral-200 overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-2 ${filterType === 'all' ? 'bg-black text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterType('voucher')}
                className={`px-3 py-2 border-l border-neutral-200 ${filterType === 'voucher' ? 'bg-black text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                Mã Voucher
              </button>
              <button
                type="button"
                onClick={() => setFilterType('automatic')}
                className={`px-3 py-2 border-l border-neutral-200 ${filterType === 'automatic' ? 'bg-black text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                Giảm tự động
              </button>
            </div>

            {/* Filter Scope */}
            <div className="flex rounded border border-neutral-200 overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`px-3 py-2 ${filterScope === 'all' ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                Tất cả phạm vi
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('order')}
                className={`px-3 py-2 border-l border-neutral-200 ${filterScope === 'order' ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                Theo đơn hàng
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('product')}
                className={`px-3 py-2 border-l border-neutral-200 ${filterScope === 'product' ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                Theo sản phẩm
              </button>
            </div>
          </div>

          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã voucher..."
              className="h-9 px-3 border border-neutral-300 text-xs rounded focus:outline-none focus:border-black min-w-[220px]"
            />
            <button
              type="submit"
              className="px-4 h-9 bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 rounded transition-colors"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* NỘI DUNG VOUCHER */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-neutral-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase">ĐANG TẢI KHO ƯU ĐÃI...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white border border-red-200 text-red-600 rounded">
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchPromotions}
              className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded"
            >
              Thử lại
            </button>
          </div>
        ) : promotions.length === 0 ? (
          <div className="py-20 text-center bg-white border border-neutral-200 rounded p-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-neutral-800">
              CHƯA CÓ ƯU ĐÃI NÀO PHÙ HỢP
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Hiện tại không có chương trình khuyến mãi nào khả dụng theo bộ lọc đã chọn. Hãy quay lại sau nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {promotions.map((promo) => (
              <div key={promo._id} className="flex justify-center h-full">
                <TearOffCoupon
                  promotion={promo}
                  isLoggedIn={isAuthenticated}
                  onSave={handleSaveVoucher}
                  onUseNow={handleUseNow}
                  onRequireLogin={handleRequireLogin}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PromotionsCenterPage;
