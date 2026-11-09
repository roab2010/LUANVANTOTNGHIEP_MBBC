const mongoose = require('mongoose');
const Promotion = require('../models/Promotion');
const PromotionUsage = require('../models/PromotionUsage');
const Product = require('../models/Product');

/**
 * Tính trạng thái thực tế (computedStatus) của chương trình khuyến mãi
 * @param {Object} promo
 * @param {Date} now
 * @returns {'draft'|'scheduled'|'active'|'paused'|'expired'}
 */
const getComputedStatus = (promo, now = new Date()) => {
  if (promo.status === 'draft') return 'draft';
  if (promo.status === 'paused') return 'paused';

  const startTime = new Date(promo.startAt).getTime();
  const endTime = new Date(promo.endAt).getTime();
  const currentTime = now.getTime();

  if (currentTime < startTime) return 'scheduled';
  if (currentTime > endTime) return 'expired';
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) return 'expired';

  return 'active';
};

/**
 * Làm giàu dữ liệu mảng items: đảm bảo mỗi item đều có thông tin category
 * Nếu item chưa có category nhưng có product ID, tự động tra cứu từ DB Product.
 * @param {Array} items
 * @returns {Promise<Array>}
 */
const enrichItemsWithCategory = async (items = []) => {
  if (!items || items.length === 0) return items;
  return Promise.all(
    items.map(async (it) => {
      const explicitCat = it.category || it.product?.category;
      if (explicitCat) {
        return {
          ...it,
          category: explicitCat,
        };
      }
      const prodId = it.product?._id || it.product;
      if (prodId && mongoose.Types.ObjectId.isValid(prodId)) {
        try {
          const prod = await Product.findById(prodId).select('category');
          if (prod && prod.category) {
            return {
              ...it,
              category: prod.category,
            };
          }
        } catch {
          // ignore error
        }
      }
      return it;
    })
  );
};

/**
 * Xác thực tính hợp lệ của một voucher/khuyến mãi đối với giỏ hàng và khách hàng
 * @param {Object} promo Promotion document
 * @param {Object} options { items, subtotal, userId, now }
 * @returns {{ valid: boolean, message?: string, reasonCode?: string }}
 */
