const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { uploadToCloudinary } = require('../config/cloudinary');

// ============================================
// HELPER SINH MÃ PHIẾU ĐỔI TRẢ
// Format: DT-YYMMDD-XXXX (Ví dụ: DT-261126-7842)
// ============================================
const generateReturnCode = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `DT-${year}${month}${day}-${random}`;
};

// ============================================
// 1. KIỂM TRA ĐIỀU KIỆN ĐỔI TRẢ CỦA ĐƠN HÀNG
// GET /api/returns/order-eligibility/:orderId
// ============================================
const checkOrderReturnEligibility = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    const order = await Order.findById(orderId).populate('items.product', 'name images image stock variants');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn hàng',
      });
    }

    // Xác thực quyền sở hữu đơn hàng
    const orderCustomerId = order.customer?.customerId ? order.customer.customerId.toString() : '';
    if (orderCustomerId !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập đơn hàng này',
      });
    }

    // Đơn hàng phải ở trạng thái Giao thành công (delivered)
    if (order.status !== 'delivered') {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Chỉ đơn hàng đã giao thành công mới có thể gửi yêu cầu đổi trả.',
        },
      });
    }

    // Kiểm tra xem đơn hàng đã có yêu cầu đổi trả nào đang hoạt động chưa
    const activeReturn = await ReturnRequest.findOne({
      orderId: order._id,
      status: { $in: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED'] },
    });

    if (activeReturn) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: `Đơn hàng này đã có phiếu yêu cầu đổi/trả (${activeReturn.returnCode}) với trạng thái ${activeReturn.status}.`,
          existingReturn: activeReturn,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        eligible: true,
        order: {
          _id: order._id,
          orderCode: order.orderCode,
          deliveredAt: order.updatedAt,
          items: order.items,
          customer: order.customer,
          totalAmount: order.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi kiểm tra điều kiện đổi trả:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra điều kiện đổi trả',
    });
  }
};

