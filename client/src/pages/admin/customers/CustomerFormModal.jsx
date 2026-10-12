import { useState, useEffect } from 'react';
import { createCustomer, updateCustomer } from '../../../services/customerApi';

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

// ============================================
// CUSTOMER FORM MODAL COMPONENT
// ============================================
const CustomerFormModal = ({ customer, onClose, onSuccess }) => {
  const isEditing = !!customer;

  // State form
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    gender: 'female',
    notes: '',
    status: 'active',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        gender: customer.gender || 'female',
        notes: customer.notes || '',
        status: customer.status || 'active',
      });
    }
  }, [customer]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validate form phía frontend
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ tên khách hàng');
      return false;
    }

    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return false;
    }

    // Validate định dạng SĐT Việt Nam (10 số, bắt đầu 0)
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError('Số điện thoại không hợp lệ (Ví dụ: 0912345678)');
      return false;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Địa chỉ email không hợp lệ');
        return false;
      }
    }

    return true;
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gender: formData.gender,
        notes: formData.notes.trim(),
        status: isEditing ? formData.status : 'active',
      };

      if (isEditing) {
        await updateCustomer(customer._id, payload);
      } else {
        await createCustomer(payload);
      }

      onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (isEditing ? 'Cập nhật khách hàng thất bại' : 'Tạo khách hàng thất bại');
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
      <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Sửa thông tin khách hàng' : 'Thêm khách hàng mới'}
          </h2>
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
          <div className="mx-6 mt-4 p-3 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="Ví dụ: Nguyễn Văn An"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* SĐT & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cust-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Số điện thoại <span className="text-danger-500">*</span>
              </label>
              <input
                id="cust-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="cust-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="cust-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="khachhang@gmail.com"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>
          </div>

          {/* Giới tính */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Giới tính
            </label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Nữ
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Nam
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={handleChange}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Khác
              </label>
            </div>
          </div>

          {/* Địa chỉ */}
          <div>
            <label htmlFor="cust-address" className="block text-sm font-medium text-gray-700 mb-1.5">
              Địa chỉ
            </label>
            <input
              id="cust-address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label htmlFor="cust-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
              Ghi chú
            </label>
            <textarea
              id="cust-notes"
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Thông tin size thường mặc, lưu ý giao hàng..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 resize-none"
            />
          </div>

          {/* Trạng thái (chỉ hiện khi chỉnh sửa) */}
          {isEditing && (
            <div>
              <label htmlFor="cust-status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trạng thái
              </label>
              <select
                id="cust-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              >
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <SpinnerIcon />}
              {isEditing ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
