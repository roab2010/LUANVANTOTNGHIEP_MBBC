const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');
const { logActivity } = require('../services/activityLogService');

// ============================================
// HELPER: CẬP NHẬT ĐIỂM TRUNG BÌNH & SỐ LƯỢT ĐÁNH GIÁ SẢN PHẨM
// ============================================
// CHỈ tính toán từ các đánh giá có trạng thái 'APPROVED'
const updateProductRatingStats = async (productId) => {
  try {
    if (!productId) return;
    const prodObjectId = new mongoose.Types.ObjectId(productId);

    const stats = await Review.aggregate([
      {
        $match: {
          productId: prodObjectId,
          status: 'APPROVED',
        },
      },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const rawAvg = stats[0].avgRating || 0;
      // Làm tròn 1 chữ số thập phân (ví dụ: 4.8)
      const ratingAverage = Math.round(rawAvg * 10) / 10;
      const reviewCount = stats[0].reviewCount || 0;

      await Product.findByIdAndUpdate(productId, {
        ratingAverage,
        reviewCount,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        ratingAverage: 0,
        reviewCount: 0,
      });
    }
  } catch (err) {
    console.error('⚠️ [ReviewController Error]: Không thể cập nhật rating stats sản phẩm:', err.message);
  }
};

// ============================================
// HELPER: MÃ HÓA TÊN KHÁCH HÀNG BẢO VỆ RIÊNG TƯ
// ============================================
const maskCustomerName = (fullName = '') => {
  const trimmed = fullName.trim();
  if (!trimmed) return 'Khách hàng MBBC';
  const parts = trimmed.split(' ');
  if (parts.length === 1) {
    return parts[0].length <= 2 ? parts[0] + '***' : parts[0].slice(0, 2) + '***';
  }
  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, -1).join(' ');
  return `${firstNames} ${lastName.slice(0, 1)}***`;
};

