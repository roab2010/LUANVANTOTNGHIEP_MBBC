import api from './api';

// ============================================
// SUPPLIER API SERVICE
// ============================================

// Lấy danh sách nhà cung cấp (có search, filter, phân trang)
export const getSuppliers = (params = {}) => {
  return api.get('/suppliers', { params });
};

// Lấy chi tiết nhà cung cấp
export const getSupplierById = (id) => {
  return api.get(`/suppliers/${id}`);
};

// Tạo nhà cung cấp mới
export const createSupplier = (data) => {
  return api.post('/suppliers', data);
};

// Cập nhật thông tin nhà cung cấp
export const updateSupplier = (id, data) => {
  return api.put(`/suppliers/${id}`, data);
};

// Xóa nhà cung cấp
export const deleteSupplier = (id) => {
  return api.delete(`/suppliers/${id}`);
};
