const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFilterOptions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes: Khách hàng và người dùng đều xem được danh sách và chi tiết sản phẩm
router.get('/', getProducts);                   // Lấy danh sách (có search, filter, phân trang)
router.get('/filters/options', getFilterOptions); // Lấy tùy chọn màu, size, giá cho bộ lọc
router.get('/:id', getProductById);             // Lấy chi tiết

// Thao tác chỉnh sửa, tạo mới, xóa yêu cầu đăng nhập + quyền admin
router.use(authenticateToken, requireAdmin);

// Thêm middleware upload.single('image') cho các API có ảnh
router.post('/', upload.single('image'), createProduct);        // Tạo mới
router.put('/:id', upload.single('image'), updateProduct);      // Cập nhật
router.delete('/:id', deleteProduct);   // Xóa

// Xử lý lỗi từ Multer
router.use((err, req, res, next) => {
  if (err.name === 'MulterError' || err.message.includes('định dạng')) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Lỗi tải ảnh lên',
    });
  }
  next(err);
});

module.exports = router;
