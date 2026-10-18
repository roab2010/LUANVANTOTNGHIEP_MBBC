import { useState, useEffect } from 'react';
import { createCategory, updateCategory } from '../../../services/categoryApi';

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

// Giới hạn ký tự danh mục
const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  DESC_MAX: 200,
};

// ============================================
// CATEGORY FORM MODAL COMPONENT
// ============================================
const CategoryFormModal = ({ category, existingCategories = [], onClose, onSuccess }) => {
  const isEditing = !!category;

  // State form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
      });
    }
  }, [category]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validate form phía frontend
  const validateForm = () => {
    const trimmed = formData.name.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên danh mục');
      return false;
    }
    if (trimmed.length < LIMITS.NAME_MIN || trimmed.length > LIMITS.NAME_MAX) {
      setError(`Tên danh mục phải có từ ${LIMITS.NAME_MIN} đến ${LIMITS.NAME_MAX} ký tự`);
      return false;
    }
    if (formData.description.trim().length > LIMITS.DESC_MAX) {
      setError(`Mô tả danh mục tối đa ${LIMITS.DESC_MAX} ký tự`);
      return false;
    }

    // Kiểm tra trùng tên (không phân biệt hoa/thường hoặc khoảng trắng thừa)
    const isDuplicate = (existingCategories || []).some((cat) => {
      if (isEditing && (cat._id === category._id || cat.id === category._id)) return false;
      return cat.name?.trim().toLowerCase() === trimmed.toLowerCase();
    });
    if (isDuplicate) {
      setError('Tên danh mục đã tồn tại');
      return false;
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
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (isEditing) {
        await updateCategory(category._id, payload);
      } else {
        await createCategory(payload);
      }

      onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (isEditing ? 'Cập nhật danh mục thất bại' : 'Tạo danh mục thất bại');
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
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới'}
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
          <div className="mx-6 mt-4 p-3 bg-danger-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
            <p className="text-sm text-danger-700 font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Tên danh mục */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700">
                Tên danh mục <span className="text-danger-500">*</span>
              </label>
              <span className={`text-xs tabular-nums ${formData.name.length > LIMITS.NAME_MAX ? 'text-danger-600 font-semibold' : 'text-gray-400'}`}>
                {formData.name.length}/{LIMITS.NAME_MAX}
              </span>
            </div>
            <input
              id="cf-name"
              name="name"
              type="text"
              maxLength={LIMITS.NAME_MAX}
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên danh mục (2 - 50 ký tự)..."
              autoFocus
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Mô tả */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cf-description" className="block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <span className={`text-xs tabular-nums ${formData.description.length > LIMITS.DESC_MAX ? 'text-danger-600 font-semibold' : 'text-gray-400'}`}>
                {formData.description.length}/{LIMITS.DESC_MAX}
              </span>
            </div>
            <textarea
              id="cf-description"
              name="description"
              maxLength={LIMITS.DESC_MAX}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về danh mục này (không bắt buộc, tối đa 200 ký tự)"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 resize-none"
            />
          </div>


          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center gap-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span>Đang lưu...</span>
                </>
              ) : isEditing ? (
                'Cập nhật'
              ) : (
                'Tạo danh mục'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
