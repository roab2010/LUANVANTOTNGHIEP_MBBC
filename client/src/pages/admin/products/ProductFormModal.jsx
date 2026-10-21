import { useState, useEffect, useMemo } from 'react';
import { createProduct, updateProduct, getProducts } from '../../../services/productApi';
import { getCategories } from '../../../services/categoryApi';
import { getSuppliers } from '../../../services/supplierApi';

// ============================================
// ICONS
// ============================================
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
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

const LightningIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
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
  COST_PRICE_MAX: 10000000, // 10 triệu
  PROFIT_MARGIN_MIN: 0,
  PROFIT_MARGIN_MAX: 1000,   // 1.000%
  STOCK_MIN: 0,
  STOCK_MAX: 10000,         // 10.000 sản phẩm
  NAME_MAX_LENGTH: 100,
  DESC_MAX_LENGTH: 1000,
  UNIT_MAX_LENGTH: 15,
  COLOR_MAX_LENGTH: 30,
  SIZE_MAX_LENGTH: 15,
};

const COMMON_UNITS = ['cái', 'chiếc', 'bộ', 'đôi', 'hộp', 'gói'];

// Preset màu sắc chuẩn (Hình 3)
const DEFAULT_PRESET_COLORS = [
  { name: 'Đen', hex: '#111111', textColor: '#ffffff' },
  { name: 'Trắng', hex: '#FFFFFF', textColor: '#111111', border: true },
  { name: 'Xám', hex: '#808080', textColor: '#ffffff' },
  { name: 'Đỏ', hex: '#EF4444', textColor: '#ffffff' },
  { name: 'Xanh navy', hex: '#1E3A8A', textColor: '#ffffff' },
  { name: 'Be', hex: '#D4B996', textColor: '#111111' },
];

// Preset size chuẩn (Hình 3)
const DEFAULT_PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