// ============================================
// 1. LẤY DANH SÁCH ĐÁNH GIÁ CÔNG KHAI - GET /api/reviews/product/:productId
// ============================================
// CHỈ trả về đánh giá APPROVED! Không để lộ PENDING, REJECTED, HIDDEN.
const getPublicProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      rating,
      hasImage,
      sort = 'latest',
      page = 1,
      limit = 10,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const prodObjectId = new mongoose.Types.ObjectId(productId);

    // Filter cơ sở: BẮT BUỘC chỉ lấy APPROVED
    const filter = {
      productId: prodObjectId,
      status: 'APPROVED',
    };

    // Lọc theo số sao cụ thể (1..5)
    if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
      filter.rating = Number(rating);
    }

    // Lọc chỉ các đánh giá có hình ảnh đính kèm
    if (hasImage === 'true' || hasImage === true) {
      filter.images = { $exists: true, $not: { $size: 0 } };
    }

    // Sắp xếp
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'lowest') {
      sortOption = { rating: 1, createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Truy vấn danh sách đánh giá
    const [reviews, totalMatching] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'fullName avatar')
        .populate('adminReply.repliedBy', 'fullName')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
    ]);

    // Thống kê phân bố sao toàn diện (Dựa trên TOÀN BỘ đánh giá APPROVED của sản phẩm này)
    const distributionStats = await Review.aggregate([
      {
        $match: {
          productId: prodObjectId,
          status: 'APPROVED',
        },
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    // Tổng số đánh giá có ảnh
    const imageCountStats = await Review.countDocuments({
      productId: prodObjectId,
      status: 'APPROVED',
      images: { $exists: true, $not: { $size: 0 } },
    });

    // Chuẩn hóa distribution map 1..5 sao
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalAllApproved = 0;
    let totalRatingSum = 0;

    distributionStats.forEach((st) => {
      if (distribution[st._id] !== undefined) {
        distribution[st._id] = st.count;
        totalAllApproved += st.count;
        totalRatingSum += st._id * st.count;
      }
    });

    const ratingAverage =
      totalAllApproved > 0 ? Math.round((totalRatingSum / totalAllApproved) * 10) / 10 : 0;

    // Ẩn tên khách hàng bảo vệ riêng tư trước khi trả về frontend
    const sanitizedReviews = reviews.map((rev) => ({
      _id: rev._id,
      rating: rev.rating,
      content: rev.content,
      images: rev.images || [],
      variant: rev.variant || {},
      isEdited: rev.isEdited || false,
      createdAt: rev.createdAt,
      customerName: maskCustomerName(rev.userId?.fullName || 'Khách hàng MBBC'),
      adminReply: rev.adminReply?.content
        ? {
            content: rev.adminReply.content,
            repliedAt: rev.adminReply.repliedAt,
            adminName: 'Ban Quản Trị M.B.B.C',
          }
        : null,
    }));

    return res.json({
      success: true,
      data: {
        reviews: sanitizedReviews,
        stats: {
          ratingAverage,
          reviewCount: totalAllApproved,
          distribution,
          hasImagesCount: imageCountStats,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMatching,
          totalPages: Math.ceil(totalMatching / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách đánh giá công khai:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy đánh giá sản phẩm' });
  }
};

// ============================================
// 2. KIỂM TRA ĐIỀU KIỆN ĐÁNH GIÁ - GET /api/reviews/check-eligibility
// ============================================
// Khách phải: 1. Đăng nhập, 2. Đã mua sản phẩm, 3. Đơn hàng ở trạng thái 'delivered', 4. Chưa đánh giá đơn đó
const checkReviewEligibility = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user.userId;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    const prodObjectId = new mongoose.Types.ObjectId(productId);

    // 1. Tìm tất cả đơn hàng của tài khoản này có chứa sản phẩm đó và có trạng thái 'delivered'
    const deliveredOrders = await Order.find({
      'customer.customerId': userId,
      status: 'delivered',
      'items.product': prodObjectId,
    })
      .select('_id orderCode createdAt status items')
      .sort({ createdAt: -1 })
      .lean();

    if (deliveredOrders.length === 0) {
      // Kiểm tra xem khách có đơn hàng nào chứa sản phẩm nhưng CHƯA giao thành công không
      const pendingOrders = await Order.find({
        'customer.customerId': userId,
        status: { $in: ['pending', 'processing', 'shipping'] },
        'items.product': prodObjectId,
      }).select('orderCode status').lean();

      if (pendingOrders.length > 0) {
        return res.json({
          success: true,
          data: {
            eligible: false,
            reason: 'Đơn hàng của bạn đang trong quá trình xử lý hoặc vận chuyển. Bạn có thể gửi đánh giá sau khi đơn hàng được giao thành công.',
            orders: [],
          },
        });
      }

      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Chỉ khách hàng đã mua sản phẩm này và nhận hàng thành công tại MBBC mới có thể gửi đánh giá.',
          orders: [],
        },
      });
    }

    // 2. Tìm các đánh giá mà khách này đã gửi cho sản phẩm này (trừ các đánh giá đã xóa DELETED)
    const existingReviews = await Review.find({
      userId,
      productId: prodObjectId,
      status: { $ne: 'DELETED' },
    })
      .select('orderId status rating content')
      .lean();

    const reviewedOrderIds = new Set(existingReviews.map((r) => r.orderId.toString()));

    // 3. Lọc ra danh sách các đơn hàng đã nhận hàng nhưng CHƯA đánh giá
    const eligibleOrders = deliveredOrders
      .filter((ord) => !reviewedOrderIds.has(ord._id.toString()))
      .map((ord) => {
        const item = (ord.items || []).find(
          (it) => it.product && it.product.toString() === productId.toString()
        );
        return {
          orderId: ord._id,
          orderCode: ord.orderCode,
          orderDate: ord.createdAt,
          variant: {
            size: item?.size || '',
            color: item?.color || '',
          },
        };
      });

    if (eligibleOrders.length === 0) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'Bạn đã hoàn tất gửi đánh giá cho sản phẩm này trong các đơn hàng đã mua.',
          orders: [],
        },
      });
    }

    return res.json({
      success: true,
      data: {
        eligible: true,
        orders: eligibleOrders,
      },
    });
  } catch (err) {
    console.error('Lỗi kiểm tra điều kiện đánh giá:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra điều kiện đánh giá' });
  }
};

