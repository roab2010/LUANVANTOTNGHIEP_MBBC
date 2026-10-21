# ========================================================
# PROJECT RULES - HỆ THỐNG QUẢN LÝ BÁN HÀNG VÀ KHO HÀNG
# ========================================================
# File này ghi nhớ TẤT CẢ quy tắc của dự án.
# AI phải đọc file này mỗi khi bắt đầu phiên làm việc mới.
# ========================================================

## 1. THÔNG TIN CHUNG

- **Tên đề tài**: Phân tích, thiết kế và xây dựng hệ thống quản lý bán hàng và kho hàng trên nền tảng Web
- **Loại dự án**: Đồ án luận văn tốt nghiệp ngành CNTT
- **Tên người dùng**: Bảo
- **Ngày bắt đầu**: 22/09/2026

---

## 2. CÔNG NGHỆ (KHÔNG ĐƯỢC THAY ĐỔI)

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | React |
| CSS Framework | Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (Cloud) |
| ODM | Mongoose |
| Authentication | JWT + bcryptjs |
| HTTP Client | Axios |
| Frontend Routing | React Router |
| Chart (sau này) | Recharts |

### Database
- **MongoDB Atlas** (Cloud - dùng chung cho cả nhóm)
- Connection string (chỉ lưu ở `.env` cá nhân): `mongodb+srv://...`
- KHÔNG commit thông tin thật lên Git. Mọi người tự tạo file `.env` từ `.env.example`.

---

## 3. QUY TẮC THIẾT KẾ GIAO DIỆN

### BẮT BUỘC
- Hiện đại, sạch, tối giản, chuyên nghiệp
- Responsive (mobile-first)
- Phù hợp với đồ án đại học
- Micro-animations (hover effects, transitions)
- Shadow, rounded corners

### CẤM
- ❌ **KHÔNG dùng gradient** (Bảo không muốn)
- ❌ KHÔNG dùng màu generic quá đơn giản
- ❌ KHÔNG tạo giao diện quá cầu kỳ

### Màu sắc
- Tông chủ đạo: Xanh dương chuyên nghiệp (indigo/blue)
- Nền sáng, clean
- Không gradient

---

## 4. ROLE HỆ THỐNG (CHỈ 2 ROLE)

### ADMIN
- Quản lý toàn bộ hệ thống
- Dashboard, sản phẩm, danh mục, nhà cung cấp, kho, nhập hàng, đơn hàng, khách hàng, thống kê
- Được tạo bằng seed script

### CUSTOMER
- Đăng ký, đăng nhập, xem/mua sản phẩm, giỏ hàng, đặt hàng
- KHÔNG được truy cập Admin
- Đăng ký public → role luôn = "customer"

### QUAN TRỌNG
- ❌ KHÔNG có role Staff
- ❌ KHÔNG cho user chọn role khi đăng ký
- ❌ KHÔNG cho user gửi role=admin từ API
- ❌ KHÔNG thêm mới khách hàng thủ công ở trang Admin: Khách hàng liên kết trực tiếp bảng User (`role: customer`) và tự động ghi nhận khi người dùng đăng ký tài khoản.
- ❌ KHÔNG tạo đơn hàng thủ công ở trang Admin: Đơn hàng chỉ được sinh ra khi Khách hàng đặt mua sản phẩm (Customer Checkout). Trang Admin chỉ phục vụ xem danh sách, lọc, theo dõi và cập nhật trạng thái đơn hàng.

---

## 5. QUY TẮC CODE

### BẮT BUỘC
- Code dễ hiểu, dễ bảo trì
- Component React rõ ràng
- Phù hợp sinh viên làm luận văn
- Validate input cả frontend và backend
- Hiển thị lỗi bằng **tiếng Việt**
- Password hash bằng bcrypt
- JWT secret trong .env
- MongoDB URI trong .env
- Không trả password về frontend

### CẤM
- ❌ KHÔNG over-engineering
- ❌ KHÔNG abstraction phức tạp
- ❌ KHÔNG cài package không cần thiết
- ❌ KHÔNG commit .env
- ❌ KHÔNG rewrite toàn bộ project
- ❌ KHÔNG đổi framework/database

