const mongoose = require('mongoose');

// ============================================
// SCHEMA YÊU CẦU ĐỔI TRẢ (RETURN / EXCHANGE REQUEST)
// Phù hợp cho đồ án tốt nghiệp MBBC Store
// ============================================

const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: '',
    trim: true,
  },
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
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  // Nếu là Đổi hàng (EXCHANGE): Kích thước và màu sắc khách muốn đổi sang
  exchangeSize: {
    type: String,
    default: '',
    trim: true,
  },
  exchangeColor: {
    type: String,
    default: '',
    trim: true,
  },
  itemReason: {
    type: String,
    default: '',
    trim: true,
  },
});

const returnRequestSchema = new mongoose.Schema(
  {
    // Mã phiếu đổi trả tự sinh (ví dụ: DT-241126-1024)
    returnCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Đơn hàng gốc liên quan
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Vui lòng cung cấp mã đơn hàng'],
      index: true,
    },

    // Khách hàng gửi yêu cầu
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vui lòng cung cấp mã khách hàng'],
      index: true,
    },

    // Phân loại yêu cầu:
    // EXCHANGE: Đổi size / Đổi mẫu
    // RETURN: Trả hàng & Hoàn tiền
    requestType: {
      type: String,
      enum: ['EXCHANGE', 'RETURN'],
      required: [true, 'Vui lòng chọn loại yêu cầu (Đổi hàng hoặc Trả hàng)'],
      default: 'EXCHANGE',
    },

    // Danh sách sản phẩm muốn đổi/trả
    items: [returnItemSchema],

    // Lý do chính
    reason: {
      type: String,
      enum: [
        'DEFECTIVE', // Hàng lỗi do nhà sản xuất (rách, bung chỉ, bẩn, lỗi in ấn)
        'WRONG_SIZE', // Mặc không vừa (chật, rộng)
        'WRONG_ITEM', // Shop gửi sai mẫu hoặc sai màu
        'DAMAGED_SHIPPING', // Hàng hư hỏng trong quá trình vận chuyển
        'NOT_AS_DESCRIBED', // Không đúng như mô tả / hình ảnh
        'OTHER', // Lý do khác
      ],
      required: [true, 'Vui lòng chọn lý do đổi trả'],
      default: 'DEFECTIVE',
    },

    // Mô tả chi tiết vấn đề khách gặp phải
    reasonDetail: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả chi tiết lý do'],
      trim: true,
      minlength: [5, 'Mô tả chi tiết tối thiểu 5 ký tự'],
      maxlength: [1000, 'Mô tả chi tiết tối đa 1,000 ký tự'],
    },

    // Danh sách hình ảnh / video minh chứng (tối đa 5 ảnh)
    images: {
      type: [String],
      default: [],
      validate: [
        (val) => val.length <= 5,
        'Chỉ được tải lên tối đa 5 hình ảnh thực tế minh chứng',
      ],
    },

    // Thông tin tài khoản ngân hàng nhận tiền hoàn (chỉ dùng khi requestType === 'RETURN')
    bankInfo: {
      bankName: {
        type: String,
        default: '',
        trim: true,
      },
      accountNumber: {
        type: String,
        default: '',
        trim: true,
      },
      accountHolder: {
        type: String,
        default: '',
        trim: true,
      },
    },

    // Thông tin liên hệ nhận hàng đổi trả (lấy mặc định từ đơn hàng)
    customerContact: {
      fullName: {
        type: String,
        default: '',
        trim: true,
      },
      phone: {
        type: String,
        default: '',
        trim: true,
      },
      address: {
        type: String,
        default: '',
        trim: true,
      },
    },

    // Số tiền dự kiến hoàn (nếu là Trả hàng)
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Trạng thái yêu cầu:
    // PENDING: Chờ Shop / MBBC tiếp nhận
    // APPROVED: Shop đã duyệt, đồng ý cho khách gửi hàng về kho
    // PROCESSING: Hàng đã về kho, đang kiểm tra tình trạng
    // COMPLETED: Đã hoàn tất (Đã gửi hàng mới hoặc Đã hoàn tiền cho khách)
    // REJECTED: Shop từ chối (có kèm lý do)
    // CANCELLED: Khách hàng chủ động hủy yêu cầu (khi còn PENDING)
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },

    // Phản hồi / Hướng dẫn gửi hàng từ MBBC Admin cho khách
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },

    // Lý do từ chối nếu Admin từ chối yêu cầu
    rejectReason: {
      type: String,
      default: '',
      trim: true,
    },

    // Quản trị viên xử lý
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Thời gian xử lý
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes tối ưu truy vấn
returnRequestSchema.index({ orderId: 1, status: 1 });
returnRequestSchema.index({ userId: 1, createdAt: -1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

module.exports = ReturnRequest;
