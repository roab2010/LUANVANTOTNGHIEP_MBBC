const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes đều yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

// CRUD routes
router.get('/', getCategories);           // Lấy danh sách (có search, filter, phân trang)
router.get('/:id', getCategoryById);      // Lấy chi tiết
router.post('/', createCategory);         // Tạo mới
router.put('/:id', updateCategory);       // Cập nhật
router.delete('/:id', deleteCategory);    // Xóa

module.exports = router;
