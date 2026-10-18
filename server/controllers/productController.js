const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');

// Helper: Kiểm tra request có phải từ Admin có token hợp lệ không
const checkIsAdmin = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('role status');
    return !!(user && user.status === 'active' && user.role === 'admin');
  } catch (err) {
    return false;
  }
};

// ============================================
// LẤY DANH SÁCH SẢN PHẨM - GET /api/products
// ============================================
const getProducts = async (req, res) => {
  try {
    const { search, status, stockStatus, category, includeLocked, page = 1, limit = 10 } = req.query;

    // Tạo filter
    const filter = {};

    // Tìm kiếm theo tên
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
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

    // Phân quyền: Kiểm tra Admin có yêu cầu xem cả danh mục bị khóa không
    const isAdmin = await checkIsAdmin(req);
    const allowLocked = isAdmin && (includeLocked === 'true' || includeLocked === true);

    if (!allowLocked) {
      // Ẩn toàn bộ sản phẩm thuộc danh mục bị khóa (áp dụng cho khách hàng & API công khai)
      const inactiveCategories = await Category.find({ status: 'inactive' }).select('name').lean();
      const inactiveCatNames = inactiveCategories.map((c) => c.name);

      if (inactiveCatNames.length > 0) {
        if (category && category !== 'ALL') {
          const isCategoryLocked = inactiveCatNames.some(
            (cName) => cName.toLowerCase() === category.trim().toLowerCase()
          );
          if (isCategoryLocked) {
            // Danh mục khách hàng lọc đang bị khóa -> Không hiển thị bất kỳ sản phẩm nào
            return res.json({
              success: true,
              data: {
                products: [],
                pagination: {
                  page: parseInt(page) || 1,
                  limit: parseInt(limit) || 10,
                  total: 0,
                  totalPages: 0,
                },
              },
            });
          }
          filter.category = {
            $regex: new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            $nin: inactiveCatNames,
          };
        } else {
          filter.category = { $nin: inactiveCatNames };
        }
      } else if (category && category !== 'ALL') {
        filter.category = { $regex: new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      }
    } else {
      // Cho phép Admin xem tất cả danh mục (bao gồm cả danh mục bị khóa)
      if (category && category !== 'ALL') {
        filter.category = { $regex: new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      }
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

    // Kiểm tra nếu danh mục của sản phẩm bị khóa và người xem không phải admin
    if (product.category) {
      const cat = await Category.findOne({
        name: { $regex: new RegExp(`^${product.category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (cat && cat.status === 'inactive') {
        const isAdmin = await checkIsAdmin(req);
        if (!isAdmin) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy sản phẩm',
          });
        }
      }
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

    if (costPrice !== undefined && costPrice !== '') {
      const costNum = Number(costPrice);
      if (isNaN(costNum) || costNum < 10000 || costNum > 10000000) {
        return res.status(400).json({
          success: false,
          message: 'Giá nhập phải từ 10,000 ₫ đến 10,000,000 ₫',
        });
      }
    }

    if (stock !== undefined && stock !== '') {
      const stockNum = Number(stock);
      if (isNaN(stockNum) || stockNum < 0 || stockNum > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng tồn kho phải từ 0 đến 10,000',
        });
      }
    }

    if (unit !== undefined && unit.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Đơn vị tính không được quá 20 ký tự',
      });
    }

    // --- Kiểm tra trùng tên sản phẩm (case-insensitive, trim) ---
    const trimmedName = name.trim();
    const existingByName = await Product.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existingByName) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm đã tồn tại.',
      });
    }

    // --- Kiểm tra quy tắc danh mục bị khóa khi tạo mới ---
    if (category && category.trim()) {
      const trimmedCat = category.trim();
      const catDoc = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (catDoc && catDoc.status === 'inactive') {
        return res.status(400).json({
          success: false,
          message: `Không thể thêm sản phẩm vào danh mục đang bị khóa ("${catDoc.name}").`,
        });
      }
    }

    // --- Xử lý ảnh + kiểm tra trùng nội dung ảnh ---
    let imageUrl = '';
    let imageHash = '';
    if (req.file) {
      // 1. Tính toán SHA-256 hash từ binary buffer của ảnh
      imageHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      // 2. Kiểm tra trùng nội dung ảnh với các sản phẩm đã có
      const existingByHash = await Product.findOne({ imageHash });
      if (existingByHash) {
        return res.status(400).json({
          success: false,
          message: 'Hình ảnh này đã được sử dụng cho sản phẩm khác.',
        });
      }

      // 3. Nếu chưa trùng, upload buffer lên Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    // --- Tạo sản phẩm ---
    const product = await Product.create({
      name: trimmedName,
      description: description?.trim() || '',
      price: Number(price),
      costPrice: costPrice !== undefined ? Number(costPrice) : 0,
      stock: stock !== undefined ? Number(stock) : 0,
      unit: unit?.trim() || 'cái',
      category: category?.trim() || '',
      supplier: supplier ? supplier : null,
      status: status || 'active',
      image: imageUrl,
      imageHash: imageHash,
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

    if (costPrice !== undefined && costPrice !== '') {
      const costNum = Number(costPrice);
      if (isNaN(costNum) || costNum < 10000 || costNum > 10000000) {
        return res.status(400).json({
          success: false,
          message: 'Giá nhập phải từ 10,000 ₫ đến 10,000,000 ₫',
        });
      }
    }

    if (stock !== undefined && stock !== '') {
      const stockNum = Number(stock);
      if (isNaN(stockNum) || stockNum < 0 || stockNum > 10000) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng tồn kho phải từ 0 đến 10,000',
        });
      }
    }

    if (unit !== undefined && unit.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Đơn vị tính không được quá 20 ký tự',
      });
    }

    // --- Kiểm tra trùng tên sản phẩm (case-insensitive, trim, loại trừ chính nó) ---
    if (name !== undefined) {
      const trimmedName = name.trim();
      const existingByName = await Product.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (existingByName) {
        return res.status(400).json({
          success: false,
          message: 'Tên sản phẩm đã tồn tại.',
        });
      }
    }

    // --- Kiểm tra sản phẩm tồn tại trước khi cập nhật ---
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // --- Kiểm tra quy tắc khi danh mục bị khóa khi chỉnh sửa ---
    // 1. Nếu sản phẩm hiện tại đang thuộc danh mục bị khóa, KHÔNG cho phép chuyển sang danh mục khác
    if (existingProduct.category) {
      const currentCatDoc = await Category.findOne({
        name: { $regex: new RegExp(`^${existingProduct.category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (currentCatDoc && currentCatDoc.status === 'inactive') {
        if (category !== undefined && category.trim().toLowerCase() !== existingProduct.category.trim().toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm đang thuộc danh mục bị khóa ("${currentCatDoc.name}"), không được phép chuyển sang danh mục khác.`,
          });
        }
      }
    }

    // 2. Không cho phép chuyển sản phẩm vào danh mục đang bị khóa
    if (category !== undefined && category.trim()) {
      const newCatName = category.trim();
      if (!existingProduct.category || newCatName.toLowerCase() !== existingProduct.category.trim().toLowerCase()) {
        const targetCatDoc = await Category.findOne({
          name: { $regex: new RegExp(`^${newCatName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (targetCatDoc && targetCatDoc.status === 'inactive') {
          return res.status(400).json({
            success: false,
            message: `Không thể chuyển sản phẩm vào danh mục đang bị khóa ("${targetCatDoc.name}").`,
          });
        }
      }
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

    // Lấy thông tin sản phẩm cũ để xử lý ảnh
    // Nếu có file mới tải lên, tính hash và kiểm tra trùng trước khi upload
    if (req.file) {
      // 1. Tính toán SHA-256 hash từ binary buffer của ảnh mới
      const newHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      // 2. Kiểm tra trùng hash với sản phẩm khác (ngoại trừ chính sản phẩm đang sửa)
      const existingByHash = await Product.findOne({
        _id: { $ne: req.params.id },
        imageHash: newHash,
      });
      if (existingByHash) {
        return res.status(400).json({
          success: false,
          message: 'Hình ảnh này đã được sử dụng cho sản phẩm khác.',
        });
      }

      // 3. Upload ảnh mới lên Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      updateData.image = uploadResult.secure_url;
      updateData.imageHash = newHash;
    } else if (req.body.removeImage === 'true') {
      // Nếu user chủ động xóa ảnh
      updateData.image = '';
      updateData.imageHash = '';
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
