const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes đều yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

// CRUD routes
router.get('/', getCustomers);           // Lấy danh sách (có search, filter, phân trang)
router.get('/:id', getCustomerById);      // Lấy chi tiết
router.post('/', createCustomer);         // Tạo mới
router.put('/:id', updateCustomer);       // Cập nhật
router.delete('/:id', deleteCustomer);    // Xóa

module.exports = router;
