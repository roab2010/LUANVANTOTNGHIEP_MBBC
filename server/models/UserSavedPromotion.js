const mongoose = require('mongoose');

const userSavedPromotionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vui lòng cung cấp ID người dùng'],
      index: true,
    },
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
      required: [true, 'Vui lòng cung cấp ID khuyến mãi'],
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ràng buộc duy nhất: Một khách hàng không thể lưu trùng cùng một voucher
userSavedPromotionSchema.index({ userId: 1, promotionId: 1 }, { unique: true });

const UserSavedPromotion = mongoose.model('UserSavedPromotion', userSavedPromotionSchema);

module.exports = UserSavedPromotion;

