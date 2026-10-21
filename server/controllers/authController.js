const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../services/activityLogService');
const { sendOtpEmail } = require('../services/emailService');

// ============================================
// SINH MÃ OTP 6 SỐ
// ============================================
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
      // 1. Nếu tài khoản đã bị xóa mềm trước đó -> Cho phép đăng ký lại với thông tin mới
      if (existingUser.status === 'deleted') {
        existingUser.fullName = fullName;
        existingUser.password = password; // Sẽ được hash bởi pre-save hook
        existingUser.phone = phone || '';
        existingUser.status = 'active';
        existingUser.isEmailVerified = false;

        // Sinh OTP và gửi email xác minh
        const otpCode = generateOtp();
        existingUser.emailOtp = otpCode;
        existingUser.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
        await existingUser.save();

        // Gửi email OTP (không block response)
        sendOtpEmail(email, otpCode, fullName).catch((err) =>
          console.error('Lỗi gửi OTP email:', err)
        );

        return res.status(200).json({
          success: true,
          message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
          data: {
            user: existingUser.toJSON(),
            requireOtp: true,
          },
        });
      }

      // 2. Nếu tài khoản đã đăng ký nhưng CHƯA XÁC MINH EMAIL (đang dở dang hoặc chưa nhập OTP)
      // -> Tự động cập nhật lại thông tin mới nhất, cấp OTP mới và tiếp tục luồng xác minh
      if (!existingUser.isEmailVerified) {
        existingUser.fullName = fullName;
        existingUser.password = password; // Sẽ được hash lại bởi pre-save hook
        existingUser.phone = phone || '';
        existingUser.status = 'active';

        const otpCode = generateOtp();
        existingUser.emailOtp = otpCode;
        existingUser.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
        await existingUser.save();

        sendOtpEmail(email, otpCode, fullName).catch((err) =>
          console.error('Lỗi gửi OTP email:', err)
        );

        return res.status(200).json({
          success: true,
          message: 'Tài khoản chưa được kích hoạt. Chúng tôi đã gửi lại mã OTP mới để bạn hoàn tất xác minh.',
          data: {
            user: existingUser.toJSON(),
            requireOtp: true,
          },
        });
      }

      // 3. Nếu tài khoản ĐÃ XÁC MINH EMAIL THÀNH CÔNG rồi -> Báo đã đăng ký
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký và kích hoạt. Vui lòng chuyển sang trang Đăng nhập.',
      });
    }

    // Sinh OTP
    const otpCode = generateOtp();

    // --- Tạo user mới (role luôn = customer) ---
    const user = await User.create({
      fullName,
      email,
      password, // Sẽ được hash tự động bởi pre-save hook
      phone: phone || '',
      role: 'customer', // QUAN TRỌNG: Luôn là customer, không nhận từ client
      isEmailVerified: false,
      emailOtp: otpCode,
      emailOtpExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    });

    // Gửi email OTP (không block response)
    sendOtpEmail(email, otpCode, fullName).catch((err) =>
      console.error('Lỗi gửi OTP email:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
      data: {
        user: user.toJSON(),
        requireOtp: true,
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
// XÁC MINH OTP - POST /api/auth/verify-otp
// ============================================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mã OTP',
      });
    }

    const user = await User.findOne({ email });
    if (!user || user.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được xác minh trước đó',
      });
    }

    // Kiểm tra OTP hết hạn
    if (!user.emailOtp || !user.emailOtpExpires || new Date() > user.emailOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.',
      });
    }

    // Kiểm tra OTP khớp
    if (user.emailOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác',
      });
    }

    // Xác minh thành công
    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Xác minh email thành công! Bạn có thể đăng nhập ngay bây giờ.',
    });
  } catch (error) {
    console.error('Lỗi xác minh OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// GỬI LẠI MÃ OTP - POST /api/auth/resend-otp
// ============================================
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email',
      });
    }

    const user = await User.findOne({ email });
    if (!user || user.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Tài khoản không tồn tại trong hệ thống',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được xác minh trước đó',
      });
    }

    // Chống spam: Chỉ cho phép gửi lại nếu OTP cũ đã hết hạn hoặc đã qua ít nhất 60 giây
    if (user.emailOtpExpires) {
      const timeSinceLastOtp = Date.now() - (user.emailOtpExpires.getTime() - 5 * 60 * 1000);
      if (timeSinceLastOtp < 60 * 1000) {
        const remainingSeconds = Math.ceil((60 * 1000 - timeSinceLastOtp) / 1000);
        return res.status(429).json({
          success: false,
          message: `Vui lòng chờ ${remainingSeconds} giây trước khi gửi lại mã OTP`,
        });
      }
    }

    // Sinh OTP mới
    const otpCode = generateOtp();
    user.emailOtp = otpCode;
    user.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Gửi email
    const result = await sendOtpEmail(email, otpCode, user.fullName);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email OTP. Vui lòng thử lại sau.',
      });
    }

    res.json({
      success: true,
      message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.',
    });
  } catch (error) {
    console.error('Lỗi gửi lại OTP:', error);
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

    // --- Kiểm tra xác minh email (chỉ customer, admin bỏ qua) ---
    if (user.role === 'customer' && !user.isEmailVerified) {
      // Tự động sinh OTP mới và gửi email
      const otpCode = generateOtp();
      user.emailOtp = otpCode;
      user.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      sendOtpEmail(email, otpCode, user.fullName).catch((err) =>
        console.error('Lỗi gửi OTP email:', err)
      );

      return res.status(403).json({
        success: false,
        message: 'Email chưa được xác minh. Chúng tôi đã gửi mã OTP mới đến email của bạn.',
        requireOtp: true,
        email: user.email,
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

module.exports = { register, login, getMe, logout, verifyOtp, resendOtp };
