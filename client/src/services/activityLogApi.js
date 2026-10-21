import api from './api';

// Lấy danh sách nhật ký hoạt động có phân trang và bộ lọc
export const getActivityLogs = (params) => {
  return api.get('/activity-logs', { params });
};

// Lấy chi tiết một bản ghi nhật ký hoạt động
export const getActivityLogById = (id) => {
  return api.get(`/activity-logs/${id}`);
};

// Lấy danh mục bộ lọc phân hệ & hành động
export const getFilterOptions = () => {
  return api.get('/activity-logs/filter-options');
};
