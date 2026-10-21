const ghnService = require('../services/ghnService');

// ============================================
// LẤY DANH SÁCH TỈNH / THÀNH PHỐ - GET /api/shipping/provinces
// ============================================
const getProvinces = async (req, res) => {
  try {
    const provinces = await ghnService.getProvinces();
    res.json({
      success: true,
      data: provinces,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách Tỉnh/Thành từ GHN:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách Tỉnh/Thành từ GHN',
    });
  }
};

// ============================================
// LẤY DANH SÁCH QUẬN / HUYỆN - GET /api/shipping/districts
// ============================================
const getDistricts = async (req, res) => {
  try {
    const { province_id } = req.query;
    if (!province_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số province_id',
      });
    }

    const districts = await ghnService.getDistricts(province_id);
    res.json({
      success: true,
      data: districts,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách Quận/Huyện từ GHN:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách Quận/Huyện từ GHN',
    });
  }
};

// ============================================
// LẤY DANH SÁCH PHƯỜNG / XÃ - GET /api/shipping/wards
// ============================================
const getWards = async (req, res) => {
  try {
    const { district_id } = req.query;
    if (!district_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số district_id',
      });
    }

    const wards = await ghnService.getWards(district_id);
    res.json({
      success: true,
      data: wards,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách Phường/Xã từ GHN:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lấy danh sách Phường/Xã từ GHN',
    });
  }
};

// ============================================
// TÍNH PHÍ VẬN CHUYỂN GHN STAGING - POST /api/shipping/calculate-fee
// ============================================
const calculateFee = async (req, res) => {
  try {
    const { toDistrictId, toWardCode, items = [], insuranceValue = 0 } = req.body;

    if (!toDistrictId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn Quận/Huyện nhận hàng để tính phí vận chuyển',
      });
    }

    if (!toWardCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn Phường/Xã nhận hàng để tính phí vận chuyển',
      });
    }

    const feeResult = await ghnService.calculateShippingFee({
      toDistrictId,
      toWardCode,
      items,
      insuranceValue,
    });

    res.json({
      success: true,
      data: feeResult,
    });
  } catch (error) {
    console.error('Lỗi tính phí vận chuyển GHN:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Không thể tính phí vận chuyển cho địa chỉ này',
    });
  }
};

module.exports = {
  getProvinces,
  getDistricts,
  getWards,
  calculateFee,
};
