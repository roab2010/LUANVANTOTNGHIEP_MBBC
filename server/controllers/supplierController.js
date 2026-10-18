const Supplier = require('../models/Supplier');

// ============================================
// LẤY DANH SÁCH NHÀ CUNG CẤP - GET /api/suppliers
// ============================================
const getSuppliers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Supplier.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhà cung cấp:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY CHI TIẾT NHÀ CUNG CẤP - GET /api/suppliers/:id
// ============================================
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
      });
    }

    res.json({
      success: true,
      data: { supplier },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết nhà cung cấp:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID nhà cung cấp không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// TẠO NHÀ CUNG CẤP MỚI - POST /api/suppliers
// ============================================
const createSupplier = async (req, res) => {
  try {
    const { name, phone, address, note, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên nhà cung cấp',
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp không được vượt quá 100 ký tự',
      });
    }

    if (phone && phone.trim().length > 11) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không được vượt quá 11 ký tự',
      });
    }

    if (address && address.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ không được vượt quá 200 ký tự',
      });
    }

    if (note && note.trim().length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được vượt quá 300 ký tự',
      });
    }

    const existingSupplier = await Supplier.findOne({ name: name.trim() });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp này đã tồn tại',
      });
    }

    // Kiểm tra không trùng số điện thoại nếu có nhập
    if (phone && phone.trim()) {
      const existingPhone = await Supplier.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại này đã được sử dụng bởi nhà cung cấp khác',
        });
      }
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      note: note?.trim() || '',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo nhà cung cấp thành công',
      data: { supplier },
    });
  } catch (error) {
    console.error('Lỗi tạo nhà cung cấp:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// CẬP NHẬT NHÀ CUNG CẤP - PUT /api/suppliers/:id
// ============================================
const updateSupplier = async (req, res) => {
  try {
    const { name, phone, address, note, status } = req.body;

    const existingSupplier = await Supplier.findById(req.params.id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
      });
    }

    if (name && name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tên nhà cung cấp không được vượt quá 100 ký tự',
      });
    }

    if (phone && phone.trim().length > 11) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không được vượt quá 11 ký tự',
      });
    }

    if (address && address.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ không được vượt quá 200 ký tự',
      });
    }

    if (note && note.trim().length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được vượt quá 300 ký tự',
      });
    }

    // Kiểm tra không trùng tên với nhà cung cấp khác
    if (name && name.trim() !== existingSupplier.name) {
      const duplicateName = await Supplier.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (duplicateName) {
        return res.status(400).json({
          success: false,
          message: 'Tên nhà cung cấp này đã tồn tại',
        });
      }
    }

    // Kiểm tra không trùng số điện thoại với nhà cung cấp khác
    if (phone && phone.trim() && phone.trim() !== existingSupplier.phone) {
      const duplicatePhone = await Supplier.findOne({
        phone: phone.trim(),
        _id: { $ne: req.params.id },
      });
      if (duplicatePhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại này đã được sử dụng bởi nhà cung cấp khác',
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (note !== undefined) updateData.note = note.trim();
    if (status !== undefined) updateData.status = status;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật nhà cung cấp thành công',
      data: { supplier },
    });
  } catch (error) {
    console.error('Lỗi cập nhật nhà cung cấp:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID nhà cung cấp không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XÓA NHÀ CUNG CẤP - DELETE /api/suppliers/:id
// ============================================
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
      });
    }

    res.json({
      success: true,
      message: 'Xóa nhà cung cấp thành công',
    });
  } catch (error) {
    console.error('Lỗi xóa nhà cung cấp:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID nhà cung cấp không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
