const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes đều yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

// Danh sách khách hàng (chỉ xem, cập nhật trạng thái/thông tin và xóa)
// Tài khoản khách hàng được tạo tự động khi người dùng đăng ký tài khoản trên website
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