// ============================================
// 3. GỬI ĐÁNH GIÁ MỚI - POST /api/reviews
// ============================================
// BẮT BUỘC: Tạo mới luôn ở trạng thái 'PENDING' và chờ Admin kiểm duyệt!
const createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, orderId, rating, content } = req.body;

    // --- Validation cơ bản ---
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'ID đơn hàng không hợp lệ' });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao đánh giá từ 1 đến 5 sao' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung nhận xét của bạn' });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 5) {
      return res.status(400).json({ success: false, message: 'Nội dung nhận xét tối thiểu 5 ký tự' });
    }

    if (trimmedContent.length > 1000) {
      return res.status(400).json({ success: false, message: 'Nội dung nhận xét tối đa 1,000 ký tự' });
    }

    // --- XÁC MINH NGHIÊM NGẶT TẠI BACKEND (KHÔNG TIN CLIENT) ---
    // 1. Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product || product.status === 'inactive') {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh' });
    }

    // 2. Kiểm tra đơn hàng tồn tại
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại trong hệ thống' });
    }

    // 3. Xác minh đơn hàng thuộc về chính tài khoản đang đăng nhập
    if (
      !order.customer ||
      !order.customer.customerId ||
      order.customer.customerId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh giá đơn hàng của tài khoản khác',
      });
    }

    // 4. Xác minh trạng thái đơn hàng đã giao thành công (delivered)
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Bạn chỉ có thể gửi đánh giá khi đơn hàng đã được giao hàng thành công',
      });
    }

    // 5. Xác minh sản phẩm có thực sự nằm trong đơn hàng đó
    const orderItem = (order.items || []).find(
      (it) => it.product && it.product.toString() === productId.toString()
    );

    if (!orderItem) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm này không tồn tại trong đơn hàng bạn đã chọn',
      });
    }

    // 6. Chống gửi trùng: Kiểm tra đã từng đánh giá sản phẩm này trong đơn hàng này chưa
    const existing = await Review.findOne({
      productId,
      userId,
      orderId,
    });

    if (existing && existing.status !== 'DELETED') {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng này rồi',
      });
    }

    // --- XỬ LÝ UPLOAD HÌNH ẢNH THỰC TẾ ---
    const uploadedImages = [];

    // Nếu gửi file qua multipart form-data (req.files)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Chỉ được phép tải lên tối đa 5 hình ảnh thực tế',
        });
      }

      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'sellstock/reviews');
        if (uploadResult && uploadResult.secure_url) {
          uploadedImages.push(uploadResult.secure_url);
        }
      }
    } else if (req.body.images) {
      // Nếu client gửi mảng URL ảnh có sẵn
      try {
        const parsed = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        if (Array.isArray(parsed)) {
          uploadedImages.push(...parsed.slice(0, 5));
        }
      } catch (e) {
        // bỏ qua nếu lỗi parse
      }
    }

    // --- TẠO HOẶC CẬP NHẬT LẠI ĐÁNH GIÁ (NẾU ĐÃ XÓA MỀM TRƯỚC ĐÓ) ---
    let review;
    if (existing && existing.status === 'DELETED') {
      existing.rating = ratingNum;
      existing.content = trimmedContent;
      existing.images = uploadedImages;
      existing.variant = {
        size: orderItem.size || '',
        color: orderItem.color || '',
      };
      existing.status = 'PENDING'; // Đưa lại về PENDING
      existing.moderationReason = '';
      existing.moderatedBy = null;
      existing.moderatedAt = null;
      existing.adminReply = { content: '', repliedAt: null, repliedBy: null };
      existing.isEdited = false;
      review = await existing.save();
    } else {
      review = await Review.create({
        productId,
        userId,
        orderId,
        variant: {
          size: orderItem.size || '',
          color: orderItem.color || '',
        },
        rating: ratingNum,
        content: trimmedContent,
        images: uploadedImages,
        status: 'PENDING', // BẮT BUỘC PENDING
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Đánh giá của bạn đã được gửi và đang chờ Admin duyệt',
      data: {
        review: {
          _id: review._id,
          rating: review.rating,
          content: review.content,
          images: review.images,
          status: review.status,
          createdAt: review.createdAt,
        },
      },
    });
  } catch (err) {
    console.error('Lỗi gửi đánh giá sản phẩm:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng này rồi',
      });
    }
    return res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá' });
  }
};

