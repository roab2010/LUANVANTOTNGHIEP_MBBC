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

// ============================================
// DANH MỤC QUẦN ÁO / THỜI TRANG PRESET
// ============================================
const CLOTHING_CATEGORIES = [
  'Áo thun',
  'Áo sơ mi',
  'Áo khoác',
  'Áo len & Hoodie',
  'Áo polo',
  'Quần jean',
  'Quần tây & Quần âu',
  'Quần short',
  'Quần kaki & Jogger',
  'Đồ bộ & Đồ mặc nhà',
  'Đồ thể thao',
  'Giày dép',
  'Túi xách & Balo',
  'Phụ kiện thời trang',
  
];

// ============================================
// CATEGORY FORM MODAL COMPONENT
// ============================================
const CategoryFormModal = ({ category, onClose, onSuccess }) => {
  const isEditing = !!category;

  // State form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        status: category.status || 'active',
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
    if (!formData.name.trim()) {
      setError('Vui lòng chọn tên danh mục');
      return false;
    }
    if (formData.name.trim().length > 100) {
      setError('Tên danh mục không được vượt quá 100 ký tự');
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
        status: isEditing ? formData.status : 'active',
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
            <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên danh mục <span className="text-danger-500">*</span>
            </label>
            <select
              id="cf-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoFocus
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            >
              <option value="">-- Chọn danh mục quần áo --</option>
              {CLOTHING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {formData.name && !CLOTHING_CATEGORIES.includes(formData.name) && (
                <option value={formData.name}>{formData.name}</option>
              )}
            </select>
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="cf-description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              id="cf-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về danh mục này (không bắt buộc)"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 resize-none"
            />
          </div>

          {/* Trạng thái (chỉ hiển thị khi chỉnh sửa) */}
          {isEditing && (
            <div>
              <label htmlFor="cf-status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trạng thái
              </label>
              <select
                id="cf-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
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
