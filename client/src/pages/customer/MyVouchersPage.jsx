import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getMySavedPromotions, unsavePromotion } from '../../services/promotionApi';
import StoreHeader from '../../components/common/StoreHeader';
import StoreModals from '../../components/common/StoreModals';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

const MyVouchersPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setIsCartOpen, showToast } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('usable'); // usable | used | expired
  const [vouchersData, setVouchersData] = useState({ usable: [], used: [], expired: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchSavedVouchers = async () => {
    setLoading(true);
    try {
      const res = await getMySavedPromotions();
      if (res.data?.success) {
        setVouchersData(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải kho voucher:', err);
      showToast('Không thể tải kho voucher cá nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else {
        fetchSavedVouchers();
      }
    }
  }, [isAuthenticated, authLoading]);

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleUseNow = (promo) => {
    // Điều hướng vào giỏ hàng và sao chép mã
    if (promo.code) {
      navigator.clipboard.writeText(promo.code);
      // Lưu vào sessionStorage để modal checkout tự động điền nếu cần
      sessionStorage.setItem('mbbc_applied_promo_code', promo.code);
      showToast(`Đã sao chép mã "${promo.code}". Đang mở giỏ hàng...`);
    } else {
      showToast(`Đã chọn ưu đãi "${promo.name}"`);
    }
    setIsCartOpen(true);
  };

  const handleUnsave = async (promoId) => {
    try {
      const res = await unsavePromotion(promoId);
      if (res.data?.success) {
        showToast('Đã xóa voucher khỏi kho ưu đãi');
        fetchSavedVouchers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể bỏ lưu voucher');
    }
  };

  const currentList = vouchersData[activeTab] || [];

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-['Montserrat',sans-serif]">
      <StoreHeader />
      <StoreModals />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* TIÊU ĐỀ TRANG */}
        <div className="border-b border-neutral-200 pb-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-red-600 uppercase block mb-1">
              TÀI KHOẢN CÁ NHÂN
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              KHO VOUCHER CỦA TÔI
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Quản lý các mã giảm giá và ưu đãi đã lưu trong tài khoản của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/promotions')}
            className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded transition-colors self-start sm:self-auto"
          >
            + Khám phá thêm ưu đãi
          </button>
        </div>

        {/* 3 TABS PHÂN NHÓM VOUCHER */}
        <div className="flex border-b border-neutral-200 mb-6 bg-white rounded-t">
          <button
            type="button"
            onClick={() => setActiveTab('usable')}
            className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-colors border-b-2 text-center flex items-center justify-center gap-2 ${
              activeTab === 'usable'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <span>Có thể sử dụng</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'usable' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {vouchersData.usable.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('used')}
            className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-colors border-b-2 text-center flex items-center justify-center gap-2 ${
              activeTab === 'used'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <span>Đã sử dụng</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'used' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {vouchersData.used.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expired')}
            className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-colors border-b-2 text-center flex items-center justify-center gap-2 ${
              activeTab === 'expired'
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <span>Đã hết hạn</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'expired' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'}`}>
              {vouchersData.expired.length}
            </span>
          </button>
        </div>

        {/* DANH SÁCH VOUCHER THEO TAB */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-neutral-300 border-t-black rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase">ĐANG TẢI KHO VOUCHER...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded p-12 text-center">
            <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800">
              {activeTab === 'usable'
                ? 'BẠN CHƯA CÓ VOUCHER NÀO TRONG KHO'
                : activeTab === 'used'
                ? 'CHƯA CÓ VOUCHER NÀO ĐÃ SỬ DỤNG'
                : 'KHÔNG CÓ VOUCHER NÀO HẾT HẠN'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'usable'
                ? 'Hãy truy cập Trung tâm ưu đãi để khám phá và lưu những mã giảm giá hot nhất cho đơn hàng của bạn.'
                : 'Các ưu đãi khi sử dụng hoặc hết hạn sẽ được lưu giữ tại đây để bạn tiện theo dõi lịch sử.'}
            </p>
            {activeTab === 'usable' && (
              <button
                type="button"
                onClick={() => navigate('/promotions')}
                className="mt-4 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition-colors rounded"
              >
                ĐẾN TRUNG TÂM ƯU ĐÃI
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentList.map((promo) => {
              const isUsableTab = activeTab === 'usable';
              const discountText =
                promo.discountType === 'percentage'
                  ? `GIẢM ${promo.discountValue}%`
                  : `GIẢM ${formatCurrency(promo.discountValue)}`;

              return (
                <div
                  key={promo._id}
                  className={`bg-white border rounded p-4 sm:p-5 flex flex-col justify-between transition-shadow relative ${
                    isUsableTab ? 'border-neutral-200 hover:shadow-md' : 'border-neutral-200 bg-neutral-50/60 opacity-80'
                  }`}
                >
                  <div>
                    {/* Header voucher */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {promo.type === 'voucher' ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase tracking-wider rounded">
                            Voucher
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider rounded">
                            Tự động
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                          {promo.scope === 'product' ? 'Theo sản phẩm' : 'Toàn đơn hàng'}
                        </span>
                      </div>

                      {/* Nút xóa khỏi kho */}
                      <button
                        type="button"
                        onClick={() => handleUnsave(promo._id)}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Bỏ lưu khỏi kho"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <h3 className="text-xl font-black text-neutral-900 tracking-tight leading-snug">
                      {discountText}
                    </h3>

                    <p className="text-xs font-bold text-neutral-700 mt-1 line-clamp-1" title={promo.name}>
                      {promo.name}
                    </p>

                    {/* Mã code */}
                    {promo.code && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-widest bg-purple-50 text-purple-700 px-2 py-1 border border-purple-200 rounded">
                          {promo.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(promo.code)}
                          className="text-[10px] font-bold text-neutral-600 hover:text-black uppercase underline tracking-wider"
                        >
                          {copiedCode === promo.code ? 'ĐÃ SAO CHÉP' : 'Sao chép'}
                        </button>
                      </div>
                    )}

                    {/* Điều kiện */}
                    <div className="mt-3 text-[11px] text-neutral-500 space-y-0.5 font-medium border-t border-neutral-100 pt-2.5">
                      {promo.minOrderValue > 0 && (
                        <p>• Đơn tối thiểu: <span className="font-bold text-neutral-800">{formatCurrency(promo.minOrderValue)}</span></p>
                      )}
                      {promo.discountType === 'percentage' && promo.maxDiscount && (
                        <p>• Giảm tối đa: <span className="font-bold text-neutral-800">{formatCurrency(promo.maxDiscount)}</span></p>
                      )}
                      <p>
                        • Hạn dùng: <span className="font-semibold text-neutral-700">{new Date(promo.endAt).toLocaleDateString('vi-VN')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Chân thẻ voucher */}
                  <div className="pt-3 mt-3 border-t border-dashed border-neutral-200 flex items-center justify-between">
                    <div>
                      {isUsableTab ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Có thể dùng
                        </span>
                      ) : activeTab === 'used' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Đã dùng vào {promo.lastUsedAt ? new Date(promo.lastUsedAt).toLocaleDateString('vi-VN') : 'đơn hàng'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                          Hết hiệu lực
                        </span>
                      )}
                    </div>

                    {isUsableTab && (
                      <button
                        type="button"
                        onClick={() => handleUseNow(promo)}
                        className="py-1.5 px-4 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded transition-colors"
                      >
                        Sử dụng ngay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyVouchersPage;

