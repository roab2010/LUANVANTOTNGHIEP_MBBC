const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getRevenueChart,
  getTopProducts,
  getOrderStatusDistribution,
} = require('../controllers/statisticController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes thống kê đều yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

router.get('/overview', getOverviewStats);
router.get('/revenue-chart', getRevenueChart);
router.get('/top-products', getTopProducts);
router.get('/order-status', getOrderStatusDistribution);

module.exports = router;
