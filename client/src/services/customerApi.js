import api from './api';

// ============================================
// CUSTOMER API SERVICE
// ============================================
// Theo template chuẩn của categoryApi.js / productApi.js

// Lấy danh sách khách hàng (có search, filter status, phân trang)
export const getCustomers = (params = {}) => {
  return api.get('/customers', { params });
};

// Lấy chi tiết khách hàng
export const getCustomerById = (id) => {
  return api.get(`/customers/${id}`);
};

// Tạo khách hàng mới
export const createCustomer = (data) => {
  return api.post('/customers', data);
};

// Cập nhật thông tin khách hàng
export const updateCustomer = (id, data) => {
  return api.put(`/customers/${id}`, data);
};

// Xóa khách hàng
export const deleteCustomer = (id) => {
  return api.delete(`/customers/${id}`);
};
