import api from './api';

// ============================================
// PRODUCT API SERVICE
// ============================================
// Template chuẩn: Các module CRUD khác sẽ copy theo cấu trúc này

// Lấy danh sách sản phẩm (có search, filter, phân trang)
export const getProducts = (params = {}) => {
  return api.get('/products', { params });
};

// Lấy chi tiết sản phẩm
export const getProductById = (id) => {
  return api.get(`/products/${id}`);
};

// Tạo sản phẩm mới
export const createProduct = (data) => {
  return api.post('/products', data);
};

// Cập nhật sản phẩm
export const updateProduct = (id, data) => {
  return api.put(`/products/${id}`, data);
};

// Xóa sản phẩm
export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};

// Lấy các tùy chọn bộ lọc (khoảng giá, danh sách màu, danh sách size có sẵn)
export const getFilterOptions = (params = {}) => {
  return api.get('/products/filters/options', { params });
};
