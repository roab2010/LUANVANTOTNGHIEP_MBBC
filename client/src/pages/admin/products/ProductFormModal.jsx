import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../../../services/productApi';
import { getCategories } from '../../../services/categoryApi';

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

const ImageIcon = () => (
  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

// ============================================
// PRODUCT FORM MODAL COMPONENT
// ============================================
const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const isEditing = !!product;

  // State form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    costPrice: '',
    profitMargin: '',
    stock: '',
    unit: 'cái',
    category: '',
    status: 'active',
  });
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);

  // Lấy danh sách danh mục active khi mở modal
  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        const res = await getCategories({ status: 'active', limit: 100 });
        if (res?.data?.data?.categories) {
          setActiveCategories(res.data.data.categories);
        }
      } catch {
        // Nếu không lấy được danh mục, cho phép để trống
        setActiveCategories([]);
      }
    };
    fetchActiveCategories();
  }, []);

  // Load dữ liệu khi chỉnh sửa
  useEffect(() => {
    if (product) {
      const cost = product.costPrice || 0;
      const price = product.price || 0;
      let margin = '';
      if (cost > 0) {
        margin = (((price - cost) / cost) * 100).toFixed(2);
        // Remove trailing zeroes if it's a whole number
        margin = parseFloat(margin).toString();
      } else if (cost === 0 && price > 0) {
         margin = '100'; 
      }

      setFormData({
        name: product.name || '',
        description: product.description || '',
        costPrice: cost.toString() || '',
        profitMargin: margin,
        stock: product.stock?.toString() || '',
        unit: product.unit || 'cái',
        category: product.category || '',
        status: product.status || 'active',
      });

      setImagePreview(product.image || '');
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [product]);

  // Derived price
  const cost = Number(formData.costPrice) || 0;
  const margin = Number(formData.profitMargin) || 0;
  const calculatedPrice = cost + (cost * margin) / 100;

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Image handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa là 5MB');
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ các định dạng: JPG, JPEG, PNG, WEBP');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(true);
    // Reset file input value
    const fileInput = document.getElementById('pf-image');
    if (fileInput) fileInput.value = '';
  };

  // Validate form phía frontend
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return false;
    }
    
    const costPriceNum = Number(formData.costPrice);
    if (formData.costPrice === '' || costPriceNum < 10000 || costPriceNum > 1000000000) {
      setError('Giá nhập phải từ 10,000 đến 1,000,000,000 ₫');
      return false;
    }

    const profitMarginNum = Number(formData.profitMargin);
    if (formData.profitMargin === '' || profitMarginNum < 0 || profitMarginNum > 1000) {
      setError('Phần trăm lợi nhuận phải từ 0 đến 1000%');
      return false;
    }

    if (formData.stock && Number(formData.stock) < 0) {
      setError('Số lượng không được âm');
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
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('description', formData.description.trim());
      payload.append('price', calculatedPrice);
      payload.append('costPrice', cost);
      payload.append('stock', formData.stock ? Number(formData.stock) : 0);
      payload.append('unit', formData.unit.trim() || 'cái');
      payload.append('category', formData.category.trim());
      payload.append('status', isEditing ? formData.status : 'active');
      
      if (imageFile) {
        payload.append('image', imageFile);
      } else if (removeImage) {
        payload.append('removeImage', 'true');
      }

      if (isEditing) {
        await updateProduct(product._id, payload);
      } else {
        await createProduct(payload);
      }

      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || (isEditing ? 'Cập nhật thất bại' : 'Tạo sản phẩm thất bại');
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
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
          
          {/* Tên sản phẩm */}
          <div>
            <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên sản phẩm <span className="text-danger-500">*</span>
            </label>
            <input
              id="pf-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên sản phẩm"
              autoFocus
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
            />
          </div>

          {/* Ảnh sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ảnh sản phẩm
            </label>
            <div className="flex items-start gap-4">
              {/* Preview Box */}
              <div className="shrink-0 w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh"
                    >
                      <TrashIcon className="w-5 h-5 text-white" />
                    </button>
                  </>
                ) : (
                  <ImageIcon />
                )}
              </div>
              
              {/* Upload Input */}
              <div className="flex-1 pt-1">
                <input
                  type="file"
                  id="pf-image"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="pf-image"
                  className="inline-flex items-center gap-2 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <UploadIcon />
                  Chọn ảnh từ máy tính
                </label>
                <p className="mt-2 text-xs text-gray-400">
                  Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="pf-description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Mô tả
            </label>
            <textarea
              id="pf-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về sản phẩm"
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 resize-none"
            />
          </div>

          {/* Giá nhập + Phần trăm lợi nhuận */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-costPrice" className="block text-sm font-medium text-gray-700 mb-1.5">
                Giá nhập (₫) <span className="text-danger-500">*</span>
              </label>
              <input
                id="pf-costPrice"
                name="costPrice"
                type="number"
                min="10000"
                max="1000000000"
                value={formData.costPrice}
                onChange={handleChange}
                placeholder="0"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="pf-profitMargin" className="block text-sm font-medium text-gray-700 mb-1.5">
                Lợi nhuận (%) <span className="text-danger-500">*</span>
              </label>
              <input
                id="pf-profitMargin"
                name="profitMargin"
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={formData.profitMargin}
                onChange={handleChange}
                placeholder="Ví dụ: 20"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>
          </div>

          {/* Giá bán preview */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Giá bán dự kiến:</span>
            <span className="text-lg font-bold text-teal-600">{formatCurrency(calculatedPrice)}</span>
          </div>

          {/* Số lượng + Đơn vị */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-stock" className="block text-sm font-medium text-gray-700 mb-1.5">
                Số lượng
              </label>
              <input
                id="pf-stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="pf-unit" className="block text-sm font-medium text-gray-700 mb-1.5">
                Đơn vị tính
              </label>
              <input
                id="pf-unit"
                name="unit"
                type="text"
                value={formData.unit}
                onChange={handleChange}
                placeholder="cái, hộp, kg..."
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              />
            </div>
          </div>

          {/* Danh mục + Trạng thái */}
          <div className="grid grid-cols-2 gap-4">
            <div className={!isEditing ? "col-span-2" : ""}>
              <label htmlFor="pf-category" className="block text-sm font-medium text-gray-700 mb-1.5">
                Danh mục
              </label>
              <select
                id="pf-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
              >
                <option value="">— Chọn danh mục —</option>
                {activeCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {isEditing && (
              <div>
                <label htmlFor="pf-status" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trạng thái
                </label>
                <select
                  id="pf-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200"
                >
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div>
            )}
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
                'Tạo sản phẩm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
