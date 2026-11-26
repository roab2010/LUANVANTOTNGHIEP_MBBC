import api from './api';

// ============================================
// RETURN & EXCHANGE API SERVICE (KHÁCH HÀNG)
// ============================================

// 1. Kiểm tra đơn hàng có đủ điều kiện đổi trả hay không
export const checkReturnEligibility = (orderId) => {
  return api.get(`/returns/order-eligibility/${orderId}`);
};

// 2. Tạo yêu cầu đổi trả mới (hỗ trợ FormData kèm file ảnh)
export const createReturnRequest = (formData) => {
  const isFormData = typeof FormData !== 'undefined' && formData instanceof FormData;
  return api.post('/returns', formData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
};

// 3. Lấy danh sách yêu cầu đổi trả của chính khách hàng
export const getMyReturns = (params = {}) => {
  return api.get('/returns/my-returns', { params });
};

// 4. Lấy chi tiết 1 yêu cầu đổi trả
export const getReturnById = (id) => {
  return api.get(`/returns/${id}`);
};

// 5. Khách hàng hủy yêu cầu đổi trả (khi còn PENDING)
export const cancelReturnRequest = (id) => {
  return api.patch(`/returns/${id}/cancel`);
};
