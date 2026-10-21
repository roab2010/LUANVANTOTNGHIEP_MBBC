const Order = require('../models/Order');
const Product = require('../models/Product');

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
    const order = await Order.findById(req.params.id);
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

      validatedItems.push({
        product: product._id,
        name: product.name,
        size: itemSize,
        color: itemColor,
        price: product.price,
        quantity: qty,
        total: itemTotal,
      });

      // Lưu product (pre-save hook tính tổng stock nếu có variants)
      await product.save();
    }

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
        address: customer.address?.trim() || '',
      },
      items: validatedItems,
      totalAmount,
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