// ============================================
// 2. TẠO YÊU CẦU ĐỔI TRẢ MỚI
// POST /api/returns
// ============================================
const createReturnRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      orderId,
      requestType = 'EXCHANGE',
      reason = 'DEFECTIVE',
      reasonDetail,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đơn hàng',
      });
    }

    if (!reasonDetail || reasonDetail.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mô tả chi tiết lý do (tối thiểu 5 ký tự)',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng cần đổi trả',
      });
    }

    const orderCustomerId = order.customer?.customerId ? order.customer.customerId.toString() : '';
    if (orderCustomerId !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không thể tạo yêu cầu đổi trả cho đơn hàng của người khác',
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể yêu cầu đổi trả cho đơn hàng đã giao thành công',
      });
    }

    // Chặn trùng yêu cầu đang xử lý
    const activeReturn = await ReturnRequest.findOne({
      orderId: order._id,
      status: { $in: ['PENDING', 'APPROVED', 'PROCESSING'] },
    });
    if (activeReturn) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng này đang có yêu cầu đổi trả (${activeReturn.returnCode}) đang chờ xử lý.`,
      });
    }

    // Parse items
    let parsedItems = [];
    try {
      parsedItems = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu danh sách sản phẩm không hợp lệ',
      });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 sản phẩm cần đổi/trả',
      });
    }

    // Parse bankInfo nếu là Trả hàng hoàn tiền
    let bankInfo = { bankName: '', accountNumber: '', accountHolder: '' };
    if (requestType === 'RETURN') {
      try {
        const b = typeof req.body.bankInfo === 'string' ? JSON.parse(req.body.bankInfo) : req.body.bankInfo;
        if (b) {
          bankInfo = {
            bankName: (b.bankName || '').trim(),
            accountNumber: (b.accountNumber || '').trim(),
            accountHolder: (b.accountHolder || '').trim().toUpperCase(),
          };
        }
      } catch (e) {
        // bỏ qua
      }

      if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin tài khoản ngân hàng để nhận tiền hoàn (Tên ngân hàng, Số tài khoản, Chủ tài khoản)',
        });
      }
    }

    // Parse customerContact
    let customerContact = {
      fullName: order.customer?.fullName || '',
      phone: order.customer?.phone || '',
      address: order.customer?.address || '',
    };
    if (req.body.customerContact) {
      try {
        const c = typeof req.body.customerContact === 'string' ? JSON.parse(req.body.customerContact) : req.body.customerContact;
        if (c) {
          customerContact.fullName = c.fullName?.trim() || customerContact.fullName;
          customerContact.phone = c.phone?.trim() || customerContact.phone;
          customerContact.address = c.address?.trim() || customerContact.address;
        }
      } catch (e) {
        // bỏ qua
      }
    }

    // Tính toán refundAmount và chuẩn hóa items
    let calculatedRefundAmount = 0;
    const finalItems = [];

    for (const it of parsedItems) {
      const originalItem = order.items.find(
        (oi) => oi.product?.toString() === (it.productId || it.product?._id || it.product)?.toString()
      );

      const qty = Number(it.quantity) || 1;
      const unitPrice = originalItem ? originalItem.price : Number(it.price) || 0;
      const itemTotal = unitPrice * qty;

      if (requestType === 'RETURN') {
        calculatedRefundAmount += itemTotal;
      }

      finalItems.push({
        product: originalItem?.product || it.productId || it.product,
        name: originalItem?.name || it.name || 'Sản phẩm',
        image: it.image || originalItem?.image || '',
        size: it.size || originalItem?.size || '',
        color: it.color || originalItem?.color || '',
        price: unitPrice,
        quantity: qty,
        exchangeSize: it.exchangeSize || '',
        exchangeColor: it.exchangeColor || '',
        itemReason: it.itemReason || '',
      });
    }

    // Xử lý hình ảnh minh chứng
    const uploadedImages = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files.slice(0, 5)) {
        try {
          const uploadResult = await uploadToCloudinary(file.buffer, 'sellstock/returns');
          if (uploadResult && uploadResult.secure_url) {
            uploadedImages.push(uploadResult.secure_url);
          }
        } catch (uploadErr) {
          console.warn('Lỗi tải ảnh lên Cloudinary (sử dụng base64 fallback):', uploadErr.message);
          const base64Str = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          uploadedImages.push(base64Str);
        }
      }
    } else if (req.body.images) {
      try {
        const parsed = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(parsed)) {
          uploadedImages.push(...parsed.slice(0, 5));
        }
      } catch (e) {
        // bỏ qua
      }
    }

    // Tạo mã phiếu đổi trả duy nhất
    let returnCode = generateReturnCode();
    let isCodeExists = await ReturnRequest.findOne({ returnCode });
    while (isCodeExists) {
      returnCode = generateReturnCode();
      isCodeExists = await ReturnRequest.findOne({ returnCode });
    }

    const returnRequest = new ReturnRequest({
      returnCode,
      orderId: order._id,
      userId,
      requestType,
      items: finalItems,
      reason,
      reasonDetail: reasonDetail.trim(),
      images: uploadedImages,
      bankInfo,
      customerContact,
      refundAmount: calculatedRefundAmount,
      status: 'PENDING',
    });

    await returnRequest.save();

    return res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu đổi trả thành công. MBBC Store sẽ liên hệ kiểm tra và xử lý trong thời gian sớm nhất!',
      data: returnRequest,
    });
  } catch (error) {
    console.error('Lỗi tạo yêu cầu đổi trả:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi yêu cầu đổi trả',
      error: error.message,
    });
  }
};

// ============================================
// 3. LẤY DANH SÁCH YÊU CẦU ĐỔI TRẢ CỦA TÔI
// GET /api/returns/my-returns
// ============================================
const getMyReturnRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId };
    if (status && ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(status)) {
      filter.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [returns, total] = await Promise.all([
      ReturnRequest.find(filter)
        .populate('orderId', 'orderCode status createdAt totalAmount items')
        .populate('items.product', 'name images image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReturnRequest.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        returns,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách yêu cầu đổi trả của tôi:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách yêu cầu đổi trả',
    });
  }
};

// ============================================
// 4. LẤY CHI TIẾT 1 YÊU CẦU ĐỔI TRẢ
// GET /api/returns/:id
// ============================================
const getReturnRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const returnRequest = await ReturnRequest.findById(id)
      .populate('orderId', 'orderCode status createdAt totalAmount shippingFee items customer')
      .populate('items.product', 'name images image price');

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đổi trả',
      });
    }

    // Quyền truy cập: Chỉ khách hàng sở hữu hoặc Admin
    if (returnRequest.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem yêu cầu đổi trả này',
      });
    }

    return res.json({
      success: true,
      data: returnRequest,
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết yêu cầu đổi trả:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải chi tiết yêu cầu đổi trả',
    });
  }
};

// ============================================
// 5. KHÁCH HÀNG HỦY YÊU CẦU ĐỔI TRẢ
// PATCH /api/returns/:id/cancel
// ============================================
const cancelMyReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const returnRequest = await ReturnRequest.findById(id);
    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đổi trả',
      });
    }

    if (returnRequest.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thao tác trên yêu cầu này',
      });
    }

    if (returnRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy yêu cầu khi đang ở trạng thái Chờ duyệt (PENDING)',
      });
    }

    returnRequest.status = 'CANCELLED';
    await returnRequest.save();

    return res.json({
      success: true,
      message: 'Đã hủy yêu cầu đổi trả thành công',
      data: returnRequest,
    });
  } catch (error) {
    console.error('Lỗi hủy yêu cầu đổi trả:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy yêu cầu đổi trả',
    });
  }
};

module.exports = {
  checkOrderReturnEligibility,
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  cancelMyReturnRequest,
};
