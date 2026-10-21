const ActivityLog = require('../models/ActivityLog');

// Danh sách các trường nhạy cảm cần loại bỏ hoàn toàn khỏi log
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshToken',
  'secret',
  'jwt_secret',
  'otp',
  'cookie',
  'authorization',
]);

/**
 * Trích xuất an toàn địa chỉ IP và User Agent từ Express Request
 */
const getClientInfo = (req) => {
  if (!req) return { ipAddress: '', userAgent: '' };

  let ip =
    (req.headers && req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : '') ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';

  // Chuẩn hóa IPv6 localhost hoặc ::ffff:127.0.0.1 thành 127.0.0.1
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  } else if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  const rawUserAgent = req.headers ? req.headers['user-agent'] || '' : '';
  // Giới hạn độ dài user agent để tránh phình dữ liệu
  const userAgent = rawUserAgent.slice(0, 255);

  return { ipAddress: ip, userAgent };
};

/**
 * Lọc sạch các trường nhạy cảm trong đối tượng metadata
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[ĐÃ ẨN BẢO MẬT]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * So sánh 2 document để trích xuất các trường thay đổi thực tế trước và sau
 * @param {Object} oldObj - Đối tượng trước khi cập nhật
 * @param {Object} newObj - Đối tượng sau khi cập nhật
 * @param {Object} fieldLabelsMap - Bản đồ nhãn tiếng Việt { fieldName: 'Tên hiển thị tiếng Việt' }
 */
const diffObjects = (oldObj = {}, newObj = {}, fieldLabelsMap = {}) => {
  const changes = [];

  for (const [field, labelVi] of Object.entries(fieldLabelsMap)) {
    // Không so sánh các trường nhạy cảm
    if (SENSITIVE_KEYS.has(field.toLowerCase())) continue;

    const oldVal = oldObj[field];
    const newVal = newObj[field];

    // Chuyển sang JSON để so sánh cả mảng hoặc object con (ví dụ mảng hình ảnh hoặc variants)
    const oldStr = JSON.stringify(oldVal !== undefined ? oldVal : null);
    const newStr = JSON.stringify(newVal !== undefined ? newVal : null);

    if (oldStr !== newStr) {
      changes.push({
        field,
        fieldNameVi: labelVi,
        oldValue: oldVal !== undefined ? oldVal : null,
        newValue: newVal !== undefined ? newVal : null,
      });
    }
  }

  return changes;
};

/**
 * Ghi nhận một sự kiện nhật ký hoạt động (Fail-safe, không làm nghẽn tiến trình nghiệp vụ)
 */
const logActivity = async (options = {}) => {
  try {
    const {
      req,
      actor,
      action,
      module,
      targetType = '',
      targetId = '',
      targetName = '',
      description = '',
      changes = [],
      status = 'SUCCESS',
      metadata = {},
    } = options;

    const clientInfo = getClientInfo(req);

    // Xác định người thao tác: Ưu tiên từ actor truyền vào, sau đó đến req.user
    let actorId = null;
    let actorName = 'Quản Trị Viên';
    let actorRole = 'admin';

    if (actor) {
      actorId = actor.id || actor._id || null;
      actorName = actor.fullName || actor.name || actor.email || 'Quản Trị Viên';
      actorRole = actor.role || 'admin';
    } else if (req && req.user) {
      actorId = req.user.userId || req.user._id || null;
      actorName = req.user.fullName || req.user.email || 'Quản Trị Viên';
      actorRole = req.user.role || 'admin';
    }

    // CHỈ LƯU VẾT THAO TÁC CỦA ADMIN HOẶC SYSTEM
    // Loại bỏ hoàn toàn thao tác của khách hàng (customer/anonymous) theo yêu cầu để làm bằng chứng nội bộ
    if (actorRole !== 'admin' && actorRole !== 'system') {
      return;
    }

    // Lọc sạch mảng changes
    const safeChanges = Array.isArray(changes)
      ? changes
          .filter((c) => c && c.field && !SENSITIVE_KEYS.has(c.field.toLowerCase()))
          .map((c) => ({
            field: c.field,
            fieldNameVi: c.fieldNameVi || c.field,
            oldValue: sanitizeData(c.oldValue),
            newValue: sanitizeData(c.newValue),
          }))
      : [];

    // Tạo bản ghi log
    await ActivityLog.create({
      actorId,
      actorName,
      actorRole,
      action,
      module,
      targetType: String(targetType || ''),
      targetId: String(targetId || ''),
      targetName: String(targetName || ''),
      description: String(description || ''),
      changes: safeChanges,
      status: status === 'FAILED' ? 'FAILED' : 'SUCCESS',
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      metadata: sanitizeData(metadata),
    });
  } catch (err) {
    // Fail-safe: Chỉ in log server, không ném exception làm gián đoạn API nghiệp vụ của hệ thống
    console.error('⚠️ [ActivityLogService Error]: Không thể ghi nhật ký hoạt động:', err.message);
  }
};

module.exports = {
  logActivity,
  diffObjects,
  getClientInfo,
  sanitizeData,
};