---

## 6. CẤU TRÚC PROJECT

```
QuanLyBanHangBC/
├── client/                    # Frontend React
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       │   ├── auth/
│       │   ├── admin/
│       │   └── customer/
│       ├── services/
│       └── App.jsx
├── server/                    # Backend Express
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seeds/
│   └── server.js
└── PROJECT_RULES.md           # File này
```

---

## 7. API ENDPOINTS

### Auth (Module 1 - ĐÃ LÀM)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | /api/auth/register | Public | Đăng ký Customer |
| POST | /api/auth/login | Public | Đăng nhập |
| GET | /api/auth/me | Token | Lấy thông tin user |
| POST | /api/auth/logout | Token | Đăng xuất |

### Vận chuyển & Giao Hàng Nhanh (GHN Staging - Module 10)
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | /api/shipping/provinces | Public | Lấy danh sách Tỉnh/Thành từ Master Data GHN |
| GET | /api/shipping/districts?province_id=... | Public | Lấy danh sách Quận/Huyện theo Tỉnh/Thành từ GHN |
| GET | /api/shipping/wards?district_id=... | Public | Lấy danh sách Phường/Xã theo Quận/Huyện từ GHN |
| POST | /api/shipping/calculate-fee | Public | Tính phí vận chuyển thực tế qua cổng GHN Staging |

---

## 8. DATABASE SCHEMAS

### User
```
{
  fullName: String (required),
  email: String (required, unique),
  password: String (required, bcrypt hashed),
  phone: String (optional),
  role: 'admin' | 'customer' (default: 'customer'),
  status: 'active' | 'blocked' | 'deleted' (default: 'active'),
  timestamps: true
}
```

### ActivityLog (Nhật ký hoạt động hệ thống)
```
{
  actorId: ObjectId (ref: 'User', optional - null nếu đăng nhập sai),
  actorName: String (tên người thực hiện),
  actorRole: 'admin' | 'system' (chỉ ghi nhận thao tác của Quản trị viên và Hệ thống, không ghi nhận khách hàng),
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'STOCK_IN' | 'STOCK_OUT' | 'STOCK_ADJUST' | 'BLOCK' | 'UNBLOCK' | 'EXPORT',
  module: 'AUTH' | 'PRODUCT' | 'CATEGORY' | 'SUPPLIER' | 'ORDER' | 'CUSTOMER' | 'INVENTORY' | 'SYSTEM',
  targetType: String ('User', 'Product', 'Category', 'Order', ...),
  targetId: String (ID đối tượng bị tác động),
  targetName: String (Tên/Mã đối tượng),
  description: String (Mô tả hành động tiếng Việt rõ ràng),
  changes: [
    {
      field: String,
      fieldNameVi: String,
      oldValue: Mixed,
      newValue: Mixed
    }
  ],
  status: 'SUCCESS' | 'FAILED' (mặc định: 'SUCCESS'),
  errorMessage: String (optional),
  ipAddress: String (IP thực hiện thao tác),
  userAgent: String (Trình duyệt / Thiết bị),
  metadata: Mixed,
  createdAt: Date (tự động)
}
```

### (Các schema khác sẽ bổ sung khi triển khai)

---

## 9. TÀI KHOẢN TEST

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@quanlybanhang.com | Admin@123 |

---

## 10. CÁCH CHẠY DỰ ÁN

```bash
# Backend (Terminal 1)
cd server
npm install
node seeds/adminSeed.js    # Chạy 1 lần để tạo admin
npm run dev                # Chạy server port 5000

# Frontend (Terminal 2)
cd client
npm install
npm run dev                # Chạy frontend port 5173
```

