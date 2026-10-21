const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, verifyOtp, resendOtp } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Routes công khai (không cần đăng nhập)
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

// Routes cần xác thực (phải đăng nhập)
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

module.exports = router;
