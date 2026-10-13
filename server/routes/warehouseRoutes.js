const express = require('express');
const router = express.Router();
const {
  getInventory,
  getWarehouseStats,
  adjustStock,
} = require('../controllers/warehouseController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes kho hàng đều yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

router.get('/', getInventory);
router.get('/stats', getWarehouseStats);
router.post('/adjust', adjustStock);

module.exports = router;
