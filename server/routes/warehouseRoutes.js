const express = require('express');
const router = express.Router();
const {
  getInventory,
  getWarehouseStats,
  importStock,
  exportStock,
  getStockHistoryByProduct,
  adjustStock,
} = require('../controllers/warehouseController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes kho hàng đều yêu cầu đăng nhập + quyền Admin
router.use(authenticateToken, requireAdmin);

// Thống kê & Danh sách kho
router.get('/', getInventory);
router.get('/stats', getWarehouseStats);

// Nghiệp vụ Nhập kho & Xuất kho trực tiếp
router.post('/import', importStock);
router.post('/export', exportStock);
router.get('/history/:productId', getStockHistoryByProduct);

// API điều chỉnh tương thích ngược
router.post('/adjust', adjustStock);

module.exports = router;