### Cấu hình .env (server/.env) - KHÔNG COMMIT
- Copy file `.env.example` thành `.env`
- Điền chuỗi kết nối MongoDB Atlas của nhóm vào biến `MONGODB_URI`
- Cấu hình Cloudinary (lưu trữ ảnh)
- Cấu hình GHN Staging (Tính phí vận chuyển thử nghiệm - Sandbox giả lập, không tạo vận đơn thật, không trừ tiền)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/quanlybanhang?retryWrites=true&w=majority
JWT_SECRET=chuoi_bi_mat_bat_ky_tu_chon

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Giao Hàng Nhanh (GHN Staging - Sandbox Thử nghiệm cho Đồ án)
GHN_API_URL=https://dev-online-gateway.ghn.vn/shiip/public-api
GHN_TOKEN=your_ghn_staging_token
GHN_SHOP_ID=232043
GHN_FROM_DISTRICT_ID=1446
GHN_FROM_WARD_CODE=20415
```

---

## 11. QUY TRÌNH LÀM VIỆC NHÓM
1. Clone project từ Github về máy.
2. Cài đặt dependencies: `npm install` ở cả 2 thư mục `server` và `client`.
3. Tạo file `server/.env` từ `server/.env.example`.
4. Lấy chuỗi kết nối MongoDB Atlas từ trưởng nhóm điền vào `.env`.
5. Chạy project. Mọi dữ liệu thao tác sẽ đồng bộ lên database cloud `quanlybanhang`.

---

## 11. FRONTEND ROUTES

### Public
- /login
- /register

### Customer (cần đăng nhập)
- /customer, /cart, /checkout, /orders, /profile

### Admin (cần đăng nhập + role admin)
- /admin, /admin/dashboard, /admin/products, /admin/categories, /admin/suppliers, /admin/orders, /admin/customers, /admin/statistics, /admin/activity-logs

---

## 12. MODULES & TIẾN ĐỘ

| # | Module | Trạng thái |
|---|--------|-----------|
| 1 | Authentication & Authorization | ✅ Hoàn thành |
| 2 | Admin Dashboard | ✅ Hoàn thành |
| 3 | Quản lý sản phẩm & tồn kho | ✅ Hoàn thành (Gộp Module 3 & 6) |
| 4 | Quản lý danh mục | ✅ Hoàn thành |
| 5 | Quản lý nhà cung cấp | ✅ Hoàn thành |
| 6 | Quản lý kho | ✅ Đã gộp vào Module Sản phẩm |
| 7 | Nhập hàng | ✅ Đã tinh gọn & tích hợp trực tiếp vào Module Sản phẩm |
| 8 | Quản lý khách hàng | ✅ Hoàn thành |
| 9 | Giỏ hàng & Danh mục sản phẩm (Storefront) | ✅ Hoàn thành |
| 10 | Đặt hàng / Checkout & Tích hợp GHN Staging | ✅ Hoàn thành |
| 11 | Quản lý đơn hàng | ✅ Hoàn thành |
| 12 | Thống kê doanh thu | ✅ Hoàn thành |
| 13 | Quản lý tài khoản | ⬜ Chưa bắt đầu |
| 14 | Nhật ký hoạt động (Activity Log / Audit Log) | ✅ Hoàn thành |

---

## 13. QUY TẮC LÀM VIỆC VỚI AI

1. **Trước khi code**: Kiểm tra project hiện tại → giải thích → xác định file cần tạo/sửa → rồi mới code
2. **Không tự ý**: Thay đổi công nghệ, kiến trúc, framework, database
3. **Triển khai từng module**: Theo thứ tự, không làm tất cả cùng lúc
4. **Sau khi xong module**: Báo cáo đầy đủ rồi DỪNG LẠI, chờ yêu cầu tiếp
5. **Đọc file PROJECT_RULES.md** này mỗi khi bắt đầu phiên mới

---

## 15. QUY TẮC TRIỂN KHAI CRUD (TEMPLATE PATTERN)

### Nguyên tắc chung
- Sử dụng **module Products (Sản phẩm)** làm **template chuẩn** cho tất cả module CRUD.
- Hoàn thiện Products trước theo cấu trúc thống nhất, đảm bảo chạy ổn định.
- Sau khi Products hoàn chỉnh → giữ nguyên cấu trúc, cách đặt tên, cách xử lý API, validation và UI pattern để nhân ra các module tương tự.

### Thứ tự triển khai mỗi module CRUD
1. **Model/Schema** (server/models/)
2. **Controller/Service** (server/controllers/)
3. **Route/API** (server/routes/)
4. **React Page** (client/src/pages/admin/)
5. **Form** (component tạo/sửa)
6. **Table/List** (component danh sách)
7. **Validation** (cả frontend và backend)
8. **Error handling** (thông báo lỗi tiếng Việt)

### Quy tắc bắt buộc
- ❌ **KHÔNG** tự tạo kiến trúc khác cho từng module
- ❌ **KHÔNG** thay đổi cách đặt tên file, cách gọi API, cấu trúc response
- ✅ Các module có nghiệp vụ khác nhau → chỉ thay đổi phần **business logic** cần thiết
- ✅ Ưu tiên code **dễ hiểu, đồng nhất**, phù hợp đồ án sinh viên
- ✅ Trước khi code module mới → kiểm tra project hiện tại, **tránh viết lại phần đang hoạt động**
- ✅ Auth module đã hoàn thành → **KHÔNG sửa auth**, chỉ áp dụng template pattern cho CRUD

### Các module sẽ dùng template Products
- Categories (Danh mục)
- Suppliers (Nhà cung cấp)
- Promotions (Khuyến mãi)
- Và các module CRUD tương tự khác

---

## 16. LỊCH SỬ THAY ĐỔI

| Ngày | Thay đổi |
|------|----------|
| 22/09/2026 | Tạo project, bắt đầu Module 1: Authentication |
| 05/10/2026 | Thêm quy tắc triển khai CRUD theo template pattern (Products làm mẫu) |
| 05/10/2026 | Hoàn thiện Auth UI/UX, Admin Dashboard và module Products (CRUD Template) |
| 12/10/2026 | Hoàn thành Module 4: Quản lý danh mục (Category model, controller, routes, CategoriesPage, CategoryFormModal, categoryApi) |
| 13/10/2026 | Hoàn thành Module 8: Quản lý khách hàng (Customer model, controller, routes, CustomersPage, CustomerFormModal, customerApi) |
| 13/10/2026 | Hoàn thành cùng lúc 3 module theo yêu cầu: Module 6 - Quản lý kho (WarehousePage, StockAdjustModal), Module 11 - Quản lý đơn hàng (Order model, controller, routes, OrdersPage, OrderDetailModal, CreateOrderModal), Module 12 - Thống kê doanh thu (statisticController, routes, StatisticsPage) |
| 13/10/2026 | Cập nhật Module 8: Quản lý khách hàng đồng bộ trực tiếp từ bảng User (role customer), bỏ tạo thủ công, hỗ trợ khóa/mở khóa tài khoản |
| 13/10/2026 | Cập nhật Auth & Middleware: Khóa tài khoản báo liên hệ email admin@quanlybanhang.com khi đăng nhập; Xóa tài khoản báo không tồn tại trong hệ thống |
| 13/10/2026 | Dọn dẹp collection thừa customers trên Atlas, xóa file Customer.js; Chuyển chức năng xóa khách hàng sang Xóa mềm (status = deleted) bảo toàn dữ liệu lịch sử |
| 13/10/2026 | Cập nhật Module 11 (Quản lý đơn hàng): Bỏ tính năng tạo đơn hàng thủ công trên Admin (loại bỏ CreateOrderModal), đơn hàng sẽ tự động ghi nhận khi khách hàng đặt mua |
| 13/10/2026 | Cập nhật Module 3 (Sản phẩm): Liên kết chọn danh mục từ Module 4 (Category) qua dropdown select thay vì nhập tay |
| 13/10/2026 | Cập nhật Module 6 (Kho hàng): Tinh gọn modal kho chỉ còn nghiệp vụ "Nhập thêm hàng", loại bỏ chức năng xuất bớt và đặt lại số tồn |
| 13/10/2026 | Cập nhật Module 4 (Danh mục): Bổ sung thống kê và hiển thị số lượng sản phẩm (productCount) trong từng danh mục trên bảng Admin |
| 13/10/2026 | Hoàn thành Module 5: Quản lý nhà cung cấp (Supplier model, controller, routes, SuppliersPage, SupplierFormModal, supplierApi) |
| 13/10/2026 | Cập nhật Module 5 (Nhà cung cấp): Bổ sung kiểm tra không trùng số điện thoại và tên nhà cung cấp (cả thêm mới và cập nhật) |
| 13/10/2026 | Hoàn thành Module 7: Nhập hàng (ImportReceipt model, controller, routes, importReceiptApi, ImportReceiptsPage, CreateImportReceiptModal, ImportReceiptDetailModal) tự động cập nhật tồn kho Module 6; Bổ sung SupplierHistoryModal liên kết Nhà cung cấp - Phiếu nhập - Sản phẩm theo đúng chuẩn ERD |
| 18/10/2026 | Hợp nhất Module 3 (Sản phẩm) và Module 6 (Kho hàng) thành một trang duy nhất "Quản lý sản phẩm": Bổ sung 4 thẻ KPI tồn kho, bộ lọc tình trạng tồn kho, hiển thị vốn tồn từng sản phẩm; Giữ nút "Thêm sản phẩm" ở góc trên; Tích hợp tạo phiếu nhập kho với chọn Nhà cung cấp và đơn giá nhập tại nút "Nhập thêm"; Bỏ ô nhập số lượng tồn kho khi sửa sản phẩm; Bổ sung chọn và sửa lại Nhà cung cấp đối tác (supplier) trong form Thêm/Sửa sản phẩm, hiển thị tag Nhà cung cấp trên bảng danh sách sản phẩm |
| 18/10/2026 | Tái cấu trúc trang Admin Dashboard: Loại bỏ hoàn toàn mock data, tích hợp 100% dữ liệu thực tế từ Database (thẻ thống kê doanh thu, đơn hàng chờ, vốn tồn kho, biểu đồ 7 ngày chuyển đổi Doanh thu/Số đơn, cảnh báo sản phẩm sắp hết hàng từ kho thực tế, bảng 5 đơn hàng gần đây và lối tắt 7 phân hệ quản trị) |
| 18/10/2026 | Cập nhật Module 4 (Danh mục): Chuyển đổi chức năng "Xóa" thành "Khóa / Mở khóa" danh mục (backend soft lock bảo toàn dữ liệu); Khắc phục icon ổ khóa trực quan: Danh mục Đã khóa hiển thị icon Ổ khóa ĐÓNG màu đỏ, danh mục Đang hoạt động hiển thị icon Ổ khóa MỞ; Gỡ bỏ mục "Nhập hàng" khỏi Sidebar menu và Dashboard (do đã hợp nhất nhập hàng vào từng sản phẩm) |
| 19/10/2026 | Cập nhật Module 3 (Sản phẩm) & Kho: Giới hạn giá nhập tối đa 10,000,000 ₫ (thay vì 1 tỷ); Chặn nhập trực tiếp theo thời gian thực (real-time input blocking) cho giá nhập (> 10 triệu) và % lợi nhuận (> 1.000%); Giới hạn số lượng tồn kho/nhập thêm tối đa 10,000 sản phẩm; Chuẩn hóa đơn vị tính (tối đa 15 ký tự, bổ sung chip gợi ý chọn nhanh: cái, chiếc, bộ, đôi, hộp, gói); Thêm noValidate và thông báo lỗi tiếng Việt nội dòng (inline validation) loại bỏ popup tiếng Anh của trình duyệt |
| 19/10/2026 | Tinh gọn chức năng kho cho dự án MBBC: Chuyển toàn bộ quy trình nhập kho & xuất kho trực tiếp vào từng sản phẩm tại trang Quản lý sản phẩm; Thêm nút và modal Xem chi tiết (ProductDetailModal) kèm bảng lịch sử giao dịch kho thực tế của riêng sản phẩm đó; Tinh gọn nút Nhập kho (StockAdjustModal) tăng tồn và ghi nhận lịch sử; Thêm nút và modal Xuất kho (StockExportModal) giảm tồn với 4 lý do (hàng lỗi/hư hỏng, sử dụng nội bộ, điều chỉnh tồn kho, khác) và chặn xuất vượt tồn; Tạo model StockHistory hợp nhất; Ẩn giá vốn nội bộ costPrice đối với tài khoản Customer |
| 19/10/2026 | Dọn dẹp triệt để hệ thống phiếu nhập cũ: Xóa toàn bộ dữ liệu 3 phiếu nhập cũ trong collection importreceipts trên Atlas, trừ lại số lượng tồn kho đã nhập thử (LOGO MOB CAP trừ 5 cái từ 10 xuống 5; ADDICT FLARED WASHED PANTS trừ 15 cái từ 25 xuống 10); Gỡ bỏ hoàn toàn nút xem lịch sử phiếu nhập (icon đồng hồ), modal lịch sử cung cấp (SupplierHistoryModal) và modal tạo phiếu nhập (CreateImportReceiptModal) khỏi trang Quản lý nhà cung cấp (SuppliersPage); Xóa bỏ toàn bộ controller, routes, API và model ImportReceipt.js không còn sử dụng |
| 19/10/2026 | Cập nhật Module 5 (Nhà cung cấp): Giới hạn ký tự và chặn nhập trực tiếp theo thời gian thực (real-time blocking) cho form Thêm & Sửa nhà cung cấp: Tên nhà cung cấp tối đa 100 ký tự; Số điện thoại tối đa 11 số (chỉ cho phép nhập số); Địa chỉ tối đa 200 ký tự; Ghi chú tối đa 300 ký tự; Bổ sung bộ đếm ký tự hiển thị trực quan và validate chặt chẽ cả frontend và backend |
| 21/10/2026 | Xây dựng Trang Chi tiết sản phẩm dành cho khách hàng (Customer Product Detail Page - ProductDetailPage.jsx): Layout chuẩn streetwear MBBC, bộ sưu tập ảnh thumbnail đổi ảnh mượt mà, chọn biến thể size/màu sắc trực quan kèm chấm màu trạng thái tồn kho, thanh sticky bar thêm vào giỏ hàng dưới đáy màn hình tự động hiển thị/ẩn theo cuộn trang, danh sách sản phẩm cùng danh mục và sản phẩm đã xem gần đây (lưu trữ localStorage) |
| 21/10/2026 | Xây dựng Trang Danh mục sản phẩm (CategoryPage.jsx): Breadcrumb điều hướng, tiêu đề danh mục lớn, toolbar bộ lọc drawer, lưới sản phẩm 3:4 chuẩn thời trang; Tích hợp 9 tiêu chí sắp xếp thực tế từ MongoDB (giá tăng/giảm, tên A-Z/Z-A, mới/cũ nhất, tồn kho giảm dần, sản phẩm nổi bật isFeatured, bán chạy nhất best_seller tổng hợp từ Order aggregation); Tự động đổi bảng màu/size và khoảng giá theo danh mục trong Drawer thời gian thực (0ms cache); Đồng bộ URL search params và phân trang "Xem thêm" |
| 21/10/2026 | Nâng cấp StoreHeader.jsx: Dropdown menu SHOP hỗ trợ cả hover & click (TOPS, OUTWEAR, BOTTOMS, ACCESSORIES, NEW ARRIVALS); Menu hamburger mở slide drawer trên điện thoại di động hỗ trợ cảm ứng 100%; Nhận diện scroll tự động chuyển nền trắng khi cuộn qua hero banner |
| 21/10/2026 | Tích hợp tính phí vận chuyển tự động Giao Hàng Nhanh (GHN Staging API - Module 10): Tạo ghnService.js kết nối Master Data GHN (Tỉnh/Thành, Quận/Huyện, Phường/Xã) và endpoint tính phí chính thức POST /v2/shipping-order/fee; Xác nhận môi trường Staging/Sandbox hoàn toàn giả lập, an toàn tuyệt đối cho đồ án (chỉ gọi tính cước tham khảo, không tạo vận đơn thực tế, không trừ tiền tài khoản); Cấu hình kho xuất phát giả lập Quận 4, TP.HCM (from_district_id: 1446, from_ward_code: '20415'); Cấu hình gói hàng demo 250g/sản phẩm; Nâng cấp modal Checkout với 3 dropdown Tỉnh -> Huyện -> Xã chuẩn mã GHN; Tự động tính phí ship theo thời gian thực; Xác thực phí ship độc lập tại Backend khi tạo đơn hàng (createOrder); Bổ sung shippingFee và lưu địa chỉ cấu trúc trong Order.js; Cập nhật .env.example và bảo mật an toàn qua .gitignore |
| 21/10/2026 | Nâng cấp Checkout & Đơn hàng của tôi (StoreModals.jsx & MyOrdersModal.jsx): Tự động lưu và điền sẵn địa chỉ nhận hàng từ lần đặt trước (Họ tên, SĐT, Tỉnh, Huyện, Xã, Số nhà và tự tính phí GHN ngay khi mở modal); Thay thế dropdown Tỉnh/Huyện/Xã thành SearchableSelect có ô tìm kiếm gợi ý thời gian thực (hỗ trợ gõ không dấu/có dấu); Hiển thị hình ảnh thumbnail sản phẩm và chip màu sắc kèm chấm màu (color dot) trực quan trong cả modal Checkout và modal Đơn hàng của tôi; Bổ sung trường image cho items trong Order model và cơ chế tự động retry khi GHN Staging bị gián đoạn mạng tạm thời |
| 21/10/2026 | Sửa lỗi nút "Đơn hàng của tôi" (CustomerHome.jsx & MyOrdersModal.jsx): Khắc phục lỗi thiếu `setIsMyOrdersOpen` trong hook `useCart` tại trang chủ khiến nút không mở được modal; Nâng `z-index` của MyOrdersModal lên `z-[70]` đảm bảo hiển thị nổi trên Header; Bổ sung mục "Đơn hàng của tôi" vào Mobile menu trên trang chủ |
| 21/10/2026 | Nâng cấp trang Quản lý đơn hàng Admin (OrdersPage.jsx & OrderDetailModal.jsx): Bổ sung hình ảnh thumbnail sản phẩm và chip màu sắc kèm chấm màu (color dot) trực quan trong cả bảng danh sách đơn hàng và modal Chi tiết đơn hàng; Mở rộng kích thước modal (max-w-3xl) thoáng đẹp; Bổ sung dòng phân tách chi tiết cước phí vận chuyển GHN và tiền hàng trong bảng chi tiết |
| 21/10/2026 | Triển khai Hệ thống Nhật ký hoạt động toàn diện (Activity Log / Audit Log - Module 14): Xây dựng model ActivityLog với đầy đủ indexes tối ưu tìm kiếm; Tạo activityLogService an toàn (fail-safe không chặn luồng chính, tự so sánh diffObjects trước/sau, tự sanitizeData loại bỏ mật khẩu/token, trích xuất IP và UserAgent); Tích hợp ghi log tự động trên toàn bộ hệ thống (Đăng nhập/Đăng xuất/Đăng ký/Khóa tài khoản, CRUD Sản phẩm kèm diff giá & tồn kho, Danh mục, Nhà cung cấp, Xuất nhập tồn kho, Đổi trạng thái đơn hàng); Bảo vệ endpoint API bằng authenticateToken và requireAdmin (401/403); Xây dựng giao diện Quản trị ActivityLogsPage.jsx với 3 thẻ KPI, bộ lọc đa năng (tìm kiếm, module, hành động, trạng thái, khoảng ngày), phân trang và modal ActivityLogDetailModal.jsx soi chi tiết biến động dữ liệu trực quan |
