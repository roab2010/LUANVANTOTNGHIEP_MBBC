const Customer = require('../models/Customer');

// ============================================
// LẤY DANH SÁCH KHÁCH HÀNG - GET /api/customers
// ============================================
const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    // Tạo filter
    const filter = {};

    // Tìm kiếm theo tên hoặc số điện thoại
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Lọc theo trạng thái
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }

    // Phân trang
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Query
    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(filter),
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
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng',
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
// TẠO KHÁCH HÀNG MỚI - POST /api/customers
// ============================================
const createCustomer = async (req, res) => {
  try {
    const { fullName, phone, email, address, gender, notes, status } = req.body;

    // --- Validate input ---
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập họ tên khách hàng',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại',
      });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingCustomer = await Customer.findOne({ phone: phone.trim() });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã tồn tại trong hệ thống',
      });
    }

    // --- Tạo khách hàng ---
    const customer = await Customer.create({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email?.trim() || '',
      address: address?.trim() || '',
      gender: gender || 'female',
      notes: notes?.trim() || '',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Thêm khách hàng thành công',
      data: { customer },
    });
  } catch (error) {
    console.error('Lỗi tạo khách hàng:', error);
    // Lỗi duplicate key từ MongoDB (unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã tồn tại trong hệ thống',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// CẬP NHẬT KHÁCH HÀNG - PUT /api/customers/:id
// ============================================
const updateCustomer = async (req, res) => {
  try {
    const { fullName, phone, email, address, gender, notes, status } = req.body;

    // --- Validate input ---
    if (fullName !== undefined && !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Họ tên không được để trống',
      });
    }

    if (phone !== undefined && !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không được để trống',
      });
    }

    // Kiểm tra số điện thoại trùng (loại trừ chính nó)
    if (phone) {
      const existingCustomer = await Customer.findOne({
        phone: phone.trim(),
        _id: { $ne: req.params.id },
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã tồn tại trong hệ thống',
        });
      }
    }

    // --- Tạo object cập nhật ---
    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (gender !== undefined) updateData.gender = gender;
    if (notes !== undefined) updateData.notes = notes.trim();
    if (status !== undefined) updateData.status = status;

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật khách hàng thành công',
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại đã tồn tại trong hệ thống',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XÓA KHÁCH HÀNG - DELETE /api/customers/:id
// ============================================
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng',
      });
    }

    res.json({
      success: true,
      message: 'Xóa khách hàng thành công',
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
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
