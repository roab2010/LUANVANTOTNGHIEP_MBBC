const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ============================================
// ĐƯỜNG DẪN TÀI NGUYÊN (FONT & LOGO)
// ============================================
const getAssetPaths = () => {
  const serverDir = path.join(__dirname, '..');

  // Font Unicode tiếng Việt (ưu tiên thư mục assets/fonts nội bộ, fallback Windows Fonts)
  const internalRegular = path.join(serverDir, 'assets', 'fonts', 'arial.ttf');
  const internalBold = path.join(serverDir, 'assets', 'fonts', 'arialbd.ttf');
  const winRegular = 'C:/Windows/Fonts/arial.ttf';
  const winBold = 'C:/Windows/Fonts/arialbd.ttf';

  const fontRegular = fs.existsSync(internalRegular)
    ? internalRegular
    : fs.existsSync(winRegular)
    ? winRegular
    : null;

  const fontBold = fs.existsSync(internalBold)
    ? internalBold
    : fs.existsSync(winBold)
    ? winBold
    : null;

  // Logo MBBC thật
  const internalLogo = path.join(serverDir, 'assets', 'logo MBBC.png');
  const clientLogo = path.join(serverDir, '..', 'client', 'src', 'assets', 'logo MBBC.png');

  const logoPath = fs.existsSync(internalLogo)
    ? internalLogo
    : fs.existsSync(clientLogo)
    ? clientLogo
    : null;

  return { fontRegular, fontBold, logoPath };
};

// ============================================
// FORMAT TIỀN VIỆT NAM (₫)
// ============================================
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
};

