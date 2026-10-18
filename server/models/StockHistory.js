const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Vui lòng chọn sản phẩm'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['import', 'export'],
        message: 'Loại giao dịch chỉ có thể là Nhập kho (import) hoặc Xuất kho (export)',
      },
      required: [true, 'Vui lòng xác định loại giao dịch'],
    },
    quantity: {
      type: Number,
      required: [true, 'Vui lòng nhập số lượng'],
      min: [1, 'Số lượng phải lớn hơn 0'],
    },
    stockBefore: {
      type: Number,
      required: true,
      min: [0, 'Tồn kho trước giao dịch không hợp lệ'],
    },
    stockAfter: {
      type: Number,
      required: true,
      min: [0, 'Tồn kho sau giao dịch không hợp lệ'],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Đơn giá không được âm'],
    },
    reason: {
      type: String,
      enum: {
        values: [
          'Hàng lỗi/hư hỏng',
          'Sử dụng nội bộ/chụp ảnh sản phẩm',
          'Điều chỉnh tồn kho',
          'Khác',
          '',
        ],
        message: 'Lý do xuất kho không hợp lệ',
      },
      default: '',
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự'],
    },
    performer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index phục vụ truy vấn lịch sử theo sản phẩm sắp xếp mới nhất
stockHistorySchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
