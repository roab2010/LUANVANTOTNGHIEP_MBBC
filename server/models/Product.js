const mongoose = require('mongoose');

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
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng tồn kho không được âm'],
      max: [10000, 'Số lượng tồn kho tối đa là 10,000'],
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
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// Index tìm kiếm theo tên
productSchema.index({ name: 'text' });

// Index cho imageHash — sparse để bỏ qua sản phẩm cũ chưa có hash
productSchema.index({ imageHash: 1 }, { sparse: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
