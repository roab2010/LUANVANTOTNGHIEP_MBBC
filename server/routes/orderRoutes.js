const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes đơn hàng phía quản trị đều yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router;
