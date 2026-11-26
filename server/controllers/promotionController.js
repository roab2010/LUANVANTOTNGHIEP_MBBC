const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
const PromotionUsage = require('../models/PromotionUsage');
const UserSavedPromotion = require('../models/UserSavedPromotion');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { logActivity } = require('../services/activityLogService');
const {
  getComputedStatus,
  validatePromotionEligibility,
  calculateDiscountAmount,
  evaluateBestPromotion,
} = require('../services/promotionEngine');

// ============================================
// KHÁCH HÀNG: LẤY DANH SÁCH KHUYẾN MÃI CÔNG KHAI
// GET /api/promotions
// ============================================
const getPublicPromotions = async (req, res) => {
  try {
    const { type, scope, search } = req.query;
    const userId = req.user?.userId || null;

    const filter = {
      isPublic: true,
      status: { $in: ['active', 'paused'] }, // Hiển thị cả đang diễn ra và sắp diễn ra
    };

    if (type && ['automatic', 'voucher'].includes(type)) {
      filter.type = type;
    }
    if (scope && ['order', 'product'].includes(scope)) {
      filter.scope = scope;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const promotions = await Promotion.find(filter)
      .populate('applicableProducts', 'name price image')
      .sort({ createdAt: -1 })
      .lean();

    // Lấy danh sách ID các voucher mà user đã lưu (nếu đã đăng nhập)
    let savedPromoIds = new Set();
    if (userId) {
      const userSaved = await UserSavedPromotion.find({ userId }).select('promotionId').lean();
      savedPromoIds = new Set(userSaved.map((s) => s.promotionId.toString()));
    }

    const now = new Date();
    const formatted = promotions.map((p) => {
      const computedStatus = getComputedStatus(p, now);
      const isSaved = savedPromoIds.has(p._id.toString());
      const remainingUses = p.usageLimit !== null ? Math.max(0, p.usageLimit - (p.usedCount || 0)) : null;

      return {
        ...p,
        computedStatus,
        isSaved,
        remainingUses,
      };
    });

    res.json({
      success: true,
      data: {
        promotions: formatted,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách khuyến mãi công khai:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách ưu đãi',
    });
  }
};

// ============================================
// KHÁCH HÀNG: CHI TIẾT CHƯƠNG TRÌNH KHUYẾN MÃI
// GET /api/promotions/:id
// ============================================
const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID khuyến mãi không hợp lệ' });
    }

    const promo = await Promotion.findById(id)
      .populate('applicableProducts', 'name price image')
      .lean();

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình ưu đãi' });
    }

    const now = new Date();
    const computedStatus = getComputedStatus(promo, now);

    let isSaved = false;
    if (userId) {
      const savedDoc = await UserSavedPromotion.findOne({ userId, promotionId: id });
      isSaved = !!savedDoc;
    }

    res.json({
      success: true,
      data: {
        promotion: {
          ...promo,
          computedStatus,
          isSaved,
          remainingUses: promo.usageLimit !== null ? Math.max(0, promo.usageLimit - (promo.usedCount || 0)) : null,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết khuyến mãi:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

// ============================================
// KHÁCH HÀNG: KIỂM TRA & TÍNH TOÁN VOUCHER / KHUYẾN MÃI TỰ ĐỘNG
// POST /api/promotions/validate
// ============================================
const validatePromotion = async (req, res) => {
  try {
    const { items = [], voucherCode = '', promotionId = '' } = req.body;
    const userId = req.user?.userId || null;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng trống, không thể kiểm tra khuyến mãi',
      });
    }

    // Bảo mật: Lấy giá và thông tin sản phẩm trực tiếp từ DB, không tin tưởng giá từ frontend
    const validatedItems = [];
    for (const item of items) {
      const prodId = item.product?._id || item.product || item.productId;
      if (!prodId) continue;

      const product = await Product.findById(prodId).select('name price category status');
      if (!product || product.status !== 'active') continue;

      const qty = parseInt(item.quantity) || 1;
      validatedItems.push({
        product: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: qty,
      });
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng',
      });
    }

    const evaluation = await evaluateBestPromotion({
      items: validatedItems,
      voucherCode: voucherCode ? voucherCode.trim() : '',
      promotionId: promotionId ? promotionId.trim() : '',
      userId,
      now: new Date(),
    });

    const subtotal = validatedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const discountAmount = evaluation.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    res.json({
      success: true,
      data: {
        subtotal,
        discountAmount,
        finalTotal,
        appliedPromotion: evaluation.appliedPromotion
          ? {
              _id: evaluation.appliedPromotion._id,
              name: evaluation.appliedPromotion.name,
              code: evaluation.appliedPromotion.code,
              type: evaluation.appliedPromotion.type,
              scope: evaluation.appliedPromotion.scope,
              discountType: evaluation.appliedPromotion.discountType,
              discountValue: evaluation.appliedPromotion.discountValue,
              maxDiscount: evaluation.appliedPromotion.maxDiscount,
            }
          : null,
        voucherResult: evaluation.voucherResult,
        specificResult: evaluation.specificResult || null,
        comparison: evaluation.comparison,
      },
    });
  } catch (error) {
    console.error('Lỗi kiểm tra khuyến mãi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra mã khuyến mãi',
    });
  }
};