// ============================================
// 4. LẤY DANH SÁCH ĐÁNH GIÁ CỦA TÔI - GET /api/reviews/my-reviews
// ============================================
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      userId,
      status: { $ne: 'DELETED' }, // Không hiển thị đánh giá đã xóa mềm
    };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('productId', 'name image price category')
        .populate('orderId', 'orderCode createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách đánh giá của tôi:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi tải đánh giá của bạn' });
  }
};

// ============================================
// 5. CHỈNH SỬA ĐÁNH GIÁ CỦA CHÍNH MÌNH - PUT /api/reviews/:id
// ============================================
// QUY TẮC: Nếu khách sửa đánh giá đã được APPROVED, chuyển lại PENDING và không hiển thị công khai cho đến khi duyệt lại!
const updateMyReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { rating, content, images } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }

    const review = await Review.findById(id);
    if (!review || review.status === 'DELETED') {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }

    // Xác minh quyền sở hữu
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa đánh giá này' });
    }

    // Validate dữ liệu mới
    if (rating !== undefined) {
      const rNum = Number(rating);
      if (isNaN(rNum) || rNum < 1 || rNum > 5) {
        return res.status(400).json({ success: false, message: 'Số sao phải từ 1 đến 5 sao' });
      }
      review.rating = rNum;
    }

    if (content !== undefined) {
      const trimmed = content.trim();
      if (trimmed.length < 5 || trimmed.length > 1000) {
        return res.status(400).json({ success: false, message: 'Nội dung nhận xét phải từ 5 đến 1,000 ký tự' });
      }
      review.content = trimmed;
    }

    // Xử lý ảnh mới nếu có
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files.slice(0, 5)) {
        const uploadResult = await uploadToCloudinary(file.buffer, 'sellstock/reviews');
        if (uploadResult && uploadResult.secure_url) {
          newImages.push(uploadResult.secure_url);
        }
      }
      review.images = newImages;
    } else if (images !== undefined) {
      try {
        const parsed = typeof images === 'string' ? JSON.parse(images) : images;
        if (Array.isArray(parsed)) {
          review.images = parsed.slice(0, 5);
        }
      } catch (e) {
        // giữ nguyên
      }
    }

    const wasApproved = review.status === 'APPROVED';

    // ĐỔI TRẠNG THÁI VỀ PENDING VÀ ĐẶT LẠI LÝ DO
    review.status = 'PENDING';
    review.moderationReason = '';
    review.isEdited = true;

    await review.save();

    // Nếu trước đó đang là APPROVED, cập nhật lại điểm sản phẩm vì đánh giá này đang tạm chờ duyệt lại
    if (wasApproved) {
      await updateProductRatingStats(review.productId);
    }

    return res.json({
      success: true,
      message: 'Đánh giá của bạn đã được cập nhật và đang chờ Admin duyệt lại',
      data: { review },
    });
  } catch (err) {
    console.error('Lỗi cập nhật đánh giá:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi chỉnh sửa đánh giá' });
  }
};

// ============================================
// 6. XÓA ĐÁNH GIÁ CỦA CHÍNH MÌNH (XÓA MỀM) - DELETE /api/reviews/:id
// ============================================
const deleteMyReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }

    const review = await Review.findById(id);
    if (!review || review.status === 'DELETED') {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }

    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đánh giá này' });
    }

    const wasApproved = review.status === 'APPROVED';

    // Xóa mềm
    review.status = 'DELETED';
    await review.save();

    if (wasApproved) {
      await updateProductRatingStats(review.productId);
    }

    return res.json({
      success: true,
      message: 'Đã xóa đánh giá thành công',
    });
  } catch (err) {
    console.error('Lỗi xóa đánh giá:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi xóa đánh giá' });
  }
};

