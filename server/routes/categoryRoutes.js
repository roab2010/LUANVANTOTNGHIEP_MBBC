const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
  getPublicCategories,
} = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Route công khai: Khách hàng lấy danh mục active để xem sản phẩm
router.get('/public', getPublicCategories);

// Các routes quản trị dưới đây yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

// CRUD routes
router.get('/', getCategories);                       // Lấy danh sách (có search, filter, phân trang)
router.get('/:id', getCategoryById);                  // Lấy chi tiết
router.post('/', createCategory);                     // Tạo mới
router.put('/:id', updateCategory);                   // Cập nhật
router.patch('/:id/toggle-status', toggleCategoryStatus); // Khóa / Mở khóa danh mục
router.delete('/:id', deleteCategory);                // Khóa danh mục

module.exports = router;
