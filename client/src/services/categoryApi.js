import api from './api';

// ============================================
// CATEGORY API SERVICE
// ============================================
// Theo template chuẩn của productApi.js

// Lấy danh sách danh mục (có search, filter, phân trang)
export const getCategories = (params = {}) => {
  return api.get('/categories', { params });
};

// Lấy chi tiết danh mục
export const getCategoryById = (id) => {
  return api.get(`/categories/${id}`);
};

// Tạo danh mục mới
export const createCategory = (data) => {
  return api.post('/categories', data);
};

// Cập nhật danh mục
export const updateCategory = (id, data) => {
  return api.put(`/categories/${id}`, data);
};

// Xóa danh mục
export const deleteCategory = (id) => {
  return api.delete(`/categories/${id}`);
};
