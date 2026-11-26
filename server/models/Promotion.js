const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên chương trình khuyến mãi'],
      trim: true,
      maxlength: [150, 'Tên chương trình không được vượt quá 150 ký tự'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Mô tả không được vượt quá 500 ký tự'],
    },
    // Hình thức: automatic (tự động) | voucher (nhập mã)
    type: {
      type: String,
      enum: ['automatic', 'voucher'],
      required: [true, 'Vui lòng chọn hình thức khuyến mãi'],
      default: 'voucher',
    },
    // Mã voucher: Bắt buộc nếu type === 'voucher', viết hoa không dấu
    code: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (val) {
          if (this.type === 'voucher') {
            return val && val.trim().length >= 3 && /^[A-Z0-9_-]+$/.test(val.trim());
          }
          return true;
        },
        message: 'Mã voucher phải có ít nhất 3 ký tự, chỉ chứa chữ hoa, số, dấu gạch ngang hoặc gạch dưới',
      },
    },
    // Phạm vi áp dụng: order (toàn đơn hàng đủ điều kiện) | product (chỉ sản phẩm/danh mục chọn)
    scope: {
      type: String,
      enum: ['order', 'product'],
      required: [true, 'Vui lòng chọn phạm vi áp dụng'],
      default: 'order',
    },
    // Loại giảm giá: percentage (%) | fixed (VNĐ)
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Vui lòng chọn loại giảm giá'],
      default: 'percentage',
    },
    // Giá trị giảm: Số % (1-100) hoặc số tiền cố định (>= 1,000đ)
    discountValue: {
      type: Number,
      required: [true, 'Vui lòng nhập giá trị giảm'],
      min: [1, 'Giá trị giảm phải lớn hơn 0'],
    },
    // Mức giảm tối đa áp dụng khi discountType === 'percentage'
    maxDiscount: {
      type: Number,
      default: null,
      min: [0, 'Mức giảm tối đa không được âm'],
    },
    // Giá trị đơn hàng tối thiểu để được áp dụng
    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị đơn hàng tối thiểu không được âm'],
    },
    // Danh sách ID sản phẩm được áp dụng (khi scope === 'product')
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    // Danh sách tên danh mục được áp dụng (khi scope === 'product')
    applicableCategories: [
      {
        type: String,
        trim: true,
      },
    ],
    // Thời gian bắt đầu
    startAt: {
      type: Date,
      required: [true, 'Vui lòng chọn thời gian bắt đầu'],
    },
    // Thời gian kết thúc
    endAt: {
      type: Date,
      required: [true, 'Vui lòng chọn thời gian kết thúc'],
      validate: {
        validator: function (val) {
          return val > this.startAt;
        },
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      },
    },
    // Tổng số lượt sử dụng tối đa của chương trình (null = không giới hạn)
    usageLimit: {
      type: Number,
      default: null,
      min: [1, 'Giới hạn sử dụng phải ít nhất là 1'],
    },
    // Số lượt đã sử dụng thực tế
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Giới hạn số lần sử dụng trên mỗi khách hàng (mặc định 1)
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Giới hạn mỗi khách hàng phải ít nhất là 1'],
    },
    // Trạng thái cơ bản lưu trong DB: draft (nháp), active (kích hoạt), paused (tạm dừng)
    status: {
      type: String,
      enum: ['draft', 'active', 'paused'],
      default: 'draft',
    },
    // Cho phép hiển thị công khai ở Trung tâm ưu đãi
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Cho phép khách hàng lưu vào Kho voucher cá nhân
    allowSaving: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promotionSchema.index({ code: 1 }, { unique: true, sparse: true });
promotionSchema.index({ status: 1, startAt: 1, endAt: 1, isPublic: 1 });
promotionSchema.index({ type: 1, status: 1 });

/**
 * Helper tính trạng thái thực tế (computedStatus) theo thời gian hiện tại
 * Kết quả: Draft | Scheduled | Active | Paused | Expired
 */
promotionSchema.methods.getComputedStatus = function () {
  if (this.status === 'draft') return 'draft';
  if (this.status === 'paused') return 'paused';

  const now = new Date();
  if (now < this.startAt) return 'scheduled';
  if (now > this.endAt) return 'expired';
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return 'expired';

  return 'active';
};

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
