const express = require('express');
const router = express.Router();
const {
  getOrders,
  getMyOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// 1. Tạo đơn hàng (khách đăng nhập hoặc khách vãng lai)
router.post('/', optionalAuth, createOrder);

// 2. Lấy danh sách đơn hàng của khách hàng đăng nhập
router.get('/my-orders', authenticateToken, getMyOrders);

// 3. Xem chi tiết đơn hàng (Admin hoặc chính khách hàng sở hữu đơn)
router.get('/:id', authenticateToken, getOrderById);

// 4. Các routes dành riêng cho Quản trị viên (Admin)
router.get('/', authenticateToken, requireAdmin, getOrders);
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteOrder);

module.exports = router;
