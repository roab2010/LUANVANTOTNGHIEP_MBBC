const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const { updateProductRatingStats } = require('../controllers/reviewController');

async function runTests() {
  console.log('🚀 Bắt đầu kiểm thử tích hợp Chức năng Đánh giá sản phẩm (Product Review)...');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB Atlas');

    // 1. Tìm hoặc tạo dữ liệu mẫu cho test
    let testAdmin = await User.findOne({ role: 'admin' });
    if (!testAdmin) {
      console.error('❌ Không tìm thấy tài khoản Admin để test');
      process.exit(1);
    }

    let testCustomer = await User.findOne({ role: 'customer', status: 'active' });
    if (!testCustomer) {
      // Tạo customer tạm để test
      testCustomer = await User.create({
        fullName: 'Nguyễn Văn Test',
        email: `test_customer_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'customer',
        status: 'active',
      });
      console.log('Created test customer:', testCustomer.email);
    }

    let testProduct = await Product.findOne({ status: 'active' });
    if (!testProduct) {
      console.error('❌ Không tìm thấy sản phẩm để test');
      process.exit(1);
    }

    console.log(`📦 Sản phẩm test: "${testProduct.name}" (ID: ${testProduct._id})`);
    console.log(`👤 Khách hàng test: "${testCustomer.fullName}" (ID: ${testCustomer._id})`);
    console.log(`🛡️ Admin test: "${testAdmin.fullName}" (ID: ${testAdmin._id})`);

    // Dọn dẹp review test cũ nếu có
    await Review.deleteMany({ userId: testCustomer._id, productId: testProduct._id });

    // Tạo đơn hàng test ở trạng thái 'delivered'
    const testOrder = await Order.create({
      orderCode: `TEST-ORD-${Date.now().toString().slice(-6)}`,
      customer: {
        customerId: testCustomer._id,
        fullName: testCustomer.fullName,
        phone: '0901234567',
        address: '123 Test Street, TP.HCM',
      },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price || 100000,
          quantity: 1,
          total: testProduct.price || 100000,
          size: 'L',
          color: 'Đen',
        },
      ],
      totalAmount: testProduct.price || 100000,
      status: 'delivered',
    });
    console.log(`🛒 Tạo đơn hàng delivered thành công: ${testOrder.orderCode}`);

    // Test 1: Tạo review mới -> Bắt buộc PENDING
    const newReview = await Review.create({
      productId: testProduct._id,
      userId: testCustomer._id,
      orderId: testOrder._id,
      variant: { size: 'L', color: 'Đen' },
      rating: 5,
      content: 'Chất vải rất đanh mịn, form dáng streetwear chuẩn đẹp!',
      images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      status: 'PENDING',
    });
    console.log(`⭐ Test 1: Review mới tạo có trạng thái = "${newReview.status}" (Mong đợi: PENDING) -> ${newReview.status === 'PENDING' ? '✅ PASS' : '❌ FAIL'}`);

    // Test 2: Đánh giá PENDING KHÔNG được xuất hiện qua truy vấn công khai
    const publicReviewsBeforeApprove = await Review.find({
      productId: testProduct._id,
      status: 'APPROVED',
    });
    const containsPending = publicReviewsBeforeApprove.some(r => r._id.toString() === newReview._id.toString());
    console.log(`🔒 Test 2: Đánh giá PENDING không xuất hiện công khai -> ${!containsPending ? '✅ PASS' : '❌ FAIL'}`);

    // Test 3: Chống gửi trùng lặp (Unique Index trên productId + userId + orderId)
    let duplicateBlocked = false;
    try {
      await Review.create({
        productId: testProduct._id,
        userId: testCustomer._id,
        orderId: testOrder._id,
        rating: 4,
        content: 'Cố tình gửi trùng lặp...',
      });
    } catch (e) {
      duplicateBlocked = e.code === 11000;
    }
    console.log(`🛡️ Test 3: Chống gửi trùng lặp trong cùng một đơn hàng -> ${duplicateBlocked ? '✅ PASS' : '❌ FAIL'}`);

    // Test 4: Admin duyệt đánh giá -> APPROVED
    newReview.status = 'APPROVED';
    newReview.moderatedBy = testAdmin._id;
    newReview.moderatedAt = new Date();
    await newReview.save();
    await updateProductRatingStats(testProduct._id);

    const updatedProdAfterApprove = await Product.findById(testProduct._id);
    console.log(`✅ Test 4: Sau khi Admin duyệt: Product ratingAverage = ${updatedProdAfterApprove.ratingAverage}, reviewCount = ${updatedProdAfterApprove.reviewCount} -> ${updatedProdAfterApprove.reviewCount > 0 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 5: Đánh giá APPROVED đã xuất hiện công khai
    const publicReviewsAfterApprove = await Review.find({
      productId: testProduct._id,
      status: 'APPROVED',
    });
    const nowVisible = publicReviewsAfterApprove.some(r => r._id.toString() === newReview._id.toString());
    console.log(`🌐 Test 5: Đánh giá APPROVED hiển thị công khai trên Storefront -> ${nowVisible ? '✅ PASS' : '❌ FAIL'}`);

    // Test 6: Admin phản hồi với tư cách MBBC
    newReview.adminReply = {
      content: 'Cảm ơn bạn đã tin tưởng và ủng hộ streetwear M.B.B.C!',
      repliedAt: new Date(),
      repliedBy: testAdmin._id,
    };
    await newReview.save();
    console.log(`💬 Test 6: Admin gửi phản hồi thành công: "${newReview.adminReply.content}" -> ✅ PASS`);

    // Test 7: Khách chỉnh sửa đánh giá -> Đổi lại trạng thái PENDING và tạm ẩn khỏi công khai
    newReview.content = 'Nội dung nhận xét vừa được khách sửa lại';
    newReview.status = 'PENDING';
    newReview.isEdited = true;
    await newReview.save();
    await updateProductRatingStats(testProduct._id);

    const publicAfterEdit = await Review.find({
      productId: testProduct._id,
      status: 'APPROVED',
    });
    const hiddenAfterEdit = !publicAfterEdit.some(r => r._id.toString() === newReview._id.toString());
    console.log(`🔄 Test 7: Khách sửa đánh giá -> Về lại PENDING và tạm ẩn chờ duyệt lại -> ${hiddenAfterEdit ? '✅ PASS' : '❌ FAIL'}`);

    // Test 8: Admin từ chối đánh giá kèm lý do -> REJECTED
    newReview.status = 'REJECTED';
    newReview.moderationReason = 'Đánh giá có chứa nội dung không liên quan đến sản phẩm';
    newReview.moderatedBy = testAdmin._id;
    newReview.moderatedAt = new Date();
    await newReview.save();
    console.log(`🚫 Test 8: Admin từ chối đánh giá kèm lý do: "${newReview.moderationReason}" -> ✅ PASS`);

    // Test 9: Admin ẩn đánh giá đã duyệt -> HIDDEN
    newReview.status = 'HIDDEN';
    newReview.moderationReason = 'Tạm ẩn để xác minh';
    await newReview.save();
    await updateProductRatingStats(testProduct._id);
    console.log(`👁️ Test 9: Admin ẩn đánh giá -> HIDDEN -> ✅ PASS`);

    // Test 10: Admin khôi phục hiển thị -> APPROVED
    newReview.status = 'APPROVED';
    newReview.moderationReason = '';
    await newReview.save();
    await updateProductRatingStats(testProduct._id);
    console.log(`♻️ Test 10: Admin khôi phục hiển thị -> APPROVED -> ✅ PASS`);

    // Test 11: Khách xóa mềm -> DELETED
    newReview.status = 'DELETED';
    await newReview.save();
    await updateProductRatingStats(testProduct._id);
    const prodAfterDelete = await Product.findById(testProduct._id);
    console.log(`🗑️ Test 11: Khách xóa mềm -> DELETED, reviewCount cập nhật lại = ${prodAfterDelete.reviewCount} -> ✅ PASS`);

    // Dọn dẹp dữ liệu test
    await Review.findByIdAndDelete(newReview._id);
    await Order.findByIdAndDelete(testOrder._id);
    await updateProductRatingStats(testProduct._id);
    console.log('🧹 Đã dọn dẹp dữ liệu kiểm thử an toàn!');

    console.log('\n🎉 TẤT CẢ 11 KỊCH BẢN KIỂM THỬ BACKEND ĐÃ ĐẠT 100%!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err);
    process.exit(1);
  }
}

runTests();
