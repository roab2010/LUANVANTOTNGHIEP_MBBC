const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
  // Size và màu tại thời điểm mua (có thể rỗng cho đơn hàng cũ / sản phẩm chưa có biến thể)
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
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      fullName: {
        type: String,
        required: [true, 'Vui lòng cung cấp tên khách hàng'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Vui lòng cung cấp số điện thoại'],
        trim: true,
      },
      address: {
        type: String,
        default: '',
        trim: true,
      },
      streetAddress: {
        type: String,
        default: '',
        trim: true,
      },
      province: {
        type: String,
        default: '',
        trim: true,
      },
      provinceId: {
        type: Number,
      },
      district: {
        type: String,
        default: '',
        trim: true,
      },
      districtId: {
        type: Number,
      },
      ward: {
        type: String,
        default: '',
        trim: true,
      },
      wardCode: {
        type: String,
        default: '',
        trim: true,
      },
    },
    items: [orderItemSchema],
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'banking'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm theo mã đơn và thông tin khách hàng
orderSchema.index({ orderCode: 'text', 'customer.fullName': 'text', 'customer.phone': 'text' });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
