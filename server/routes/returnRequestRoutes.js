const express = require('express');
const router = express.Router();
const {
  checkOrderReturnEligibility,
  createReturnRequest,
  getMyReturnRequests,
  getReturnRequestById,
  cancelMyReturnRequest,
} = require('../controllers/returnRequestController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// ============================================
// ROUTES ĐỔI TRẢ DÀNH CHO KHÁCH HÀNG (CUSTOMER)
// ============================================

// 1. Kiểm tra đơn hàng có đủ điều kiện đổi trả hay không
router.get('/order-eligibility/:orderId', authenticateToken, checkOrderReturnEligibility);

// 2. Lấy danh sách yêu cầu đổi trả của chính khách hàng đang đăng nhập
router.get('/my-returns', authenticateToken, getMyReturnRequests);

// 3. Tạo yêu cầu đổi trả mới (hỗ trợ tải lên tối đa 5 ảnh minh chứng)
router.post('/', authenticateToken, upload.array('images', 5), createReturnRequest);

// 4. Xem chi tiết 1 yêu cầu đổi trả
router.get('/:id', authenticateToken, getReturnRequestById);

// 5. Khách hàng chủ động hủy yêu cầu đổi trả khi còn PENDING
router.patch('/:id/cancel', authenticateToken, cancelMyReturnRequest);

module.exports = router;
