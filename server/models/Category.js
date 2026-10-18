const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên danh mục'],
      trim: true,
      minlength: [2, 'Tên danh mục phải có từ 2 đến 50 ký tự'],
      maxlength: [50, 'Tên danh mục tối đa 50 ký tự'],
      unique: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Mô tả danh mục tối đa 200 ký tự'],
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
categorySchema.index({ name: 'text' });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
