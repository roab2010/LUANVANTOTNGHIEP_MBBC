const mongoose = require('mongoose');

// ============================================
// SCHEMA ĐÁNH GIÁ SẢN PHẨM (PRODUCT REVIEW)
// ============================================
const reviewSchema = new mongoose.Schema(
  {
    // Sản phẩm được đánh giá
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Vui lòng cung cấp ID sản phẩm'],
      index: true,
    },

    // Khách hàng gửi đánh giá
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vui lòng cung cấp ID người dùng'],
      index: true,
    },

    // Đơn hàng liên quan (bắt buộc để xác thực giao dịch mua hàng thực tế)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Vui lòng cung cấp ID đơn hàng'],
      index: true,
    },

    // Biến thể đã mua trong đơn hàng (Size & Màu sắc để hiển thị minh bạch)
    variant: {
      size: {
        type: String,
        default: '',
        trim: true,
      },
      color: {
        type: String,
        default: '',
        trim: true,
      },
    },

    // Số sao đánh giá từ 1 đến 5
    rating: {
      type: Number,
      required: [true, 'Vui lòng chọn số sao đánh giá'],
      min: [1, 'Đánh giá tối thiểu là 1 sao'],
      max: [5, 'Đánh giá tối đa là 5 sao'],
    },

    // Nội dung nhận xét chi tiết
    content: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung nhận xét'],
      trim: true,
      minlength: [5, 'Nội dung nhận xét tối thiểu 5 ký tự'],
      maxlength: [1000, 'Nội dung nhận xét tối đa 1,000 ký tự'],
    },

    // Danh sách hình ảnh thực tế (tối đa 5 ảnh)
    images: {
      type: [String],
      default: [],
      validate: [
        (val) => val.length <= 5,
        'Chỉ được tải lên tối đa 5 hình ảnh thực tế',
      ],
    },

    // Trạng thái kiểm duyệt:
    // PENDING: Chờ Admin duyệt (mới tạo hoặc vừa sửa)
    // APPROVED: Đã duyệt, hiển thị công khai trên Storefront và tính vào điểm trung bình
    // REJECTED: Bị từ chối (có lý do)
    // HIDDEN: Bị ẩn do vi phạm quy chuẩn
    // DELETED: Khách hàng xóa mềm (vẫn lưu vết truy xuất)
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'DELETED'],
      default: 'PENDING',
      index: true,
    },

    // Lý do Admin từ chối hoặc ẩn đánh giá
    moderationReason: {
      type: String,
      default: '',
      trim: true,
    },

    // Quản trị viên thực hiện kiểm duyệt
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Thời điểm kiểm duyệt
    moderatedAt: {
      type: Date,
      default: null,
    },

    // Phản hồi chính thức từ MBBC/Admin (nếu có)
    adminReply: {
      content: {
        type: String,
        default: '',
        trim: true,
        maxlength: [1000, 'Nội dung phản hồi tối đa 1,000 ký tự'],
      },
      repliedAt: {
        type: Date,
        default: null,
      },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },

    // Đánh dấu khách đã từng chỉnh sửa nội dung
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// ============================================
// INDEXES TỐI ƯU HÓA HIỆU NĂNG & CHỐNG GỬI TRÙNG
// ============================================

// 1. Compound Unique Index: Mỗi khách hàng chỉ được đánh giá 1 lần cho 1 sản phẩm trong 1 đơn hàng cụ thể
reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true });

// 2. Phục vụ lấy danh sách đánh giá công khai của sản phẩm (chỉ lấy APPROVED, sắp xếp mới nhất)
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

// 3. Phục vụ truy vấn "Đánh giá của tôi"
reviewSchema.index({ userId: 1, createdAt: -1 });

// 4. Phục vụ Admin lọc theo trạng thái và thời gian
reviewSchema.index({ status: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
