const mongoose = require('mongoose');

// Schema Chi tiết phiếu nhập (ChiTietPhieuNhap)
const importItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Vui lòng chọn sản phẩm'],
  },
  quantity: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng'],
    min: [1, 'Số lượng nhập phải từ 1 trở lên'],
  },
  importPrice: {
    type: Number,
    required: [true, 'Vui lòng nhập giá nhập'],
    min: [0, 'Giá nhập không được âm'],
  },
  total: {
    type: Number,
    default: 0,
  },
});

// Schema Phiếu nhập (PhieuNhap)
const importReceiptSchema = new mongoose.Schema(
  {
    receiptCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Vui lòng chọn nhà cung cấp'],
    },
    importDate: {
      type: Date,
      default: Date.now,
    },
    items: [importItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Tổng tiền không được âm'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

importReceiptSchema.index({ receiptCode: 'text' });

const ImportReceipt = mongoose.model('ImportReceipt', importReceiptSchema);

module.exports = ImportReceipt;
