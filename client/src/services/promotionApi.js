import api from './api';

// ============================================
// KHÁCH HÀNG: API CÔNG KHAI & TÀI KHOẢN
// ============================================

/**
 * Lấy danh sách ưu đãi công khai (Trung tâm ưu đãi MBBC)
 */
export const getPublicPromotions = (params) => {
  return api.get('/promotions', { params });
};

/**
 * Lấy chi tiết một chương trình khuyến mãi
 */
export const getPromotionById = (id) => {
  return api.get(`/promotions/${id}`);
};

/**
 * Kiểm tra tính hợp lệ & tính tiền ưu đãi tốt nhất cho giỏ hàng
 * @param {{ items: Array, voucherCode?: string }} data
 */
export const validatePromotion = (data) => {
  return api.post('/promotions/validate', data);
};

/**
 * Lấy Kho voucher của khách hàng đã đăng nhập
 */
export const getMySavedPromotions = () => {
  return api.get('/promotions/saved');
};

/**
 * Lưu voucher vào Kho ưu đãi cá nhân
 */
export const savePromotion = (id) => {
  return api.post(`/promotions/${id}/save`);
};

/**
 * Bỏ lưu voucher khỏi Kho ưu đãi cá nhân
 */
export const unsavePromotion = (id) => {
  return api.delete(`/promotions/${id}/save`);
};

// ============================================
// ADMIN: API QUẢN TRỊ KHUYẾN MÃI
// ============================================

/**
 * Lấy danh sách khuyến mãi trang quản trị (kèm lọc, tìm kiếm, phân trang)
 */
export const getAdminPromotions = (params) => {
  return api.get('/promotions/admin', { params });
};

/**
 * Tạo mới chương trình khuyến mãi
 */
export const createAdminPromotion = (data) => {
  return api.post('/promotions/admin', data);
};

/**
 * Lấy chi tiết khuyến mãi trong trang quản trị
 */
export const getAdminPromotionById = (id) => {
  return api.get(`/promotions/admin/${id}`);
};

/**
 * Chỉnh sửa chương trình khuyến mãi
 */
export const updateAdminPromotion = (id, data) => {
  return api.put(`/promotions/admin/${id}`, data);
};

/**
 * Bật/tắt trạng thái (active / paused)
 */
export const toggleAdminPromotionStatus = (id, status) => {
  return api.patch(`/promotions/admin/${id}/status`, { status });
};

/**
 * Xóa chương trình khuyến mãi (chỉ cho phép khi chưa có lượt dùng)
 */
export const deleteAdminPromotion = (id) => {
  return api.delete(`/promotions/admin/${id}`);
};

/**
 * Lấy số liệu thống kê khuyến mãi thực tế từ DB
 */
export const getAdminPromotionStatistics = () => {
  return api.get('/promotions/admin/statistics');
};

/**
 * Lấy lịch sử sử dụng khuyến mãi / voucher
 */
export const getAdminPromotionUsages = (params) => {
  return api.get('/promotions/admin/usages', { params });
};

