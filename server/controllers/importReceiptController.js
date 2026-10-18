const ImportReceipt = require('../models/ImportReceipt');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// ============================================
// LẤY DANH SÁCH PHIẾU NHẬP - GET /api/import-receipts
// ============================================
const getImportReceipts = async (req, res) => {
  try {
    const { search, supplierId, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search) {
      filter.receiptCode = { $regex: search, $options: 'i' };
    }

    if (supplierId) {
      filter.supplier = supplierId;
    }

    if (status && ['completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [receipts, total] = await Promise.all([
      ImportReceipt.find(filter)
        .populate('supplier', 'name phone address')
        .populate('items.product', 'name unit costPrice price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ImportReceipt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        receipts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách phiếu nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY CHI TIẾT PHIẾU NHẬP - GET /api/import-receipts/:id
// ============================================
const getImportReceiptById = async (req, res) => {
  try {
    const receipt = await ImportReceipt.findById(req.params.id)
      .populate('supplier', 'name phone address')
      .populate('items.product', 'name unit costPrice price image');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập hàng',
      });
    }

    res.json({
      success: true,
      data: { receipt },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết phiếu nhập:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu nhập không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// TẠO PHIẾU NHẬP HÀNG - POST /api/import-receipts
// ============================================
const createImportReceipt = async (req, res) => {
  try {
    const { supplierId, items, note, importDate } = req.body;

    // Validate supplier
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn nhà cung cấp',
      });
    }

    const supplierExists = await Supplier.findById(supplierId);
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: 'Nhà cung cấp không tồn tại',
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phiếu nhập phải có ít nhất một sản phẩm',
      });
    }

    let calculatedTotalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn sản phẩm cho từng dòng nhập',
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm có ID: ${item.product}`,
        });
      }

      const qty = parseInt(item.quantity);
      const price = Number(item.importPrice);

      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Số lượng nhập của sản phẩm "${product.name}" phải từ 1 trở lên`,
        });
      }

      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: `Giá nhập của sản phẩm "${product.name}" không hợp lệ`,
        });
      }

      const itemTotal = qty * price;
      calculatedTotalAmount += itemTotal;

      validatedItems.push({
        product: product._id,
        quantity: qty,
        importPrice: price,
        total: itemTotal,
      });
    }

    // Sinh mã phiếu nhập tự động: PN + yyyyMMdd + 4 số ngẫu nhiên
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptCode = `PN${dateStr}-${randomSuffix}`;

    // Tạo phiếu nhập
    const receipt = await ImportReceipt.create({
      receiptCode,
      supplier: supplierId,
      importDate: importDate || new Date(),
      items: validatedItems,
      totalAmount: calculatedTotalAmount,
      note: note?.trim() || '',
      status: 'completed',
    });

    // TỰ ĐỘNG CẬP NHẬT TỒN KHO & GIÁ VỐN & NHÀ CUNG CẤP CHO TỪNG SẢN PHẨM
    for (const it of validatedItems) {
      await Product.findByIdAndUpdate(it.product, {
        $inc: { stock: it.quantity },
        costPrice: it.importPrice, // Cập nhật giá vốn mới nhất
        supplier: supplierId,      // Cập nhật nhà cung cấp nhập hàng
      });
    }

    const populatedReceipt = await ImportReceipt.findById(receipt._id)
      .populate('supplier', 'name phone address')
      .populate('items.product', 'name unit costPrice price');

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu nhập hàng và cập nhật tồn kho thành công',
      data: { receipt: populatedReceipt },
    });
  } catch (error) {
    console.error('Lỗi tạo phiếu nhập hàng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// HỦY PHIẾU NHẬP - PUT /api/import-receipts/:id/cancel
// ============================================
const cancelImportReceipt = async (req, res) => {
  try {
    const receipt = await ImportReceipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu nhập hàng',
      });
    }

    if (receipt.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu nhập này đã bị hủy trước đó',
      });
    }

    // Kiểm tra và trừ lại tồn kho tương ứng
    for (const it of receipt.items) {
      const product = await Product.findById(it.product);
      if (product) {
        product.stock = Math.max(0, product.stock - it.quantity);
        await product.save();
      }
    }

    receipt.status = 'cancelled';
    await receipt.save();

    res.json({
      success: true,
      message: 'Hủy phiếu nhập hàng và hoàn lại tồn kho thành công',
      data: { receipt },
    });
  } catch (error) {
    console.error('Lỗi hủy phiếu nhập:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu nhập không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getImportReceipts,
  getImportReceiptById,
  createImportReceipt,
  cancelImportReceipt,
};
