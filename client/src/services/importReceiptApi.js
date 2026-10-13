import api from './api';

// ============================================
// IMPORT RECEIPT API SERVICE (PHIẾU NHẬP HÀNG)
// ============================================

// Lấy danh sách phiếu nhập
export const getImportReceipts = (params = {}) => {
  return api.get('/import-receipts', { params });
};

// Lấy chi tiết phiếu nhập
export const getImportReceiptById = (id) => {
  return api.get(`/import-receipts/${id}`);
};

// Tạo phiếu nhập mới (tự động tăng tồn kho)
export const createImportReceipt = (data) => {
  return api.post('/import-receipts', data);
};

// Hủy phiếu nhập
export const cancelImportReceipt = (id) => {
  return api.put(`/import-receipts/${id}/cancel`);
};
