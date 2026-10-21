const mongoose = require('mongoose');

// ============================================
// SCHEMA BIẾN THỂ (SIZE + MÀU + TỒN KHO RIÊNG)
// ============================================
const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: [true, 'Vui lòng chọn size'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Vui lòng chọn màu sắc'],
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng tồn kho biến thể không được âm'],
      max: [10000, 'Số lượng tồn kho biến thể tối đa là 10,000'],
    },
  },
  { _id: true }
);

// ============================================
// SCHEMA SẢN PHẨM
// ============================================
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá bán'],
      min: [0, 'Giá bán không được âm'],
    },
    costPrice: {
      type: Number,
      default: 10000,
      min: [10000, 'Giá nhập phải từ 10,000 ₫ trở lên'],
      max: [10000000, 'Giá nhập tối đa là 10,000,000 ₫'],
    },
    // Tồn kho tổng: tự tính từ variants nếu có, hoặc nhập trực tiếp (sản phẩm cũ)
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng tồn kho không được âm'],
      max: [10000, 'Số lượng tồn kho tối đa là 10,000'],
    },
    // Mảng biến thể size + màu (có thể rỗng cho sản phẩm cũ chưa phân biến thể)
    variants: {
      type: [variantSchema],
      default: [],
    },
    unit: {
      type: String,
      default: 'cái',
      trim: true,
      maxlength: [20, 'Đơn vị tính không được quá 20 ký tự'],
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    image: {
      type: String,
      default: '',
    },
    imageHash: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// ============================================
// PRE-SAVE: Tự tính tổng stock từ variants (nếu có)
// Sản phẩm cũ không có variants → giữ nguyên stock chung
// ============================================
productSchema.pre('save', function () {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  } else if (this.isModified('variants') && Array.isArray(this.variants) && this.variants.length === 0) {
    if (!this.isModified('stock')) {
      this.stock = 0;
    }
  }
});

// Index tìm kiếm theo tên
productSchema.index({ name: 'text' });

// Index cho imageHash — sparse để bỏ qua sản phẩm cũ chưa có hash
productSchema.index({ imageHash: 1 }, { sparse: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
