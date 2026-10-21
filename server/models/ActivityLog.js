const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // Người thực hiện hành động
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorName: {
      type: String,
      default: 'Khách vãng lai / Hệ thống',
      trim: true,
    },
    actorRole: {
      type: String,
      enum: ['admin', 'system'],
      default: 'admin',
    },

    // Loại hành động
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'STATUS_CHANGE',
        'STOCK_IN',
        'STOCK_OUT',
      ],
      trim: true,
    },

    // Phân hệ liên quan
    module: {
      type: String,
      required: true,
      enum: [
        'AUTH',
        'USER',
        'PRODUCT',
        'CATEGORY',
        'SUPPLIER',
        'ORDER',
        'INVENTORY',
        'SHIPPING',
        'SYSTEM',
      ],
      trim: true,
    },

    // Đối tượng bị tác động
    targetType: {
      type: String,
      default: '',
      trim: true,
    },
    targetId: {
      type: String,
      default: '',
      trim: true,
    },
    targetName: {
      type: String,
      default: '',
      trim: true,
    },

    // Mô tả chi tiết bằng tiếng Việt
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Thay đổi dữ liệu trước/sau (chỉ lưu trường cần thiết, đã lọc bỏ mật khẩu & dữ liệu nhạy cảm)
    changes: [
      {
        field: { type: String, required: true },
        fieldNameVi: { type: String, default: '' },
        oldValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed },
      },
    ],

    // Kết quả thao tác
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS',
    },

    // Thông tin kỹ thuật an toàn
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },

    // Dữ liệu bổ sung có cấu trúc (nếu cần thiết)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Chỉ cần createdAt, log không được sửa
  }
);

// Indexes phục vụ lọc và tìm kiếm nhanh
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ module: 1, action: 1 });
activityLogSchema.index({ actorId: 1 });
activityLogSchema.index({ actorRole: 1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ status: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