// ============================================
// KHÁCH HÀNG: LẤY KHO VOUCHER CỦA TÔI
// GET /api/promotions/saved
// ============================================
const getMySavedPromotions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const savedRecords = await UserSavedPromotion.find({ userId })
      .populate({
        path: 'promotionId',
        populate: { path: 'applicableProducts', select: 'name price image' },
      })
      .sort({ savedAt: -1 })
      .lean();

    const now = new Date();

    // Lấy các bản ghi đã sử dụng của user này
    const usedRecords = await PromotionUsage.find({
      userId,
      status: 'Used',
    }).select('promotionId usedAt discountAmount orderId').lean();

    const usedMap = new Map();
    usedRecords.forEach((u) => {
      const pid = u.promotionId.toString();
      if (!usedMap.has(pid)) {
        usedMap.set(pid, []);
      }
      usedMap.get(pid).push(u);
    });

    const usable = [];
    const used = [];
    const expired = [];

    for (const record of savedRecords) {
      const promo = record.promotionId;
      if (!promo) continue;

      const computedStatus = getComputedStatus(promo, now);
      const userUsageList = usedMap.get(promo._id.toString()) || [];
      const userUsedCount = userUsageList.length;

      const promoData = {
        ...promo,
        savedAt: record.savedAt,
        computedStatus,
        userUsedCount,
        remainingUses: promo.usageLimit !== null ? Math.max(0, promo.usageLimit - promo.usedCount) : null,
      };

      if (userUsedCount >= (promo.perUserLimit || 1)) {
        // Đã sử dụng hết hạn mức cá nhân
        used.push({
          ...promoData,
          lastUsedAt: userUsageList[userUsageList.length - 1]?.usedAt,
        });
      } else if (computedStatus === 'expired' || computedStatus === 'paused') {
        expired.push(promoData);
      } else if (computedStatus === 'active') {
        usable.push(promoData);
      } else {
        // scheduled hoặc draft
        usable.push(promoData);
      }
    }

    res.json({
      success: true,
      data: {
        usable,
        used,
        expired,
        total: savedRecords.length,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy kho voucher khách hàng:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================
// KHÁCH HÀNG: LƯU VOUCHER VÀO KHO CÁ NHÂN
// POST /api/promotions/:id/save
// ============================================
const savePromotion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID khuyến mãi không hợp lệ' });
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình ưu đãi' });
    }

    if (!promo.allowSaving) {
      return res.status(400).json({
        success: false,
        message: 'Chương trình này không hỗ trợ lưu vào kho ưu đãi',
      });
    }

    const now = new Date();
    const computedStatus = getComputedStatus(promo, now);
    if (computedStatus === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết hạn, không thể lưu',
      });
    }

    // Kiểm tra xem đã lưu chưa
    const existing = await UserSavedPromotion.findOne({ userId, promotionId: id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã lưu voucher này trong kho ưu đãi rồi',
      });
    }

    await UserSavedPromotion.create({
      userId,
      promotionId: id,
      savedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu voucher vào Kho ưu đãi của bạn',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã lưu voucher này trong kho ưu đãi rồi',
      });
    }
    console.error('Lỗi lưu voucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lưu voucher' });
  }
};