const validatePromotionEligibility = async (promo, { items = [], subtotal = 0, userId = null, now = new Date() }) => {
  if (!promo) {
    return { valid: false, message: 'Mã voucher không tồn tại', reasonCode: 'NOT_FOUND' };
  }

  // Tự động bổ sung category cho các items nếu cần kiểm tra phạm vi danh mục
  if (promo.scope === 'product' && Array.isArray(promo.applicableCategories) && promo.applicableCategories.length > 0) {
    items = await enrichItemsWithCategory(items);
  }

  const computedStatus = getComputedStatus(promo, now);
  if (computedStatus === 'draft') {
    return { valid: false, message: 'Chương trình khuyến mãi đang ở trạng thái bản nháp', reasonCode: 'DRAFT' };
  }
  if (computedStatus === 'paused') {
    return { valid: false, message: 'Chương trình khuyến mãi hiện đang tạm dừng áp dụng', reasonCode: 'PAUSED' };
  }
  if (computedStatus === 'scheduled') {
    const startStr = new Date(promo.startAt).toLocaleString('vi-VN');
    return { valid: false, message: `Chương trình chưa đến thời gian sử dụng (bắt đầu lúc ${startStr})`, reasonCode: 'SCHEDULED' };
  }
  if (computedStatus === 'expired') {
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return { valid: false, message: 'Voucher đã hết lượt sử dụng', reasonCode: 'USAGE_LIMIT_REACHED' };
    }
    return { valid: false, message: 'Voucher đã hết thời hạn sử dụng', reasonCode: 'EXPIRED' };
  }

  // Kiểm tra tổng lượt sử dụng
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return { valid: false, message: 'Voucher đã hết lượt sử dụng', reasonCode: 'USAGE_LIMIT_REACHED' };
  }

  // Kiểm tra lượt sử dụng của khách hàng nếu đã đăng nhập
  if (userId && promo.perUserLimit) {
    const userUsedCount = await PromotionUsage.countDocuments({
      promotionId: promo._id,
      userId,
      status: 'Used',
    });
    if (userUsedCount >= promo.perUserLimit) {
      return {
        valid: false,
        message: `Bạn đã sử dụng tối đa ${promo.perUserLimit} lần cho khuyến mãi này`,
        reasonCode: 'USER_LIMIT_REACHED',
      };
    }
  }

  // Kiểm tra phạm vi áp dụng sản phẩm/danh mục
  const { eligibleSubtotal, eligibleItems } = getEligibleItemsAndSubtotal(promo, items);

  if (promo.scope === 'product' && eligibleItems.length === 0) {
    return {
      valid: false,
      message: 'Sản phẩm trong giỏ hàng không thuộc phạm vi áp dụng của chương trình',
      reasonCode: 'NO_MATCHING_PRODUCTS',
    };
  }

  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      message: 'Không có sản phẩm nào đủ điều kiện áp dụng khuyến mãi',
      reasonCode: 'ZERO_ELIGIBLE_AMOUNT',
    };
  }

  // Kiểm tra giá trị đơn hàng tối thiểu
  if (promo.minOrderValue && promo.minOrderValue > 0) {
    // Giá trị đơn hàng tối thiểu so sánh với tổng tiền hàng (subtotal)
    if (subtotal < promo.minOrderValue) {
      const minValStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promo.minOrderValue);
      return {
        valid: false,
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${minValStr} để áp dụng ưu đãi này`,
        reasonCode: 'MIN_ORDER_NOT_MET',
      };
    }
  }

  return { valid: true };
};

/**
 * Lọc các mặt hàng và tính tổng giá trị hàng hoá đủ điều kiện theo phạm vi
 * @param {Object} promo
 * @param {Array} items [{ product: ObjectId | Object, price, quantity, ... }]
 * @returns {{ eligibleItems: Array, eligibleSubtotal: number }}
 */
const getEligibleItemsAndSubtotal = (promo, items = []) => {
  if (!items || items.length === 0) {
    return { eligibleItems: [], eligibleSubtotal: 0 };
  }

  if (promo.scope === 'order') {
    const eligibleSubtotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
    return { eligibleItems: [...items], eligibleSubtotal };
  }

  // Scope: product -> kiểm tra theo applicableProducts và applicableCategories
  const applicableProdIds = new Set((promo.applicableProducts || []).map((p) => (p._id || p).toString()));
  const applicableCats = new Set((promo.applicableCategories || []).map((c) => c.trim().toLowerCase()));

  const eligibleItems = [];
  let eligibleSubtotal = 0;

  for (const item of items) {
    const prodId = (item.product?._id || item.product || '').toString();
    const itemCat = (item.product?.category || item.category || '').toString().trim().toLowerCase();

    const matchesProduct = applicableProdIds.has(prodId);
    const matchesCategory = itemCat && applicableCats.has(itemCat);

    if (matchesProduct || matchesCategory) {
      eligibleItems.push(item);
      eligibleSubtotal += (item.price || 0) * (item.quantity || 1);
    }
  }

  return { eligibleItems, eligibleSubtotal };
};

/**
 * Tính số tiền giảm thực tế của một chương trình
 * @param {Object} promo
 * @param {Array} items
 * @returns {{ discountAmount: number, eligibleSubtotal: number, eligibleItems: Array }}
 */
const calculateDiscountAmount = (promo, items = []) => {
  const { eligibleSubtotal, eligibleItems } = getEligibleItemsAndSubtotal(promo, items);

  if (eligibleSubtotal <= 0) {
    return { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] };
  }

  let discount = 0;

  if (promo.discountType === 'percentage') {
    discount = Math.round((eligibleSubtotal * (promo.discountValue || 0)) / 100);
    if (promo.maxDiscount && promo.maxDiscount > 0 && discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }
  } else if (promo.discountType === 'fixed') {
    discount = promo.discountValue || 0;
  }

  // Không giảm quá giá trị hàng hóa đủ điều kiện
  discount = Math.min(discount, eligibleSubtotal);
  discount = Math.max(0, discount);

  return {
    discountAmount: discount,
    eligibleSubtotal,
    eligibleItems,
  };
};

/**
 * Đánh giá chương trình khuyến mãi tốt nhất (So sánh Khuyến mãi tự động vs Voucher)
 * Quy tắc:
 * 1. Tìm khuyến mãi tự động hợp lệ cho mức giảm cao nhất.
 * 2. Nếu có voucherCode: kiểm tra tính hợp lệ của voucher. Nếu không hợp lệ, báo lỗi rõ.
 * 3. So sánh mức giảm thực tế:
 *    - Chọn chương trình giúp khách tiết kiệm nhiều nhất.
 *    - Nếu bằng nhau: ƯU TIÊN KHUYẾN MÃI TỰ ĐỘNG (khách không phải nhập mã).
 *    - Nếu voucher giảm nhiều hơn hẳn: áp dụng voucher.
 * @param {Object} params { items, subtotal, voucherCode, promotionId, userId, now }
 */
const evaluateBestPromotion = async ({ items = [], voucherCode = '', promotionId = '', userId = null, now = new Date() }) => {
  // 1. Chuẩn hoá và làm giàu category cho từng item
  items = await enrichItemsWithCategory(items);
  const subtotal = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);

  // 0. Nếu khách hàng chọn một khuyến mãi cụ thể từ danh sách
  if (promotionId && typeof promotionId === 'string' && promotionId.trim()) {
    const cleanPromoId = promotionId.trim();
    if (!mongoose.Types.ObjectId.isValid(cleanPromoId)) {
      return {
        appliedPromotion: null,
        discountAmount: 0,
        calculation: { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] },
        voucherResult: null,
        specificResult: {
          valid: false,
          message: 'Mã ID khuyến mãi không hợp lệ',
          reasonCode: 'INVALID_ID',
        },
        comparison: 'specific_failed',
      };
    }

    const specificPromo = await Promotion.findById(cleanPromoId).populate('applicableProducts', 'name category price');
    if (!specificPromo) {
      return {
        appliedPromotion: null,
        discountAmount: 0,
        calculation: { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] },
        voucherResult: null,
        specificResult: {
          valid: false,
          message: 'Chương trình khuyến mãi đã chọn không tồn tại hoặc đã bị xóa',
          reasonCode: 'NOT_FOUND',
        },
        comparison: 'specific_failed',
      };
    }

    if (specificPromo.status === 'active') {
        const valResult = await validatePromotionEligibility(specificPromo, { items, subtotal, userId, now });
        if (valResult.valid) {
          const calc = calculateDiscountAmount(specificPromo, items);
          if (calc.discountAmount > 0) {
            return {
              appliedPromotion: specificPromo,
              discountAmount: calc.discountAmount,
              calculation: calc,
              voucherResult: specificPromo.code ? { code: specificPromo.code, valid: true } : null,
              specificResult: { valid: true },
              comparison: 'specific_selected',
            };
          } else {
            return {
              appliedPromotion: null,
              discountAmount: 0,
              calculation: { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] },
              voucherResult: specificPromo.code ? { code: specificPromo.code, valid: false, message: 'Khuyến mãi đã chọn không mang lại mức giảm giá cho đơn hàng' } : null,
              specificResult: {
                valid: false,
                message: 'Khuyến mãi đã chọn không mang lại mức giảm giá cho các sản phẩm trong đơn hàng',
                reasonCode: 'ZERO_DISCOUNT',
              },
              comparison: 'specific_failed',
            };
          }
        } else {
          return {
            appliedPromotion: null,
            discountAmount: 0,
            calculation: { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] },
            voucherResult: specificPromo.code ? { code: specificPromo.code, valid: false, message: valResult.message } : null,
            specificResult: {
              valid: false,
              message: valResult.message || 'Khuyến mãi đã chọn không đủ điều kiện áp dụng',
              reasonCode: valResult.reasonCode,
            },
            comparison: 'specific_failed',
          };
        }
      } else {
        return {
          appliedPromotion: null,
          discountAmount: 0,
          calculation: { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] },
          voucherResult: specificPromo.code ? { code: specificPromo.code, valid: false, message: 'Chương trình khuyến mãi hiện không còn hiệu lực' } : null,
          specificResult: {
            valid: false,
            message: 'Chương trình khuyến mãi hiện không còn hiệu lực',
            reasonCode: 'INACTIVE',
          },
          comparison: 'specific_failed',
        };
      }
    }

  // 1. Lấy tất cả khuyến mãi tự động có trạng thái active
  const automaticPromos = await Promotion.find({
    type: 'automatic',
    status: 'active',
    startAt: { $lte: now },
    endAt: { $gte: now },
  }).populate('applicableProducts', 'name category price');

  let bestAutoPromo = null;
  let bestAutoDiscount = 0;
  let bestAutoCalc = null;

  for (const promo of automaticPromos) {
    const valResult = await validatePromotionEligibility(promo, { items, subtotal, userId, now });
    if (valResult.valid) {
      const calc = calculateDiscountAmount(promo, items);
      if (calc.discountAmount > bestAutoDiscount) {
        bestAutoDiscount = calc.discountAmount;
        bestAutoPromo = promo;
        bestAutoCalc = calc;
      }
    }
  }

  // 2. Xử lý voucher nhập mã (nếu khách cung cấp voucherCode)
  let voucherPromo = null;
  let voucherDiscount = 0;
  let voucherCalc = null;
  let voucherValidation = null;

  if (voucherCode && voucherCode.trim()) {
    const cleanCode = voucherCode.trim().toUpperCase();
    voucherPromo = await Promotion.findOne({
      code: cleanCode,
      type: 'voucher',
    }).populate('applicableProducts', 'name category price');

    if (!voucherPromo) {
      return {
        appliedPromotion: bestAutoPromo,
        discountAmount: bestAutoDiscount,
        calculation: bestAutoCalc,
        voucherResult: {
          code: cleanCode,
          valid: false,
          message: `Mã giảm giá "${cleanCode}" không tồn tại`,
          reasonCode: 'NOT_FOUND',
        },
        comparison: bestAutoPromo ? 'auto_applied_voucher_failed' : 'none',
      };
    }

    voucherValidation = await validatePromotionEligibility(voucherPromo, { items, subtotal, userId, now });
    if (!voucherValidation.valid) {
      return {
        appliedPromotion: bestAutoPromo,
        discountAmount: bestAutoDiscount,
        calculation: bestAutoCalc,
        voucherResult: {
          code: cleanCode,
          valid: false,
          message: voucherValidation.message,
          reasonCode: voucherValidation.reasonCode,
        },
        comparison: bestAutoPromo ? 'auto_applied_voucher_failed' : 'none',
      };
    }

    voucherCalc = calculateDiscountAmount(voucherPromo, items);
    voucherDiscount = voucherCalc.discountAmount;
  }

  // 3. So sánh Khuyến mãi tự động vs Voucher
  if (voucherPromo && voucherDiscount > 0) {
    // Nếu mức giảm bằng nhau -> Ưu tiên khuyến mãi tự động
    if (bestAutoPromo && bestAutoDiscount >= voucherDiscount) {
      return {
        appliedPromotion: bestAutoPromo,
        discountAmount: bestAutoDiscount,
        calculation: bestAutoCalc,
        voucherResult: {
          code: voucherPromo.code,
          valid: true,
          discountAmount: voucherDiscount,
          message: `Hệ thống tự động áp dụng "${bestAutoPromo.name}" giúp bạn tiết kiệm mức tối ưu nhất (${bestAutoDiscount.toLocaleString('vi-VN')}₫)`,
        },
        comparison: 'auto_preferred_or_equal',
      };
    }

    // Voucher giảm nhiều hơn -> Áp dụng voucher
    return {
      appliedPromotion: voucherPromo,
      discountAmount: voucherDiscount,
      calculation: voucherCalc,
      voucherResult: {
        code: voucherPromo.code,
        valid: true,
        discountAmount: voucherDiscount,
        message: `Đã áp dụng mã "${voucherPromo.code}" giảm ${voucherDiscount.toLocaleString('vi-VN')}₫`,
      },
      comparison: 'voucher_applied',
    };
  }

  // Nếu không có voucher hợp lệ hoặc voucher không giảm gì
  if (bestAutoPromo && bestAutoDiscount > 0) {
    return {
      appliedPromotion: bestAutoPromo,
      discountAmount: bestAutoDiscount,
      calculation: bestAutoCalc,
      voucherResult: null,
      comparison: 'auto_applied',
    };
  }

  // Không có khuyến mãi nào áp dụng được
  return {
    appliedPromotion: null,
    discountAmount: 0,
    calculation: { discountAmount: 0, eligibleSubtotal: 0, eligibleItems: [] },
    voucherResult: null,
    comparison: 'none',
  };
};

module.exports = {
  getComputedStatus,
  validatePromotionEligibility,
  getEligibleItemsAndSubtotal,
  calculateDiscountAmount,
  evaluateBestPromotion,
};

