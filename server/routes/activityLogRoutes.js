const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getActivityLogById,
  getFilterOptions,
} = require('../controllers/activityLogController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// TẤT CẢ các routes Nhật ký hoạt động chỉ dành riêng cho Quản trị viên (Admin)
router.use(authenticateToken, requireAdmin);

// 1. Lấy danh mục tùy chọn bộ lọc (phân hệ, hành động)
router.get('/filter-options', getFilterOptions);

// 2. Lấy danh sách nhật ký hoạt động có phân trang và bộ lọc
router.get('/', getActivityLogs);

// 3. Lấy chi tiết một bản ghi nhật ký hoạt động
router.get('/:id', getActivityLogById);

module.exports = router;
