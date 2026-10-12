import api from './api';

// ============================================
// WAREHOUSE API SERVICE
// ============================================

// Lấy danh sách tồn kho (hỗ trợ search, stockStatus, category, page, limit)
export const getInventory = (params = {}) => {
  return api.get('/warehouse', { params });
};

// Lấy thống kê tổng quan kho hàng
export const getWarehouseStats = () => {
  return api.get('/warehouse/stats');
};

// Điều chỉnh tồn kho sản phẩm
export const adjustStock = (data) => {
  return api.post('/warehouse/adjust', data);
};
