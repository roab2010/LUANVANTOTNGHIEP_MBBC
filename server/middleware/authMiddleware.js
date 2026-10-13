const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware xác thực token JWT
const authenticateToken = async (req, res, next) => {
  // Lấy token từ header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để tiếp tục',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user trong CSDL để đảm bảo không bị khóa hoặc đã bị xóa
    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'deleted') {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên qua email: admin@quanlybanhang.com',
      });
    }

    // Gắn thông tin user vào request
    req.user = { userId: user._id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};

module.exports = { authenticateToken };
