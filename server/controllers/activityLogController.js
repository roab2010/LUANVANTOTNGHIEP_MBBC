const ActivityLog = require('../models/ActivityLog');

// ============================================
// LẤY DANH SÁCH NHẬT KÝ HOẠT ĐỘNG (ADMIN) - GET /api/activity-logs
// ============================================
const getActivityLogs = async (req, res) => {
  try {
    const {
      search,
      module,
      action,
      status,
      actorRole,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // 1. Tìm kiếm theo mô tả, tên đối tượng hoặc tên người thực hiện
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { description: { $regex: q, $options: 'i' } },
        { targetName: { $regex: q, $options: 'i' } },
        { targetId: { $regex: q, $options: 'i' } },
        { actorName: { $regex: q, $options: 'i' } },
      ];
    }

    // 2. Bộ lọc phân hệ (Module)
    if (module && module.trim()) {
      filter.module = module.trim();
    }

    // 3. Bộ lọc hành động (Action)
    if (action && action.trim()) {
      filter.action = action.trim();
    }

    // 4. Bộ lọc trạng thái (Status)
    if (status && ['SUCCESS', 'FAILED'].includes(status)) {
      filter.status = status;
    }

    // 5. Bộ lọc vai trò người thực hiện (ActorRole)
    if (actorRole && ['admin', 'customer', 'system', 'anonymous'].includes(actorRole)) {
      filter.actorRole = actorRole;
    }

    // 6. Bộ lọc khoảng ngày
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Phân trang
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total, totalSuccess, totalFailed] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('actorId', 'fullName email role phone'),
      ActivityLog.countDocuments(filter),
      ActivityLog.countDocuments({ ...filter, status: 'SUCCESS' }),
      ActivityLog.countDocuments({ ...filter, status: 'FAILED' }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          total,
          success: totalSuccess,
          failed: totalFailed,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhật ký hoạt động:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải nhật ký hoạt động',
    });
  }
};

// ============================================
// LẤY CHI TIẾT MỘT BẢN GHI NHẬT KÝ - GET /api/activity-logs/:id
// ============================================
const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id).populate(
      'actorId',
      'fullName email role phone'
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi nhật ký hoạt động',
      });
    }

    res.json({
      success: true,
      data: { log },
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết nhật ký:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Mã ID nhật ký không hợp lệ',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải chi tiết nhật ký',
    });
  }
};

// ============================================
// DANH MỤC PHÂN HỆ VÀ HÀNH ĐỘNG DÙNG ĐỂ LỌC - GET /api/activity-logs/filter-options
// ============================================
const getFilterOptions = (req, res) => {
  const modules = [
    { value: 'AUTH', label: 'Tài khoản & Xác thực' },
    { value: 'USER', label: 'Quản lý người dùng' },
    { value: 'PRODUCT', label: 'Sản phẩm & Biến thể' },
    { value: 'CATEGORY', label: 'Danh mục sản phẩm' },
    { value: 'SUPPLIER', label: 'Nhà cung cấp' },
    { value: 'ORDER', label: 'Đơn hàng & Giao vận' },
    { value: 'INVENTORY', label: 'Kho hàng (Nhập/Xuất)' },
    { value: 'SHIPPING', label: 'Cấu hình vận chuyển GHN' },
    { value: 'SYSTEM', label: 'Hệ thống' },
  ];

  const actions = [
    { value: 'CREATE', label: 'Thêm mới' },
    { value: 'UPDATE', label: 'Cập nhật' },
    { value: 'DELETE', label: 'Xóa dữ liệu' },
    { value: 'LOGIN', label: 'Đăng nhập' },
    { value: 'LOGOUT', label: 'Đăng xuất' },
    { value: 'STATUS_CHANGE', label: 'Đổi trạng thái' },
    { value: 'STOCK_IN', label: 'Nhập kho hàng' },
    { value: 'STOCK_OUT', label: 'Xuất kho hàng' },
  ];

  res.json({
    success: true,
    data: { modules, actions },
  });
};

module.exports = {
  getActivityLogs,
  getActivityLogById,
  getFilterOptions,
};