// ============================================
// KHÁCH HÀNG: BỎ LƯU VOUCHER KHỎI KHO CÁ NHÂN
// DELETE /api/promotions/:id/save
// ============================================
const unsavePromotion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await UserSavedPromotion.findOneAndDelete({ userId, promotionId: id });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Voucher không có trong kho lưu của bạn',
      });
    }

    res.json({
      success: true,
      message: 'Đã bỏ lưu voucher khỏi kho ưu đãi',
    });
  } catch (error) {
    console.error('Lỗi bỏ lưu voucher:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================
// ADMIN: LẤY DANH SÁCH CHƯƠNG TRÌNH KHUYẾN MÃI
// GET /api/admin/promotions
// ============================================
const getAdminPromotions = async (req, res) => {
  try {
    const { search, type, scope, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    if (type && ['automatic', 'voucher'].includes(type)) {
      filter.type = type;
    }
    if (scope && ['order', 'product'].includes(scope)) {
      filter.scope = scope;
    }
    if (status && ['draft', 'active', 'paused'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [promotions, total] = await Promise.all([
      Promotion.find(filter)
        .populate('applicableProducts', 'name price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Promotion.countDocuments(filter),
    ]);

    const now = new Date();
    const formatted = promotions.map((p) => ({
      ...p,
      computedStatus: getComputedStatus(p, now),
    }));

    res.json({
      success: true,
      data: {
        promotions: formatted,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi admin lấy danh sách khuyến mãi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================
// ADMIN: TẠO CHƯƠNG TRÌNH KHUYẾN MÃI MỚI
// POST /api/admin/promotions
// ============================================
const createPromotion = async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'voucher',
      code,
      scope = 'order',
      discountType = 'percentage',
      discountValue,
      maxDiscount,
      minOrderValue = 0,
      applicableProducts = [],
      applicableCategories = [],
      startAt,
      endAt,
      usageLimit = null,
      perUserLimit = 1,
      status = 'draft',
      isPublic = true,
      allowSaving = true,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên chương trình' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Tên chương trình không được vượt quá 100 ký tự' });
    }

    if (description && description.trim().length > 250) {
      return res.status(400).json({ success: false, message: 'Mô tả ngắn không được vượt quá 250 ký tự' });
    }

    if (type === 'voucher') {
      if (!code || !code.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã voucher' });
      }
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode.length < 3 || cleanCode.length > 20) {
        return res.status(400).json({ success: false, message: 'Mã voucher phải từ 3 đến 20 ký tự' });
      }
      if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher chỉ được chứa chữ cái in hoa không dấu, số, gạch nối hoặc gạch dưới',
        });
      }
      const existing = await Promotion.findOne({ code: cleanCode });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Mã voucher "${cleanCode}" đã tồn tại trên hệ thống`,
        });
      }
    }

    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: 'Giá trị giảm phải lớn hơn 0' });
    }

    if (discountType === 'percentage') {
      const pVal = Number(discountValue);
      if (pVal < 1 || pVal > 100) {
        return res.status(400).json({ success: false, message: 'Tỷ lệ giảm phần trăm phải từ 1% đến 100%' });
      }
    } else {
      if (Number(discountValue) > 100000000) {
        return res.status(400).json({ success: false, message: 'Số tiền giảm không được vượt quá 100.000.000₫' });
      }
    }

    if (minOrderValue && Number(minOrderValue) > 500000000) {
      return res.status(400).json({ success: false, message: 'Đơn hàng tối thiểu không được vượt quá 500.000.000₫' });
    }

    if (maxDiscount && Number(maxDiscount) > 100000000) {
      return res.status(400).json({ success: false, message: 'Mức giảm tối đa không được vượt quá 100.000.000₫' });
    }

    if (usageLimit && Number(usageLimit) > 1000000) {
      return res.status(400).json({ success: false, message: 'Tổng lượt sử dụng tối đa không được vượt quá 1.000.000 lượt' });
    }

    if (perUserLimit && (Number(perUserLimit) < 1 || Number(perUserLimit) > 100)) {
      return res.status(400).json({ success: false, message: 'Lượt dùng tối đa mỗi khách phải từ 1 đến 100' });
    }

    if (!startAt || !endAt) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn thời gian bắt đầu và kết thúc' });
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Định dạng thời gian không hợp lệ' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ success: false, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
    }

    const newPromotion = await Promotion.create({
      name: name.trim(),
      description: description?.trim() || '',
      type,
      code: type === 'voucher' ? code.trim().toUpperCase() : undefined,
      scope,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount && Number(maxDiscount) > 0 ? Number(maxDiscount) : null,
      minOrderValue: Number(minOrderValue) || 0,
      applicableProducts: scope === 'product' ? applicableProducts : [],
      applicableCategories: scope === 'product' ? applicableCategories : [],
      startAt: startDate,
      endAt: endDate,
      usageLimit: usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      perUserLimit: Number(perUserLimit) || 1,
      status: ['draft', 'active', 'paused'].includes(status) ? status : 'draft',
      isPublic: Boolean(isPublic),
      allowSaving: Boolean(allowSaving),
    });

    logActivity({
      req,
      action: 'CREATE',
      module: 'PROMOTION',
      targetType: 'Promotion',
      targetId: newPromotion._id,
      targetName: newPromotion.name,
      description: `Tạo chương trình ưu đãi "${newPromotion.name}" (${newPromotion.type === 'voucher' ? `Mã: ${newPromotion.code}` : 'Tự động'})`,
    });

    res.status(201).json({
      success: true,
      message: 'Tạo chương trình khuyến mãi thành công',
      data: { promotion: newPromotion },
    });
  } catch (error) {
    console.error('Lỗi tạo chương trình khuyến mãi:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi máy chủ' });
  }
};

// ============================================
// ADMIN: CHI TIẾT CHƯƠNG TRÌNH KHUYẾN MÃI
// GET /api/admin/promotions/:id
// ============================================
const getAdminPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    const promo = await Promotion.findById(id)
      .populate('applicableProducts', 'name price image')
      .lean();

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    // Lấy thống kê sử dụng của chương trình này
    const [usageStats] = await PromotionUsage.aggregate([
      { $match: { promotionId: new mongoose.Types.ObjectId(id), status: 'Used' } },
      {
        $group: {
          _id: null,
          totalUsed: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
        },
      },
    ]);

    const now = new Date();
    res.json({
      success: true,
      data: {
        promotion: {
          ...promo,
          computedStatus: getComputedStatus(promo, now),
          totalDiscountGiven: usageStats?.totalDiscount || 0,
          actualUsedCount: usageStats?.totalUsed || 0,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết khuyến mãi Admin:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================
// ADMIN: CHỈNH SỬA CHƯƠNG TRÌNH KHUYẾN MÃI
// PUT /api/admin/promotions/:id
// Quy tắc C.4:
// - Draft và usedCount === 0: sửa đầy đủ.
// - Active hoặc đã có usedCount > 0: KHÔNG ĐƯỢC ĐỔI các thông tin thương mại (code, discountValue, discountType, scope, conditions, time limits). Chỉ cho phép đổi name, description, isPublic, allowSaving.
// ============================================
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await Promotion.findById(id);

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình khuyến mãi' });
    }

    const hasBeenUsed = promo.usedCount > 0;
    const wasActive = promo.status === 'active';
    const isRestricted = hasBeenUsed || wasActive;

    const {
      name,
      description,
      isPublic,
      allowSaving,
      // Commercial fields:
      type,
      code,
      scope,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      applicableProducts,
      applicableCategories,
      startAt,
      endAt,
      usageLimit,
      perUserLimit,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên chương trình không được để trống' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Tên chương trình không được vượt quá 100 ký tự' });
    }

    if (description !== undefined) {
      if (description && description.trim().length > 250) {
        return res.status(400).json({ success: false, message: 'Mô tả ngắn không được vượt quá 250 ký tự' });
      }
      promo.description = description.trim();
    }
    promo.name = name.trim();
    if (isPublic !== undefined) promo.isPublic = Boolean(isPublic);
    if (allowSaving !== undefined) promo.allowSaving = Boolean(allowSaving);

    if (!isRestricted) {
      // Cho phép sửa đầy đủ vì là Draft chưa từng có lượt dùng
      if (type) promo.type = type;
      if (promo.type === 'voucher') {
        if (!code || !code.trim()) {
          return res.status(400).json({ success: false, message: 'Mã voucher không được để trống' });
        }
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode.length < 3 || cleanCode.length > 20) {
          return res.status(400).json({ success: false, message: 'Mã voucher phải từ 3 đến 20 ký tự' });
        }
        if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
          return res.status(400).json({
            success: false,
            message: 'Mã voucher chỉ được chứa chữ cái in hoa không dấu, số, gạch nối hoặc gạch dưới',
          });
        }
        if (cleanCode !== promo.code) {
          const duplicate = await Promotion.findOne({ code: cleanCode, _id: { $ne: promo._id } });
          if (duplicate) {
            return res.status(400).json({
              success: false,
              message: `Mã voucher "${cleanCode}" đã được sử dụng ở chương trình khác`,
            });
          }
          promo.code = cleanCode;
        }
      }

      if (scope) promo.scope = scope;
      if (discountType) promo.discountType = discountType;
      if (discountValue !== undefined) {
        if (Number(discountValue) <= 0) {
          return res.status(400).json({ success: false, message: 'Giá trị giảm phải lớn hơn 0' });
        }
        if (promo.discountType === 'percentage') {
          if (Number(discountValue) < 1 || Number(discountValue) > 100) {
            return res.status(400).json({ success: false, message: 'Tỷ lệ giảm phần trăm phải từ 1% đến 100%' });
          }
        } else {
          if (Number(discountValue) > 100000000) {
            return res.status(400).json({ success: false, message: 'Số tiền giảm không được vượt quá 100.000.000₫' });
          }
        }
        promo.discountValue = Number(discountValue);
      }
      promo.maxDiscount = maxDiscount && Number(maxDiscount) > 0 ? Math.min(Number(maxDiscount), 100000000) : null;
      if (minOrderValue !== undefined) promo.minOrderValue = Math.min(Number(minOrderValue) || 0, 500000000);
      if (applicableProducts !== undefined) promo.applicableProducts = applicableProducts;
      if (applicableCategories !== undefined) promo.applicableCategories = applicableCategories;

      if (startAt && endAt) {
        const s = new Date(startAt);
        const e = new Date(endAt);
        if (e <= s) {
          return res.status(400).json({ success: false, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
        }
        promo.startAt = s;
        promo.endAt = e;
      }

      if (usageLimit !== undefined) {
        promo.usageLimit = usageLimit && Number(usageLimit) > 0 ? Number(usageLimit) : null;
      }
      if (perUserLimit !== undefined) {
        promo.perUserLimit = Number(perUserLimit) || 1;
      }
      if (status && ['draft', 'active', 'paused'].includes(status)) {
        promo.status = status;
      }
    } else {
      // Khi đã active hoặc đã có lượt dùng: chỉ cho phép chuyển đổi status giữa active và paused
      if (status && ['active', 'paused'].includes(status)) {
        promo.status = status;
      }
    }

    await promo.save();

    logActivity({
      req,
      action: 'UPDATE',
      module: 'PROMOTION',
      targetType: 'Promotion',
      targetId: promo._id,
      targetName: promo.name,
      description: `Cập nhật thông tin chương trình khuyến mãi "${promo.name}"`,
    });

    res.json({
      success: true,
      message: isRestricted
        ? 'Đã cập nhật thông tin mô tả. Các thông tin thương mại được bảo vệ để đảm bảo quyền lợi khách hàng.'
        : 'Cập nhật chương trình khuyến mãi thành công',
      data: { promotion: promo },
    });
  } catch (error) {
    console.error('Lỗi cập nhật khuyến mãi Admin:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

// ============================================
// ADMIN: THAY ĐỔI TRẠNG THÁI (ACTIVE / PAUSED)
// PATCH /api/admin/promotions/:id/status
// ============================================
const togglePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const promo = await Promotion.findById(id);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    const oldStatus = promo.status;
    promo.status = status;
    await promo.save();

    logActivity({
      req,
      action: 'STATUS_CHANGE',
      module: 'PROMOTION',
      targetType: 'Promotion',
      targetId: promo._id,
      targetName: promo.name,
      description: `Đổi trạng thái khuyến mãi "${promo.name}" từ [${oldStatus}] sang [${status}]`,
    });

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái chương trình thành ${status === 'active' ? 'Đang hoạt động' : status === 'paused' ? 'Tạm dừng' : 'Bản nháp'}`,
      data: { promotion: promo },
    });
  } catch (error) {
    console.error('Lỗi đổi trạng thái khuyến mãi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================
// ADMIN: XÓA CHƯƠNG TRÌNH KHUYẾN MÃI
// DELETE /api/admin/promotions/:id
// Không cho xóa nếu đã có lượt sử dụng thực tế
// ============================================
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await Promotion.findById(id);

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    if (promo.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Chương trình "${promo.name}" đã có ${promo.usedCount} lượt sử dụng trong các đơn hàng thực tế. Không thể xóa để bảo toàn lịch sử đơn hàng. Bạn có thể chọn "Tạm dừng" chương trình.`,
      });
    }

    await Promotion.findByIdAndDelete(id);
    await UserSavedPromotion.deleteMany({ promotionId: id });

    logActivity({
      req,
      action: 'DELETE',
      module: 'PROMOTION',
      targetType: 'Promotion',
      targetId: id,
      targetName: promo.name,
      description: `Xóa chương trình khuyến mãi "${promo.name}"`,
    });

    res.json({
      success: true,
      message: 'Xóa chương trình khuyến mãi thành công',
    });
  } catch (error) {
    console.error('Lỗi xóa khuyến mãi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// ============================================
// ADMIN: DASHBOARD THỐNG KÊ KHUYẾN MÃI THỰC TẾ
// GET /api/admin/promotions/statistics
// ============================================
const getPromotionStatistics = async (req, res) => {
  try {
    const now = new Date();

    // 1. Lấy tất cả promotions để tính các trạng thái computedStatus thực tế
    const allPromotions = await Promotion.find({}).lean();
    let totalPromotions = allPromotions.length;
    let activeCount = 0;
    let scheduledCount = 0;
    let expiredCount = 0;
    let pausedCount = 0;
    let draftCount = 0;

    allPromotions.forEach((p) => {
      const cStatus = getComputedStatus(p, now);
      if (cStatus === 'active') activeCount++;
      else if (cStatus === 'scheduled') scheduledCount++;
      else if (cStatus === 'expired') expiredCount++;
      else if (cStatus === 'paused') pausedCount++;
      else if (cStatus === 'draft') draftCount++;
    });

    // 2. Thống kê lượt sử dụng và tổng tiền giảm thực tế từ PromotionUsages
    const [usageSummary] = await PromotionUsage.aggregate([
      { $match: { status: 'Used' } },
      {
        $group: {
          _id: null,
          totalUsageCount: { $sum: 1 },
          totalDiscountGiven: { $sum: '$discountAmount' },
        },
      },
    ]);

    // 3. Top chương trình được sử dụng nhiều nhất
    const topUsedPromotions = await PromotionUsage.aggregate([
      { $match: { status: 'Used' } },
      {
        $group: {
          _id: '$promotionId',
          useCount: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
        },
      },
      { $sort: { useCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'promotions',
          localField: '_id',
          foreignField: '_id',
          as: 'promotion',
        },
      },
      { $unwind: '$promotion' },
      {
        $project: {
          _id: 1,
          name: '$promotion.name',
          code: '$promotion.code',
          type: '$promotion.type',
          useCount: 1,
          totalDiscount: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPromotions,
        activeCount,
        scheduledCount,
        expiredCount,
        pausedCount,
        draftCount,
        totalUsageCount: usageSummary?.totalUsageCount || 0,
        totalDiscountGiven: usageSummary?.totalDiscountGiven || 0,
        topUsedPromotions,
      },
    });
  } catch (error) {
    console.error('Lỗi thống kê khuyến mãi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê' });
  }
};

// ============================================
// ADMIN: LỊCH SỬ SỬ DỤNG VOUCHER / KHUYẾN MÃI
// GET /api/admin/promotions/usages
// ============================================
const getPromotionUsages = async (req, res) => {
  try {
    const { promotionId, search, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (promotionId && mongoose.Types.ObjectId.isValid(promotionId)) {
      filter.promotionId = promotionId;
    }
    if (status && ['Used', 'Restored'].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Tìm kiếm qua populate
    const usages = await PromotionUsage.find(filter)
      .populate('promotionId', 'name code type discountType discountValue')
      .populate('orderId', 'orderCode totalAmount shippingFee createdAt')
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await PromotionUsage.countDocuments(filter);

    res.json({
      success: true,
      data: {
        usages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử sử dụng khuyến mãi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

module.exports = {
  getPublicPromotions,
  getPromotionById,
  validatePromotion,
  getMySavedPromotions,
  savePromotion,
  unsavePromotion,
  getAdminPromotions,
  createPromotion,
  getAdminPromotionById,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  getPromotionStatistics,
  getPromotionUsages,
};

