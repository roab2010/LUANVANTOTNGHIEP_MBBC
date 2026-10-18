const Product = require('../models/Product');

// ============================================
// LẤY DANH SÁCH SẢN PHẨM - GET /api/products
// ============================================
const getProducts = async (req, res) => {
  try {
    const { search, status, stockStatus, category, page = 1, limit = 10 } = req.query;

    // Tạo filter
    const filter = {};

    // Tìm kiếm theo tên
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Lọc theo danh mục
    if (category && category !== 'ALL') {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Lọc theo trạng thái kinh doanh
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }

    // Lọc theo tình trạng tồn kho
    if (stockStatus === 'out_of_stock') {
      filter.stock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      filter.stock = { $gt: 0, $lte: 10 };
    } else if (stockStatus === 'in_stock') {
      filter.stock = { $gt: 10 };
    }

    // Phân trang
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('supplier', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY CHI TIẾT SẢN PHẨM - GET /api/products/:id
// ============================================
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name phone address');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    res.json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    // Trường hợp ID không hợp lệ
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// TẠO SẢN PHẨM MỚI - POST /api/products
// ============================================
const createProduct = async (req, res) => {
  try {
    const { name, description, price, costPrice, stock, unit, category, supplier, status } = req.body;

    // --- Validate input ---
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên sản phẩm',
      });
    }

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập giá bán',
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá bán không được âm',
      });
    }

    if (costPrice !== undefined && Number(costPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá nhập không được âm',
      });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không được âm',
      });
    }

    // --- Xử lý ảnh ---
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path;
    }

    // --- Tạo sản phẩm ---
    const product = await Product.create({
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      stock: stock !== undefined ? Number(stock) : 0,
      unit: unit?.trim() || 'cái',
      category: category?.trim() || '',
      supplier: supplier ? supplier : null,
      status: status || 'active',
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: { product },
    });
  } catch (error) {
    console.error('Lỗi tạo sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// CẬP NHẬT SẢN PHẨM - PUT /api/products/:id
// ============================================
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, costPrice, stock, unit, category, supplier, status } = req.body;

    // --- Validate input ---
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm không được để trống',
      });
    }

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá bán không được âm',
      });
    }

    if (costPrice !== undefined && Number(costPrice) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá nhập không được âm',
      });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không được âm',
      });
    }

    // --- Tìm và cập nhật ---
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (unit !== undefined) updateData.unit = unit.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (supplier !== undefined) updateData.supplier = supplier ? supplier : null;
    if (status !== undefined) updateData.status = status;

    // Lấy thông tin sản phẩm cũ để xử lý ảnh (tùy chọn xóa trên cloudinary nếu cần thiết, ở đây tạm thời bỏ qua phần xóa ảnh cũ trên cloudinary để giữ code đơn giản, hoặc có thể thêm thư viện để xóa)
    // Nếu có file mới tải lên, lấy url mới
    if (req.file) {
      updateData.image = req.file.path;
    } else if (req.body.removeImage === 'true') {
      // Nếu user chủ động xóa ảnh
      updateData.image = '';
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('supplier', 'name phone address');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: { product },
    });
  } catch (error) {
    console.error('Lỗi cập nhật sản phẩm:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XÓA SẢN PHẨM - DELETE /api/products/:id
// ============================================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công',
    });
  } catch (error) {
    console.error('Lỗi xóa sản phẩm:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
