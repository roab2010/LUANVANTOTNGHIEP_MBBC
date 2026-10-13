import { useState, useEffect } from 'react';
import { updateCustomer } from '../../../services/customerApi';

// ============================================
// ICON COMPONENTS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

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

// ============================================
// CUSTOMER FORM MODAL COMPONENT (XEM & CẬP NHẬT)
// ============================================
const CustomerFormModal = ({ customer, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    status: 'active',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        status: customer.status || 'active',
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ tên khách hàng');
      return;
    }

    setLoading(true);
    try {
      await updateCustomer(customer._id, {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
      });

      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'Cập nhật thông tin thất bại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !loading && onClose()} />

      {/* Modal */}
      <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Chi tiết tài khoản khách hàng</h2>
            <p className="text-xs text-gray-500">Đăng ký ngày: {formatDate(customer?.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-danger-50 border border-red-200 rounded-lg text-sm text-danger-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email tài khoản (Chỉ xem) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Email đăng nhập (Cố định)
            </label>
            <input
              type="text"
              value={customer?.email || ''}
              disabled
              className="w-full h-10 px-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Tài khoản được khách hàng đăng ký trực tiếp trên hệ thống</p>
          </div>

          {/* Họ tên */}
          <div>
            <label htmlFor="cust-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Họ tên khách hàng <span className="text-danger-500">*</span>
            </label>
            <input
              id="cust-name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn An"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label htmlFor="cust-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại
            </label>
            <input
              id="cust-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15"
            />
          </div>

          {/* Trạng thái tài khoản */}
          <div>
            <label htmlFor="cust-status" className="block text-sm font-medium text-gray-700 mb-1.5">
              Trạng thái tài khoản
            </label>
            <select
              id="cust-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15"
            >
              <option value="active">Đang hoạt động (Bình thường)</option>
              <option value="blocked">Đã bị khóa (Không thể đăng nhập)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <SpinnerIcon />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
