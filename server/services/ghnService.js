/**
 * ============================================
 * DỊCH VỤ TÍCH HỢP GIAO HÀNG NHANH (GHN STAGING API)
 * ============================================
 * Sử dụng endpoint chính thức của GHN:
 * Fee: https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee
 * Master Data: /master-data/province, /master-data/district, /master-data/ward
 */

const getHeaders = () => {
  const token = process.env.GHN_TOKEN;
  const shopId = process.env.GHN_SHOP_ID;

  if (!token) {
    throw new Error('Chưa cấu hình GHN_TOKEN trong biến môi trường backend');
  }

  const headers = {
    'Content-Type': 'application/json',
    token: token.trim(),
  };

  if (shopId) {
    headers.ShopId = String(shopId).trim();
  }

  return headers;
};

const getBaseUrl = () => {
  return process.env.GHN_API_URL || 'https://dev-online-gateway.ghn.vn/shiip/public-api';
};

/**
 * 1. LẤY DANH SÁCH TỈNH / THÀNH PHỐ
 */
const getProvinces = async () => {
  const url = `${getBaseUrl()}/master-data/province`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resJson = await response.json();
  if (!response.ok || resJson.code !== 200) {
    throw new Error(resJson.message || 'Không thể lấy danh sách Tỉnh/Thành từ GHN');
  }

  // Lọc chỉ lấy các tỉnh thành hợp lệ đang hoạt động
  return (resJson.data || [])
    .filter((p) => p.Status === 1)
    .map((p) => ({
      provinceId: p.ProvinceID,
      provinceName: p.ProvinceName,
      code: p.Code,
    }))
    .sort((a, b) => a.provinceName.localeCompare(b.provinceName, 'vi'));
};

/**
 * 2. LẤY DANH SÁCH QUẬN / HUYỆN THEO TỈNH THÀNH
 */
