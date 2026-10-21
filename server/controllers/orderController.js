const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/Review');
const ghnService = require('../services/ghnService');
const { logActivity } = require('../services/activityLogService');

// ============================================
// LẤY DANH SÁCH ĐƠN HÀNG (ADMIN) - GET /api/orders
// ============================================
const getOrders = async (req, res) => {
  try {
    const { search, status, paymentStatus, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { 'customer.fullName': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && ['pending', 'processing', 'shipping', 'delivered', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    if (paymentStatus && ['unpaid', 'paid'].includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name image images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY ĐƠN HÀNG CỦA KHÁCH HÀNG - GET /api/orders/my-orders
// ============================================
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { 'customer.customerId': userId };

    if (status && ['pending', 'processing', 'shipping', 'delivered', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name image images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Lấy danh sách ID các đơn hàng có trạng thái 'delivered'
    const deliveredOrderIds = orders
      .filter((o) => o.status === 'delivered')
      .map((o) => o._id);

    const reviewMap = new Map();
    if (deliveredOrderIds.length > 0) {
      const existingReviews = await Review.find({
        userId,
        orderId: { $in: deliveredOrderIds },
        status: { $ne: 'DELETED' },
      })
        .select('orderId productId status rating')
        .lean();

      existingReviews.forEach((r) => {
        const key = `${r.orderId.toString()}_${r.productId.toString()}`;
        reviewMap.set(key, r);
      });
    }

    // Đính kèm trạng thái isReviewed vào từng sản phẩm trong đơn hàng
    const formattedOrders = orders.map((ord) => {
      const items = (ord.items || []).map((it) => {
        const prodId = it.product?._id ? it.product._id.toString() : (it.product ? it.product.toString() : '');
        const key = `${ord._id.toString()}_${prodId}`;
        const matchedReview = reviewMap.get(key);

        return {
          ...it,
          isReviewed: !!matchedReview,
          reviewStatus: matchedReview?.status || null,
          reviewRating: matchedReview?.rating || null,
        };
      });

      return {
        ...ord,
        items,
      };
    });

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy đơn hàng khách hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY CHI TIẾT ĐƠN HÀNG - GET /api/orders/:id
// ============================================
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name image images');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Nếu là customer, chỉ xem được đơn của chính mình
    if (req.user.role === 'customer') {
      if (!order.customer.customerId || order.customer.customerId.toString() !== req.user.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem đơn hàng này',
        });
      }
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Mã ID đơn hàng không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// TẠO ĐƠN HÀNG MỚI (CUSTOMER CHECKOUT) - POST /api/orders
// ============================================
const createOrder = async (req, res) => {
  try {
    const { customer, items, paymentMethod, notes } = req.body;

    if (!customer || !customer.fullName || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp họ tên và số điện thoại khách hàng',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng phải có ít nhất một sản phẩm',
      });
    }

    // Kiểm tra và tính tiền từng sản phẩm
    let totalAmount = 0;
    const validatedItems = [];
    // Lưu thay đổi để rollback nếu cần
    const stockChanges = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy sản phẩm mã ${item.product}`,
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" hiện đang ngừng bán`,
        });
      }

      const qty = parseInt(item.quantity) || 1;
      if (qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Số lượng sản phẩm "${product.name}" phải lớn hơn 0`,
        });
      }

      const hasVariants = product.variants && product.variants.length > 0;
      const itemSize = item.size ? item.size.trim() : '';
      const itemColor = item.color ? item.color.trim() : '';

      if (hasVariants) {
        // Sản phẩm có biến thể → bắt buộc chọn size + color
        if (!itemSize || !itemColor) {
          return res.status(400).json({
            success: false,
            message: `Vui lòng chọn size và màu sắc cho sản phẩm "${product.name}"`,
          });
        }

        const variant = product.variants.find(
          (v) => v.size === itemSize && v.color === itemColor
        );
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Biến thể size "${itemSize}" - màu "${itemColor}" không tồn tại cho sản phẩm "${product.name}"`,
          });
        }

        if ((variant.stock || 0) < qty) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm "${product.name}" (size ${itemSize}, màu ${itemColor}) chỉ còn ${variant.stock} ${product.unit || 'cái'} trong kho`,
          });
        }

        // Trừ stock biến thể
        variant.stock -= qty;
        stockChanges.push({ product, qty, itemSize, itemColor, hasVariants: true });
      } else {
        // Sản phẩm không có biến thể → kiểm tra stock chung
        if (product.stock < qty) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} ${product.unit || 'cái'} trong kho, không đủ đáp ứng`,
          });
        }

        // Trừ stock chung
        product.stock -= qty;
        stockChanges.push({ product, qty, itemSize, itemColor, hasVariants: false });
      }

      const itemTotal = product.price * qty;
      totalAmount += itemTotal;

      const itemImg = product.image || (Array.isArray(product.images) && product.images[0]) || '';

      validatedItems.push({
        product: product._id,
        name: product.name,
        image: itemImg,
        size: itemSize,
        color: itemColor,
        price: product.price,
        quantity: qty,
        total: itemTotal,
      });

      // Lưu product (pre-save hook tính tổng stock nếu có variants)
      await product.save();
    }

    // Xác thực phí vận chuyển GHN tại backend nếu có thông tin quận/huyện và phường/xã
    let shippingFee = 0;
    if (customer.districtId && customer.wardCode) {
      try {
        const feeResult = await ghnService.calculateShippingFee({
          toDistrictId: customer.districtId,
          toWardCode: customer.wardCode,
          items: validatedItems,
          insuranceValue: totalAmount,
        });
        shippingFee = feeResult.total || 0;
      } catch (ghnErr) {
        return res.status(400).json({
          success: false,
          message: `Lỗi tính phí vận chuyển từ GHN: ${ghnErr.message}`,
        });
      }
    }

    const grandTotal = totalAmount + shippingFee;

    // Sinh mã đơn hàng tự động DH-xxxx
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `DH-${Date.now().toString().slice(-4)}${randomSuffix}`;

    // Lấy customerId từ token nếu có (customer đăng nhập checkout)
    const customerId = customer.customerId || req.user?.userId || null;

    const order = await Order.create({
      orderCode,
      customer: {
        customerId,
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        address:
          customer.address?.trim() ||
          [customer.streetAddress, customer.ward, customer.district, customer.province]
            .filter(Boolean)
            .join(', '),
        streetAddress: customer.streetAddress?.trim() || '',
        province: customer.province?.trim() || '',
        provinceId: customer.provinceId ? Number(customer.provinceId) : undefined,
        district: customer.district?.trim() || '',
        districtId: customer.districtId ? Number(customer.districtId) : undefined,
        ward: customer.ward?.trim() || '',
        wardCode: customer.wardCode ? String(customer.wardCode) : '',
      },
      items: validatedItems,
      shippingFee,
      totalAmount: grandTotal,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'banking' ? 'paid' : 'unpaid',
      status: 'pending',
      notes: notes?.trim() || '',
    });

    res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: { order },
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG - PUT /api/orders/:id/status
// ============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    const oldStatus = order.status;
    const oldPaymentStatus = order.paymentStatus;

    // Nếu đơn hàng bị hủy -> hoàn lại số lượng tồn kho cho các sản phẩm
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            const hasVariants = product.variants && product.variants.length > 0;
            if (hasVariants && item.size && item.color) {
              // Hoàn stock cho biến thể cụ thể
              const variant = product.variants.find(
                (v) => v.size === item.size && v.color === item.color
              );
              if (variant) {
                variant.stock += item.quantity;
              }
            } else {
              // Hoàn stock chung
              product.stock += item.quantity;
            }
            await product.save();
          }
        }
      }
    }

    // Nếu đơn hàng từ cancelled được phục hồi sang trạng thái khác -> trừ lại stock
    if (oldStatus === 'cancelled' && status && status !== 'cancelled') {
      for (const item of order.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            const hasVariants = product.variants && product.variants.length > 0;
            if (hasVariants && item.size && item.color) {
              const variant = product.variants.find(
                (v) => v.size === item.size && v.color === item.color
              );
              if (variant) {
                variant.stock -= item.quantity;
              }
            } else {
              product.stock -= item.quantity;
            }
            await product.save();
          }
        }
      }
    }

    if (status) {
      order.status = status;
      // Nếu đã giao hàng thành công -> thanh toán cũng coi như đã xong
      if (status === 'delivered') {
        order.paymentStatus = 'paid';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    const orderChanges = [];
    if (status && status !== oldStatus) {
      orderChanges.push({
        field: 'status',
        fieldNameVi: 'Trạng thái đơn hàng',
        oldValue: oldStatus,
        newValue: order.status,
      });
    }
    if (paymentStatus && paymentStatus !== oldPaymentStatus) {
      orderChanges.push({
        field: 'paymentStatus',
        fieldNameVi: 'Trạng thái thanh toán',
        oldValue: oldPaymentStatus,
        newValue: order.paymentStatus,
      });
    }

    logActivity({
      req,
      action: 'STATUS_CHANGE',
      module: 'ORDER',
      targetType: 'Order',
      targetId: order._id,
      targetName: order.orderCode,
      description: `Cập nhật đơn hàng "${order.orderCode}": Trạng thái [${oldStatus} → ${order.status}], Thanh toán [${oldPaymentStatus} → ${order.paymentStatus}]`,
      changes: orderChanges,
    });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: { order },
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XÓA ĐƠN HÀNG - DELETE /api/orders/:id
// ============================================
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Chỉ cho phép xóa đơn hàng đã bị hủy
    if (order.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa đơn hàng có trạng thái "Đã hủy"',
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    logActivity({
      req,
      action: 'DELETE',
      module: 'ORDER',
      targetType: 'Order',
      targetId: order._id,
      targetName: order.orderCode,
      description: `Xóa vĩnh viễn đơn hàng đã hủy "${order.orderCode}" của khách hàng ${order.customer?.fullName || ''}`,
      metadata: {
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
      },
    });

    res.json({
      success: true,
      message: 'Xóa đơn hàng thành công',
    });
  } catch (error) {
    console.error('Lỗi xóa đơn hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
