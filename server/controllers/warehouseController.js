const mongoose = require('mongoose');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockHistory = require('../models/StockHistory');
const { logActivity } = require('../services/activityLogService');

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
        .populate('supplier', 'name phone')
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
        supplier: prod.supplier,
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
// NHẬP KHO TRỰC TIẾP - POST /api/warehouse/import
// ============================================
const importStock = async (req, res) => {
  try {
    const { productId, quantity, supplierId, unitPrice, note, variantSize, variantColor } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn sản phẩm cần nhập kho hợp lệ',
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng nhập phải là số nguyên lớn hơn 0',
      });
    }

    if (qty > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng nhập mỗi lần tối đa là 10.000 sản phẩm',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong hệ thống',
      });
    }

    const stockBefore = product.stock || 0;
    const hasVariants = product.variants && product.variants.length > 0;

    // Nếu sản phẩm có biến thể, bắt buộc phải chọn biến thể khi nhập kho
    if (hasVariants) {
      if (!variantSize || !variantColor) {
        return res.status(400).json({
          success: false,
          message: 'Sản phẩm có biến thể, vui lòng chọn size và màu sắc để nhập kho',
        });
      }

      // Tìm biến thể khớp
      const variant = product.variants.find(
        (v) => v.size === variantSize.trim() && v.color === variantColor.trim()
      );
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể size "${variantSize}" - màu "${variantColor}" trong sản phẩm này`,
        });
      }

      const variantTarget = (variant.stock || 0) + qty;
      if (variantTarget > 10000) {
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn biến thể sau khi nhập (${variantTarget}) vượt quá giới hạn tối đa (10.000)`,
        });
      }

      // Tăng stock biến thể (pre-save hook sẽ tự tính tổng stock)
      variant.stock = variantTarget;
    } else {
      // Sản phẩm cũ không có biến thể → tăng stock chung
      const targetStock = stockBefore + qty;
      if (targetStock > 10000) {
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn kho sau khi nhập (${targetStock}) vượt quá giới hạn tối đa cho phép (10.000 sản phẩm)`,
        });
      }
      product.stock = targetStock;
    }

    // Kiểm tra nhà cung cấp nếu có truyền
    let validSupplierId = null;
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return res.status(400).json({
          success: false,
          message: 'Mã nhà cung cấp không hợp lệ',
        });
      }
      const supplierExists = await Supplier.findById(supplierId);
      if (!supplierExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin nhà cung cấp đã chọn',
        });
      }
      validSupplierId = supplierExists._id;
    }

    // Kiểm tra đơn giá nhập nếu có truyền
    let validatedUnitPrice = product.costPrice || 0;
    if (unitPrice !== undefined && unitPrice !== null && unitPrice !== '') {
      const priceNum = Number(unitPrice);
      if (isNaN(priceNum) || priceNum < 10000 || priceNum > 10000000) {
        return res.status(400).json({
          success: false,
          message: 'Đơn giá nhập phải từ 10.000 ₫ đến 10.000.000 ₫',
        });
      }
      validatedUnitPrice = priceNum;
      product.costPrice = priceNum;
    }

    // Cập nhật nhà cung cấp mặc định cho sản phẩm nếu có
    if (validSupplierId) {
      product.supplier = validSupplierId;
    }

    // Lưu sản phẩm (pre-save hook sẽ tính tổng stock nếu có variants)
    await product.save();

    // Tạo bản ghi lịch sử kho
    let historyRecord;
    try {
      historyRecord = await StockHistory.create({
        product: product._id,
        variantSize: variantSize ? variantSize.trim() : '',
        variantColor: variantColor ? variantColor.trim() : '',
        type: 'import',
        quantity: qty,
        stockBefore,
        stockAfter: product.stock,
        supplier: validSupplierId || product.supplier || null,
        unitPrice: validatedUnitPrice,
        note: note ? String(note).trim() : '',
        performer: req.user?.userId || null,
      });

      // Populate thông tin nhà cung cấp và người thực hiện để trả về frontend
      await historyRecord.populate([
        { path: 'supplier', select: 'name phone' },
        { path: 'performer', select: 'fullName email' },
      ]);
    } catch (historyErr) {
      // Rollback lại tồn kho sản phẩm nếu lưu lịch sử thất bại
      console.error('Lỗi khi lưu StockHistory, thực hiện rollback tồn kho:', historyErr);
      // Rollback: load lại sản phẩm gốc từ DB
      const rollbackProduct = await Product.findById(productId);
      if (rollbackProduct) {
        if (hasVariants) {
          const rv = rollbackProduct.variants.find(
            (v) => v.size === variantSize.trim() && v.color === variantColor.trim()
          );
          if (rv) rv.stock = (rv.stock || 0) - qty;
        } else {
          rollbackProduct.stock = stockBefore;
        }
        await rollbackProduct.save();
      }
      throw historyErr;
    }

    logActivity({
      req,
      action: 'STOCK_IN',
      module: 'INVENTORY',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.name,
      description: `Nhập kho +${qty} ${product.unit || 'cái'} cho sản phẩm "${product.name}"${variantSize && variantColor ? ` (Size: ${variantSize}, Màu: ${variantColor})` : ''} - Tồn kho: ${stockBefore} → ${product.stock}`,
      changes: [
        {
          field: 'stock',
          fieldNameVi: 'Số lượng tồn kho',
          oldValue: stockBefore,
          newValue: product.stock,
        },
      ],
      metadata: {
        quantity: qty,
        variantSize: variantSize || undefined,
        variantColor: variantColor || undefined,
        unitPrice: validatedUnitPrice,
      },
    });

    res.status(200).json({
      success: true,
      message: `Đã nhập kho thành công ${qty} ${product.unit || 'sản phẩm'}. Tồn kho hiện tại: ${product.stock}`,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          stock: product.stock,
          variants: product.variants,
          costPrice: product.costPrice,
          supplier: product.supplier,
        },
        history: historyRecord,
      },
    });
  } catch (error) {
    console.error('Lỗi nhập kho sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi nhập kho, vui lòng thử lại sau',
    });
  }
};

// ============================================
// XUẤT KHO TRỰC TIẾP - POST /api/warehouse/export
// ============================================
const exportStock = async (req, res) => {
  try {
    const { productId, quantity, reason, note, variantSize, variantColor } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn sản phẩm cần xuất kho hợp lệ',
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng xuất phải là số nguyên lớn hơn 0',
      });
    }

    const validReasons = [
      'Hàng lỗi/hư hỏng',
      'Sử dụng nội bộ/chụp ảnh sản phẩm',
      'Điều chỉnh tồn kho',
      'Khác',
    ];

    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn một lý do xuất kho hợp lệ trong danh mục quy định',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong hệ thống',
      });
    }

    const stockBefore = product.stock || 0;
    const hasVariants = product.variants && product.variants.length > 0;

    if (hasVariants) {
      // Sản phẩm có biến thể → bắt buộc chọn biến thể
      if (!variantSize || !variantColor) {
        return res.status(400).json({
          success: false,
          message: 'Sản phẩm có biến thể, vui lòng chọn size và màu sắc để xuất kho',
        });
      }

      const variant = product.variants.find(
        (v) => v.size === variantSize.trim() && v.color === variantColor.trim()
      );
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể size "${variantSize}" - màu "${variantColor}" trong sản phẩm này`,
        });
      }

      const variantStock = variant.stock || 0;
      if (variantStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Biến thể size "${variantSize}" - màu "${variantColor}" chỉ còn ${variantStock} ${product.unit || 'cái'}, không đủ xuất ${qty}`,
        });
      }

      // Giảm stock biến thể (pre-save hook sẽ tính lại tổng)
      variant.stock = variantStock - qty;
    } else {
      // Sản phẩm cũ không có biến thể
      if (stockBefore < qty) {
        return res.status(400).json({
          success: false,
          message: `Số lượng xuất (${qty}) vượt quá số lượng tồn kho khả dụng hiện tại (${stockBefore} ${product.unit || 'cái'})`,
        });
      }
      product.stock = stockBefore - qty;
    }

    // Lưu sản phẩm (pre-save hook tính tổng stock nếu có variants)
    await product.save();

    // Tạo bản ghi lịch sử xuất kho
    let historyRecord;
    try {
      historyRecord = await StockHistory.create({
        product: product._id,
        variantSize: variantSize ? variantSize.trim() : '',
        variantColor: variantColor ? variantColor.trim() : '',
        type: 'export',
        quantity: qty,
        stockBefore,
        stockAfter: product.stock,
        reason,
        note: note ? String(note).trim() : '',
        performer: req.user?.userId || null,
      });

      await historyRecord.populate([
        { path: 'performer', select: 'fullName email' },
      ]);
    } catch (historyErr) {
      // Rollback lại tồn kho nếu lưu lịch sử thất bại
      console.error('Lỗi khi lưu StockHistory, thực hiện rollback tồn kho:', historyErr);
      const rollbackProduct = await Product.findById(productId);
      if (rollbackProduct) {
        if (hasVariants) {
          const rv = rollbackProduct.variants.find(
            (v) => v.size === variantSize.trim() && v.color === variantColor.trim()
          );
          if (rv) rv.stock = (rv.stock || 0) + qty;
        } else {
          rollbackProduct.stock = stockBefore;
        }
        await rollbackProduct.save();
      }
      throw historyErr;
    }

    logActivity({
      req,
      action: 'STOCK_OUT',
      module: 'INVENTORY',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.name,
      description: `Xuất kho -${qty} ${product.unit || 'cái'} cho sản phẩm "${product.name}"${variantSize && variantColor ? ` (Size: ${variantSize}, Màu: ${variantColor})` : ''} - Lý do: ${reason} - Tồn kho: ${stockBefore} → ${product.stock}`,
      changes: [
        {
          field: 'stock',
          fieldNameVi: 'Số lượng tồn kho',
          oldValue: stockBefore,
          newValue: product.stock,
        },
      ],
      metadata: {
        quantity: qty,
        variantSize: variantSize || undefined,
        variantColor: variantColor || undefined,
        reason,
      },
    });

    res.status(200).json({
      success: true,
      message: `Đã xuất kho thành công ${qty} ${product.unit || 'sản phẩm'}. Tồn kho còn lại: ${product.stock}`,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          stock: product.stock,
          variants: product.variants,
        },
        history: historyRecord,
      },
    });
  } catch (error) {
    console.error('Lỗi xuất kho sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xuất kho, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY LỊCH SỬ KHO THEO SẢN PHẨM - GET /api/warehouse/history/:productId
// ============================================
const getStockHistoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã ID sản phẩm không hợp lệ',
      });
    }

    const product = await Product.findById(productId).select('name unit stock');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong hệ thống',
      });
    }

    // Truy vấn lịch sử sắp xếp mới nhất lên đầu
    const history = await StockHistory.find({ product: productId })
      .populate('supplier', 'name phone')
      .populate('performer', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        product,
        history,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử kho của sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải lịch sử kho, vui lòng thử lại sau',
    });
  }
};

// ============================================
// ĐIỀU CHỈNH TỒN KHO CŨ - POST /api/warehouse/adjust (Tương thích ngược)
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

    const qty = parseInt(quantity, 10);
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

    const stockBefore = product.stock || 0;
    let newStock = stockBefore;
    let historyType = 'import';
    let historyReason = reason || 'Điều chỉnh tồn kho';

    if (actionType === 'set') {
      newStock = qty;
      historyType = newStock >= stockBefore ? 'import' : 'export';
    } else if (actionType === 'add') {
      newStock = stockBefore + qty;
      historyType = 'import';
    } else if (actionType === 'subtract') {
      if (stockBefore < qty) {
        return res.status(400).json({
          success: false,
          message: `Số lượng tồn hiện tại (${stockBefore}) không đủ để giảm ${qty}`,
        });
      }
      newStock = stockBefore - qty;
      historyType = 'export';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Loại điều chỉnh không hợp lệ (set, add, subtract)',
      });
    }

    product.stock = newStock;
    await product.save();

    // Ghi nhận vào StockHistory để đồng bộ
    try {
      await StockHistory.create({
        product: product._id,
        type: historyType,
        quantity: Math.abs(newStock - stockBefore),
        stockBefore,
        stockAfter: newStock,
        reason: historyType === 'export' ? 'Điều chỉnh tồn kho' : '',
        note: reason || 'Điều chỉnh qua API kiểm kê',
        performer: req.user?.userId || null,
      });
    } catch (e) {
      console.warn('Không thể ghi nhận history cho adjustStock:', e.message);
    }

    logActivity({
      req,
      action: historyType === 'import' ? 'STOCK_IN' : 'STOCK_OUT',
      module: 'INVENTORY',
      targetType: 'Product',
      targetId: product._id,
      targetName: product.name,
      description: `Điều chỉnh tồn kho sản phẩm "${product.name}" (${actionType}): ${stockBefore} → ${newStock} - Lý do: ${reason || 'Kiểm kê kho'}`,
      changes: [
        {
          field: 'stock',
          fieldNameVi: 'Số lượng tồn kho',
          oldValue: stockBefore,
          newValue: newStock,
        },
      ],
      metadata: {
        actionType,
        reason: reason || 'Kiểm kê kho',
      },
    });

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
  importStock,
  exportStock,
  getStockHistoryByProduct,
  adjustStock,
};
