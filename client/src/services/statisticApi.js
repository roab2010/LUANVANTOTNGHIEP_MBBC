import api from './api';

// ============================================
// STATISTIC API SERVICE
// ============================================

export const getOverviewStats = () => {
  return api.get('/statistics/overview');
};

export const getRevenueChart = () => {
  return api.get('/statistics/revenue-chart');
};

export const getTopProducts = () => {
  return api.get('/statistics/top-products');
};

export const getOrderStatusDistribution = () => {
  return api.get('/statistics/order-status');
};