// ============================================
// PRODUCT FORM MODAL COMPONENT
// ============================================
const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const isEditing = !!product;

  // State form chính
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

  // State quản lý biến thể mới theo phong cách Hình 2 & Hình 3
  const [customColors, setCustomColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [extraSizes, setExtraSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [variantStocks, setVariantStocks] = useState({});
  const [activeColorTab, setActiveColorTab] = useState('');

  // Modal thêm màu mới
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');

  // Modal thêm size mới
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');

  // Modal áp dụng nhanh số lượng tồn
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [quickApplyStock, setQuickApplyStock] = useState('10');
  const [quickApplyTargetColor, setQuickApplyTargetColor] = useState('');
  const [quickApplyScope, setQuickApplyScope] = useState('color'); // 'color' | 'all'

  // State lỗi từng trường
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

  // Categories & Suppliers
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tải danh mục
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        setCategoriesLoading(true);
        const res = await getCategories({ limit: 100 });
        setCategories(res.data?.data?.categories || []);
      } catch (err) {
        console.error('Lỗi tải danh mục:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategoryList();
  }, []);

  // Tải nhà cung cấp
  useEffect(() => {
    const fetchSupplierList = async () => {
      try {
        setSuppliersLoading(true);
        const res = await getSuppliers({ limit: 100, status: 'active' });
        setSuppliers(res.data?.data?.suppliers || []);
      } catch (err) {
        console.error('Lỗi tải nhà cung cấp:', err);
      } finally {
        setSuppliersLoading(false);
      }
    };
    fetchSupplierList();
  }, []);

  // Load dữ liệu khi sửa sản phẩm
  useEffect(() => {
    if (product) {
      const cost = product.costPrice || 0;
      const price = product.price || 0;
      let margin = '';
      if (cost > 0) {
        margin = (((price - cost) / cost) * 100).toFixed(2);
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

      // Load biến thể theo cấu trúc mới
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const colorsSet = new Set();
        const sizesSet = new Set();
        const stocksObj = {};
        const extraC = [];
        const extraS = [];

        product.variants.forEach((v) => {
          if (v.color) {
            colorsSet.add(v.color);
            if (!DEFAULT_PRESET_COLORS.some((c) => c.name.toLowerCase() === v.color.toLowerCase())) {
              if (!extraC.some((c) => c.name.toLowerCase() === v.color.toLowerCase())) {
                extraC.push({ name: v.color, hex: '#4B5563', textColor: '#ffffff' });
              }
            }
          }
          if (v.size) {
            sizesSet.add(v.size);
            if (!DEFAULT_PRESET_SIZES.includes(v.size) && !extraS.includes(v.size)) {
              extraS.push(v.size);
            }
          }
          if (v.color && v.size) {
            stocksObj[`${v.color}__${v.size}`] = (v.stock !== undefined ? v.stock : 0).toString();
          }
        });

        const colorsArr = Array.from(colorsSet);
        const sizesArr = Array.from(sizesSet);
        setCustomColors(extraC);
        setExtraSizes(extraS);
        setSelectedColors(colorsArr);
        setSelectedSizes(sizesArr);
        setVariantStocks(stocksObj);
        setActiveColorTab(colorsArr[0] || '');
      } else {
        setSelectedColors([]);
        setSelectedSizes([]);
        setVariantStocks({});
        setActiveColorTab('');
      }

      setImagePreview(product.image || '');
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [product]);

  // Danh sách toàn bộ màu sắc khả dụng
  const allAvailableColors = useMemo(() => {
    return [...DEFAULT_PRESET_COLORS, ...customColors];
  }, [customColors]);

  // Danh sách toàn bộ size khả dụng
  const allAvailableSizes = useMemo(() => {
    return [...DEFAULT_PRESET_SIZES, ...extraSizes];
  }, [extraSizes]);

  // Tính tổng tồn kho tự động từ các biến thể đã chọn
  const totalVariantStock = useMemo(() => {
    if (selectedColors.length === 0 || selectedSizes.length === 0) return 0;
    let total = 0;
    for (const c of selectedColors) {
      for (const s of selectedSizes) {
        const val = parseInt(variantStocks[`${c}__${s}`], 10);
        if (!isNaN(val) && val > 0) {
          total += val;
        }
      }
    }
    return total;
  }, [selectedColors, selectedSizes, variantStocks]);

  // Toggle màu sắc (Hình 3)
  const toggleColor = (colorName) => {
    setError('');
    if (selectedColors.includes(colorName)) {
      const updated = selectedColors.filter((c) => c !== colorName);
      setSelectedColors(updated);
      if (activeColorTab === colorName) {
        setActiveColorTab(updated[0] || '');
      }
    } else {
      const updated = [...selectedColors, colorName];
      setSelectedColors(updated);
      if (!activeColorTab) {
        setActiveColorTab(colorName);
      }
    }
  };

  // Toggle size (Hình 3)
  const toggleSize = (sizeName) => {
    setError('');
    if (selectedSizes.includes(sizeName)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sizeName));
    } else {
      setSelectedSizes([...selectedSizes, sizeName]);
    }
  };

  // Thêm màu sắc tùy chỉnh bằng tay (nút + hình tròn)
  const handleAddNewColor = (e) => {
    e.preventDefault();
    const trimmed = newColorName.trim();
    if (!trimmed) return;
    if (trimmed.length > LIMITS.COLOR_MAX_LENGTH) {
      setError(`Tên màu sắc tối đa ${LIMITS.COLOR_MAX_LENGTH} ký tự`);
      return;
    }
    const exists = allAvailableColors.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      const newObj = { name: trimmed, hex: newColorHex, textColor: '#ffffff' };
      setCustomColors((prev) => [...prev, newObj]);
    }
    if (!selectedColors.includes(trimmed)) {
      setSelectedColors((prev) => [...prev, trimmed]);
      if (!activeColorTab) setActiveColorTab(trimmed);
    }
    setNewColorName('');
    setShowAddColorModal(false);
  };

  // Thêm size tùy chỉnh bằng tay
  const handleAddNewSize = (e) => {
    e.preventDefault();
    const trimmed = newSizeName.trim().toUpperCase();
    if (!trimmed) return;
    if (trimmed.length > LIMITS.SIZE_MAX_LENGTH) {
      setError(`Tên size tối đa ${LIMITS.SIZE_MAX_LENGTH} ký tự`);
      return;
    }
    if (!allAvailableSizes.includes(trimmed)) {
      setExtraSizes((prev) => [...prev, trimmed]);
    }
    if (!selectedSizes.includes(trimmed)) {
      setSelectedSizes((prev) => [...prev, trimmed]);
    }
    setNewSizeName('');
    setShowAddSizeModal(false);
  };

  // Cập nhật số lượng tồn cho 1 biến thể cụ thể
  const handleStockChangeForVariant = (color, size, rawValue) => {
    setError('');
    const clean = rawValue.replace(/[^0-9]/g, '');
    if (clean.length > 5) return; // Chặn quá 5 ký tự
    const num = Number(clean);
    if (num > LIMITS.STOCK_MAX) return;
    setVariantStocks((prev) => ({
      ...prev,
      [`${color}__${size}`]: clean,
    }));
  };

  // Mở modal áp dụng nhanh số lượng tồn
  const handleOpenQuickApply = (colorName) => {
    const target = colorName || activeColorTab || selectedColors[0] || '';
    setQuickApplyTargetColor(target);
    setQuickApplyScope('color');
    setQuickApplyStock('10');
    setShowQuickApplyModal(true);
  };

  // Xác nhận áp dụng số lượng tồn nhanh cho các size
  const handleExecuteQuickApply = (e) => {
    e?.preventDefault();
    const clean = quickApplyStock.replace(/[^0-9]/g, '');
    const num = clean ? Number(clean) : 0;
    if (num > LIMITS.STOCK_MAX) {
      return;
    }
    const valToSet = clean || '0';

    setVariantStocks((prev) => {
      const updated = { ...prev };
      if (quickApplyScope === 'all') {
        selectedColors.forEach((colorName) => {
          selectedSizes.forEach((s) => {
            updated[`${colorName}__${s}`] = valToSet;
          });
        });
      } else {
        const targetColor = quickApplyTargetColor || activeColorTab;
        selectedSizes.forEach((s) => {
          updated[`${targetColor}__${s}`] = valToSet;
        });
      }
      return updated;
    });

    setShowQuickApplyModal(false);
  };

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

  // Xử lý giá nhập: Giới hạn 8 ký tự (10.000.000)
  const handleCostPriceChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setError('');

    if (rawVal === '') {
      setFormData((prev) => ({ ...prev, costPrice: '' }));
      setFieldErrors((prev) => ({ ...prev, costPrice: '' }));
      return;
    }

    if (rawVal.length > 8) return; // Chặn ký tự thứ 9

    const num = Number(rawVal);
    if (num > LIMITS.COST_PRICE_MAX) {
      setFieldErrors((prev) => ({
        ...prev,
        costPrice: `Giá nhập tối đa là ${formatCurrency(LIMITS.COST_PRICE_MAX)}`,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, costPrice: rawVal }));
    setFieldErrors((prev) => ({ ...prev, costPrice: '' }));
  };

  const handleCostPriceBlur = () => {
    if (formData.costPrice === '') return;
    const num = Number(formData.costPrice);
    if (num < LIMITS.COST_PRICE_MIN) {
      setFieldErrors((prev) => ({
        ...prev,
        costPrice: `Giá nhập tối thiểu là ${formatCurrency(LIMITS.COST_PRICE_MIN)}`,
      }));
    }
  };

  // Xử lý % lợi nhuận
  const handleProfitMarginChange = (e) => {
    const rawVal = e.target.value;
    setError('');

    if (rawVal === '') {
      setFormData((prev) => ({ ...prev, profitMargin: '' }));
      setFieldErrors((prev) => ({ ...prev, profitMargin: '' }));
      return;
    }

    if (!/^\d*\.?\d*$/.test(rawVal) || rawVal.length > 6) return;

    const num = Number(rawVal);
    if (num > LIMITS.PROFIT_MARGIN_MAX) {
      setFieldErrors((prev) => ({
        ...prev,
        profitMargin: `Lợi nhuận tối đa là ${LIMITS.PROFIT_MARGIN_MAX}%`,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, profitMargin: rawVal }));
    setFieldErrors((prev) => ({ ...prev, profitMargin: '' }));
  };

  // Xử lý số lượng tồn kho chung
  const handleStockChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setError('');

    if (rawVal === '') {
      setFormData((prev) => ({ ...prev, stock: '' }));
      setFieldErrors((prev) => ({ ...prev, stock: '' }));
      return;
    }

    if (rawVal.length > 5) return;

    const num = Number(rawVal);
    if (num > LIMITS.STOCK_MAX) {
      setFieldErrors((prev) => ({
        ...prev,
        stock: `Số lượng tối đa là ${LIMITS.STOCK_MAX.toLocaleString()} sản phẩm`,
      }));
      return;
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

    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh tối đa là 5MB');
      return;
    }

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

    // Kiểm tra tính nhất quán giữa màu và size
    if (selectedColors.length > 0 && selectedSizes.length === 0) {
      setError('Bạn đã chọn màu sắc nhưng chưa chọn Size. Vui lòng chọn ít nhất 1 size.');
      return false;
    }
    if (selectedSizes.length > 0 && selectedColors.length === 0) {
      setError('Bạn đã chọn Size nhưng chưa chọn màu sắc. Vui lòng chọn ít nhất 1 màu sắc.');
      return false;
    }

    // Nếu không quản lý theo biến thể thì kiểm tra stock chung khi tạo mới
    const hasVariants = selectedColors.length > 0 && selectedSizes.length > 0;
    if (!hasVariants && !isEditing && formData.stock !== '') {
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
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

      // Kiểm tra trùng ảnh
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
          console.warn('Frontend image hash check error:', hashErr);
        }
      }

      const payload = new FormData();
      payload.append('name', trimmedName);
      payload.append('description', formData.description.trim());
      payload.append('price', calculatedPrice);
      payload.append('costPrice', cost);

      // Thu thập biến thể từ giao diện mới
      let variantsToSubmit = [];
      if (selectedColors.length > 0 && selectedSizes.length > 0) {
        for (const c of selectedColors) {
          for (const s of selectedSizes) {
            const rawVal = variantStocks[`${c}__${s}`];
            const stk = parseInt(rawVal, 10);
            variantsToSubmit.push({
              color: c.trim(),
              size: s.trim(),
              stock: isNaN(stk) || stk < 0 ? 0 : stk,
            });
          }
        }
      }

      if (variantsToSubmit.length > 0) {
        payload.append('variants', JSON.stringify(variantsToSubmit));
        payload.append('stock', totalVariantStock);
      } else {
        payload.append('variants', JSON.stringify([]));
        if (!isEditing || formData.stock !== '') {
          payload.append('stock', formData.stock ? Number(formData.stock) : 0);
        } else {
          payload.append('stock', 0);
        }
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

  const hasVariantsConfigured = selectedColors.length > 0 && selectedSizes.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs animate-fade-in" onClick={() => !loading && onClose()} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto animate-scale-in border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <h2 className="text-base font-bold text-gray-900">
            {isEditing ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Global Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down" role="alert">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          
          {/* Tên sản phẩm */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700">
                Tên sản phẩm <span className="text-danger-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400 font-mono">
                {formData.name.length}/{LIMITS.NAME_MAX_LENGTH}
              </span>
            </div>
            <input
              id="pf-name"
              name="name"
              type="text"
              maxLength={LIMITS.NAME_MAX_LENGTH}
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: ÁO THUN MBBC STREETWEAR"
              autoFocus
              className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all duration-200"
            />
          </div>

          {/* Ảnh sản phẩm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ảnh sản phẩm
            </label>
            <div className="flex items-start gap-4">
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
                  className="inline-flex items-center gap-2 h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-2xs"
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="pf-description" className="block text-sm font-medium text-gray-700">
                Mô tả sản phẩm
              </label>
              <span className="text-[11px] text-gray-400 font-mono">
                {formData.description.length}/{LIMITS.DESC_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="pf-description"
              name="description"
              maxLength={LIMITS.DESC_MAX_LENGTH}
              value={formData.description}
              onChange={handleChange}
              placeholder="Chi tiết chất liệu, form dáng, cách bảo quản..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black transition-all duration-200 resize-none"
            />
          </div>

          {/* Giá nhập + Phần trăm lợi nhuận */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pf-costPrice" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Giá nhập (₫) <span className="text-danger-500">*</span></span>
                <span className="text-[11px] text-gray-400">Tối đa 10 tr</span>
              </label>
              <input
                id="pf-costPrice"
                name="costPrice"
                type="text"
                inputMode="numeric"
                maxLength={8}
                value={formData.costPrice}
                onChange={handleCostPriceChange}
                onBlur={handleCostPriceBlur}
                placeholder="10.000 - 10.000.000"
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                  fieldErrors.costPrice
                    ? 'border-danger-500 focus:border-danger-500'
                    : 'border-gray-300 focus:border-black'
                }`}
              />
              {fieldErrors.costPrice && (
                <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.costPrice}</p>
              )}
            </div>
            <div>
              <label htmlFor="pf-profitMargin" className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Lợi nhuận (%) <span className="text-danger-500">*</span></span>
                <span className="text-[11px] text-gray-400">0% - 1.000%</span>
              </label>
              <input
                id="pf-profitMargin"
                name="profitMargin"
                type="text"
                inputMode="decimal"
                maxLength={6}
                value={formData.profitMargin}
                onChange={handleProfitMarginChange}
                placeholder="Ví dụ: 30"
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                  fieldErrors.profitMargin
                    ? 'border-danger-500 focus:border-danger-500'
                    : 'border-gray-300 focus:border-black'
                }`}
              />
              {fieldErrors.profitMargin && (
                <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.profitMargin}</p>
              )}
            </div>
          </div>

          {/* Giá bán preview */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Giá bán niêm yết dự kiến:</span>
            <span className="text-base font-black text-black">{formatCurrency(calculatedPrice)}</span>
          </div>

          {/* ========================================================= */}
          {/* KHU VỰC THIẾT LẬP BIẾN THỂ SIZE & MÀU (CHUẨN HÌNH 3 & HÌNH 2) */}
          {/* ========================================================= */}
          <div className="p-4 bg-neutral-50/80 border border-neutral-200 rounded-xl space-y-4">
            
            {/* Header Biến thể */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <div>
                <h4 className="text-xs font-black tracking-widest text-neutral-900 uppercase">
                  BIẾN THỂ & TỒN KHO THEO SIZE / MÀU
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Chọn màu sắc và size để hệ thống tự động sinh bảng tồn kho chi tiết
                </p>
              </div>

              {hasVariantsConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa toàn bộ biến thể và quay về quản lý tồn kho chung?')) {
                      setSelectedColors([]);
                      setSelectedSizes([]);
                      setVariantStocks({});
                      setActiveColorTab('');
                    }
                  }}
                  className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline"
                >
                  Xóa tất cả biến thể
                </button>
              )}
            </div>

            {/* 1. CHỌN MÀU SẮC (CHUẨN HÌNH 3) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-900 tracking-wide flex items-center gap-1.5">
                  <span>1. Chọn màu sắc</span>
                  {selectedColors.length > 0 && (
                    <span className="text-[11px] font-bold text-teal-600">({selectedColors.length} màu đã chọn)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddColorModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 bg-white hover:bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-300 transition-colors shadow-2xs"
                >
                  <span>+ Thêm màu mới</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mb-2.5">
                Hiển thị các màu dưới dạng ô màu có thể bấm chọn.
              </p>

              {/* Hàng các ô màu */}
              <div className="flex flex-wrap items-center gap-2">
                {allAvailableColors.map((c) => {
                  const isSelected = selectedColors.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleColor(c.name)}
                      className={`flex flex-col items-center justify-center min-w-[56px] py-2 px-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-black bg-neutral-900 text-white shadow-xs scale-105'
                          : 'border-gray-200 bg-white hover:border-gray-400 text-gray-800'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 relative shadow-2xs ${
                          c.border ? 'border border-gray-300' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke={c.textColor || '#ffffff'}
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      <span className="text-[11px] font-bold tracking-tight">{c.name}</span>
                    </button>
                  );
                })}

                {/* Nút dấu cộng tròn thêm màu */}
                <button
                  type="button"
                  onClick={() => setShowAddColorModal(true)}
                  title="Thêm màu mới"
                  className="w-12 h-14 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-black hover:bg-white text-gray-400 hover:text-black transition-all"
                >
                  <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm font-black mb-1">
                    +
                  </div>
                  <span className="text-[10px] font-semibold">Khác</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-600 mt-2 font-medium">
                Đang chọn:{' '}
                <span className="font-bold text-gray-900">
                  {selectedColors.length > 0 ? selectedColors.join(', ') : 'Chưa chọn màu nào'}
                </span>
              </p>
            </div>

            {/* 2. CHỌN SIZE (CHUẨN HÌNH 3) */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-900 tracking-wide flex items-center gap-1.5">
                  <span>2. Chọn size</span>
                  {selectedSizes.length > 0 && (
                    <span className="text-[11px] font-bold text-teal-600">({selectedSizes.length} size đã chọn)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddSizeModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-800 bg-white hover:bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-300 transition-colors shadow-2xs"
                >
                  <span>+ Thêm size khác</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mb-2.5">
                Có thể bấm chọn nhiều size, không cần tạo từng size riêng lẻ.
              </p>

              {/* Hàng các nút size */}
              <div className="flex flex-wrap items-center gap-2">
                {allAvailableSizes.map((s) => {
                  const isSelected = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`min-w-[44px] h-9 px-3 rounded-lg text-xs font-bold font-mono transition-all border ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-black shadow-xs scale-105'
                          : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}

                {/* Nút cộng size */}
                <button
                  type="button"
                  onClick={() => setShowAddSizeModal(true)}
                  className="h-9 px-3 rounded-lg text-xs font-bold border-2 border-dashed border-gray-300 hover:border-black hover:bg-white text-gray-500 transition-all flex items-center gap-1"
                >
                  <span>+ Size</span>
                </button>
              </div>

              <p className="text-[11px] text-gray-600 mt-2 font-medium">
                Đang chọn:{' '}
                <span className="font-bold text-gray-900">
                  {selectedSizes.length > 0 ? selectedSizes.join(', ') : 'Chưa chọn size nào'}
                </span>
              </p>
            </div>

            {/* 3. BẢNG TỒN KHO THEO TỪNG MÀU (CHUẨN HÌNH 2: CÁCH 2 - CHỌN MÀU RỒI MỚI HIỆN SIZE) */}
            {hasVariantsConfigured ? (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Tồn kho theo biến thể ({selectedColors.length * selectedSizes.length} biến thể)
                  </span>
                  <span className="text-xs font-semibold text-gray-600">
                    Tổng tồn: <strong className="text-gray-900">{totalVariantStock}</strong> {formData.unit || 'cái'}
                  </span>
                </div>

                {/* Hàng tabs chọn màu (như Ảnh 2) */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-gray-200/70 rounded-xl border border-gray-300">
                  {selectedColors.map((colorName) => {
                    const cObj = allAvailableColors.find((c) => c.name === colorName) || {
                      name: colorName,
                      hex: '#4B5563',
                    };
                    const isActive = activeColorTab === colorName;
                    const colorTotal = selectedSizes.reduce(
                      (sum, s) => sum + (parseInt(variantStocks[`${colorName}__${s}`], 10) || 0),
                      0
                    );

                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => setActiveColorTab(colorName)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 ${cObj.border ? 'border border-gray-300' : ''}`}
                          style={{ backgroundColor: cObj.hex }}
                        />
                        <span>{colorName}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {colorTotal}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bảng nhập số lượng tồn cho Màu đang chọn (Ảnh 2) */}
                {activeColorTab && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{
                            backgroundColor:
                              allAvailableColors.find((c) => c.name === activeColorTab)?.hex || '#4B5563',
                          }}
                        />
                        <h5 className="text-xs font-black text-gray-900 tracking-wider uppercase">
                          Màu {activeColorTab} — số lượng tồn
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickApply(activeColorTab)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-neutral-900 hover:text-white rounded-lg transition-all border border-gray-200 shadow-2xs"
                        title="Điền nhanh cùng một số lượng tồn cho các size"
                      >
                        <LightningIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Áp dụng nhanh cho tất cả size</span>
                      </button>
                    </div>

                    {/* Danh sách các size của màu này */}
                    <div className="divide-y divide-gray-100">
                      {selectedSizes.map((s) => {
                        const stockVal = variantStocks[`${activeColorTab}__${s}`] || '';
                        return (
                          <div key={s} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-gray-900 font-mono w-24">Size {s}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400">Tồn kho:</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={5}
                                value={stockVal}
                                onChange={(e) => handleStockChangeForVariant(activeColorTab, s, e.target.value)}
                                placeholder="0"
                                className="w-24 h-8 px-2.5 border border-gray-300 rounded-lg text-right font-bold font-mono text-xs text-gray-900 focus:border-black focus:outline-none"
                              />
                              <span className="text-gray-400 text-[11px] w-8">{formData.unit || 'cái'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Banner tổng tồn kho tự động */}
                <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs">
                  <span className="font-semibold text-teal-800">Tổng tồn kho tự động tính (toàn bộ màu & size):</span>
                  <span className="text-base font-black text-teal-900 tabular-nums">
                    {totalVariantStock} <span className="font-normal text-xs text-teal-700">{formData.unit || 'cái'}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-white border border-dashed border-gray-300 rounded-lg">
                <p className="text-xs text-gray-500">
                  {selectedColors.length === 0 && selectedSizes.length === 0
                    ? 'Chưa thiết lập biến thể. Bấm chọn màu sắc và size ở trên để kích hoạt quản lý kho theo Size / Màu.'
                    : selectedColors.length === 0
                    ? 'Bạn đã chọn Size, vui lòng chọn thêm Màu sắc để hiển thị bảng nhập tồn kho.'
                    : 'Bạn đã chọn Màu sắc, vui lòng chọn thêm Size để hiển thị bảng nhập tồn kho.'}
                </p>
              </div>
            )}
          </div>

          {/* Đơn vị tính và Tồn kho tổng (nếu không dùng biến thể) */}
          <div className="grid grid-cols-2 gap-4">
            {hasVariantsConfigured ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Tổng tồn kho</span>
                  <span className="text-xs text-teal-600 font-semibold">Khóa (tính từ biến thể)</span>
                </label>
                <div className="w-full h-10 px-3.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex items-center justify-between">
                  <span>{totalVariantStock}</span>
                  <span className="text-xs text-gray-400 font-normal">{formData.unit || 'cái'}</span>
                </div>
              </div>
            ) : !isEditing ? (
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
                  maxLength={5}
                  value={formData.stock}
                  onChange={handleStockChange}
                  placeholder="0"
                  className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                    fieldErrors.stock
                      ? 'border-danger-500 focus:border-danger-500'
                      : 'border-gray-300 focus:border-black'
                  }`}
                />
                {fieldErrors.stock && (
                  <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.stock}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Tồn kho hiện tại</span>
                  <span className="text-xs text-gray-400 font-normal">Chung</span>
                </label>
                <div className="w-full h-10 px-3.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 flex items-center justify-between">
                  <span>{formData.stock || 0}</span>
                  <span className="text-xs text-gray-400 font-normal">{formData.unit || 'cái'}</span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="pf-unit" className="block text-sm font-medium text-gray-700">
                  Đơn vị tính <span className="text-danger-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400 font-mono">
                  {formData.unit.length}/{LIMITS.UNIT_MAX_LENGTH}
                </span>
              </div>
              <input
                id="pf-unit"
                name="unit"
                type="text"
                maxLength={LIMITS.UNIT_MAX_LENGTH}
                value={formData.unit}
                onChange={handleUnitChange}
                placeholder="cái, chiếc, bộ, đôi..."
                className={`w-full h-10 px-3.5 bg-white border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 ${
                  fieldErrors.unit
                    ? 'border-danger-500 focus:border-danger-500'
                    : 'border-gray-300 focus:border-black'
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
                          ? 'bg-neutral-900 border-black text-white font-semibold shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.unit && (
                <p className="mt-1 text-xs text-danger-600 font-medium">{fieldErrors.unit}</p>
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
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-black transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option
                    key={cat._id}
                    value={cat.name}
                    disabled={cat.status === 'inactive' && (!isEditing || cat.name !== product?.category)}
                  >
                    {cat.name} {cat.status === 'inactive' ? '(Đang bị khóa)' : ''}
                  </option>
                ))}
              </select>
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
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-black transition-all duration-200 disabled:bg-gray-100"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>
                    {sup.name} ({sup.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trạng thái hoạt động (chỉ hiện khi sửa) */}
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
                className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-black transition-all duration-200"
              >
                <option value="active">Đang bán (Hiển thị cho khách hàng)</option>
                <option value="inactive">Ngừng bán (Ẩn khỏi storefront)</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEditing ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================= */}
      {/* MODAL THÊM MÀU MỚI TÙY CHỈNH (Nút dấu cộng) */}
      {/* ========================================================= */}
      {showAddColorModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddColorModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm z-10 space-y-4 animate-scale-in border border-gray-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Thêm màu sắc mới</h4>
              <button
                type="button"
                onClick={() => setShowAddColorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddNewColor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên màu sắc (Tối đa 30 ký tự)
                </label>
                <input
                  type="text"
                  maxLength={LIMITS.COLOR_MAX_LENGTH}
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Ví dụ: Rêu olive, Nâu đất..."
                  autoFocus
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Chọn mã màu hiển thị
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-10 h-10 p-0.5 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold text-gray-700">{newColorHex}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddColorModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newColorName.trim()}
                  className="px-4 py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                >
                  Thêm màu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THÊM SIZE MỚI TÙY CHỈNH */}
      {/* ========================================================= */}
      {showAddSizeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddSizeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm z-10 space-y-4 animate-scale-in border border-gray-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900">Thêm size tùy chỉnh</h4>
              <button
                type="button"
                onClick={() => setShowAddSizeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddNewSize} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tên Size (Tối đa 15 ký tự)
                </label>
                <input
                  type="text"
                  maxLength={LIMITS.SIZE_MAX_LENGTH}
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  placeholder="Ví dụ: 4XL, FREESIZE, OVERSIZE..."
                  autoFocus
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 uppercase focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSizeModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newSizeName.trim()}
                  className="px-4 py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                >
                  Thêm size
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL ÁP DỤNG NHANH SỐ LƯỢNG TỒN KHO */}
      {/* ========================================================= */}
      {showQuickApplyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowQuickApplyModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10 space-y-5 animate-scale-in border border-gray-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <LightningIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Áp dụng nhanh số lượng tồn
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Điền đồng loạt số lượng tồn cho các size nhanh chóng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleExecuteQuickApply} className="space-y-4">
              {/* Phạm vi áp dụng */}
              {selectedColors.length > 1 ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Phạm vi áp dụng:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickApplyScope('color')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        quickApplyScope === 'color'
                          ? 'border-black bg-neutral-900 text-white shadow-sm'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/40"
                          style={{
                            backgroundColor:
                              allAvailableColors.find((c) => c.name === quickApplyTargetColor)?.hex || '#4B5563',
                          }}
                        />
                        <span className="truncate">Chỉ màu {quickApplyTargetColor}</span>
                      </div>
                      <span className={`text-[10px] ${quickApplyScope === 'color' ? 'text-gray-300' : 'text-gray-400'}`}>
                        {selectedSizes.length} size đang chọn
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickApplyScope('all')}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        quickApplyScope === 'all'
                          ? 'border-black bg-neutral-900 text-white shadow-sm'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="truncate">Tất cả {selectedColors.length} màu</span>
                      </div>
                      <span className={`text-[10px] ${quickApplyScope === 'all' ? 'text-gray-300' : 'text-gray-400'}`}>
                        Tổng {selectedColors.length * selectedSizes.length} biến thể
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Màu áp dụng:</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 uppercase">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          allAvailableColors.find((c) => c.name === quickApplyTargetColor)?.hex || '#4B5563',
                      }}
                    />
                    <span>{quickApplyTargetColor || 'Mặc định'}</span>
                  </div>
                </div>
              )}

              {/* Ô nhập số lượng tồn */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-800">
                    Số lượng tồn cho mỗi size
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Tối đa {LIMITS.STOCK_MAX.toLocaleString()} {formData.unit || 'cái'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    autoFocus
                    value={quickApplyStock}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setQuickApplyStock(clean);
                    }}
                    placeholder="0"
                    className="w-full h-11 px-3.5 pr-14 border border-gray-300 rounded-xl text-base font-bold font-mono text-gray-900 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">
                    {formData.unit || 'cái'}
                  </span>
                </div>

                {Number(quickApplyStock || 0) > LIMITS.STOCK_MAX && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">
                    Số lượng không được vượt quá {LIMITS.STOCK_MAX.toLocaleString()} {formData.unit || 'cái'}
                  </p>
                )}

                {/* Gợi ý số lượng nhanh dạng chip bấm */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-gray-400 font-medium">Gợi ý nhanh:</span>
                  {['0', '5', '10', '20', '50', '100'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuickApplyStock(val)}
                      className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded-md border transition-all ${
                        quickApplyStock === val
                          ? 'bg-black text-white border-black'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Xem trước thay đổi */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>⚡</span> Xem trước cập nhật:
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Sẽ gán tồn kho <strong>{quickApplyStock || '0'} {formData.unit || 'cái'}</strong> cho{' '}
                  <strong>
                    {quickApplyScope === 'all'
                      ? `${selectedColors.length * selectedSizes.length} biến thể (${selectedColors.length} màu × ${selectedSizes.length} size)`
                      : `${selectedSizes.length} size của Màu ${quickApplyTargetColor}`}
                  </strong>.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowQuickApplyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={Number(quickApplyStock || 0) > LIMITS.STOCK_MAX}
                  className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
                >
                  Xác nhận áp dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductFormModal;
