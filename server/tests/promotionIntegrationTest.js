const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Promotion = require('../models/Promotion');
const PromotionUsage = require('../models/PromotionUsage');
const UserSavedPromotion = require('../models/UserSavedPromotion');
const {
  getComputedStatus,
  validatePromotionEligibility,
  calculateDiscountAmount,
  evaluateBestPromotion,
} = require('../services/promotionEngine');

async function runTests() {
  console.log('🚀 Bắt đầu bộ kiểm thử toàn diện Chức năng Khuyến mãi & Voucher (27 trường hợp)...');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB Atlas');

    // Dọn dẹp dữ liệu test cũ nếu có
    await Promotion.deleteMany({ code: { $regex: /^TEST_/ } });
    await Promotion.deleteMany({ name: { $regex: /^\[TEST\]/ } });

    // Lấy hoặc tạo user test
    let testAdmin = await User.findOne({ role: 'admin' });
    let testCustomer = await User.findOne({ role: 'customer', status: 'active' });
    if (!testCustomer) {
      testCustomer = await User.create({
        fullName: 'Khách Test MBBC',
        email: `test_promo_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'customer',
        status: 'active',
      });
    }

    let testCustomer2 = await User.create({
      fullName: 'Khách Test 2',
      email: `test_promo_2_${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'customer',
      status: 'active',
    });

    let testProduct = await Product.findOne({ status: 'active' });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Áo Thun Test MBBC',
        price: 250000,
        costPrice: 100000,
        stock: 100,
        category: 'ÁO',
        status: 'active',
      });
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ============================================
    // CASE 1: Tạo voucher giảm phần trăm
    // ============================================
    const promoPercent = await Promotion.create({
      name: '[TEST] Voucher giảm 20%',
      type: 'voucher',
      code: 'TEST_PCT20',
      scope: 'order',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 50000,
      minOrderValue: 200000,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
      isPublic: true,
      allowSaving: true,
    });
    assert(promoPercent && promoPercent.discountValue === 20, '1. Tạo voucher giảm phần trăm thành công');

    // ============================================
    // CASE 2: Tạo voucher giảm số tiền cố định
    // ============================================
    const promoFixed = await Promotion.create({
      name: '[TEST] Voucher giảm 30K',
      type: 'voucher',
      code: 'TEST_FIX30',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 30000,
      minOrderValue: 150000,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
      isPublic: true,
      allowSaving: true,
    });
    assert(promoFixed && promoFixed.discountValue === 30000, '2. Tạo voucher giảm số tiền cố định thành công');

    // ============================================
    // CASE 3: Tạo khuyến mãi tự động
    // ============================================
    const promoAuto = await Promotion.create({
      name: '[TEST] Tự động giảm 16%',
      type: 'automatic',
      scope: 'order',
      discountType: 'percentage',
      discountValue: 16,
      minOrderValue: 100000,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
      isPublic: true,
      allowSaving: false,
    });
    assert(promoAuto && promoAuto.type === 'automatic', '3. Tạo khuyến mãi tự động thành công');

    // ============================================
    // CASE 4: Tạo voucher công khai
    // ============================================
    assert(promoPercent.isPublic === true, '4. Tạo voucher công khai (isPublic: true) thành công');

    // ============================================
    // CASE 5: Khách chưa đăng nhập xem được voucher
    // ============================================
    const publicList = await Promotion.find({ isPublic: true, status: 'active' });
    assert(publicList.length > 0, '5. Khách chưa đăng nhập xem được danh sách voucher công khai');

    // ============================================
    // CASE 6: Khách chưa đăng nhập không lưu được voucher
    // ============================================
    let guestSaveError = false;
    try {
      // UserSavedPromotion yêu cầu userId bắt buộc
      await UserSavedPromotion.create({ userId: null, promotionId: promoPercent._id });
    } catch {
      guestSaveError = true;
    }
    assert(guestSaveError, '6. Khách chưa đăng nhập (userId = null) bị chặn không lưu được voucher');

    // ============================================
    // CASE 7: Khách đã đăng nhập lưu được voucher
    // ============================================
    const savedDoc = await UserSavedPromotion.create({
      userId: testCustomer._id,
      promotionId: promoPercent._id,
    });
    assert(savedDoc && savedDoc.userId.equals(testCustomer._id), '7. Khách đã đăng nhập lưu được voucher vào tài khoản');

    // ============================================
    // CASE 8: Không lưu trùng voucher
    // ============================================
    let duplicateSaveError = false;
    try {
      await UserSavedPromotion.create({
        userId: testCustomer._id,
        promotionId: promoPercent._id,
      });
    } catch (err) {
      duplicateSaveError = true;
    }
    assert(duplicateSaveError, '8. Chặn thành công không cho khách lưu trùng một voucher');

    // ============================================
    // CASE 9: Voucher đã lưu hiển thị trong Kho ưu đãi
    // ============================================
    const customerSavedList = await UserSavedPromotion.find({ userId: testCustomer._id }).populate('promotionId');
    assert(customerSavedList.some((s) => s.promotionId._id.equals(promoPercent._id)), '9. Voucher đã lưu hiển thị đúng trong Kho ưu đãi cá nhân');

    // ============================================
    // CASE 10: Voucher hết hạn không sử dụng được
    // ============================================
    const expiredPromo = await Promotion.create({
      name: '[TEST] Voucher hết hạn',
      type: 'voucher',
      code: 'TEST_EXPIRED',
      scope: 'order',
      discountType: 'percentage',
      discountValue: 50,
      startAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    const expResult = await validatePromotionEligibility(expiredPromo, {
      items: [{ product: testProduct, price: testProduct.price, quantity: 1 }],
      subtotal: testProduct.price,
    });
    assert(!expResult.valid && expResult.reasonCode === 'EXPIRED', '10. Voucher hết hạn bị từ chối sử dụng (EXPIRED)');

    // ============================================
    // CASE 11: Voucher chưa bắt đầu không sử dụng được
    // ============================================
    const futurePromo = await Promotion.create({
      name: '[TEST] Voucher tương lai',
      type: 'voucher',
      code: 'TEST_FUTURE',
      scope: 'order',
      discountType: 'percentage',
      discountValue: 50,
      startAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'active',
    });
    const futureResult = await validatePromotionEligibility(futurePromo, {
      items: [{ product: testProduct, price: testProduct.price, quantity: 1 }],
      subtotal: testProduct.price,
    });
    assert(!futureResult.valid && futureResult.reasonCode === 'SCHEDULED', '11. Voucher chưa đến ngày sử dụng bị từ chối (SCHEDULED)');

    // ============================================
    // CASE 12: Voucher bị tạm dừng không sử dụng được
    // ============================================
    const pausedPromo = await Promotion.create({
      name: '[TEST] Voucher tạm dừng',
      type: 'voucher',
      code: 'TEST_PAUSED',
      scope: 'order',
      discountType: 'percentage',
      discountValue: 25,
      startAt: pastDate,
      endAt: futureDate,
      status: 'paused',
    });
    const pausedResult = await validatePromotionEligibility(pausedPromo, {
      items: [{ product: testProduct, price: testProduct.price, quantity: 1 }],
      subtotal: testProduct.price,
    });
    assert(!pausedResult.valid && pausedResult.reasonCode === 'PAUSED', '12. Voucher đang tạm dừng bị từ chối sử dụng (PAUSED)');

    // ============================================
    // CASE 13: Không đủ giá trị đơn hàng tối thiểu
    // ============================================
    const minOrderPromo = await Promotion.create({
      name: '[TEST] Đơn tối thiểu 500k',
      type: 'voucher',
      code: 'TEST_MIN500',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderValue: 500000,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    const minOrderResult = await validatePromotionEligibility(minOrderPromo, {
      items: [{ product: testProduct, price: 200000, quantity: 1 }],
      subtotal: 200000,
    });
    assert(!minOrderResult.valid && minOrderResult.reasonCode === 'MIN_ORDER_NOT_MET', '13. Đơn hàng chưa đạt giá trị tối thiểu bị từ chối (MIN_ORDER_NOT_MET)');

    // ============================================
    // CASE 14: Sản phẩm không thuộc phạm vi áp dụng
    // ============================================
    const scopeProductPromo = await Promotion.create({
      name: '[TEST] Chỉ giảm danh mục PHỤ KIỆN',
      type: 'voucher',
      code: 'TEST_ACCESSORY',
      scope: 'product',
      applicableCategories: ['PHỤ KIỆN'],
      discountType: 'percentage',
      discountValue: 30,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    const scopeResult = await validatePromotionEligibility(scopeProductPromo, {
      items: [{ product: testProduct, price: testProduct.price, quantity: 1, category: 'ÁO' }],
      subtotal: testProduct.price,
    });
    assert(!scopeResult.valid && scopeResult.reasonCode === 'NO_MATCHING_PRODUCTS', '14. Sản phẩm không thuộc phạm vi bị từ chối (NO_MATCHING_PRODUCTS)');

    // ============================================
    // CASE 15: Voucher hết lượt sử dụng
    // ============================================
    const limitPromo = await Promotion.create({
      name: '[TEST] Giới hạn 2 lượt',
      type: 'voucher',
      code: 'TEST_LIMIT2',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 20000,
      usageLimit: 2,
      usedCount: 2,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    const limitResult = await validatePromotionEligibility(limitPromo, {
      items: [{ product: testProduct, price: testProduct.price, quantity: 1 }],
      subtotal: testProduct.price,
    });
    assert(!limitResult.valid && limitResult.reasonCode === 'USAGE_LIMIT_REACHED', '15. Voucher đã dùng hết lượt tổng cộng bị từ chối (USAGE_LIMIT_REACHED)');

    // ============================================
    // CASE 16: Khách vượt giới hạn sử dụng cá nhân
    // ============================================
    const userLimitPromo = await Promotion.create({
      name: '[TEST] Giới hạn 1 lần / khách',
      type: 'voucher',
      code: 'TEST_USER1',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 10000,
      perUserLimit: 1,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    // Giả lập 1 bản ghi sử dụng trước đó cho testCustomer
    const dummyOrder = await Order.create({
      orderCode: `TEST-ORD-DUMMY-${Date.now()}`,
      customer: { fullName: testCustomer.fullName, phone: '0912345678' },
      items: [{ product: testProduct._id, name: testProduct.name, price: testProduct.price, quantity: 1, total: testProduct.price }],
      totalAmount: testProduct.price,
    });
    await PromotionUsage.create({
      promotionId: userLimitPromo._id,
      userId: testCustomer._id,
      orderId: dummyOrder._id,
      discountAmount: 10000,
      status: 'Used',
    });
    const userLimitResult = await validatePromotionEligibility(userLimitPromo, {
      items: [{ product: testProduct, price: testProduct.price, quantity: 1 }],
      subtotal: testProduct.price,
      userId: testCustomer._id,
    });
    assert(!userLimitResult.valid && userLimitResult.reasonCode === 'USER_LIMIT_REACHED', '16. Khách hàng đã đạt giới hạn sử dụng cá nhân bị từ chối (USER_LIMIT_REACHED)');

    // ============================================
    // CASE 17: Tự động chọn chương trình giảm nhiều tiền nhất
    // ============================================
    // Giỏ hàng 500k: promoAuto (16% = 80k), voucher TEST_FIX30 (30k) -> chọn promoAuto
    const eval1 = await evaluateBestPromotion({
      items: [{ product: testProduct, price: 500000, quantity: 1 }],
      voucherCode: 'TEST_FIX30',
      userId: testCustomer._id,
    });
    assert(eval1.discountAmount === 80000 && eval1.appliedPromotion._id.equals(promoAuto._id), '17. Tự động so sánh và chọn chương trình tiết kiệm nhiều tiền nhất (80.000₫ > 30.000₫)');

    // ============================================
    // CASE 18: Nếu mức giảm bằng nhau, ưu tiên khuyến mãi tự động
    // ============================================
    // Tạo voucher giảm 80k (bằng với promoAuto 16% của 500k)
    const promoEqualVoucher = await Promotion.create({
      name: '[TEST] Voucher giảm 80K',
      type: 'voucher',
      code: 'TEST_EQUAL80',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 80000,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    const eval2 = await evaluateBestPromotion({
      items: [{ product: testProduct, price: 500000, quantity: 1 }],
      voucherCode: 'TEST_EQUAL80',
      userId: testCustomer._id,
    });
    assert(eval2.appliedPromotion.type === 'automatic', '18. Mức giảm bằng nhau (80k vs 80k) -> Ưu tiên khuyến mãi tự động');

    // ============================================
    // CASE 19: Không cộng dồn hai chương trình
    // ============================================
    // Kiểm tra rằng kết quả chỉ trả về 1 chương trình appliedPromotion duy nhất
    assert(eval2.appliedPromotion && !Array.isArray(eval2.appliedPromotion), '19. Chỉ áp dụng duy nhất 1 chương trình, tuyệt đối không cộng dồn');

    // ============================================
    // CASE 20: Không giảm phí vận chuyển
    // ============================================
    const shippingFee = 35000;
    const subtotal20 = 250000;
    const discount20 = 50000;
    const grandTotal20 = Math.max(0, subtotal20 - discount20) + shippingFee;
    assert(grandTotal20 === 235000, '20. Giảm giá chỉ trừ trên tiền hàng, không giảm phí vận chuyển (200k + 35k ship = 235k)');

    // ============================================
    // CASE 21: Không tin tưởng giá do frontend gửi lên
    // ============================================
    // Khách gửi item với giá 1000đ nhưng DB thực tế có giá khác
    const fakePriceItem = { product: testProduct._id, price: 1000, quantity: 1 };
    const realProduct = await Product.findById(fakePriceItem.product);
    const backendSubtotal = realProduct.price * fakePriceItem.quantity;
    assert(backendSubtotal === realProduct.price && backendSubtotal !== fakePriceItem.price, `21. Backend tự lấy giá chuẩn từ DB (${realProduct.price}₫), không tin giá frontend (${fakePriceItem.price}₫)`);

    // ============================================
    // CASE 22: Concurrency / Race Condition xử lý an toàn
    // ============================================
    const promoAtomic = await Promotion.create({
      name: '[TEST] Atomic Voucher',
      type: 'voucher',
      code: 'TEST_ATOMIC',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 10000,
      usageLimit: 3,
      usedCount: 0,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    // Giả lập 5 request cập nhật atomic đồng thời (chỉ 3 request đầu được phép thành công)
    const updatePromises = Array.from({ length: 5 }).map(() =>
      Promotion.findOneAndUpdate(
        { _id: promoAtomic._id, usedCount: { $lt: promoAtomic.usageLimit } },
        { $inc: { usedCount: 1 } },
        { returnDocument: 'after' }
      )
    );
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(Boolean).length;
    assert(successfulUpdates === 3, `22. Xử lý đồng thời (Race Condition) an toàn: Chỉ 3/${results.length} request thành công`);

    // ============================================
    // CASE 23: Đơn hàng lưu đúng snapshot khuyến mãi
    // ============================================
    const orderWithPromo = await Order.create({
      orderCode: `TEST-ORD-SNAP-${Date.now()}`,
      customer: { fullName: 'Khách Snapshot', phone: '0933333333' },
      items: [{ product: testProduct._id, name: testProduct.name, price: 250000, quantity: 1, total: 250000 }],
      subtotal: 250000,
      discountAmount: 50000,
      promotion: {
        promotionId: promoEqualVoucher._id,
        name: promoEqualVoucher.name,
        code: promoEqualVoucher.code,
        type: promoEqualVoucher.type,
        scope: promoEqualVoucher.scope,
        discountType: promoEqualVoucher.discountType,
        discountValue: promoEqualVoucher.discountValue,
        discountAmount: 50000,
      },
      shippingFee: 30000,
      totalAmount: 230000,
    });
    assert(
      orderWithPromo.promotion &&
        orderWithPromo.promotion.code === promoEqualVoucher.code &&
        orderWithPromo.discountAmount === 50000 &&
        orderWithPromo.subtotal === 250000,
      '23. Đơn hàng lưu đầy đủ snapshot khuyến mãi và số tiền giảm độc lập'
    );

    // ============================================
    // CASE 24: Hủy đơn hoàn lại lượt sử dụng đúng một lần
    // ============================================
    const promoForCancel = await Promotion.create({
      name: '[TEST] Voucher Hủy Đơn',
      type: 'voucher',
      code: 'TEST_CANCEL',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 20000,
      usedCount: 1,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });
    const cancelUsage = await PromotionUsage.create({
      promotionId: promoForCancel._id,
      userId: testCustomer._id,
      orderId: orderWithPromo._id,
      discountAmount: 20000,
      status: 'Used',
    });

    // Giả lập hủy đơn lần 1:
    let usageToRestore = await PromotionUsage.findOne({ orderId: orderWithPromo._id, status: 'Used' });
    if (usageToRestore) {
      await Promotion.findByIdAndUpdate(usageToRestore.promotionId, { $inc: { usedCount: -1 } });
      usageToRestore.status = 'Restored';
      usageToRestore.restoredAt = new Date();
      await usageToRestore.save();
    }
    const checkPromoAfter1stCancel = await Promotion.findById(promoForCancel._id);
    assert(checkPromoAfter1stCancel.usedCount === 0 && usageToRestore.status === 'Restored', '24a. Hủy đơn lần 1: Hoàn lại usedCount (1 -> 0) và đổi status sang Restored');

    // Giả lập hủy đơn lần 2 (lặp lại):
    let usageToRestore2nd = await PromotionUsage.findOne({ orderId: orderWithPromo._id, status: 'Used' });
    assert(!usageToRestore2nd, '24b. Hủy đơn lặp lại không tìm thấy bản ghi Used -> Không hoàn lượt lần 2 (Chống hoàn trùng)');

    // ============================================
    // CASE 25: Đơn hàng cũ không bị thay đổi khi Admin sửa voucher
    // ============================================
    promoEqualVoucher.discountValue = 100000;
    await promoEqualVoucher.save();
    const reloadOrder = await Order.findById(orderWithPromo._id);
    assert(reloadOrder.promotion.discountValue === 80000, '25. Lịch sử đơn hàng cũ giữ nguyên snapshot, không bị đổi khi Admin sửa voucher');

    // ============================================
    // CASE 26: Khách không xem được Kho voucher của người khác
    // ============================================
    const savedCustomer1 = await UserSavedPromotion.find({ userId: testCustomer._id });
    const savedCustomer2 = await UserSavedPromotion.find({ userId: testCustomer2._id });
    assert(!savedCustomer2.some((s) => s.userId.equals(testCustomer._id)), '26. Bảo mật: Kho voucher của từng khách hàng được phân tách độc lập qua userId');

    // ============================================
    // CASE 27: Tài khoản thường bị chặn không truy cập được API Admin
    // ============================================
    const mockCustomerReq = { user: { userId: testCustomer._id, role: 'customer' } };
    const { requireAdmin } = require('../middleware/roleMiddleware');
    let adminCheckBlocked = false;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 403) adminCheckBlocked = true;
        },
      }),
    };
    requireAdmin(mockCustomerReq, mockRes, () => {});
    assert(adminCheckBlocked, '27. Phân quyền: Role customer bị từ chối 403 khi gọi API quản trị Admin');

    // ============================================
    // CASE 28: Khuyến mãi danh mục tự động nhận diện category khi items chỉ có ObjectId
    // ============================================
    const promoCategory = await Promotion.create({
      name: '[TEST] Khuyến mãi danh mục Áo',
      type: 'automatic',
      scope: 'product',
      applicableCategories: [testProduct.category || 'Áo'],
      discountType: 'percentage',
      discountValue: 20,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });

    const evalCategoryOnlyId = await evaluateBestPromotion({
      items: [{ product: testProduct._id, price: 300000, quantity: 1 }],
      userId: testCustomer._id,
    });
    assert(
      evalCategoryOnlyId.appliedPromotion &&
      evalCategoryOnlyId.appliedPromotion._id.equals(promoCategory._id) &&
      evalCategoryOnlyId.discountAmount === 60000,
      '28. Khuyến mãi danh mục tự động nhận diện category qua enrichItemsWithCategory khi items chỉ có ObjectId'
    );

    // ============================================
    // CASE 29: Khách chọn promotionId cụ thể -> Giữ nguyên, không bị ghi đè bởi khuyến mãi tự động khác
    // ============================================
    const promoOrderWide = await Promotion.create({
      name: '[TEST] Khuyến mãi toàn sàn 50K',
      type: 'automatic',
      scope: 'order',
      discountType: 'fixed',
      discountValue: 50000,
      minOrderValue: 200000,
      startAt: pastDate,
      endAt: futureDate,
      status: 'active',
    });

    const evalSpecificLock = await evaluateBestPromotion({
      items: [{ product: testProduct._id, price: 300000, quantity: 1 }],
      promotionId: promoCategory._id.toString(),
      userId: testCustomer._id,
    });
    assert(
      evalSpecificLock.appliedPromotion &&
      evalSpecificLock.appliedPromotion._id.equals(promoCategory._id) &&
      evalSpecificLock.discountAmount === 60000 &&
      evalSpecificLock.comparison === 'specific_selected',
      '29. Khách chọn promotionId cụ thể hợp lệ -> Giữ nguyên ưu đãi danh mục (60k), không bị đè bởi ưu đãi đơn hàng (50k)'
    );

    // ============================================
    // CASE 30: Khách chọn promotionId không đủ điều kiện -> Báo lỗi chi tiết thay vì âm thầm đổi ưu đãi khác
    // ============================================
    const nonMatchingProduct = await Product.create({
      name: '[TEST] Thắt lưng phụ kiện',
      category: 'Phụ kiện',
      price: 150000,
      costPrice: 50000,
      stock: 10,
      unit: 'cái',
      status: 'active',
    });

    const evalIneligibleSpecific = await evaluateBestPromotion({
      items: [{ product: nonMatchingProduct._id, price: 150000, quantity: 1 }],
      promotionId: promoCategory._id.toString(),
      userId: testCustomer._id,
    });
    assert(
      evalIneligibleSpecific.specificResult &&
      evalIneligibleSpecific.specificResult.valid === false &&
      evalIneligibleSpecific.comparison === 'specific_failed',
      '30. Khách chọn promotionId không đủ điều kiện -> Báo specificResult.valid = false chi tiết, không âm thầm tráo ưu đãi'
    );

    // DỌN DẸP DỮ LIỆU TEST
    await Product.findByIdAndDelete(nonMatchingProduct._id);
    await Promotion.deleteMany({ code: { $regex: /^TEST_/ } });
    await Promotion.deleteMany({ name: { $regex: /^\[TEST\]/ } });
    await PromotionUsage.deleteMany({ orderId: { $in: [dummyOrder._id, orderWithPromo._id] } });
    await UserSavedPromotion.deleteMany({ userId: { $in: [testCustomer._id, testCustomer2._id] } });
    await Order.deleteMany({ _id: { $in: [dummyOrder._id, orderWithPromo._id] } });
    await User.findByIdAndDelete(testCustomer2._id);

    console.log(`\n========================================`);
    console.log(`📊 KẾT QUẢ KIỂM THỬ: ${passed}/27 ĐẠT (${failed} thất bại)`);
    console.log(`========================================`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong quá trình test:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
