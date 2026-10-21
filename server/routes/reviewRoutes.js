const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// ============================================
// 1. PUBLIC ROUTES (KHÔNG CẦN TOKEN)
// ============================================
// Lấy danh sách đánh giá công khai của 1 sản phẩm (chỉ lấy APPROVED)
router.get('/product/:productId', reviewController.getPublicProductReviews);

// ============================================
// 2. CUSTOMER ROUTES (CẦN AUTHENTICATE TOKEN)
// ============================================
// Kiểm tra điều kiện đánh giá sản phẩm (đã mua, đơn delivered, chưa review)
router.get('/check-eligibility', authenticateToken, reviewController.checkReviewEligibility);

// Lấy danh sách đánh giá của chính khách hàng đang đăng nhập
router.get('/my-reviews', authenticateToken, reviewController.getMyReviews);

// Gửi đánh giá mới (hỗ trợ upload tối đa 5 ảnh)
router.post('/', authenticateToken, upload.array('images', 5), reviewController.createReview);

// Chỉnh sửa đánh giá của chính mình (chuyển lại PENDING)
router.put('/:id', authenticateToken, upload.array('images', 5), reviewController.updateMyReview);

// Xóa đánh giá của chính mình (xóa mềm)
router.delete('/:id', authenticateToken, reviewController.deleteMyReview);

// ============================================
// 3. ADMIN ROUTES (CẦN TOKEN + ROLE ADMIN)
// ============================================
// Admin lấy danh sách toàn bộ đánh giá (lọc, phân trang, ưu tiên PENDING)
router.get('/admin', authenticateToken, requireAdmin, reviewController.getAdminReviews);

// Admin lấy chi tiết 1 đánh giá kèm đối soát đơn hàng
router.get('/admin/:id', authenticateToken, requireAdmin, reviewController.getAdminReviewById);

// Admin kiểm duyệt đánh giá (approve, reject, hide, restore)
router.patch('/admin/:id/moderate', authenticateToken, requireAdmin, reviewController.moderateReview);

// Admin gửi / sửa phản hồi chính thức với tư cách MBBC
router.post('/admin/:id/reply', authenticateToken, requireAdmin, reviewController.replyReview);

module.exports = router;
