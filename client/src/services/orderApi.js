import api from './api';

// ============================================
// ORDER API SERVICE
// ============================================

export const getOrders = (params = {}) => {
  return api.get('/orders', { params });
};

export const getMyOrders = (params = {}) => {
  return api.get('/orders/my-orders', { params });
};

export const getOrderById = (id) => {
  return api.get(`/orders/${id}`);
};

export const createOrder = (data) => {
  return api.post('/orders', data);
};

export const updateOrderStatus = (id, data) => {
  return api.put(`/orders/${id}/status`, data);
};

export const deleteOrder = (id) => {
  return api.delete(`/orders/${id}`);
};
