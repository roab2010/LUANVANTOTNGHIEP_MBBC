const Category = require('../models/Category');
const Product = require('../models/Product');
const { logActivity, diffObjects } = require('../services/activityLogService');

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

    // Query danh mục + đếm sản phẩm theo tên danh mục
    const [categories, total, productCounts] = await Promise.all([
      Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Category.countDocuments(filter),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    // Map đếm sản phẩm theo tên danh mục
    const countMap = {};
    productCounts.forEach((item) => {
      if (item._id) countMap[item._id] = item.count;
    });

    // Gắn productCount vào từng danh mục
    const categoriesWithCount = categories.map((cat) => ({
      ...cat.toObject(),
      productCount: countMap[cat.name] || 0,
    }));

    res.json({
      success: true,
      data: {
        categories: categoriesWithCount,
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

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục phải có từ 2 đến 50 ký tự',
      });
    }

    if (description && description.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả danh mục tối đa 200 ký tự',
      });
    }

    // Kiểm tra tên danh mục đã tồn tại chưa (không phân biệt hoa/thường và khoảng trắng)
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục đã tồn tại',
      });
    }

    // --- Tạo danh mục (luôn mặc định active, không cho phép đổi qua createCategory) ---
    const category = await Category.create({
      name: trimmedName,
      description: description?.trim() || '',
      status: 'active',
    });

    logActivity({
      req,
      action: 'CREATE',
      module: 'CATEGORY',
      targetType: 'Category',
      targetId: category._id,
      targetName: category.name,
      description: `Tạo mới danh mục sản phẩm: "${category.name}"`,
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
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    const oldCategorySnapshot = {
      name: category.name,
      description: category.description,
    };

    const oldName = category.name;
    let isNameChanged = false;

    // --- Validate & kiểm tra trùng tên ---
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục không được để trống',
        });
      }

      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục phải có từ 2 đến 50 ký tự',
        });
      }

      // Kiểm tra tên trùng (loại trừ chính nó, so sánh không phân biệt chữ hoa/thường hoặc khoảng trắng thừa)
      const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại',
        });
      }

      if (trimmedName !== oldName) {
        isNameChanged = true;
      }
      category.name = trimmedName;
    }

    if (description !== undefined) {
      if (description.trim().length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Mô tả danh mục tối đa 200 ký tự',
        });
      }
      category.description = description.trim();
    }

    await category.save();

    // NẾU TÊN DANH MỤC THAY ĐỔI: Tự động cập nhật toàn bộ sản phẩm đang thuộc danh mục đó để giữ nguyên liên kết
    if (isNameChanged && oldName) {
      const escapedOldName = oldName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await Product.updateMany(
        { category: { $regex: new RegExp(`^${escapedOldName}$`, 'i') } },
        { category: category.name }
      );
    }

    const categoryChanges = diffObjects(oldCategorySnapshot, category, {
      name: 'Tên danh mục',
      description: 'Mô tả danh mục',
    });

    logActivity({
      req,
      action: 'UPDATE',
      module: 'CATEGORY',
      targetType: 'Category',
      targetId: category._id,
      targetName: category.name,
      description: `Cập nhật thông tin danh mục: "${category.name}"`,
      changes: categoryChanges,
    });

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
// KHÓA / MỞ KHÓA DANH MỤC - PATCH /api/categories/:id/toggle-status
// ============================================
const toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    const oldStatus = category.status;
    const nextStatus = oldStatus === 'active' ? 'inactive' : 'active';
    category.status = nextStatus;
    await category.save();

    const actionText = nextStatus === 'active' ? 'Mở khóa' : 'Khóa';

    logActivity({
      req,
      action: 'STATUS_CHANGE',
      module: 'CATEGORY',
      targetType: 'Category',
      targetId: category._id,
      targetName: category.name,
      description: `${actionText} danh mục sản phẩm: "${category.name}"`,
      changes: [
        {
          field: 'status',
          fieldNameVi: 'Trạng thái hoạt động',
          oldValue: oldStatus,
          newValue: nextStatus,
        },
      ],
    });

    res.json({
      success: true,
      message: `${actionText} danh mục thành công`,
      data: { category },
    });
  } catch (error) {
    console.error('Lỗi thay đổi trạng thái danh mục:', error);
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
// KHÓA DANH MỤC (BẢO TOÀN LƯU VẾT) - DELETE /api/categories/:id
// ============================================
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    logActivity({
      req,
      action: 'STATUS_CHANGE',
      module: 'CATEGORY',
      targetType: 'Category',
      targetId: category._id,
      targetName: category.name,
      description: `Khóa danh mục: "${category.name}" (Bảo toàn dữ liệu sản phẩm)`,
      changes: [
        {
          field: 'status',
          fieldNameVi: 'Trạng thái',
          oldValue: 'active',
          newValue: 'inactive',
        },
      ],
    });

    res.json({
      success: true,
      message: 'Khóa danh mục thành công, dữ liệu lịch sử sản phẩm đã được bảo toàn',
      data: { category },
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

// ============================================
// LẤY DANH MỤC CÔNG KHAI (CHỈ ACTIVE CHO KHÁCH HÀNG) - GET /api/categories/public
// ============================================
const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' })
      .select('name description')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Lỗi lấy danh mục công khai:', error);
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
  toggleCategoryStatus,
  deleteCategory,
  getPublicCategories,
};