// ============================================
// FORMAT NGÀY GIỜ VIỆT NAM
// ============================================
const formatDateTime = (date) => {
  const d = date ? new Date(date) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins} - ${day}/${month}/${year}`;
};

// ============================================
// BẢN ĐỒ TRẠNG THÁI & THANH TOÁN TIẾNG VIỆT
// ============================================
const orderStatusMap = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao thành công',
  cancelled: 'Đã hủy',
};

const paymentMethodMap = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  banking: 'Chuyển khoản ngân hàng',
};

const paymentStatusMap = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
};

// ============================================
// HÀM CHÍNH: TẠO FILE PDF XÁC NHẬN ĐƠN HÀNG
// ============================================
const generateOrderPDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const { fontRegular, fontBold, logoPath } = getAssetPaths();

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Xác nhận đơn hàng ${order.orderCode || ''}`,
          Author: 'MBBC - Made By Bảo Cường',
          Subject: 'Phiếu xác nhận đơn hàng MBBC Store',
        },
      });

      // Đăng ký font Unicode nếu có
      let regularFont = 'Helvetica';
      let boldFont = 'Helvetica-Bold';

      if (fontRegular && fontBold) {
        doc.registerFont('MBBC-Regular', fontRegular);
        doc.registerFont('MBBC-Bold', fontBold);
        regularFont = 'MBBC-Regular';
        boldFont = 'MBBC-Bold';
      }

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const pageWidth = doc.page.width; // 595.28
      const margin = 40;
      const contentWidth = pageWidth - margin * 2; // 515.28
      const rightEdge = margin + contentWidth; // 555.28

      // ========================================================
      // 1. HEADER: LOGO MBBC & TIÊU ĐỀ ĐƠN HÀNG
      // ========================================================
      const headerY = 36;

      // Bên trái: Logo MBBC thật & Tên thương hiệu
      if (logoPath && fs.existsSync(logoPath)) {
        try {
          // Bù trừ mép trong suốt để logo thẳng hàng dọc chính xác với lề margin 40
          doc.image(logoPath, margin - 6, headerY - 4, { width: 96 });
        } catch (imgErr) {
          console.error('Không thể nhúng logo vào PDF:', imgErr.message);
        }
      } else {
        doc
          .font(boldFont)
          .fontSize(20)
          .fillColor('#111827')
          .text('M.B.B.C', margin, headerY);
      }

      // Thông tin thương hiệu dưới logo, căn lề thẳng hàng với mép trái
      doc
        .font(boldFont)
        .fontSize(8.5)
        .fillColor('#111827')
        .text('M.B.B.C CLOTHING STORE', margin, headerY + 52);

      doc
        .font(regularFont)
        .fontSize(7.5)
        .fillColor('#6b7280')
        .text('- Made By Bảo Cường - • Streetwear Brand', margin, headerY + 64);

      // Bên phải: TIÊU ĐỀ PHIẾU XÁC NHẬN ĐƠN HÀNG
      const titleBoxWidth = 260;
      const titleX = rightEdge - titleBoxWidth;

      doc
        .font(boldFont)
        .fontSize(16)
        .fillColor('#111827')
        .text('PHIẾU XÁC NHẬN ĐƠN HÀNG', titleX, headerY, {
          width: titleBoxWidth,
          align: 'right',
        });

      doc
        .font(boldFont)
        .fontSize(11)
        .fillColor('#dc2626')
        .text(`Mã đơn: #${order.orderCode || 'N/A'}`, titleX, headerY + 24, {
          width: titleBoxWidth,
          align: 'right',
        });

      doc
        .font(regularFont)
        .fontSize(8.5)
        .fillColor('#4b5563')
        .text(`Ngày đặt: ${formatDateTime(order.createdAt)}`, titleX, headerY + 40, {
          width: titleBoxWidth,
          align: 'right',
        });

      const currentStatus = orderStatusMap[order.status] || order.status || 'Chờ xử lý';
      doc
        .font(regularFont)
        .fontSize(8.5)
        .fillColor('#059669')
        .text(`Trạng thái: ${currentStatus}`, titleX, headerY + 54, {
          width: titleBoxWidth,
          align: 'right',
        });

      // Đường kẻ ngăn cách header
      const dividerY = headerY + 78;
      doc
        .strokeColor('#111827')
        .lineWidth(1.2)
        .moveTo(margin, dividerY)
        .lineTo(rightEdge, dividerY)
        .stroke();

      // ========================================================
      // 2. HAI CỘT THÔNG TIN: KHÁCH HÀNG & GIAO HÀNG
      // ========================================================
      const infoY = dividerY + 12;
      const colWidth = (contentWidth - 16) / 2; // ~249pt
      const col2X = margin + colWidth + 16;

      const customer = order.customer || {};
      const fullAddress =
        customer.address ||
        [customer.streetAddress, customer.ward, customer.district, customer.province]
          .filter(Boolean)
          .join(', ') ||
        'Chưa cập nhật địa chỉ';

      // Hộp bên trái: THÔNG TIN KHÁCH HÀNG
      doc
        .rect(margin, infoY, colWidth, 76)
        .fillAndStroke('#f9fafb', '#e5e7eb');

      doc
        .font(boldFont)
        .fontSize(9)
        .fillColor('#111827')
        .text('THÔNG TIN KHÁCH HÀNG', margin + 12, infoY + 8);

      doc
        .font(regularFont)
        .fontSize(8.5)
        .fillColor('#374151')
        .text(`Họ và tên: `, margin + 12, infoY + 24, { continued: true })
        .font(boldFont)
        .text(customer.fullName || 'Khách vãng lai');

      doc
        .font(regularFont)
        .text(`Số điện thoại: `, margin + 12, infoY + 38, { continued: true })
        .font(boldFont)
        .text(customer.phone || 'N/A');

      doc
        .font(regularFont)
        .text(`Hình thức: `, margin + 12, infoY + 52, { continued: true })
        .font(regularFont)
        .fillColor('#111827')
        .text(paymentMethodMap[order.paymentMethod] || order.paymentMethod || 'COD');

      // Hộp bên phải: ĐỊA CHỈ NHẬN HÀNG
      doc
        .rect(col2X, infoY, colWidth, 76)
        .fillAndStroke('#f9fafb', '#e5e7eb');

      doc
        .font(boldFont)
        .fontSize(9)
        .fillColor('#111827')
        .text('ĐỊA CHỈ NHẬN HÀNG', col2X + 12, infoY + 8);

      doc
        .font(regularFont)
        .fontSize(8.5)
        .fillColor('#374151')
        .text(fullAddress, col2X + 12, infoY + 24, {
          width: colWidth - 24,
          height: 44,
          ellipsis: true,
          lineGap: 2,
        });

      // ========================================================
      // 3. BẢNG DANH SÁCH SẢN PHẨM (ITEMS TABLE - KHOẢNG CÁCH THOÁNG ĐÃNG)
      // ========================================================
      let tableY = infoY + 90;

      // Cấu hình các cột cân đối, thoáng đãng, ĐƠN GIÁ và THÀNH TIỀN không bao giờ bị dính
      // Tổng width: 28 + 182 + 90 + 30 + 85 + 90 + các khoảng đệm = 515.28
      const cols = {
        stt: { x: margin, width: 28, align: 'center', label: 'STT' },
        name: { x: margin + 32, width: 182, align: 'left', label: 'SẢN PHẨM' },
        variant: { x: margin + 218, width: 88, align: 'center', label: 'PHÂN LOẠI' },
        qty: { x: margin + 310, width: 30, align: 'center', label: 'SL' },
        price: { x: margin + 344, width: 80, align: 'right', label: 'ĐƠN GIÁ' },
        total: { x: margin + 430, width: 85, align: 'right', label: 'THÀNH TIỀN' },
      };

      // Hàm vẽ header của bảng
      const renderTableHeader = (currentY) => {
        doc
          .rect(margin, currentY, contentWidth, 22)
          .fill('#111827');

        doc.font(boldFont).fontSize(8).fillColor('#ffffff');

        doc.text(cols.stt.label, cols.stt.x, currentY + 6, {
          width: cols.stt.width,
          align: cols.stt.align,
        });
        doc.text(cols.name.label, cols.name.x, currentY + 6, {
          width: cols.name.width,
          align: cols.name.align,
        });
        doc.text(cols.variant.label, cols.variant.x, currentY + 6, {
          width: cols.variant.width,
          align: cols.variant.align,
        });
        doc.text(cols.qty.label, cols.qty.x, currentY + 6, {
          width: cols.qty.width,
          align: cols.qty.align,
        });
        doc.text(cols.price.label, cols.price.x, currentY + 6, {
          width: cols.price.width,
          align: cols.price.align,
        });
        doc.text(cols.total.label, cols.total.x, currentY + 6, {
          width: cols.total.width,
          align: cols.total.align,
        });

        return currentY + 22;
      };

      tableY = renderTableHeader(tableY);

      // Render từng sản phẩm
      const items = Array.isArray(order.items) ? order.items : [];

      items.forEach((item, index) => {
        // Kiểm tra sang trang mới nếu gần hết trang A4
        if (tableY > 690) {
          doc.addPage();
          tableY = 40;
          tableY = renderTableHeader(tableY);
        }

        const itemName = item.name || 'Sản phẩm MBBC';
        const variantText = [item.size ? `Size: ${item.size}` : '', item.color ? `Màu: ${item.color}` : '']
          .filter(Boolean)
          .join(' / ') || '-';

        const itemQty = item.quantity || 1;
        const itemPrice = item.price || 0;
        const itemTotal = item.total || itemPrice * itemQty;

        // Tính chiều cao dòng linh hoạt theo độ dài tên sản phẩm và phân loại
        doc.font(regularFont).fontSize(8.5);
        const nameHeight = doc.heightOfString(itemName, { width: cols.name.width });
        const variantHeight = doc.heightOfString(variantText, { width: cols.variant.width });
        const rowHeight = Math.max(26, Math.max(nameHeight, variantHeight) + 12);

        // Nền xen kẽ
        if (index % 2 === 1) {
          doc
            .rect(margin, tableY, contentWidth, rowHeight)
            .fill('#f9fafb');
        }

        // Đường kẻ viền dưới dòng
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(0.5)
          .moveTo(margin, tableY + rowHeight)
          .lineTo(rightEdge, tableY + rowHeight)
          .stroke();

        const textY = tableY + 6;

        // In các cột
        doc.font(regularFont).fontSize(8.5).fillColor('#374151');

        doc.text(String(index + 1), cols.stt.x, textY, {
          width: cols.stt.width,
          align: cols.stt.align,
        });

        doc.font(boldFont).fillColor('#111827');
        doc.text(itemName, cols.name.x, textY, {
          width: cols.name.width,
          align: cols.name.align,
        });

        doc.font(regularFont).fillColor('#4b5563');
        doc.text(variantText, cols.variant.x, textY, {
          width: cols.variant.width,
          align: cols.variant.align,
        });

        doc.text(String(itemQty), cols.qty.x, textY, {
          width: cols.qty.width,
          align: cols.qty.align,
        });

        doc.font(regularFont).fillColor('#111827');
        doc.text(formatCurrency(itemPrice), cols.price.x, textY, {
          width: cols.price.width,
          align: cols.price.align,
        });

        doc.font(boldFont).fillColor('#111827');
        doc.text(formatCurrency(itemTotal), cols.total.x, textY, {
          width: cols.total.width,
          align: cols.total.align,
        });

        tableY += rowHeight;
      });

      // ========================================================
      // 4. PHẦN TỔNG KẾT THANH TOÁN (THOÁNG ĐÃNG, RÕ RÀNG)
      // ========================================================
      if (tableY > 640) {
        doc.addPage();
        tableY = 40;
      }

      const summaryY = tableY + 14;

      // Bên trái: Ghi chú đơn hàng & Phương thức thanh toán
      const leftNoteWidth = 230;
      if (order.notes && order.notes.trim()) {
        doc
          .rect(margin, summaryY, leftNoteWidth, 60)
          .fillAndStroke('#fffbeb', '#fef3c7');

        doc
          .font(boldFont)
          .fontSize(8.5)
          .fillColor('#92400e')
          .text('GHI CHÚ CỦA KHÁCH HÀNG:', margin + 10, summaryY + 8);

        doc
          .font(regularFont)
          .fontSize(8)
          .fillColor('#78350f')
          .text(order.notes.trim(), margin + 10, summaryY + 22, {
            width: leftNoteWidth - 20,
            height: 32,
            ellipsis: true,
          });
      } else {
        doc
          .rect(margin, summaryY, leftNoteWidth, 60)
          .fillAndStroke('#f9fafb', '#e5e7eb');

        doc
          .font(boldFont)
          .fontSize(8.5)
          .fillColor('#111827')
          .text('PHƯƠNG THỨC THANH TOÁN:', margin + 10, summaryY + 8);

        doc
          .font(regularFont)
          .fontSize(8)
          .fillColor('#4b5563')
          .text(paymentMethodMap[order.paymentMethod] || 'Thanh toán khi nhận hàng (COD)', margin + 10, summaryY + 24);

        doc
          .font(regularFont)
          .fontSize(8)
          .fillColor('#059669')
          .text(`Trạng thái: ${paymentStatusMap[order.paymentStatus] || 'Chưa thanh toán'}`, margin + 10, summaryY + 38);
      }

      // Bên phải: KHỐI TỔNG KẾT TIỀN (RỘNG RÃI, THOÁNG ĐÃNG, KHÔNG DÍNH SỐ)
      const sumBoxWidth = 240;
      const sumBoxX = rightEdge - sumBoxWidth; // 555.28 - 240 = 315.28
      const sumLabelWidth = 110;
      const sumValWidth = 125;
      const sumValX = sumBoxX + sumLabelWidth + 5;

      const subtotal = (order.totalAmount || 0) - (order.shippingFee || 0);
      const shippingFee = order.shippingFee || 0;
      const grandTotal = order.totalAmount || 0;

      let curSumY = summaryY + 2;

      // Hàng 1: Tiền hàng
      doc.font(regularFont).fontSize(9).fillColor('#4b5563');
      doc.text('Tiền hàng:', sumBoxX, curSumY, { width: sumLabelWidth, align: 'left' });
      doc.font(boldFont).fontSize(9.5).fillColor('#111827');
      doc.text(formatCurrency(subtotal), sumValX, curSumY, { width: sumValWidth, align: 'right' });

      curSumY += 20;

      // Hàng 2: Phí vận chuyển (GHN)
      doc.font(regularFont).fontSize(9).fillColor('#4b5563');
      doc.text('Phí vận chuyển (GHN):', sumBoxX, curSumY, { width: sumLabelWidth, align: 'left' });
      doc.font(boldFont).fontSize(9.5).fillColor('#111827');
      doc.text(formatCurrency(shippingFee), sumValX, curSumY, { width: sumValWidth, align: 'right' });

      curSumY += 22;

      // Hộp TỔNG THANH TOÁN nổi bật
      doc
        .roundedRect(sumBoxX - 6, curSumY - 4, sumBoxWidth + 6, 32, 4)
        .fill('#111827');

      doc
        .font(boldFont)
        .fontSize(10)
        .fillColor('#ffffff')
        .text('TỔNG THANH TOÁN:', sumBoxX + 4, curSumY + 6, {
          width: sumLabelWidth,
          align: 'left',
        });

      doc
        .font(boldFont)
        .fontSize(12)
        .fillColor('#ffffff')
        .text(formatCurrency(grandTotal), sumValX, curSumY + 5, {
          width: sumValWidth - 6,
          align: 'right',
        });

      // ========================================================
      // 5. FOOTER: LỜI CẢM ƠN & THÔNG TIN HỖ TRỢ
      // ========================================================
      const footerY = 750;

      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .moveTo(margin, footerY)
        .lineTo(rightEdge, footerY)
        .stroke();

      doc
        .font(boldFont)
        .fontSize(9)
        .fillColor('#111827')
        .text('CẢM ƠN BẠN ĐÃ LỰA CHỌN M.B.B.C!', margin, footerY + 10, {
          width: contentWidth,
          align: 'center',
        });

      doc
        .font(regularFont)
        .fontSize(8)
        .fillColor('#6b7280')
        .text(
          'Hotline hỗ trợ: 0901 234 567 • Email: baohainao2016@gmail.com • Website: mbbc.vn',
          margin,
          footerY + 24,
          { width: contentWidth, align: 'center' }
        );

      doc
        .font(regularFont)
        .fontSize(7.5)
        .fillColor('#9ca3af')
        .text(
          'Phiếu xác nhận đơn hàng tự động từ Hệ thống Bán hàng MBBC - Đồ án tốt nghiệp CNTT 2026',
          margin,
          footerY + 38,
          { width: contentWidth, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateOrderPDF };
