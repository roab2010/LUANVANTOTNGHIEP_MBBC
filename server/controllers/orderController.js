const Order = require('../models/Order');
const Product = require('../models/Product');

// ============================================
// LẤY DANH SÁCH ĐƠN HÀNG - GET /api/orders
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
// TẠO ĐƠN HÀNG MỚI - POST /api/orders
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

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy sản phẩm mã ${item.product}`,
        });
      }

      const qty = parseInt(item.quantity) || 1;
      if (qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Số lượng sản phẩm "${product.name}" phải lớn hơn 0`,
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} cái trong kho, không đủ đáp ứng`,
        });
      }

      const itemTotal = product.price * qty;
      totalAmount += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        total: itemTotal,
      });

      // Giảm tồn kho sản phẩm
      product.stock -= qty;
      await product.save();
    }

    // Sinh mã đơn hàng tự động DH-xxxx
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `DH-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const order = await Order.create({
      orderCode,
      customer: {
        customerId: customer.customerId || null,
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
      message: 'Tạo đơn hàng thành công',
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
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    // Nếu đơn hàng từ cancelled được phục hồi sang trạng thái khác -> trừ lại stock
    if (oldStatus === 'cancelled' && status && status !== 'cancelled') {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
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
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
