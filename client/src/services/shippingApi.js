import api from './api';

// ============================================
// SHIPPING API SERVICE (GHN STAGING QUA BACKEND)
// ============================================

// Lấy danh sách Tỉnh / Thành phố từ GHN
export const getProvinces = () => {
  return api.get('/shipping/provinces');
};

// Lấy danh sách Quận / Huyện theo Tỉnh / Thành
export const getDistricts = (provinceId) => {
  return api.get('/shipping/districts', {
    params: { province_id: provinceId },
  });
};

// Lấy danh sách Phường / Xã theo Quận / Huyện
export const getWards = (districtId) => {
  return api.get('/shipping/wards', {
    params: { district_id: districtId },
  });
};

// Tính phí vận chuyển thông qua backend GHN Staging
export const calculateShippingFee = (data) => {
  return api.post('/shipping/calculate-fee', data);
};
