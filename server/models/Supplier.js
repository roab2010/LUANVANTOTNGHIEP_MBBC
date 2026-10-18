const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên nhà cung cấp'],
      trim: true,
      unique: true,
      maxlength: [100, 'Tên nhà cung cấp không được vượt quá 100 ký tự'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [11, 'Số điện thoại không được vượt quá 11 ký tự'],
    },
    address: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Địa chỉ không được vượt quá 200 ký tự'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Ghi chú không được vượt quá 300 ký tự'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index({ name: 'text', phone: 'text' });

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