const getDistricts = async (provinceId) => {
  if (!provinceId) {
    throw new Error('Vui lòng cung cấp provinceId');
  }

  const url = `${getBaseUrl()}/master-data/district?province_id=${provinceId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resJson = await response.json();
  if (!response.ok || resJson.code !== 200) {
    throw new Error(resJson.message || 'Không thể lấy danh sách Quận/Huyện từ GHN');
  }

  return (resJson.data || [])
    .filter((d) => d.Status === 1)
    .map((d) => ({
      districtId: d.DistrictID,
      districtName: d.DistrictName,
      code: d.Code,
    }))
    .sort((a, b) => a.districtName.localeCompare(b.districtName, 'vi'));
};

/**
 * 3. LẤY DANH SÁCH PHƯỜNG / XÃ THEO QUẬN HUYỆN
 */
const getWards = async (districtId) => {
  if (!districtId) {
    throw new Error('Vui lòng cung cấp districtId');
  }

  const url = `${getBaseUrl()}/master-data/ward?district_id=${districtId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  const resJson = await response.json();
  if (!response.ok || resJson.code !== 200) {
    throw new Error(resJson.message || 'Không thể lấy danh sách Phường/Xã từ GHN');
  }

  return (resJson.data || [])
    .filter((w) => w.Status === 1)
    .map((w) => ({
      wardCode: String(w.WardCode),
      wardName: w.WardName,
      districtId: w.DistrictID,
    }))
    .sort((a, b) => a.wardName.localeCompare(b.wardName, 'vi'));
};

/**
 * 4. TÍNH PHÍ VẬN CHUYỂN GHN STAGING
 * Endpoint: POST /v2/shipping-order/fee
 */
const calculateShippingFee = async ({
  toDistrictId,
  toWardCode,
  items = [],
  insuranceValue = 0,
}) => {
  if (!toDistrictId) {
    throw new Error('Mã Quận/Huyện nhận hàng (to_district_id) là bắt buộc');
  }
  if (!toWardCode) {
    throw new Error('Mã Phường/Xã nhận hàng (to_ward_code) là bắt buộc');
  }

  // ============================================
  // QUY CHUẨN ĐÓNG GÓI THỜI TRANG MBBC (DEMO ĐỒ ÁN)
  // Lưu ý: Đây là cấu hình tạm thời mô phỏng đóng gói cho quần áo:
  // - Trọng lượng: 250 gram / sản phẩm (tối thiểu 250g)
  // - Kích thước: 25cm (dài) x 20cm (rộng) x (số lượng * 4cm, tối đa 50cm, tối thiểu 5cm)
  // ============================================
  const totalQty = Array.isArray(items) && items.length > 0
    ? items.reduce((sum, it) => sum + (parseInt(it.quantity) || 1), 0)
    : 1;

  const packageWeight = Math.max(250, totalQty * 250); // gram
  const packageLength = 25; // cm
  const packageWidth = 20; // cm
  const packageHeight = Math.max(5, Math.min(50, totalQty * 4)); // cm

  // Kho hàng xuất phát giả lập: Quận 4, TP.HCM
  const fromDistrictId = Number(process.env.GHN_FROM_DISTRICT_ID || 1446);
  const fromWardCode = String(process.env.GHN_FROM_WARD_CODE || '20415');

  const payload = {
    from_district_id: fromDistrictId,
    from_ward_code: fromWardCode,
    service_type_id: 2, // Giao hàng chuẩn (Chuẩn TMĐT)
    to_district_id: Number(toDistrictId),
    to_ward_code: String(toWardCode),
    height: packageHeight,
    length: packageLength,
    width: packageWidth,
    weight: packageWeight,
    insurance_value: Math.min(5000000, Math.max(0, Number(insuranceValue) || 0)),
  };

  const url = `${getBaseUrl()}/v2/shipping-order/fee`;

  // Cơ chế retry tối đa 2 lần khi gặp lỗi mạng hoặc EOF từ GHN Staging
  let resJson = null;
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      resJson = await response.json();

      if (response.ok && resJson.code === 200) {
        break; // Thành công
      }

      const msg = resJson?.message || resJson?.code_message_value || '';
      // Nếu là lỗi EOF hoặc tạm thời từ server GHN Staging, thử lại sau 350ms
      if (attempt === 1 && (msg.includes('EOF') || msg.includes('timeout') || !response.ok)) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }

      let errorMsg = msg || 'Không thể tính phí vận chuyển từ GHN. Vui lòng kiểm tra lại địa chỉ.';
      if (errorMsg.includes('EOF') || errorMsg.includes('tenant_order_calculate_fee')) {
        errorMsg = 'Hệ thống GHN Staging đang phản hồi chậm hoặc gián đoạn kết nối tạm thời. Vui lòng thử lại sau giây lát.';
      }
      throw new Error(errorMsg);
    } catch (err) {
      lastError = err;
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  if (!resJson || resJson.code !== 200) {
    let finalMsg = lastError?.message || 'Không thể tính phí vận chuyển từ GHN';
    if (finalMsg.includes('EOF') || finalMsg.includes('tenant_order_calculate_fee')) {
      finalMsg = 'Hệ thống GHN Staging đang phản hồi chậm hoặc gián đoạn kết nối tạm thời. Vui lòng thử lại sau giây lát.';
    }
    throw new Error(finalMsg);
  }

  const feeData = resJson.data || {};

  return {
    total: feeData.total || feeData.service_fee || 0,
    serviceFee: feeData.service_fee || 0,
    insuranceFee: feeData.insurance_fee || 0,
    packageInfo: {
      weight: packageWeight,
      length: packageLength,
      width: packageWidth,
      height: packageHeight,
      isDemoPackaging: true,
      note: 'Quy chuẩn đóng gói quần áo MBBC (cấu hình tạm thời cho demo)',
    },
  };
};

module.exports = {
  getProvinces,
  getDistricts,
  getWards,
  calculateShippingFee,
};
