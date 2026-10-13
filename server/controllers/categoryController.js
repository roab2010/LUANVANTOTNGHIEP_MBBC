const Category = require('../models/Category');

// ============================================
// LẤY DANH SÁCH DANH MỤC - GET /api/categories
// ============================================
const getCategories = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    // Tạo filter
    const filter = {};

    // Tìm kiếm theo tên
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
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
    const [categories, total] = await Promise.all([
      Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Category.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách danh mục:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY CHI TIẾT DANH MỤC - GET /api/categories/:id
// ============================================
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết danh mục:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// TẠO DANH MỤC MỚI - POST /api/categories
// ============================================
const createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // --- Validate input ---
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên danh mục',
      });
    }

    // Kiểm tra tên danh mục đã tồn tại chưa
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại',
      });
    }

    // --- Tạo danh mục ---
    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || '',
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: { category },
    });
  } catch (error) {
    console.error('Lỗi tạo danh mục:', error);
    // Lỗi duplicate key từ MongoDB (unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// CẬP NHẬT DANH MỤC - PUT /api/categories/:id
// ============================================
const updateCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // --- Validate input ---
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống',
      });
    }

    // Kiểm tra tên trùng (loại trừ chính nó)
    if (name) {
      const existingCategory = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params.id },
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại',
        });
      }
    }

    // --- Tạo object cập nhật ---
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (status !== undefined) updateData.status = status;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: { category },
    });
  } catch (error) {
    console.error('Lỗi cập nhật danh mục:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ',
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XÓA DANH MỤC - DELETE /api/categories/:id
// ============================================
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    res.json({
      success: true,
      message: 'Xóa danh mục thành công',
    });
  } catch (error) {
    console.error('Lỗi xóa danh mục:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID danh mục không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
