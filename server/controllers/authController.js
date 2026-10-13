const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// ĐĂNG KÝ - POST /api/auth/register
// ============================================
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // --- Validate input ---
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
      });
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không đúng định dạng',
      });
    }

    const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'edu.vn'];
    const emailDomain = email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ hỗ trợ đăng ký với các email: ' + allowedDomains.map(d => '@' + d).join(', '),
      });
    }

    // Kiểm tra độ dài password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    // --- Kiểm tra email đã tồn tại chưa ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.status === 'deleted') {
        // Tài khoản cũ đã bị xóa trước đó, cho phép đăng ký lại với thông tin mới
        existingUser.fullName = fullName;
        existingUser.password = password;
        existingUser.phone = phone || '';
        existingUser.status = 'active';
        await existingUser.save();
        return res.status(201).json({
          success: true,
          message: 'Đăng ký thành công',
          data: {
            user: existingUser.toJSON(),
          },
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký',
      });
    }

    // --- Tạo user mới (role luôn = customer) ---
    const user = await User.create({
      fullName,
      email,
      password, // Sẽ được hash tự động bởi pre-save hook
      phone: phone || '',
      role: 'customer', // QUAN TRỌNG: Luôn là customer, không nhận từ client
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// ĐĂNG NHẬP - POST /api/auth/login
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Validate input ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

    // --- Tìm user theo email ---
    const user = await User.findOne({ email });
    if (!user || user.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    // --- Kiểm tra trạng thái tài khoản ---
    if (user.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên qua email: admin@quanlybanhang.com',
      });
    }

    // --- So sánh password ---
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác',
      });
    }

    // --- Tạo JWT token ---
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token hết hạn sau 7 ngày
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// LẤY THÔNG TIN USER - GET /api/auth/me
// ============================================
const getMe = async (req, res) => {
  try {
    // req.user đã được gắn bởi middleware authenticateToken
    const user = await User.findById(req.user.userId);
    if (!user || user.status === 'deleted') {
      return res.status(404).json({
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

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// ĐĂNG XUẤT - POST /api/auth/logout
// ============================================
// JWT là stateless → logout xử lý ở phía client (xóa token)
// API này chỉ trả response thành công
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
};

module.exports = { register, login, getMe, logout };
