import api from './api';

// ============================================
// WAREHOUSE API SERVICE (QUẢN LÝ KHO & LỊCH SỬ NHẬP XUẤT)
// ============================================

// Lấy danh sách tồn kho (hỗ trợ search, stockStatus, category, page, limit)
export const getInventory = (params = {}) => {
  return api.get('/warehouse', { params });
};

// Lấy thống kê tổng quan kho hàng (KPI cards)
export const getWarehouseStats = () => {
  return api.get('/warehouse/stats');
};

// Nhập kho trực tiếp sản phẩm
export const importStock = (data) => {
  return api.post('/warehouse/import', data);
};

// Xuất kho trực tiếp sản phẩm (lỗi, nội bộ, điều chỉnh)
export const exportStock = (data) => {
  return api.post('/warehouse/export', data);
};

// Lấy lịch sử nhập/xuất kho của một sản phẩm
export const getStockHistoryByProduct = (productId) => {
  return api.get(`/warehouse/history/${productId}`);
};

// Điều chỉnh tồn kho sản phẩm (tương thích ngược)
export const adjustStock = (data) => {
  return api.post('/warehouse/adjust', data);
};
