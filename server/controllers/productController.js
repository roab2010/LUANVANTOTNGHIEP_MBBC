const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const StockHistory = require('../models/StockHistory');
const User = require('../models/User');
const Order = require('../models/Order');
const { uploadToCloudinary } = require('../config/cloudinary');
const { logActivity, diffObjects } = require('../services/activityLogService');

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
    const {
      search,
      status,
      stockStatus,
      category,
      includeLocked,
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      colors,
      sizes,
      inStock,
      inStockOnly,
      sort = 'newest',
    } = req.query;

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
    } else if (
      stockStatus === 'in_stock' ||
      inStock === 'true' ||
      inStock === true ||
      inStockOnly === 'true' ||
      inStockOnly === true
    ) {
      filter.stock = { $gt: 0 };
    }

    // Lọc theo khoảng giá (minPrice, maxPrice)
    const isCleanMinPrice = minPrice !== undefined && minPrice !== '' && minPrice !== 'null' && minPrice !== 'undefined';
    const isCleanMaxPrice = maxPrice !== undefined && maxPrice !== '' && maxPrice !== 'null' && maxPrice !== 'undefined';
    if (isCleanMinPrice || isCleanMaxPrice) {
      filter.price = {};
      if (isCleanMinPrice) {
        const numMin = Number(minPrice);
        if (!isNaN(numMin)) filter.price.$gte = numMin;
      }
      if (isCleanMaxPrice) {
        const numMax = Number(maxPrice);
        if (!isNaN(numMax)) filter.price.$lte = numMax;
      }
      if (Object.keys(filter.price).length === 0) {
        delete filter.price;
      }
    }

    // Lọc theo màu sắc biến thể (hỗ trợ một hoặc nhiều màu)
    if (colors && colors !== 'null' && colors !== 'undefined') {
      const colorList = (Array.isArray(colors) ? colors : String(colors).split(','))
        .map((c) => c.trim())
        .filter((c) => Boolean(c) && c !== 'null' && c !== 'undefined');
      if (colorList.length > 0) {
        filter['variants.color'] = {
          $in: colorList.map((c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')),
        };
      }
    }

    // Lọc theo kích thước biến thể (hỗ trợ một hoặc nhiều size)
    if (sizes && sizes !== 'null' && sizes !== 'undefined') {
      const sizeList = (Array.isArray(sizes) ? sizes : String(sizes).split(','))
        .map((s) => s.trim())
        .filter((s) => Boolean(s) && s !== 'null' && s !== 'undefined');
      if (sizeList.length > 0) {
        filter['variants.size'] = {
          $in: sizeList.map((s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')),
        };
      }
    }

    // Phân quyền: Kiểm tra Admin có yêu cầu xem cả danh mục bị khóa không
    const isAdmin = await checkIsAdmin(req);
    const allowLocked = isAdmin && (includeLocked === 'true' || includeLocked === true);

    const isNewArrivals =
      category &&
      (category.toUpperCase() === 'NEW ARRIVALS' ||
        category.toUpperCase() === 'NEW-ARRIVALS' ||
        category.toUpperCase() === 'NEW_ARRIVALS');

    if (!allowLocked) {
      // Ẩn toàn bộ sản phẩm thuộc danh mục bị khóa (áp dụng cho khách hàng & API công khai)
      const inactiveCategories = await Category.find({ status: 'inactive' }).select('name').lean();
      const inactiveCatNames = inactiveCategories.map((c) => c.name);

      if (inactiveCatNames.length > 0) {
        if (category && category !== 'ALL' && !isNewArrivals) {
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
                  limit: parseInt(limit) || 12,
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
      } else if (category && category !== 'ALL' && !isNewArrivals) {
        filter.category = { $regex: new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      }
    } else {
      // Cho phép Admin xem tất cả danh mục (bao gồm cả danh mục bị khóa)
      if (category && category !== 'ALL' && !isNewArrivals) {
        filter.category = { $regex: new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
      }
    }

    // Phân trang
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Sắp xếp
    let sortOption = { createdAt: -1, _id: -1 }; // Mặc định: Mới nhất
    if (sort === 'price_asc') {
      sortOption = { price: 1, _id: 1 };
    } else if (sort === 'price_desc') {
      sortOption = { price: -1, _id: 1 };
    } else if (sort === 'name_asc') {
      sortOption = { name: 1, _id: 1 };
    } else if (sort === 'name_desc') {
      sortOption = { name: -1, _id: 1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1, _id: 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1, _id: 1 };
    } else if (sort === 'stock_desc') {
      sortOption = { stock: -1, _id: 1 };
    } else if (sort === 'featured') {
      sortOption = { isFeatured: -1, stock: -1, createdAt: -1 };
    }

    // Xử lý tiêu chí BÁN CHẠY NHẤT (best_seller) dựa trên dữ liệu đơn hàng thực tế
    if (sort === 'best_seller') {
      const salesAgg = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' } } },
        { $sort: { totalSold: -1 } },
      ]);

      const salesMap = {};
      salesAgg.forEach((item) => {
        salesMap[String(item._id)] = item.totalSold;
      });

      const allMatching = await Product.find(filter)
        .populate('supplier', 'name phone')
        .lean();

      allMatching.sort((a, b) => {
        const soldA = salesMap[String(a._id)] || 0;
        const soldB = salesMap[String(b._id)] || 0;
        if (soldB !== soldA) return soldB - soldA;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const total = allMatching.length;
      const paged = allMatching.slice(skip, skip + limitNum);

      const safeProducts = isAdmin
        ? paged
        : paged.map((p) => {
            delete p.costPrice;
            return p;
          });

      return res.json({
        success: true,
        data: {
          products: safeProducts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    }

    // Query tiêu chuẩn
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('supplier', 'name phone')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const safeProducts = isAdmin
      ? products
      : products.map((p) => {
          const obj = p.toObject();
          delete obj.costPrice;
          return obj;
        });

    res.json({
      success: true,
      data: {
        products: safeProducts,
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
// LẤY TÙY CHỌN BỘ LỌC (COLORS, SIZES, PRICE RANGE) - GET /api/products/filters/options
// ============================================
const getFilterOptions = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { status: 'active' };

    // Không lấy sản phẩm từ danh mục inactive
    const inactiveCategories = await Category.find({ status: 'inactive' }).select('name').lean();
    const inactiveCatNames = inactiveCategories.map((c) => c.name);
    if (inactiveCatNames.length > 0) {
      filter.category = { $nin: inactiveCatNames };
    }

    const isNewArrivals =
      category &&
      (category.toUpperCase() === 'NEW ARRIVALS' ||
        category.toUpperCase() === 'NEW-ARRIVALS' ||
        category.toUpperCase() === 'NEW_ARRIVALS');

    if (category && category !== 'ALL' && !isNewArrivals) {
      filter.category = {
        $regex: new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      };
    }

    const products = await Product.find(filter).select('variants price category stock').lean();

    const colorsSet = new Set();
    const sizesSet = new Set();
    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((p) => {
      if (typeof p.price === 'number') {
        if (p.price < minPrice) minPrice = p.price;
        if (p.price > maxPrice) maxPrice = p.price;
      }
      (p.variants || []).forEach((v) => {
        if (v.color) colorsSet.add(v.color.trim());
        if (v.size) sizesSet.add(v.size.trim());
      });
    });

    res.json({
      success: true,
      data: {
        colors: [...colorsSet],
        sizes: [...sizesSet],
        minPrice: minPrice === Infinity ? 0 : minPrice,
        maxPrice: maxPrice,
        totalProducts: products.length,
      },
    });
  } catch (err) {
    console.error('Lỗi lấy tùy chọn bộ lọc:', err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
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

    const isAdmin = await checkIsAdmin(req);

    // Kiểm tra nếu danh mục của sản phẩm bị khóa và người xem không phải admin
    if (product.category) {
      const cat = await Category.findOne({
        name: { $regex: new RegExp(`^${product.category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (cat && cat.status === 'inactive') {
        if (!isAdmin) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy sản phẩm',
          });
        }
      }
    }

    const productData = product.toObject();
    if (!isAdmin) {
      delete productData.costPrice;
    }

    res.json({
      success: true,
      data: { product: productData },
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
    const { name, description, price, costPrice, stock, unit, category, supplier, status, variants } = req.body;

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

    // --- Xử lý biến thể (variants) ---
    let parsedVariants = [];
    if (variants !== undefined && variants !== null && variants !== '') {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = [];
      }
      if (!Array.isArray(parsedVariants)) {
        parsedVariants = [];
      }
    }

    if (parsedVariants.length > 0) {
      const seenCombos = new Set();
      for (const v of parsedVariants) {
        const s = (v.size || '').trim();
        const c = (v.color || '').trim();
        if (!s || !c) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi biến thể phải có đầy đủ size và màu sắc',
          });
        }
        const comboKey = `${s.toLowerCase()}__${c.toLowerCase()}`;
        if (seenCombos.has(comboKey)) {
          return res.status(400).json({
            success: false,
            message: `Biến thể size "${s}" - màu "${c}" bị trùng lặp`,
          });
        }
        seenCombos.add(comboKey);

        const vStock = Number(v.stock);
        if (isNaN(vStock) || vStock < 0 || vStock > 10000) {
          return res.status(400).json({
            success: false,
            message: `Số lượng tồn cho size "${s}" - màu "${c}" phải từ 0 đến 10,000`,
          });
        }
      }
    } else {
      if (stock !== undefined && stock !== '') {
        const stockNum = Number(stock);
        if (isNaN(stockNum) || stockNum < 0 || stockNum > 10000) {
          return res.status(400).json({
            success: false,
            message: 'Số lượng tồn kho phải từ 0 đến 10,000',
          });
        }
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
    const productPayload = {
      name: trimmedName,
      description: description?.trim() || '',
      price: Number(price),
      costPrice: costPrice !== undefined && costPrice !== '' ? Number(costPrice) : 10000,
      unit: unit?.trim() || 'cái',
      category: category?.trim() || '',
      supplier: supplier ? supplier : null,
      status: status || 'active',
      image: imageUrl,
      imageHash: imageHash,
    };

    if (parsedVariants.length > 0) {
      productPayload.variants = parsedVariants.map((v) => ({
        size: v.size.trim(),
        color: v.color.trim(),
        stock: Math.max(0, parseInt(v.stock) || 0),
      }));
      productPayload.stock = productPayload.variants.reduce((sum, v) => sum + v.stock, 0);
    } else {
      productPayload.variants = [];
      productPayload.stock = stock !== undefined && stock !== '' ? Math.max(0, Number(stock)) : 0;
    }

    const product = await Product.create(productPayload);

    logActivity({
      req,
      action: 'CREATE',
      module: 'PRODUCT',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.name,
      description: `Thêm mới sản phẩm: "${product.name}" (${product.category || 'Chưa phân loại'}) - Giá: ${product.price?.toLocaleString('vi-VN')}₫`,
      metadata: {
        price: product.price,
        costPrice: product.costPrice,
        stock: product.stock,
        category: product.category,
      },
    });

    // Ghi nhận lưu vết lịch sử kho ban đầu (nếu có tồn kho)
    try {
      if (product.variants && product.variants.length > 0) {
        for (const v of product.variants) {
          if (v.stock > 0) {
            await StockHistory.create({
              product: product._id,
              variantSize: v.size,
              variantColor: v.color,
              type: 'import',
              quantity: v.stock,
              stockBefore: 0,
              stockAfter: v.stock,
              supplier: product.supplier || null,
              unitPrice: product.costPrice || 0,
              reason: 'Khởi tạo tồn kho ban đầu',
              note: `Khởi tạo tồn kho ban đầu cho Size ${v.size} - Màu ${v.color}`,
              performer: req.user?.userId || null,
            });
          }
        }
      } else if (product.stock > 0) {
        await StockHistory.create({
          product: product._id,
          variantSize: '',
          variantColor: '',
          type: 'import',
          quantity: product.stock,
          stockBefore: 0,
          stockAfter: product.stock,
          supplier: product.supplier || null,
          unitPrice: product.costPrice || 0,
          reason: 'Khởi tạo tồn kho ban đầu',
          note: 'Khởi tạo tồn kho chung ban đầu',
          performer: req.user?.userId || null,
        });
      }
    } catch (historyErr) {
      console.warn('Lỗi ghi nhận lịch sử kho khi tạo sản phẩm mới:', historyErr);
    }

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
    const { name, description, price, costPrice, stock, unit, category, supplier, status, variants } = req.body;

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

    // --- Xử lý biến thể (variants) ---
    let parsedVariants = undefined;
    if (variants !== undefined && variants !== null && variants !== '') {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = [];
      }
      if (!Array.isArray(parsedVariants)) {
        parsedVariants = [];
      }

      const seenCombos = new Set();
      for (const v of parsedVariants) {
        const s = (v.size || '').trim();
        const c = (v.color || '').trim();
        if (!s || !c) {
          return res.status(400).json({
            success: false,
            message: 'Mỗi biến thể phải có đầy đủ size và màu sắc',
          });
        }
        const comboKey = `${s.toLowerCase()}__${c.toLowerCase()}`;
        if (seenCombos.has(comboKey)) {
          return res.status(400).json({
            success: false,
            message: `Biến thể size "${s}" - màu "${c}" bị trùng lặp`,
          });
        }
        seenCombos.add(comboKey);

        const vStock = Number(v.stock);
        if (isNaN(vStock) || vStock < 0 || vStock > 10000) {
          return res.status(400).json({
            success: false,
            message: `Số lượng tồn cho size "${s}" - màu "${c}" phải từ 0 đến 10,000`,
          });
        }
      }
    } else if (stock !== undefined && stock !== '') {
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

    // Lưu snapshot dữ liệu cũ để tính toán thay đổi trước / sau cho Activity Log
    const oldProductSnapshot = {
      name: existingProduct.name,
      price: existingProduct.price,
      costPrice: existingProduct.costPrice,
      category: existingProduct.category,
      status: existingProduct.status,
      stock: existingProduct.stock,
      unit: existingProduct.unit,
    };

    // --- Kiểm tra quy tắc khi danh mục bị khóa khi chỉnh sửa ---
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

    // Lưu trữ thông tin tồn kho cũ trước khi cập nhật để so sánh lưu vết
    const oldVariants = existingProduct.variants
      ? existingProduct.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock || 0 }))
      : [];
    const oldTotalStock = existingProduct.stock || 0;

    // --- Cập nhật các trường ---
    if (name !== undefined) existingProduct.name = name.trim();
    if (description !== undefined) existingProduct.description = description.trim();
    if (price !== undefined) existingProduct.price = Number(price);
    if (costPrice !== undefined && costPrice !== '') existingProduct.costPrice = Number(costPrice);
    if (unit !== undefined) existingProduct.unit = unit.trim();
    if (category !== undefined) existingProduct.category = category.trim();
    if (supplier !== undefined) existingProduct.supplier = supplier ? supplier : null;
    if (status !== undefined) existingProduct.status = status;

    if (parsedVariants !== undefined) {
      existingProduct.variants = parsedVariants.map((v) => ({
        size: v.size.trim(),
        color: v.color.trim(),
        stock: Math.max(0, parseInt(v.stock) || 0),
      }));
      if (existingProduct.variants.length > 0) {
        existingProduct.stock = existingProduct.variants.reduce((sum, v) => sum + v.stock, 0);
      } else if (stock !== undefined && stock !== '') {
        existingProduct.stock = Math.max(0, Number(stock));
      } else {
        existingProduct.stock = 0;
      }
    } else if (stock !== undefined && stock !== '') {
      existingProduct.stock = Math.max(0, Number(stock));
    }

    // Xử lý ảnh
    if (req.file) {
      const newHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
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

      const uploadResult = await uploadToCloudinary(req.file.buffer);
      existingProduct.image = uploadResult.secure_url;
      existingProduct.imageHash = newHash;
    } else if (req.body.removeImage === 'true') {
      existingProduct.image = '';
      existingProduct.imageHash = '';
    }

    await existingProduct.save();
    await existingProduct.populate('supplier', 'name phone address');

    // Lưu vết thay đổi tồn kho (StockHistory) khi sửa sản phẩm
    try {
      if (parsedVariants !== undefined) {
        const oldMap = new Map();
        oldVariants.forEach((v) => oldMap.set(`${v.size}__${v.color}`, v.stock));

        const newMap = new Map();
        existingProduct.variants.forEach((v) => newMap.set(`${v.size}__${v.color}`, v.stock));

        // Kiểm tra biến thể mới thêm hoặc thay đổi số lượng tồn
        for (const [key, newStk] of newMap.entries()) {
          const [s, c] = key.split('__');
          if (!oldMap.has(key)) {
            if (newStk > 0) {
              await StockHistory.create({
                product: existingProduct._id,
                variantSize: s,
                variantColor: c,
                type: 'import',
                quantity: newStk,
                stockBefore: 0,
                stockAfter: newStk,
                supplier: existingProduct.supplier || null,
                unitPrice: existingProduct.costPrice || 0,
                reason: 'Khởi tạo tồn kho ban đầu',
                note: `Thêm biến thể mới Size ${s} - Màu ${c} khi cập nhật sản phẩm`,
                performer: req.user?.userId || null,
              });
            }
          } else {
            const oldStk = oldMap.get(key);
            if (newStk > oldStk) {
              await StockHistory.create({
                product: existingProduct._id,
                variantSize: s,
                variantColor: c,
                type: 'import',
                quantity: newStk - oldStk,
                stockBefore: oldStk,
                stockAfter: newStk,
                supplier: existingProduct.supplier || null,
                unitPrice: existingProduct.costPrice || 0,
                reason: 'Điều chỉnh tồn kho',
                note: `Tăng tồn kho biến thể Size ${s} - Màu ${c} khi cập nhật sản phẩm`,
                performer: req.user?.userId || null,
              });
            } else if (newStk < oldStk) {
              await StockHistory.create({
                product: existingProduct._id,
                variantSize: s,
                variantColor: c,
                type: 'export',
                quantity: oldStk - newStk,
                stockBefore: oldStk,
                stockAfter: newStk,
                supplier: existingProduct.supplier || null,
                unitPrice: existingProduct.costPrice || 0,
                reason: 'Điều chỉnh tồn kho',
                note: `Giảm tồn kho biến thể Size ${s} - Màu ${c} khi cập nhật sản phẩm`,
                performer: req.user?.userId || null,
              });
            }
          }
        }

        // Kiểm tra các biến thể bị xóa đi
        for (const [key, oldStk] of oldMap.entries()) {
          if (!newMap.has(key)) {
            const [s, c] = key.split('__');
            if (oldStk > 0) {
              await StockHistory.create({
                product: existingProduct._id,
                variantSize: s,
                variantColor: c,
                type: 'export',
                quantity: oldStk,
                stockBefore: oldStk,
                stockAfter: 0,
                supplier: existingProduct.supplier || null,
                unitPrice: existingProduct.costPrice || 0,
                reason: 'Xóa biến thể sản phẩm',
                note: `Xóa biến thể Size ${s} - Màu ${c} khỏi sản phẩm`,
                performer: req.user?.userId || null,
              });
            }
          }
        }
      } else {
        // Trường hợp không quản lý theo biến thể (chỉnh sửa tồn kho chung)
        const newTotalStock = existingProduct.stock || 0;
        if (newTotalStock > oldTotalStock) {
          await StockHistory.create({
            product: existingProduct._id,
            variantSize: '',
            variantColor: '',
            type: 'import',
            quantity: newTotalStock - oldTotalStock,
            stockBefore: oldTotalStock,
            stockAfter: newTotalStock,
            supplier: existingProduct.supplier || null,
            unitPrice: existingProduct.costPrice || 0,
            reason: 'Điều chỉnh tồn kho',
            note: 'Tăng tồn kho chung khi cập nhật sản phẩm',
            performer: req.user?.userId || null,
          });
        } else if (newTotalStock < oldTotalStock) {
          await StockHistory.create({
            product: existingProduct._id,
            variantSize: '',
            variantColor: '',
            type: 'export',
            quantity: oldTotalStock - newTotalStock,
            stockBefore: oldTotalStock,
            stockAfter: newTotalStock,
            supplier: existingProduct.supplier || null,
            unitPrice: existingProduct.costPrice || 0,
            reason: 'Điều chỉnh tồn kho',
            note: 'Giảm tồn kho chung khi cập nhật sản phẩm',
            performer: req.user?.userId || null,
          });
        }
      }
    } catch (historyErr) {
      console.warn('Lỗi ghi nhận lịch sử kho khi cập nhật sản phẩm:', historyErr);
    }

    // Ghi nhận Activity Log chi tiết thay đổi sản phẩm
    const productChanges = diffObjects(oldProductSnapshot, existingProduct, {
      name: 'Tên sản phẩm',
      price: 'Giá bán',
      costPrice: 'Giá vốn',
      category: 'Danh mục',
      status: 'Trạng thái kinh doanh',
      stock: 'Tổng tồn kho',
      unit: 'Đơn vị tính',
    });

    logActivity({
      req,
      action: 'UPDATE',
      module: 'PRODUCT',
      targetType: 'Product',
      targetId: existingProduct._id,
      targetName: existingProduct.name,
      description: `Cập nhật thông tin sản phẩm: "${existingProduct.name}"`,
      changes: productChanges,
    });

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: { product: existingProduct },
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

    logActivity({
      req,
      action: 'DELETE',
      module: 'PRODUCT',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.name,
      description: `Xóa sản phẩm: "${product.name}" khỏi hệ thống`,
      metadata: {
        price: product.price,
        stock: product.stock,
        category: product.category,
      },
    });

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
  getFilterOptions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
