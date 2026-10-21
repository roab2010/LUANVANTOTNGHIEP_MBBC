const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// URL Logo MBBC chính thức trên Cloudinary (tránh đính kèm file thừa vào email)
const MBBC_LOGO_URL = 'https://res.cloudinary.com/sqv1exbn/image/upload/v1792612530/mbbc_branding/logo_mbbc.png';

// ============================================
// KHỞI TẠO NODEMAILER TRANSPORTER (GMAIL SMTP)
// ============================================
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER || 'baohainao2016@gmail.com';
  const pass = process.env.SMTP_PASS || '';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true cho port 465 SSL, false cho 587 STARTTLS
    requireTLS: port === 587,
    auth: {
      user,
      pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

const transporter = createTransporter();

// Tên và email người gửi
const getFromAddress = () => {
  const fromName = process.env.SMTP_FROM_NAME || 'MBBC';
  const fromEmail = process.env.SMTP_USER || 'baohainao2016@gmail.com';
  return `"${fromName}" <${fromEmail}>`;
};

// ============================================
// HÀM KIỂM TRA KẾT NỐI SMTP (VERIFY)
// ============================================
const verifyConnection = async () => {
  if (!process.env.SMTP_PASS) {
    console.warn('[EMAIL] Cảnh báo: Biến SMTP_PASS trong server/.env chưa được thiết lập.');
    return { success: false, error: 'Chưa cấu hình SMTP_PASS (Google App Password) trong file .env' };
  }

  try {
    await transporter.verify();
    console.log(`[EMAIL] Kết nối Gmail SMTP thành công qua tài khoản: ${process.env.SMTP_USER}`);
    return { success: true };
  } catch (err) {
    console.error('[EMAIL] Lỗi xác thực Gmail SMTP:', err.message);
    return { success: false, error: err.message };
  }
};

// ============================================
// 1. GỬI MÃ OTP XÁC MINH EMAIL
// ============================================
const sendOtpEmail = async (toEmail, otpCode, fullName) => {
  try {
    if (!process.env.SMTP_PASS) {
      console.warn(`[EMAIL] Chưa cấu hình SMTP_PASS trong .env. Không thể gửi OTP đến: ${toEmail}`);
      return {
        success: false,
        error: 'Hệ thống gửi email chưa được cấu hình Google App Password (SMTP_PASS)',
      };
    }

    // Logo MBBC dùng trực tiếp URL online, không đính kèm file thừa
    const logoHtml = `<img src="${MBBC_LOGO_URL}" alt="MBBC Logo" width="135" style="width: 135px; max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;

    // Tách 6 chữ số OTP để hiển thị 6 ô riêng biệt
    const digits = String(otpCode).split('');
    const digitBoxesHtml = digits
      .map(
        (d) => `
        <td style="padding: 0 4px;">
          <div style="width: 44px; height: 52px; line-height: 52px; background: #ffffff; border: 2px solid #111827; border-radius: 10px; font-size: 28px; font-weight: 800; color: #111827; text-align: center; font-family: 'Courier New', monospace; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
            ${d}
          </div>
        </td>
      `
      )
      .join('');

    const mailOptions = {
      from: getFromAddress(),
      to: toEmail,
      subject: `[MBBC] Mã xác minh tài khoản của bạn: ${otpCode}`,
      text: `Xin chào ${fullName || 'bạn'},\n\nMã xác minh OTP của bạn tại MBBC là: ${otpCode}\n\nMã có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\nTrân trọng,\nĐội ngũ M.B.B.C`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã xác minh MBBC</title>
        </head>
        <body style="margin: 0; padding: 24px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <div style="max-width: 500px; width: 100%; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                  
                  <!-- HEADER THƯƠNG HIỆU ĐEN SANG TRỌNG -->
                  <div style="background: #000000; padding: 28px 24px 22px; text-align: center;">
                    ${logoHtml}
                    <div style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
                      M.B.B.C CLOTHING STORE
                    </div>
                    <div style="color: #9ca3af; font-size: 11px; letter-spacing: 1px; margin-top: 2px;">
                      - Made By Bảo Cường -
                    </div>
                  </div>

                  <!-- PHẦN THÂN EMAIL -->
                  <div style="padding: 36px 32px 28px; text-align: center;">
                    
                    <!-- Huy hiệu hiệu lực -->
                    <div style="display: inline-block; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 20px; text-transform: uppercase;">
                      MÃ CÓ HIỆU LỰC TRONG 5 PHÚT
                    </div>

                    <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.3px;">
                      Xác minh địa chỉ Email
                    </h2>

                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
                      Xin chào <strong style="color: #111827;">${fullName || 'Quý khách'}</strong>,<br>
                      Cảm ơn bạn đã đăng ký tài khoản tại <strong>M.B.B.C</strong>. Vui lòng nhập mã xác thực gồm 6 chữ số dưới đây để kích hoạt tài khoản của bạn:
                    </p>

                    <!-- KHỐI 6 Ô MÃ OTP CHUẨN ĐẸP -->
                    <div style="margin: 0 auto 28px; display: inline-block;">
                      <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                        <tr>
                          ${digitBoxesHtml}
                        </tr>
                      </table>
                    </div>

                    <!-- LƯU Ý BẢO MẬT -->
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; text-align: left;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                        <strong style="color: #374151;">Bảo mật:</strong> Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nhân viên MBBC sẽ không bao giờ yêu cầu bạn cung cấp mã xác minh OTP.
                      </p>
                    </div>

                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                      Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Tài khoản sẽ không được kích hoạt nếu thiếu mã OTP.
                    </p>
                  </div>

                  <!-- FOOTER -->
                  <div style="background: #fafafa; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; margin: 0 0 4px;">
                      M.B.B.C - Made By Bảo Cường
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      Đồ án tốt nghiệp ngành Công nghệ thông tin 2026
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Đã gửi mã OTP thành công đến: ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Lỗi gửi email OTP tới ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ============================================
// 2. GỬI EMAIL XÁC NHẬN ĐƠN HÀNG KÈM FILE PDF
// ============================================
const sendOrderConfirmationEmail = async (toEmail, fullName, orderCode, pdfBuffer) => {
  try {
    if (!process.env.SMTP_PASS) {
      console.warn(`[EMAIL] Chưa cấu hình SMTP_PASS trong .env. Không thể gửi email đơn hàng đến: ${toEmail}`);
      return {
        success: false,
        error: 'Hệ thống gửi email chưa được cấu hình Google App Password (SMTP_PASS)',
      };
    }

    // Logo MBBC dùng trực tiếp URL online, không đính kèm file ảnh thừa
    const logoHtml = `<img src="${MBBC_LOGO_URL}" alt="MBBC Logo" width="135" style="width: 135px; max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;

    // ĐÍNH KÈM DUY NHẤT FILE PDF XÁC NHẬN ĐƠN HÀNG (Không gửi kèm bất kỳ file ảnh thừa nào)
    const attachments = [
      {
        filename: `DonHang_${orderCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ];

    const mailOptions = {
      from: getFromAddress(),
      to: toEmail,
      subject: `[MBBC] Xác nhận đơn hàng #${orderCode}`,
      text: `Xin chào ${fullName || 'Quý khách'},\n\nĐơn hàng #${orderCode} của bạn đã được tiếp nhận thành công tại M.B.B.C Store.\nChúng tôi đã đính kèm phiếu xác nhận đơn hàng định dạng PDF trong email này.\n\nCảm ơn bạn đã lựa chọn MBBC!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận đơn hàng MBBC</title>
        </head>
        <body style="margin: 0; padding: 24px 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <div style="max-width: 520px; width: 100%; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                  
                  <!-- HEADER THƯƠNG HIỆU -->
                  <div style="background: #000000; padding: 28px 24px 22px; text-align: center;">
                    ${logoHtml}
                    <div style="color: #ffffff; font-size: 13px; font-weight: 800; letter-spacing: 2px; margin-top: 10px; text-transform: uppercase;">
                      M.B.B.C CLOTHING STORE
                    </div>
                    <div style="color: #9ca3af; font-size: 11px; letter-spacing: 1px; margin-top: 2px;">
                      - Made By Bảo Cường -
                    </div>
                  </div>

                  <!-- PHẦN THÂN EMAIL -->
                  <div style="padding: 36px 32px 28px; text-align: center;">
                    
                    <!-- Huy hiệu tiếp nhận -->
                    <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 20px; margin-bottom: 20px;">
                      ✓ ĐÃ TIẾP NHẬN ĐƠN HÀNG
                    </div>

                    <h2 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 10px;">
                      Cảm ơn bạn đã đặt hàng!
                    </h2>

                    <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                      Xin chào <strong style="color: #111827;">${fullName || 'Quý khách'}</strong>,<br>
                      Đơn hàng mang mã <strong style="color: #dc2626; font-size: 15px;">#${orderCode}</strong> của bạn đã được hệ thống ghi nhận và đang chuẩn bị đóng gói.
                    </p>

                    <!-- HỘP THÔNG BÁO FILE PDF ĐÍNH KÈM -->
                    <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
                      <div style="display: flex; align-items: center;">
                        <span style="font-size: 28px; margin-right: 12px;">📄</span>
                        <div>
                          <div style="color: #0f172a; font-size: 13px; font-weight: 700;">
                            Phiếu xác nhận đơn hàng (PDF)
                          </div>
                          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">
                            Đã đính kèm tệp: <strong>DonHang_${orderCode}.pdf</strong>
                          </div>
                        </div>
                      </div>
                      <p style="margin: 12px 0 0; color: #64748b; font-size: 11.5px; line-height: 1.4;">
                        Bạn có thể tải tệp PDF đính kèm phía dưới email để xem chi tiết danh sách sản phẩm, bảng giá và địa chỉ nhận hàng.
                      </p>
                    </div>

                    <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
                      Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng phản hồi email này hoặc liên hệ hotline của chúng tôi.
                    </p>
                  </div>

                  <!-- FOOTER -->
                  <div style="background: #fafafa; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; font-weight: 600; margin: 0 0 4px;">
                      M.B.B.C - Made By Bảo Cường
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                      Đồ án tốt nghiệp ngành Công nghệ thông tin 2026
                    </p>
                  </div>

                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Đã gửi email xác nhận đơn hàng ${orderCode} thành công đến: ${toEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Lỗi gửi email xác nhận đơn hàng tới ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  transporter,
  verifyConnection,
  sendOtpEmail,
  sendOrderConfirmationEmail,
};
