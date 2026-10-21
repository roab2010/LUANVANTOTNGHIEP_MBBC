const express = require('express');
const router = express.Router();
const {
  getProvinces,
  getDistricts,
  getWards,
  calculateFee,
} = require('../controllers/shippingController');

// Public routes cho checkout tính phí vận chuyển GHN
router.get('/provinces', getProvinces);
router.get('/districts', getDistricts);
router.get('/wards', getWards);
router.post('/calculate-fee', calculateFee);

module.exports = router;
