const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../services/activityLogService');

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
      if (user.role === 'admin') {
        logActivity({
          req,
          actor: { id: user._id, fullName: user.fullName, role: 'admin' },
          action: 'LOGIN',
          module: 'AUTH',
          status: 'FAILED',
          targetType: 'User',
          targetId: user._id,
          targetName: user.fullName,
          description: `Đăng nhập bị từ chối: Tài khoản Quản trị viên "${user.email}" đang bị khóa`,
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên qua email: admin@quanlybanhang.com',
      });
    }

    // --- So sánh password ---
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (user.role === 'admin') {
        logActivity({
          req,
          actor: { id: user._id, fullName: user.fullName, role: 'admin' },
          action: 'LOGIN',
          module: 'AUTH',
          status: 'FAILED',
          targetType: 'User',
          targetId: user._id,
          targetName: user.fullName,
          description: `Đăng nhập thất bại: Sai mật khẩu cho tài khoản Quản trị viên "${user.email}"`,
        });
      }

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

    // Chỉ lưu vết khi Quản trị viên đăng nhập
    if (user.role === 'admin') {
      logActivity({
        req,
        actor: { id: user._id, fullName: user.fullName, role: 'admin' },
        action: 'LOGIN',
        module: 'AUTH',
        status: 'SUCCESS',
        targetType: 'User',
        targetId: user._id,
        targetName: user.fullName,
        description: `Quản trị viên ${user.fullName} (${user.email}) đăng nhập thành công`,
      });
    }

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
// API này ghi nhận log và trả response thành công
const logout = async (req, res) => {
  try {
    if (req.user && req.user.role === 'admin') {
      const user = await User.findById(req.user.userId);
      if (user && user.role === 'admin') {
        logActivity({
          req,
          actor: { id: user._id, fullName: user.fullName, role: 'admin' },
          action: 'LOGOUT',
          module: 'AUTH',
          status: 'SUCCESS',
          description: `Quản trị viên ${user.fullName} (${user.email}) đăng xuất khỏi hệ thống`,
        });
      }
    }
  } catch (e) {
    // ignore
  }

  res.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
};

module.exports = { register, login, getMe, logout };