// ============================================
// 7. ADMIN: LẤY DANH SÁCH ĐÁNH GIÁ TOÀN HỆ THỐNG - GET /api/reviews/admin
// ============================================
const getAdminReviews = async (req, res) => {
  try {
    const {
      status,
      rating,
      productId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 15,
    } = req.query;

    const filter = {};

    // Lọc theo trạng thái kiểm duyệt
    if (status && ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    } else {
      // Mặc định không hiển thị DELETED trừ khi tìm kiếm đặc biệt
      filter.status = { $ne: 'DELETED' };
    }

    // Lọc theo số sao
    if (rating && ['1', '2', '3', '4', '5'].includes(String(rating))) {
      filter.rating = Number(rating);
    }

    // Lọc theo sản phẩm cụ thể
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.productId = new mongoose.Types.ObjectId(productId);
    }

    // Lọc theo khoảng ngày gửi
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Tìm kiếm theo từ khóa trong nội dung
    if (search && search.trim()) {
      filter.content = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 15));
    const skip = (pageNum - 1) * limitNum;

    // Sắp xếp: Ưu tiên trạng thái PENDING lên đầu, sau đó đến ngày tạo mới nhất
    // MongoDB aggregation hoặc sort
    const [reviews, totalMatching, kpiCounts] = await Promise.all([
      Review.find(filter)
        .populate('productId', 'name image price category')
        .populate('userId', 'fullName email phone')
        .populate('orderId', 'orderCode createdAt totalAmount')
        .populate('moderatedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
      // Thống kê 4 thẻ KPI nhanh cho Admin Dashboard
      Promise.all([
        Review.countDocuments({ status: { $ne: 'DELETED' } }),
        Review.countDocuments({ status: 'PENDING' }),
        Review.countDocuments({ status: 'APPROVED' }),
        Review.countDocuments({ status: { $in: ['REJECTED', 'HIDDEN'] } }),
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        reviews,
        kpi: {
          total: kpiCounts[0],
          pending: kpiCounts[1],
          approved: kpiCounts[2],
          rejectedOrHidden: kpiCounts[3],
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalMatching,
          totalPages: Math.ceil(totalMatching / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('Lỗi Admin lấy danh sách đánh giá:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đánh giá cho Admin' });
  }
};

// ============================================
// 8. ADMIN: LẤY CHI TIẾT 1 ĐÁNH GIÁ - GET /api/reviews/admin/:id
// ============================================
const getAdminReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }

    const review = await Review.findById(id)
      .populate('productId')
      .populate('userId', 'fullName email phone role status createdAt')
      .populate('orderId')
      .populate('moderatedBy', 'fullName email')
      .populate('adminReply.repliedBy', 'fullName email')
      .lean();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    return res.json({
      success: true,
      data: { review },
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết đánh giá cho Admin:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đánh giá' });
  }
};

// ============================================
// 9. ADMIN: KIỂM DUYỆT ĐÁNH GIÁ - PATCH /api/reviews/admin/:id/moderate
// ============================================
// Thao tác: 'approve' (Duyệt) | 'reject' (Từ chối) | 'hide' (Ẩn) | 'restore' (Khôi phục)
const moderateReview = async (req, res) => {
  try {
    const adminUser = req.user;
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }

    const review = await Review.findById(id).populate('productId', 'name').populate('userId', 'fullName');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }

    const oldStatus = review.status;
    let newStatus = oldStatus;
    let actionVi = '';
    let logDesc = '';

    switch (action) {
      case 'approve':
        newStatus = 'APPROVED';
        review.moderationReason = '';
        actionVi = 'Duyệt công khai';
        logDesc = `Duyệt đánh giá ${review.rating}★ của khách hàng "${review.userId?.fullName}" cho sản phẩm "${review.productId?.name}"`;
        break;

      case 'reject':
        if (!reason || !reason.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp lý do từ chối đánh giá',
          });
        }
        newStatus = 'REJECTED';
        review.moderationReason = reason.trim();
        actionVi = 'Từ chối đánh giá';
        logDesc = `Từ chối đánh giá của khách hàng "${review.userId?.fullName}". Lý do: ${review.moderationReason}`;
        break;

      case 'hide':
        if (!reason || !reason.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp lý do ẩn đánh giá',
          });
        }
        newStatus = 'HIDDEN';
        review.moderationReason = reason.trim();
        actionVi = 'Ẩn đánh giá';
        logDesc = `Ẩn đánh giá của khách hàng "${review.userId?.fullName}". Lý do: ${review.moderationReason}`;
        break;

      case 'restore':
        newStatus = 'APPROVED';
        review.moderationReason = '';
        actionVi = 'Khôi phục hiển thị';
        logDesc = `Khôi phục hiển thị đánh giá ${review.rating}★ của khách hàng "${review.userId?.fullName}" cho sản phẩm "${review.productId?.name}"`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Thao tác kiểm duyệt không hợp lệ. Chỉ chấp nhận: approve, reject, hide, restore',
        });
    }

    review.status = newStatus;
    review.moderatedBy = adminUser.userId;
    review.moderatedAt = new Date();

    await review.save();

    // CẬP NHẬT LẠI TỔNG RATING VÀ SỐ LƯỢT CỦA SẢN PHẨM
    await updateProductRatingStats(review.productId._id || review.productId);

    // GHI NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG (ActivityLog)
    await logActivity({
      req,
      action: 'STATUS_CHANGE',
      module: 'REVIEW',
      targetType: 'Review',
      targetId: review._id.toString(),
      targetName: `Đánh giá #${review._id.toString().slice(-6).toUpperCase()} - ${review.productId?.name}`,
      description: logDesc,
      changes: [
        {
          field: 'status',
          fieldNameVi: 'Trạng thái kiểm duyệt',
          oldValue: oldStatus,
          newValue: newStatus,
        },
        ...(review.moderationReason
          ? [
              {
                field: 'moderationReason',
                fieldNameVi: 'Lý do kiểm duyệt',
                oldValue: '',
                newValue: review.moderationReason,
              },
            ]
          : []),
      ],
      metadata: {
        action,
        rating: review.rating,
        customerName: review.userId?.fullName,
      },
    });

    return res.json({
      success: true,
      message: `${actionVi} thành công`,
      data: { review },
    });
  } catch (err) {
    console.error('Lỗi kiểm duyệt đánh giá:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi kiểm duyệt đánh giá' });
  }
};

