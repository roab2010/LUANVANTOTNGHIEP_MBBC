const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const promotionController = require('../controllers/promotionController');

// ============================================
// KHÁCH HÀNG: CÁC ROUTE CÔNG KHAI & ĐÃ ĐĂNG NHẬP
// ============================================

// Kiểm tra và tính toán khuyến mãi tối ưu cho giỏ hàng
router.post('/validate', optionalAuth, promotionController.validatePromotion);

// Lấy kho voucher cá nhân của khách hàng đã đăng nhập
router.get('/saved', authenticateToken, promotionController.getMySavedPromotions);

// Lưu voucher vào kho cá nhân
router.post('/:id/save', authenticateToken, promotionController.savePromotion);

// Bỏ lưu voucher khỏi kho cá nhân
router.delete('/:id/save', authenticateToken, promotionController.unsavePromotion);

// Danh sách khuyến mãi công khai (Trung tâm ưu đãi)
router.get('/', optionalAuth, promotionController.getPublicPromotions);

// ============================================
// ADMIN: CÁC ROUTE QUẢN TRỊ KHUYẾN MÃI
// ============================================
router.get('/admin/statistics', authenticateToken, requireAdmin, promotionController.getPromotionStatistics);
router.get('/admin/usages', authenticateToken, requireAdmin, promotionController.getPromotionUsages);
router.get('/admin', authenticateToken, requireAdmin, promotionController.getAdminPromotions);
router.post('/admin', authenticateToken, requireAdmin, promotionController.createPromotion);
router.get('/admin/:id', authenticateToken, requireAdmin, promotionController.getAdminPromotionById);
router.put('/admin/:id', authenticateToken, requireAdmin, promotionController.updatePromotion);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, promotionController.togglePromotionStatus);
router.delete('/admin/:id', authenticateToken, requireAdmin, promotionController.deletePromotion);

// Chi tiết khuyến mãi theo ID (Đặt cuối cùng để tránh nuốt các route trên)
router.get('/:id', optionalAuth, promotionController.getPromotionById);

module.exports = router;

