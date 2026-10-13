import api from './api';

// ============================================
// CUSTOMER API SERVICE
// ============================================

// Lấy danh sách tài khoản khách hàng (có search, filter status, phân trang)
export const getCustomers = (params = {}) => {
  return api.get('/customers', { params });
};

// Lấy chi tiết khách hàng
export const getCustomerById = (id) => {
  return api.get(`/customers/${id}`);
};

// Cập nhật thông tin / trạng thái khóa tài khoản khách hàng
export const updateCustomer = (id, data) => {
  return api.put(`/customers/${id}`, data);
};

// Xóa tài khoản khách hàng
export const deleteCustomer = (id) => {
  return api.delete(`/customers/${id}`);
};