// ============================================
// 10. ADMIN: PHẢN HỒI VỚI TƯ CÁCH MBBC - POST /api/reviews/admin/:id/reply
// ============================================
const replyReview = async (req, res) => {
  try {
    const adminUser = req.user;
    const { id } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID đánh giá không hợp lệ' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung phản hồi của MBBC' });
    }

    const review = await Review.findById(id).populate('productId', 'name').populate('userId', 'fullName');
    if (!review) {
      return res.status(404).json({ success: false, message: 'Đánh giá không tồn tại' });
    }

    // Chỉ cho phép phản hồi các đánh giá đã được duyệt
    if (review.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể gửi phản hồi công khai cho đánh giá đã được duyệt (APPROVED)',
      });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 1000) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi tối đa 1,000 ký tự' });
    }

    const oldReply = review.adminReply?.content || '';

    review.adminReply = {
      content: trimmedContent,
      repliedAt: new Date(),
      repliedBy: adminUser.userId,
    };

    await review.save();

    // GHI NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG
    await logActivity({
      req,
      action: oldReply ? 'UPDATE' : 'CREATE',
      module: 'REVIEW',
      targetType: 'Review',
      targetId: review._id.toString(),
      targetName: `Phản hồi đánh giá #${review._id.toString().slice(-6).toUpperCase()}`,
      description: oldReply
        ? `Cập nhật phản hồi chính thức MBBC cho đánh giá của "${review.userId?.fullName}"`
        : `Gửi phản hồi chính thức MBBC cho đánh giá của "${review.userId?.fullName}"`,
      changes: [
        {
          field: 'adminReply',
          fieldNameVi: 'Nội dung phản hồi MBBC',
          oldValue: oldReply,
          newValue: trimmedContent,
        },
      ],
    });

    return res.json({
      success: true,
      message: 'Đã gửi phản hồi thành công',
      data: { adminReply: review.adminReply },
    });
  } catch (err) {
    console.error('Lỗi phản hồi đánh giá:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server khi gửi phản hồi' });
  }
};

module.exports = {
  getPublicProductReviews,
  checkReviewEligibility,
  createReview,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  getAdminReviews,
  getAdminReviewById,
  moderateReview,
  replyReview,
  updateProductRatingStats,
};
