const mongoose = require('mongoose');

const promotionUsageSchema = new mongoose.Schema(
  {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
      required: [true, 'Vui lòng cung cấp ID chương trình khuyến mãi'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Vui lòng cung cấp ID đơn hàng'],
      unique: true, // Đảm bảo mỗi đơn hàng chỉ có một bản ghi sử dụng tương ứng
      index: true,
    },
    discountAmount: {
      type: Number,
      required: [true, 'Vui lòng cung cấp số tiền giảm thực tế'],
      min: [0, 'Số tiền giảm không được âm'],
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Used', 'Restored'],
      default: 'Used',
      index: true,
    },
    restoredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hỗ trợ đếm lượt sử dụng theo User và theo Promotion nhanh chóng
promotionUsageSchema.index({ promotionId: 1, userId: 1, status: 1 });
promotionUsageSchema.index({ promotionId: 1, status: 1 });

const PromotionUsage = mongoose.model('PromotionUsage', promotionUsageSchema);

module.exports = PromotionUsage;

