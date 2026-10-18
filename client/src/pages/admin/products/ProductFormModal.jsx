import { useState, useEffect } from 'react';
import { createProduct, updateProduct, getProducts } from '../../../services/productApi';
import { getCategories } from '../../../services/categoryApi';
import { getSuppliers } from '../../../services/supplierApi';

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

const LockIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0);
};

// Cấu hình giới hạn chuẩn của hệ thống
const LIMITS = {
  COST_PRICE_MIN: 10000,
  COST_PRICE_MAX: 10000000, // Giới hạn 10 triệu theo yêu cầu
  PROFIT_MARGIN_MIN: 0,
  PROFIT_MARGIN_MAX: 1000,   // Tối đa 1.000%
  STOCK_MIN: 0,
  STOCK_MAX: 10000,         // Tối đa 10.000 sản phẩm
  UNIT_MAX_LENGTH: 15,
};

const COMMON_UNITS = ['cái', 'chiếc', 'bộ', 'đôi', 'hộp', 'gói'];

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
    supplier: '',
    status: 'active',
  });

  // State lỗi từng trường để cảnh báo ngay tại chỗ (inline error)
  const [fieldErrors, setFieldErrors] = useState({
    costPrice: '',
    profitMargin: '',
    stock: '',
    unit: '',
  });
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  // Categories list from Category module
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Suppliers list from Supplier module
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tải danh sách tất cả danh mục từ Module Danh mục
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        setCategoriesLoading(true);
        const res = await getCategories({ limit: 100 });
        const list = res.data?.data?.categories || [];
        setCategories(list);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategoryList();
  }, []);

  // Tải danh sách nhà cung cấp active từ Module Nhà cung cấp
  useEffect(() => {
    const fetchSupplierList = async () => {
      try {
        setSuppliersLoading(true);
        const res = await getSuppliers({ limit: 100, status: 'active' });
        const list = res.data?.data?.suppliers || [];
        setSuppliers(list);
      } catch (err) {
        console.error('Lỗi tải nhà cung cấp:', err);
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSupplierList();
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
        supplier: product.supplier?._id || product.supplier || '',
        status: product.status || 'active',
      });

      setImagePreview(product.image || '');
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [product]);

  // Kiểm tra danh mục hiện tại của sản phẩm có bị khóa không
  const currentCategoryObj = categories.find(
    (c) => c.name?.toLowerCase().trim() === (product?.category || '').toLowerCase().trim()
  );
  const isCurrentCategoryLocked = isEditing && !!product?.category && currentCategoryObj?.status === 'inactive';

  // Derived price
  const cost = Number(formData.costPrice) || 0;
  const margin = Number(formData.profitMargin) || 0;
  const calculatedPrice = cost + (cost * margin) / 100;

  // Xử lý thay đổi input chung
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Xử lý giá nhập: Chặn không cho nhập quá 10 triệu và hiển thị lỗi ngay tại chỗ
  const handleCostPriceChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setError('');

    if (rawVal === '') {
      setFormData((prev) => ({ ...prev, costPrice: '' }));
      setFieldErrors((prev) => ({ ...prev, costPrice: '' }));
      return;
    }

    const num = Number(rawVal);
    // CHẶN KHÔNG CHO NHẬP THÊM NẾU VƯỢT QUÁ 10 TRIỆU
    if (num > LIMITS.COST_PRICE_MAX) {
      setFieldErrors((prev) => ({
        ...prev,
        costPrice: `Giá nhập tối đa là ${formatCurrency(LIMITS.COST_PRICE_MAX)}`,
      }));
      return; // Không nhận ký tự làm vượt quá 10 triệu
    }

    setFormData((prev) => ({ ...prev, costPrice: rawVal }));
    setFieldErrors((prev) => ({ ...prev, costPrice: '' }));
  };

  const handleCostPriceBlur = () => {
    if (formData.costPrice !== '') {
      const num = Number(formData.costPrice);
      if (num < LIMITS.COST_PRICE_MIN) {
        setFieldErrors((prev) => ({
          ...prev,
          costPrice: `Giá nhập tối thiểu là ${formatCurrency(LIMITS.COST_PRICE_MIN)}`,
        }));
      }
    }
  };

  // Xử lý lợi nhuận: Chặn không cho nhập quá 1000% và báo lỗi ngay tại chỗ
  const handleProfitMarginChange = (e) => {
    const rawVal = e.target.value;
    setError('');

    if (rawVal === '') {
      setFormData((prev) => ({ ...prev, profitMargin: '' }));
      setFieldErrors((prev) => ({ ...prev, profitMargin: '' }));
      return;
    }

    // Chỉ nhận số và tối đa 1 dấu chấm thập phân
    if (!/^\d*\.?\d*$/.test(rawVal)) return;

    const num = Number(rawVal);
    // CHẶN KHÔNG CHO NHẬP THÊM NẾU VƯỢT QUÁ 1000%
    if (num > LIMITS.PROFIT_MARGIN_MAX) {
      setFieldErrors((prev) => ({
        ...prev,
        profitMargin: `Lợi nhuận tối đa là ${LIMITS.PROFIT_MARGIN_MAX}%`,
      }));
      return; // Không nhận ký tự làm vượt quá 1000%
    }

    if (num < LIMITS.PROFIT_MARGIN_MIN) {
      setFieldErrors((prev) => ({
        ...prev,
        profitMargin: 'Lợi nhuận không được âm',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, profitMargin: rawVal }));
    setFieldErrors((prev) => ({ ...prev, profitMargin: '' }));
  };

  // Xử lý số lượng tồn kho: Chặn không cho nhập quá 10,000 sản phẩm
  const handleStockChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setError('');

    if (rawVal === '') {
      setFormData((prev) => ({ ...prev, stock: '' }));
      setFieldErrors((prev) => ({ ...prev, stock: '' }));
      return;
    }

    const num = Number(rawVal);
    // CHẶN KHÔNG CHO NHẬP THÊM NẾU VƯỢT QUÁ 10.000 SẢN PHẨM
    if (num > LIMITS.STOCK_MAX) {
      setFieldErrors((prev) => ({
        ...prev,
        stock: `Số lượng tối đa là ${LIMITS.STOCK_MAX.toLocaleString()} sản phẩm`,
      }));
      return; // Không nhận ký tự làm vượt quá 10.000
    }

    setFormData((prev) => ({ ...prev, stock: rawVal }));
    setFieldErrors((prev) => ({ ...prev, stock: '' }));
  };

  // Xử lý đơn vị tính
  const handleUnitChange = (e) => {
    const val = e.target.value;
    setError('');
    if (val.length > LIMITS.UNIT_MAX_LENGTH) {
      setFieldErrors((prev) => ({
        ...prev,
        unit: `Đơn vị tính tối đa ${LIMITS.UNIT_MAX_LENGTH} ký tự`,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, unit: val }));
    setFieldErrors((prev) => ({ ...prev, unit: '' }));
  };

  const handleSelectUnit = (u) => {
    setFormData((prev) => ({ ...prev, unit: u }));
    setFieldErrors((prev) => ({ ...prev, unit: '' }));
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

  // Validate form phía frontend trước khi submit
  const validateForm = () => {
    const newFieldErrors = {};

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên sản phẩm');
      return false;
    }

    const costPriceNum = Number(formData.costPrice);
    if (formData.costPrice === '' || isNaN(costPriceNum)) {
      newFieldErrors.costPrice = 'Vui lòng nhập giá nhập';
    } else if (costPriceNum < LIMITS.COST_PRICE_MIN || costPriceNum > LIMITS.COST_PRICE_MAX) {
      newFieldErrors.costPrice = `Giá nhập phải từ ${formatCurrency(LIMITS.COST_PRICE_MIN)} đến ${formatCurrency(LIMITS.COST_PRICE_MAX)}`;
    }

    const profitMarginNum = Number(formData.profitMargin);
    if (formData.profitMargin === '' || isNaN(profitMarginNum)) {
      newFieldErrors.profitMargin = 'Vui lòng nhập % lợi nhuận';
    } else if (profitMarginNum < LIMITS.PROFIT_MARGIN_MIN || profitMarginNum > LIMITS.PROFIT_MARGIN_MAX) {
      newFieldErrors.profitMargin = `Lợi nhuận phải từ ${LIMITS.PROFIT_MARGIN_MIN}% đến ${LIMITS.PROFIT_MARGIN_MAX}%`;
    }

    if (!isEditing && formData.stock !== '') {
      const stockNum = Number(formData.stock);
      if (isNaN(stockNum) || stockNum < LIMITS.STOCK_MIN || stockNum > LIMITS.STOCK_MAX) {
        newFieldErrors.stock = `Số lượng phải từ ${LIMITS.STOCK_MIN} đến ${LIMITS.STOCK_MAX.toLocaleString()}`;
      }
    }

    if (!formData.unit.trim()) {
      newFieldErrors.unit = 'Vui lòng nhập hoặc chọn đơn vị tính';
    } else if (formData.unit.trim().length > LIMITS.UNIT_MAX_LENGTH) {
      newFieldErrors.unit = `Đơn vị tính tối đa ${LIMITS.UNIT_MAX_LENGTH} ký tự`;
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
      setError('Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ');
      return false;
    }

    // Kiểm tra quy tắc danh mục bị khóa
    if (isEditing && isCurrentCategoryLocked && formData.category !== product.category) {
      setError(`Sản phẩm đang thuộc danh mục bị khóa ("${product.category}"), không được phép chuyển sang danh mục khác.`);
      return false;
    }

    if (formData.category) {
      const selectedCat = categories.find(
        (c) => c.name?.toLowerCase().trim() === formData.category.toLowerCase().trim()
      );
      if (selectedCat && selectedCat.status === 'inactive') {
        if (!isEditing || selectedCat.name !== product?.category) {
          setError(`Danh mục "${selectedCat.name}" đang bị khóa, không thể chọn danh mục này.`);
          return false;
        }
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
      // --- Kiểm tra trùng tên sản phẩm phía frontend ---
      const trimmedName = formData.name.trim();
      const checkRes = await getProducts({ search: trimmedName, limit: 50 });
      const existingProducts = checkRes.data?.data?.products || [];
      const duplicate = existingProducts.find((p) => {
        if (isEditing && p._id === product._id) return false;
        return p.name.trim().toLowerCase() === trimmedName.toLowerCase();
      });
      if (duplicate) {
        setError('Tên sản phẩm đã tồn tại.');
        setLoading(false);
        return;
      }

      // --- Kiểm tra trùng nội dung ảnh phía frontend ---
      if (imageFile) {
        try {
          const arrayBuffer = await imageFile.arrayBuffer();
          const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const fileHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

          const allProductsRes = await getProducts({ limit: 100 });
          const allProducts = allProductsRes.data?.data?.products || [];
          const duplicateImage = allProducts.find((p) => {
            if (isEditing && p._id === product._id) return false;
            return p.imageHash && p.imageHash === fileHash;
          });

          if (duplicateImage) {
            setError('Hình ảnh này đã được sử dụng cho sản phẩm khác.');
            setLoading(false);
            return;
          }
        } catch (hashErr) {
          console.warn('Frontend image hash check error, delegating to backend:', hashErr);
        }
      }

      const payload = new FormData();
      payload.append('name', trimmedName);
      payload.append('description', formData.description.trim());
      payload.append('price', calculatedPrice);
      payload.append('costPrice', cost);
      if (!isEditing) {
        payload.append('stock', formData.stock ? Number(formData.stock) : 0);
      }
      payload.append('unit', formData.unit.trim() || 'cái');
      payload.append('category', formData.category.trim());
      payload.append('supplier', formData.supplier || '');
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
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          
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
              <label htmlFor="pf-costPrice" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Giá nhập (₫) <span className="text-danger-500">*</span></span>
                <span className="text-xs text-gray-400 font-normal">Tối đa 10 triệu</span>
              </label>
              <input
                id="pf-costPrice"
                name="costPrice"
                type="text"
                inputMode="numeric"
                value={formData.costPrice}
                onChange={handleCostPriceChange}
                onBlur={handleCostPriceBlur}
                placeholder="10.000 - 10.000.000"
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                  fieldErrors.costPrice
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-[3px] focus:ring-danger-500/15'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15'
                }`}
              />
              {fieldErrors.costPrice && (
                <p className="mt-1 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.costPrice}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="pf-profitMargin" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Lợi nhuận (%) <span className="text-danger-500">*</span></span>
                <span className="text-xs text-gray-400 font-normal">0% - 1.000%</span>
              </label>
              <input
                id="pf-profitMargin"
                name="profitMargin"
                type="text"
                inputMode="decimal"
                value={formData.profitMargin}
                onChange={handleProfitMarginChange}
                placeholder="Ví dụ: 20"
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                  fieldErrors.profitMargin
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-[3px] focus:ring-danger-500/15'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15'
                }`}
              />
              {fieldErrors.profitMargin && (
                <p className="mt-1 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.profitMargin}
                </p>
              )}
            </div>
          </div>

          {/* Giá bán preview */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Giá bán dự kiến:</span>
            <span className="text-lg font-bold text-teal-600">{formatCurrency(calculatedPrice)}</span>
          </div>

          {/* Đơn vị tính (và số lượng nếu tạo mới) */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label htmlFor="pf-stock" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Số lượng</span>
                  <span className="text-xs text-gray-400 font-normal">Tối đa 10.000</span>
                </label>
                <input
                  id="pf-stock"
                  name="stock"
                  type="text"
                  inputMode="numeric"
                  value={formData.stock}
                  onChange={handleStockChange}
                  placeholder="0"
                  className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                    fieldErrors.stock
                      ? 'border-danger-500 focus:border-danger-500 focus:ring-[3px] focus:ring-danger-500/15'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15'
                  }`}
                />
                {fieldErrors.stock && (
                  <p className="mt-1 text-xs text-danger-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.stock}
                  </p>
                )}
              </div>
            )}
            <div className={isEditing ? "col-span-2" : ""}>
              <label htmlFor="pf-unit" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Đơn vị tính</span>
                <span className="text-xs text-gray-400 font-normal">Tối đa 15 ký tự</span>
              </label>
              <input
                id="pf-unit"
                name="unit"
                type="text"
                maxLength={15}
                value={formData.unit}
                onChange={handleUnitChange}
                placeholder="cái, chiếc, bộ, đôi..."
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                  fieldErrors.unit
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-[3px] focus:ring-danger-500/15'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15'
                }`}
              />
              {/* Quick Select Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs text-gray-400 mr-0.5">Gợi ý nhanh:</span>
                {COMMON_UNITS.map((u) => {
                  const isSelected = formData.unit?.trim().toLowerCase() === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleSelectUnit(u)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                        isSelected
                          ? 'bg-primary-50 border-primary-500 text-primary-700 font-semibold shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.unit && (
                <p className="mt-1 text-xs text-danger-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.unit}
                </p>
              )}
            </div>
          </div>

          {/* Danh mục + Nhà cung cấp */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="pf-category" className="block text-sm font-medium text-gray-700">
                  Danh mục
                </label>
                {isCurrentCategoryLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    <LockIcon className="w-3 h-3" />
                    Đang bị khóa
                  </span>
                )}
              </div>
              <select
                id="pf-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={categoriesLoading || isCurrentCategoryLocked}
                title={isCurrentCategoryLocked ? 'Danh mục hiện tại đang bị khóa, không thể chuyển sang danh mục khác' : undefined}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option
                    key={cat._id}
                    value={cat.name}
                    disabled={cat.status === 'inactive' && cat.name !== formData.category}
                  >
                    {cat.name} {cat.status === 'inactive' ? '(Đã khóa)' : ''}
                  </option>
                ))}
              </select>
              {isCurrentCategoryLocked && (
                <p className="text-xs text-rose-600 mt-1.5 font-medium leading-tight">
                  Danh mục "{product.category}" đang bị khóa. Không thể chuyển sang danh mục khác khi danh mục hiện tại đang bị khóa.
                </p>
              )}
              {categories.length === 0 && !categoriesLoading && (
                <p className="text-xs text-amber-600 mt-1">
                  Chưa có danh mục nào.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="pf-supplier" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nhà cung cấp
              </label>
              <select
                id="pf-supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                disabled={suppliersLoading}
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/15 transition-all duration-200 disabled:opacity-60"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && !suppliersLoading && (
                <p className="text-xs text-amber-600 mt-1">
                  Chưa có nhà cung cấp nào.
                </p>
              )}
            </div>
          </div>

          {/* Trạng thái kinh doanh (chỉ hiển thị khi sửa sản phẩm) */}
          {isEditing && (
            <div>
              <label htmlFor="pf-status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trạng thái kinh doanh
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
