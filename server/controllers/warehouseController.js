const Product = require('../models/Product');

// ============================================
// LẤY DANH SÁCH TỒN KHO - GET /api/warehouse
// ============================================
const getInventory = async (req, res) => {
  try {
    const { search, stockStatus, category, page = 1, limit = 10 } = req.query;

    const filter = {};

    // Tìm kiếm theo tên sản phẩm
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Lọc theo danh mục
    if (category) {
      filter.category = category;
    }

    // Lọc theo tình trạng tồn kho
    // in_stock: tồn > 10, low_stock: 1 <= tồn <= 10, out_of_stock: tồn = 0
    if (stockStatus === 'out_of_stock') {
      filter.stock = { $lte: 0 };
    } else if (stockStatus === 'low_stock') {
      filter.stock = { $gt: 0, $lte: 10 };
    } else if (stockStatus === 'in_stock') {
      filter.stock = { $gt: 10 };
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ stock: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    // Thêm trường tính toán tình trạng tồn
    const inventory = products.map((prod) => {
      let statusLabel = 'in_stock';
      if (prod.stock <= 0) {
        statusLabel = 'out_of_stock';
      } else if (prod.stock <= 10) {
        statusLabel = 'low_stock';
      }

      return {
        _id: prod._id,
        name: prod.name,
        category: prod.category || 'Chưa phân loại',
        unit: prod.unit || 'cái',
        price: prod.price,
        costPrice: prod.costPrice || 0,
        stock: prod.stock,
        totalCostValue: (prod.stock || 0) * (prod.costPrice || 0),
        totalRetailValue: (prod.stock || 0) * (prod.price || 0),
        statusLabel,
        updatedAt: prod.updatedAt,
      };
    });

    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách tồn kho:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// THỐNG KÊ NHANH KHO HÀNG - GET /api/warehouse/stats
// ============================================
const getWarehouseStats = async (req, res) => {
  try {
    const products = await Product.find({}, 'stock costPrice price');

    let totalProducts = products.length;
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    products.forEach((p) => {
      const stock = p.stock || 0;
      const cost = p.costPrice || 0;
      const price = p.price || 0;

      totalStock += stock;
      totalCostValue += stock * cost;
      totalRetailValue += stock * price;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= 10) {
        lowStockCount++;
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          totalStock,
          lowStockCount,
          outOfStockCount,
          totalCostValue,
          totalRetailValue,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê kho hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// ĐIỀU CHỈNH TỒN KHO - POST /api/warehouse/adjust
// ============================================
const adjustStock = async (req, res) => {
  try {
    const { productId, actionType, quantity, reason } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn sản phẩm cần điều chỉnh',
      });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng điều chỉnh không hợp lệ',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    let newStock = product.stock;
    if (actionType === 'set') {
      newStock = qty;
    } else if (actionType === 'add') {
      newStock = product.stock + qty;
    } else if (actionType === 'subtract') {
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn hiện tại (${product.stock}) không đủ để giảm ${qty}`,
        });
      }
      newStock = product.stock - qty;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Loại điều chỉnh không hợp lệ (set, add, subtract)',
      });
    }

    product.stock = newStock;
    await product.save();

    res.json({
      success: true,
      message: `Đã cập nhật tồn kho sản phẩm "${product.name}" thành ${newStock}`,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          stock: product.stock,
          reason: reason || 'Kiểm kê kho',
        },
      },
    });
  } catch (error) {
    console.error('Lỗi điều chỉnh tồn kho:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getInventory,
  getWarehouseStats,
  adjustStock,
};
