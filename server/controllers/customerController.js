const User = require('../models/User');
const { logActivity, diffObjects } = require('../services/activityLogService');

// ============================================
// LẤY DANH SÁCH KHÁCH HÀNG - GET /api/customers
// ============================================
// Lấy tất cả người dùng có role = 'customer'
const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    // Filter mặc định: chỉ lấy tài khoản có role = customer và chưa bị xóa
    const filter = { role: 'customer', status: { $ne: 'deleted' } };

    // Tìm kiếm theo tên, email hoặc số điện thoại
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Lọc theo trạng thái tài khoản: active hoặc blocked
    if (status && ['active', 'blocked'].includes(status)) {
      filter.status = status;
    }

    // Phân trang
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Query không trả password
    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY CHI TIẾT KHÁCH HÀNG - GET /api/customers/:id
// ============================================
const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
      status: { $ne: 'deleted' },
    }).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản khách hàng',
      });
    }

    res.json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết khách hàng:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// CẬP NHẬT THÔNG TIN / TRẠNG THÁI KHÁCH HÀNG - PUT /api/customers/:id
// ============================================
const updateCustomer = async (req, res) => {
  try {
    const { fullName, phone, status } = req.body;

    // Validate status nếu có
    if (status !== undefined && !['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ (chỉ chấp nhận active hoặc blocked)',
      });
    }

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (status !== undefined) updateData.status = status;

    const oldCustomer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
      status: { $ne: 'deleted' },
    });

    if (!oldCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản khách hàng',
      });
    }

    const customer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer', status: { $ne: 'deleted' } },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    const changes = diffObjects(oldCustomer, customer, {
      fullName: 'Họ và tên',
      phone: 'Số điện thoại',
      status: 'Trạng thái tài khoản',
    });

    const isStatusChange = status !== undefined && status !== oldCustomer.status;
    logActivity({
      req,
      action: isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
      module: 'USER',
      targetType: 'User',
      targetId: customer._id,
      targetName: customer.fullName,
      description: isStatusChange
        ? `${status === 'blocked' ? 'Khóa' : 'Kích hoạt/Mở khóa'} tài khoản khách hàng: ${customer.fullName} (${customer.email})`
        : `Cập nhật thông tin khách hàng: ${customer.fullName}`,
      changes,
    });

    const actionMessage =
      status === 'blocked'
        ? 'Đã khóa tài khoản khách hàng'
        : status === 'active'
        ? 'Đã kích hoạt tài khoản khách hàng'
        : 'Cập nhật thông tin khách hàng thành công';

    res.json({
      success: true,
      message: actionMessage,
      data: { customer },
    });
  } catch (error) {
    console.error('Lỗi cập nhật khách hàng:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XÓA TÀI KHOẢN KHÁCH HÀNG (XÓA MỀM) - DELETE /api/customers/:id
// ============================================
const deleteCustomer = async (req, res) => {
  try {
    // Xóa mềm: đổi status = 'deleted' để bảo toàn dữ liệu lịch sử hóa đơn & doanh thu
    const customer = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: 'customer',
        status: { $ne: 'deleted' },
      },
      { status: 'deleted' },
      { new: false }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản khách hàng',
      });
    }

    logActivity({
      req,
      action: 'DELETE',
      module: 'USER',
      targetType: 'User',
      targetId: customer._id,
      targetName: customer.fullName,
      description: `Xóa mềm tài khoản khách hàng: ${customer.fullName} (${customer.email})`,
      changes: [
        {
          field: 'status',
          fieldNameVi: 'Trạng thái',
          oldValue: customer.status,
          newValue: 'deleted',
        },
      ],
    });

    res.json({
      success: true,
      message: 'Xóa tài khoản khách hàng thành công',
    });
  } catch (error) {
    console.error('Lỗi xóa khách hàng:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
