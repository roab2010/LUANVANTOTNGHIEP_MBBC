import { useState, useEffect } from 'react';
import { createSupplier, updateSupplier } from '../../../services/supplierApi';

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
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const MAX_NAME = 100;
const MAX_PHONE = 11;
const MAX_ADDRESS = 200;
const MAX_NOTE = 300;

const SupplierFormModal = ({ supplier, onClose, onSuccess }) => {
  const isEditing = !!supplier;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: '',
    status: 'active',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        note: supplier.note || '',
        status: supplier.status || 'active',
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');

    // Giới hạn ký tự và chặn nhập thêm trực tiếp
    if (name === 'name') {
      if (value.length > MAX_NAME) return;
      setFormData((prev) => ({ ...prev, name: value }));
      return;
    }

    if (name === 'phone') {
      const cleanPhone = value.replace(/[^0-9]/g, '');
      if (cleanPhone.length > MAX_PHONE) return;
      setFormData((prev) => ({ ...prev, phone: cleanPhone }));
      return;
    }

    if (name === 'address') {
      if (value.length > MAX_ADDRESS) return;
      setFormData((prev) => ({ ...prev, address: value }));
      return;
    }

    if (name === 'note') {
      if (value.length > MAX_NOTE) return;
      setFormData((prev) => ({ ...prev, note: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập tên nhà cung cấp');
      return;
    }

    if (trimmedName.length > MAX_NAME) {
      setError(`Tên nhà cung cấp tối đa ${MAX_NAME} ký tự`);
      return;
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9]{9,11}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Số điện thoại không hợp lệ (phải gồm 9-11 chữ số)');
        return;
      }
    }

    if (formData.address.trim().length > MAX_ADDRESS) {
      setError(`Địa chỉ tối đa ${MAX_ADDRESS} ký tự`);
      return;
    }

    if (formData.note.trim().length > MAX_NOTE) {
      setError(`Ghi chú tối đa ${MAX_NOTE} ký tự`);
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await updateSupplier(supplier._id, formData);
      } else {
        await createSupplier(formData);
      }
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => !loading && onClose()} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-modal)] w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
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

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Tên nhà cung cấp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sf-name" className="block text-sm font-medium text-gray-700">
                Tên nhà cung cấp <span className="text-danger-500">*</span>
              </label>
              <span className="text-xs text-gray-400 tabular-nums font-mono">
                {formData.name.length}/{MAX_NAME}
              </span>
            </div>
            <input
              id="sf-name"
              name="name"
              type="text"
              maxLength={MAX_NAME}
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: Công ty TNHH May Mặc An Phú"
              autoFocus
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sf-phone" className="block text-sm font-medium text-gray-700">
                Số điện thoại liên hệ
              </label>
              <span className="text-xs text-gray-400 tabular-nums font-mono">
                {formData.phone.length}/{MAX_PHONE}
              </span>
            </div>
            <input
              id="sf-phone"
              name="phone"
              type="text"
              inputMode="numeric"
              maxLength={MAX_PHONE}
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ví dụ: 0912345678 (tối đa 11 số)"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sf-address" className="block text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <span className="text-xs text-gray-400 tabular-nums font-mono">
                {formData.address.length}/{MAX_ADDRESS}
              </span>
            </div>
            <input
              id="sf-address"
              name="address"
              type="text"
              maxLength={MAX_ADDRESS}
              value={formData.address}
              onChange={handleChange}
              placeholder="Ví dụ: 123 Đường Cộng Hòa, Q. Tân Bình, TP.HCM"
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sf-note" className="block text-sm font-medium text-gray-700">
                Ghi chú
              </label>
              <span className="text-xs text-gray-400 tabular-nums font-mono">
                {formData.note.length}/{MAX_NOTE}
              </span>
            </div>
            <textarea
              id="sf-note"
              name="note"
              rows={3}
              maxLength={MAX_NOTE}
              value={formData.note}
              onChange={handleChange}
              placeholder="Thông tin hàng hóa cung cấp, thời gian giao hàng, người đại diện..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 resize-none"
            />
          </div>

          {/* Trạng thái (khi sửa) */}
          {isEditing && (
            <div>
              <label htmlFor="sf-status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trạng thái hợp tác
              </label>
              <select
                id="sf-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              >
                <option value="active">Đang hợp tác</option>
                <option value="inactive">Ngừng hợp tác</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <SpinnerIcon />}
              {isEditing ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierFormModal;
