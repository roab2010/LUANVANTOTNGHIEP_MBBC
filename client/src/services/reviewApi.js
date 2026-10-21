import api from './api';

// ============================================
// REVIEW API SERVICE
// ============================================

// 1. Khách hàng: Lấy danh sách đánh giá công khai của 1 sản phẩm
export const getPublicReviews = (productId, params = {}) => {
  return api.get(`/reviews/product/${productId}`, { params });
};

// 2. Khách hàng: Kiểm tra điều kiện đánh giá (đã mua, đơn delivered, chưa review)
export const checkReviewEligibility = (productId) => {
  return api.get('/reviews/check-eligibility', { params: { productId } });
};

// 3. Khách hàng: Gửi đánh giá mới (hỗ trợ multipart formData chứa file ảnh)
export const createReview = (formData) => {
  const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;
  return api.post('/reviews', formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
};

// 4. Khách hàng: Lấy danh sách đánh giá của chính mình
export const getMyReviews = (params = {}) => {
  return api.get('/reviews/my-reviews', { params });
};

// 5. Khách hàng: Chỉnh sửa đánh giá của chính mình (chuyển lại PENDING)
export const updateMyReview = (id, formData) => {
  const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;
  return api.put(`/reviews/${id}`, formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
};

// 6. Khách hàng: Xóa đánh giá của chính mình (xóa mềm)
export const deleteMyReview = (id) => {
  return api.delete(`/reviews/${id}`);
};

// 7. Admin: Lấy danh sách đánh giá toàn hệ thống (kèm lọc, phân trang, KPI)
export const getAdminReviews = (params = {}) => {
  return api.get('/reviews/admin', { params });
};

// 8. Admin: Lấy chi tiết 1 đánh giá
export const getAdminReviewById = (id) => {
  return api.get(`/reviews/admin/${id}`);
};

// 9. Admin: Kiểm duyệt đánh giá (approve, reject, hide, restore)
export const moderateReview = (id, data) => {
  return api.patch(`/reviews/admin/${id}/moderate`, data);
};

// 10. Admin: Gửi hoặc sửa phản hồi chính thức từ MBBC
export const replyReview = (id, data) => {
  return api.post(`/reviews/admin/${id}/reply`, data);
};
