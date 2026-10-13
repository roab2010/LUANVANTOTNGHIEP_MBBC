const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// ============================================
// TỔNG QUAN THỐNG KÊ - GET /api/statistics/overview
// ============================================
const getOverviewStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      allOrders,
      totalCustomers,
      totalProducts,
      todayOrders,
    ] = await Promise.all([
      Order.find({}, 'totalAmount status paymentStatus createdAt'),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({}),
      Order.find({ createdAt: { $gte: today } }, 'totalAmount status'),
    ]);

    let totalRevenue = 0;
    let deliveredOrdersCount = 0;
    let pendingOrdersCount = 0;
    let shippingOrdersCount = 0;
    let cancelledOrdersCount = 0;

    allOrders.forEach((o) => {
      if (o.status === 'delivered') {
        totalRevenue += o.totalAmount || 0;
        deliveredOrdersCount++;
      } else if (o.status === 'pending' || o.status === 'processing') {
        pendingOrdersCount++;
      } else if (o.status === 'shipping') {
        shippingOrdersCount++;
      } else if (o.status === 'cancelled') {
        cancelledOrdersCount++;
      }
    });

    let todayRevenue = 0;
    todayOrders.forEach((o) => {
      if (o.status === 'delivered') {
        todayRevenue += o.totalAmount || 0;
      }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        todayRevenue,
        totalOrders: allOrders.length,
        deliveredOrdersCount,
        pendingOrdersCount,
        shippingOrdersCount,
        cancelledOrdersCount,
        totalCustomers,
        totalProducts,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê tổng quan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// BIỂU ĐỒ DOANH THU 7 NGÀY - GET /api/statistics/revenue-chart
// ============================================
const getRevenueChart = async (req, res) => {
  try {
    const days = 7;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const dayOrders = await Order.find({
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
      });

      const dayRevenue = dayOrders.reduce((sum, o) => {
        return sum + (o.status === 'delivered' ? o.totalAmount : 0);
      }, 0);

      const label = `${start.getDate()}/${start.getMonth() + 1}`;
      result.push({
        label,
        date: start.toISOString().split('T')[0],
        revenue: dayRevenue,
        orderCount: dayOrders.length,
      });
    }

    res.json({
      success: true,
      data: {
        chartData: result,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy biểu đồ doanh thu:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// TOP SẢN PHẨM BÁN CHẠY - GET /api/statistics/top-products
// ============================================
const getTopProducts = async (req, res) => {
  try {
    const orders = await Order.find(
      { status: { $ne: 'cancelled' } },
      'items status'
    );

    const productSalesMap = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const id = item.product?.toString() || item.name;
        if (!productSalesMap[id]) {
          productSalesMap[id] = {
            productId: item.product,
            name: item.name,
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSalesMap[id].totalQuantity += item.quantity || 0;
        productSalesMap[id].totalRevenue += item.total || 0;
      });
    });

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    res.json({
      success: true,
      data: { topProducts },
    });
  } catch (error) {
    console.error('Lỗi lấy top sản phẩm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

// ============================================
// PHÂN BỔ TRẠNG THÁI ĐƠN HÀNG - GET /api/statistics/order-status
// ============================================
const getOrderStatusDistribution = async (req, res) => {
  try {
    const statuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
    const counts = await Promise.all(
      statuses.map((status) => Order.countDocuments({ status }))
    );

    const total = counts.reduce((sum, c) => sum + c, 0);

    const distribution = statuses.map((status, index) => {
      const count = counts[index];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        status,
        count,
        percentage,
      };
    });

    res.json({
      success: true,
      data: {
        total,
        distribution,
      },
    });
  } catch (error) {
    console.error('Lỗi phân bổ trạng thái đơn:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau',
    });
  }
};

module.exports = {
  getOverviewStats,
  getRevenueChart,
  getTopProducts,
  getOrderStatusDistribution,
};
