# CẨM NANG BẢO VỆ ĐỒ ÁN TỐT NGHIỆP: DỰ ÁN M.B.B.C CLOTHING STORE
> **Đề tài:** Phân tích, thiết kế và xây dựng hệ thống quản lý bán hàng và kho hàng trên nền tảng Web  
> **Sinh viên thực hiện:** Bảo  
> **Thương hiệu dự án:** M.B.B.C - Made By Bảo Cường  
> **Phiên bản:** Hoàn thiện bảo vệ tốt nghiệp 2026  

---

## MỤC LỤC
1. [TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ HỆ THỐNG](#1-tổng-quan-kiến-trúc--công-nghệ-hệ-thống)
2. [BẢN ĐỒ CHỨC NĂNG THỰC TẾ (FRONTEND ↔ BACKEND ↔ DATABASE)](#2-bản-đồ-chức-năng-thực-tế-frontend--backend--database)
   - [2.1. Đăng ký tài khoản (Register)](#21-đăng-ký-tài-khoản-register)
   - [2.2. Xác minh Email OTP & Gửi lại mã OTP](#22-xác-minh-email-otp--gửi-lại-mã-otp)
   - [2.3. Đăng nhập (Login) & Phân quyền](#23-đăng-nhập-login--phân-quyền)
   - [2.4. Đăng xuất (Logout)](#24-đăng-xuất-logout)
   - [2.5. Quản lý người dùng & Khách hàng](#25-quản-lý-người-dùng--khách-hàng)
   - [2.6. Quản lý danh mục (Category)](#26-quản-lý-danh-mục-category)
   - [2.7. Quản lý sản phẩm & Biến thể Size / Màu](#27-quản-lý-sản-phẩm--biến-thể-size--màu)
   - [2.8. Tìm kiếm, lọc nâng cao & Sắp xếp](#28-tìm-kiếm-lọc-nâng-cao--sắp-xếp)
   - [2.9. Quản lý kho hàng & Lịch sử xuất/nhập tồn](#29-quản-lý-kho-hàng--lịch-sử-xuấtnhập-tồn)
   - [2.10. Quản lý nhà cung cấp (Supplier)](#210-quản-lý-nhà-cung-cấp-supplier)
   - [2.11. Giỏ hàng (Cart Context & LocalStorage)](#211-giỏ-hàng-cart-context--localstorage)
   - [2.12. Đặt hàng (Checkout) & Tích hợp cước GHN Staging](#212-đặt-hàng-checkout--tích-hợp-cước-ghn-staging)
   - [2.13. Quản lý đơn hàng (Order Management)](#213-quản-lý-đơn-hàng-order-management)
   - [2.14. Tự động xuất PDF & Gửi email xác nhận đơn hàng](#214-tự-động-xuất-pdf--gửi-email-xác-nhận-đơn-hàng)
   - [2.15. Đánh giá sản phẩm & Kiểm duyệt đánh giá (Reviews)](#215-đánh-giá-sản-phẩm--kiểm-duyệt-đánh-giá-reviews)
   - [2.16. Dashboard & Thống kê doanh thu (Statistics)](#216-dashboard--thống-kê-doanh-thu-statistics)
   - [2.17. Nhật ký hoạt động hệ thống (Activity Log / Audit Log)](#217-nhật-ký-hoạt-động-hệ-thống-activity-log--audit-log)
3. [GIẢI THÍCH BẢN CHẤT CODE CỐT LÕI (DÀNH CHO SINH VIÊN TRÌNH BÀY)](#3-giải-thích-bản-chất-code-cốt-lõi-dành-cho-sinh-viên-trình-bày)
   - [3.1. Luồng Request / Response giữa React và Express](#31-luồng-request--response-giữa-react-và-express)
   - [3.2. Asynchronous JavaScript: Async / Await & Try / Catch](#32-asynchronous-javascript-async--await--try--catch)
   - [3.3. Cơ chế Middleware trong Express](#33-cơ-chế-middleware-trong-express)
   - [3.4. Cơ chế băm mật khẩu Bcrypt (Salt & Hash)](#34-cơ-chế-băm-mật-khẩu-bcrypt-salt--hash)
   - [3.5. Cơ chế xác thực Token JWT (JSON Web Token)](#35-cơ-chế-xác-thực-token-jwt-json-web-token)
   - [3.6. ODM Mongoose: Schema, Model, Hook Pre-save & Compound Index](#36-odm-mongoose-schema-model-hook-pre-save--compound-index)
   - [3.7. Kỹ thuật Xóa mềm (Soft Delete)](#37-kỹ-thuật-xóa-mềm-soft-delete)
   - [3.8. Xử lý tải ảnh Cloudinary qua Multer](#38-xử-lý-tải-ảnh-cloudinary-qua-multer)
4. [KỊCH BẢN "GIẢNG VIÊN YÊU CẦU SỬA TRỰC TIẾP THÌ MỞ FILE NÀO?"](#4-kịch-bản-giảng-viên-yêu-cầu-sửa-trực-tiếp-thì-mở-file-nào)
5. [BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN THƯỜNG GẶP & CÂU TRẢ LỜI MẪU](#5-bộ-câu-hỏi-bảo-vệ-đồ-án-thường-gặp--câu-trả-lời-mẫu)

---

## 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ HỆ THỐNG

Dự án áp dụng mô hình **Single Page Application (SPA)** kết hợp kiến trúc **RESTful API**, chia tách hoàn toàn giữa Client và Server:

| Thành phần | Công nghệ sử dụng | Vai trò & Mục đích trong dự án |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18** (Vite build) | Xây dựng giao diện đơn trang mượt mà, phân tách component độc lập |
| **Routing Client** | **React Router DOM v6** | Quản lý điều hướng URL không reload trang, bảo vệ route bằng ProtectedRoute |
| **Styling** | **Tailwind CSS** | Styling tiện ích, thiết kế responsive (mobile/desktop), không dùng gradient theo quy tắc |
| **State Management** | **React Context API** | `AuthContext` (phiên đăng nhập) và `CartContext` (giỏ hàng toàn cục lưu LocalStorage) |
| **HTTP Client** | **Axios** | Giao tiếp API qua `client/src/services/api.js`, gắn token tự động bằng Interceptor |
| **Backend Runtime**| **Node.js + Express.js** | Xử lý nghiệp vụ server, định tuyến Endpoint, xử lý middleware bảo mật |
| **Database** | **MongoDB Atlas (Cloud)** | Hệ quản trị CSDL NoSQL lưu trữ dưới dạng JSON/BSON linh hoạt |
| **ODM** | **Mongoose** | Định nghĩa Schema, quan hệ tham chiếu `ref`, pre-save hook, text indexes |
| **Bảo mật mật khẩu**| **bcryptjs** | Sinh muối ngẫu nhiên (salt 10 vòng) và mã hóa một chiều trước khi lưu DB |
| **Xác thực phiên** | **JSON Web Token (JWT)**| Cấp chữ ký số stateless (thời hạn 7 ngày), giải mã ở middleware |
| **Email Service** | **Nodemailer (Gmail SMTP)**| Gửi mã OTP xác minh đăng ký và hóa đơn PDF qua STARTTLS port 587 |
| **Tạo PDF Hóa đơn**| **PDFKit** | Render tài liệu PDF vector chuẩn A4 tiếng Việt Unicode, nhúng logo thương hiệu |
| **Giao hàng nhanh**| **GHN Open API (Staging)** | Kết nối Master Data Tỉnh/Huyện/Xã và tính phí ship tự động thời gian thực |
| **Lưu trữ ảnh** | **Cloudinary + Multer** | Upload ảnh sản phẩm & review trực tiếp từ RAM buffer lên CDN đám mây |

---

## 2. BẢN ĐỒ CHỨC NĂNG THỰC TẾ (FRONTEND ↔ BACKEND ↔ DATABASE)

### 2.1. Đăng ký tài khoản (Register)
* **Mô tả nghiệp vụ:** Khách hàng điền thông tin (Họ tên, Email, Mật khẩu, SĐT). Backend kiểm tra hợp lệ, bắt buộc domain uy tín, mật khẩu tự động băm bcrypt, role luôn gán cứng là `customer`. Tài khoản được tạo ở trạng thái chưa xác minh (`isEmailVerified: false`), tự động sinh mã OTP 6 số lưu DB (hết hạn sau 5 phút) và gửi email kích hoạt.
* **Frontend:**
  * File Page: `client/src/pages/auth/RegisterPage.jsx` (Dòng 20: `handleRegisterSubmit`)
  * File Component Form: `client/src/components/auth/RegisterValidationForm.jsx` (validate realtime từng ô)
  * File Context: `client/src/context/AuthContext.jsx` (Dòng 46: `register`)
  * Gọi API: `POST http://localhost:5000/api/auth/register`
* **Backend:**
  * Route: `server/routes/authRoutes.js` (Dòng 7: `router.post('/register', register)`)
  * Controller: `server/controllers/authController.js` (Dòng 16: `const register = async (req, res) => ...`)
* **Dữ liệu lưu tại:** Collection `users` trong MongoDB qua Model `server/models/User.js`.
* **Từ khóa Ctrl+F nhanh:**
  * Frontend: `handleRegisterSubmit` trong `RegisterPage.jsx`
  * Backend: `const register = async` hoặc `existingUser.isEmailVerified` trong `authController.js`

---

### 2.2. Xác minh Email OTP & Gửi lại mã OTP
* **Mô tả nghiệp vụ:** Sau khi đăng ký hoặc khi tài khoản chưa xác minh cố đăng nhập, modal 6 ô OTP bật lên. Khách nhập đúng 6 số, hệ thống kiểm tra thời hạn và so khớp mã trong DB. Khi thành công, set `isEmailVerified: true` và xóa mã OTP tạm. Cho phép gửi lại mã OTP (chống spam rate limit 60 giây).
* **Frontend:**
  * File Component: `client/src/components/auth/OtpVerificationModal.jsx` (Dòng 88: `handleVerifySubmit`, Dòng 115: `handleResendOtp`)
  * Gọi API: 
    * Xác minh: `POST /api/auth/verify-otp` với body `{ email, otp }`
    * Gửi lại: `POST /api/auth/resend-otp` với body `{ email }`
* **Backend:**
  * Route: `server/routes/authRoutes.js` (Dòng 9, 10)
  * Controller: `server/controllers/authController.js`:
    * Xác minh: Dòng 160 (`const verifyOtp = async (req, res) => ...`)
    * Gửi lại: Dòng 224 (`const resendOtp = async (req, res) => ...`)
  * Gửi mail: `server/services/emailService.js` (Hàm `sendOtpEmail`)
* **Dữ liệu tác động:** Các trường `isEmailVerified`, `emailOtp`, `emailOtpExpires` trong Model `User`.
* **Từ khóa Ctrl+F nhanh:**
  * Frontend: `handleVerifySubmit` trong `OtpVerificationModal.jsx`
  * Backend: `const verifyOtp` hoặc `const resendOtp` trong `authController.js`

---

### 2.3. Đăng nhập (Login) & Phân quyền
* **Mô tả nghiệp vụ:** Người dùng nhập Email + Password. Backend tìm user, kiểm tra tài khoản có bị khóa (`blocked`) hoặc xóa mềm (`deleted`) hay không. Dùng `bcrypt.compare` kiểm tra mật khẩu. Nếu là `customer` chưa kích hoạt email thì chặn lại và phát OTP yêu cầu xác minh. Nếu hợp lệ, sinh JWT Token chứa `{ userId, role }` có hạn 7 ngày. Phía Frontend lưu token vào `localStorage`, phân luồng chuyển trang: `admin` chuyển về `/admin`, `customer` chuyển về `/customer` hoặc `/`.
* **Frontend:**
  * File Page: `client/src/pages/auth/LoginPage.jsx` (Dòng 67: `handleSubmit`)
  * Context xử lý: `client/src/context/AuthContext.jsx` (Dòng 52: `login`)
  * Bảo vệ route: `client/src/components/ProtectedRoute.jsx` (kiểm tra token và role)
  * Gọi API: `POST /api/auth/login`
* **Backend:**
  * Route: `server/routes/authRoutes.js` (Dòng 8: `router.post('/login', login)`)
  * Controller: `server/controllers/authController.js` (Dòng 293: `const login = async (req, res) => ...`)
  * Middleware xác thực: `server/middleware/authMiddleware.js` (`authenticateToken`)
  * Middleware phân quyền: `server/middleware/roleMiddleware.js` (`requireAdmin`)
* **Từ khóa Ctrl+F nhanh:**
  * Frontend: `handleSubmit` hoặc `requireOtp` trong `LoginPage.jsx`
  * Backend: `jwt.sign` hoặc `comparePassword` trong `authController.js`

---

### 2.4. Đăng xuất (Logout)
* **Mô tả nghiệp vụ:** Xóa `token` khỏi `localStorage` phía trình duyệt và đưa state `user` về `null`. Đồng thời gửi request tới backend để ghi nhận nhật ký hoạt động (`ActivityLog`) nếu là tài khoản Quản trị viên.
* **Frontend:**
  * Header Customer: `client/src/components/common/StoreHeader.jsx`
  * Header Admin: `client/src/layouts/AdminLayout.jsx` (Dòng gọi `logout()`)
  * Context: `client/src/context/AuthContext.jsx` (Dòng 64: `logout`)
* **Backend:**
  * Route: `server/routes/authRoutes.js` (Dòng 14)
  * Controller: `server/controllers/authController.js` (Dòng 459: `const logout = async (req, res) => ...`)
* **Từ khóa Ctrl+F nhanh:**
  * Frontend: `const logout = () =>` trong `AuthContext.jsx`
  * Backend: `const logout = async` trong `authController.js`

---

### 2.5. Quản lý người dùng & Khách hàng
* **Mô tả nghiệp vụ:** Chỉ Admin mới có quyền truy cập. Hiển thị danh sách toàn bộ khách hàng đăng ký (`role: customer`). Hỗ trợ tìm kiếm theo tên, email, SĐT; lọc trạng thái (`active`, `blocked`). Cung cấp tính năng Khóa / Mở khóa tài khoản ngay lập tức và Xóa mềm (`status: 'deleted'`) để không làm mất dữ liệu lịch sử đơn hàng.
* **Frontend:**
  * File Page: `client/src/pages/admin/customers/CustomersPage.jsx`
  * File Modal: `client/src/pages/admin/customers/CustomerFormModal.jsx`
  * File Service API: `client/src/services/customerApi.js` (`getCustomers`, `updateCustomer`, `deleteCustomer`)
* **Backend:**
  * Route: `server/routes/customerRoutes.js`
  * Controller: `server/controllers/customerController.js` (`getCustomers`, `getCustomerById`, `updateCustomer`, `deleteCustomer`)
* **Dữ liệu lưu tại:** Collection `users` trong MongoDB.
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `role: 'customer'` hoặc `status: 'deleted'` trong `customerController.js`

---

### 2.6. Quản lý danh mục (Category)
* **Mô tả nghiệp vụ:** Quản lý cây danh mục sản phẩm (Áo, Quần, Phụ kiện, v.v.). Hỗ trợ CRUD: Thêm mới, Sửa tên/mô tả, đếm số lượng sản phẩm liên kết (`productCount`). Đặc biệt áp dụng cơ chế Khóa / Mở khóa danh mục (`isActive: true/false`) thay vì xóa cứng, giúp bảo toàn tính toàn vẹn dữ liệu cho các sản phẩm đang gắn danh mục này.
* **Frontend:**
  * File Page: `client/src/pages/admin/categories/CategoriesPage.jsx`
  * File Modal: `client/src/pages/admin/categories/CategoryFormModal.jsx`
  * File Service API: `client/src/services/categoryApi.js`
* **Backend:**
  * Route: `server/routes/categoryRoutes.js`
  * Controller: `server/controllers/categoryController.js` (`getCategories`, `createCategory`, `updateCategory`, `toggleCategoryStatus`)
* **Dữ liệu lưu tại:** Collection `categories` qua Model `server/models/Category.js`.
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `toggleCategoryStatus` hoặc `productCount` trong `categoryController.js`

---

### 2.7. Quản lý sản phẩm & Biến thể Size / Màu
* **Mô tả nghiệp vụ:** Quản trị toàn diện danh mục hàng thời trang MBBC. Hỗ trợ cấu hình đa biến thể (Size: S, M, L, XL; Màu sắc kèm mã màu HEX trực quan). Mỗi biến thể có số tồn kho riêng biệt. Tổng tồn kho của sản phẩm (`stock`) được tính tự động từ tổng các biến thể qua hook `pre('save')`. Tải ảnh sản phẩm trực tiếp lên dịch vụ Cloudinary. Quản lý giá bán, giá nhập (`costPrice` - chỉ admin thấy), liên kết Danh mục và Nhà cung cấp đối tác.
* **Frontend:**
  * File Page Admin: `client/src/pages/admin/products/ProductsPage.jsx`
  * File Form Modal: `client/src/pages/admin/products/ProductFormModal.jsx`
  * File Detail Modal: `client/src/pages/admin/products/ProductDetailModal.jsx`
  * File Service API: `client/src/services/productApi.js`
* **Backend:**
  * Route: `server/routes/productRoutes.js` (kèm middleware upload ảnh Multer)
  * Controller: `server/controllers/productController.js` (`getProducts`, `createProduct`, `updateProduct`, `deleteProduct`)
  * Cấu hình Cloudinary: `server/config/cloudinary.js`
* **Dữ liệu lưu tại:** Collection `products` qua Model `server/models/Product.js`.
* **Từ khóa Ctrl+F nhanh:**
  * Model: `variantSchema` hoặc `this.variants.reduce` trong `Product.js`
  * Backend: `uploadToCloudinary` hoặc `createProduct` trong `productController.js`

---

### 2.8. Tìm kiếm, lọc nâng cao & Sắp xếp
* **Mô tả nghiệp vụ:** Khách hàng tại trang chủ (`/`) hoặc trang danh mục (`/category/:category`) có thể:
  1. Tìm kiếm sản phẩm theo tên thời gian thực (Regex không phân biệt hoa thường).
  2. Lọc theo danh mục, khoảng giá (min - max), danh sách màu sắc, danh sách kích cỡ (Size), trạng thái còn hàng.
  3. Sắp xếp đa tiêu chí: Mới nhất, Cũ nhất, Giá tăng dần, Giá giảm dần, Tên A-Z, Tên Z-A, Bán chạy nhất (tổng hợp từ aggregation Order), Nổi bật (`isFeatured`), Đánh giá cao nhất (`ratingAverage`).
* **Frontend:**
  * File Page: `client/src/pages/customer/CategoryPage.jsx` và `CustomerHome.jsx`
  * Component Drawer lọc: `CategoryPage.jsx` (bộ lọc Drawer di động chuẩn responsive)
* **Backend:**
  * Controller: `server/controllers/productController.js` (Hàm `getProducts` xử lý toàn bộ query parameters và aggregation sắp xếp bán chạy).
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `const getProducts = async` hoặc `best_seller` trong `productController.js`

---

### 2.9. Quản lý kho hàng & Lịch sử xuất/nhập tồn
* **Mô tả nghiệp vụ:** Tích hợp trực tiếp vào trang Quản lý sản phẩm. Admin có thể:
  * **Nhập thêm hàng (Stock In):** Chọn sản phẩm, chọn biến thể, chọn nhà cung cấp, nhập số lượng và đơn giá nhập -> Hệ thống tự động cộng tồn kho và ghi nhận lịch sử vào `StockHistory`.
  * **Xuất kho nội bộ (Stock Out):** Giảm số lượng với các lý do: Hàng lỗi/hư hỏng, sử dụng nội bộ, điều chỉnh kiểm kê, khác. Chặn xuất vượt tồn hiện có.
  * **Lịch sử kho:** Xem bảng lịch sử biến động kho chi tiết của từng sản phẩm.
* **Frontend:**
  * Modal Nhập: `client/src/pages/admin/warehouse/StockAdjustModal.jsx`
  * Modal Xuất: `client/src/pages/admin/products/StockExportModal.jsx`
  * Modal Xem chi tiết: `client/src/pages/admin/products/ProductDetailModal.jsx`
  * File Service API: `client/src/services/warehouseApi.js`
* **Backend:**
  * Route: `server/routes/warehouseRoutes.js`
  * Controller: `server/controllers/warehouseController.js` (`importStock`, `exportStock`, `getStockHistoryByProduct`)
* **Dữ liệu lưu tại:** Collection `stockhistories` qua Model `server/models/StockHistory.js`.
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `const importStock = async` hoặc `const exportStock = async` trong `warehouseController.js`

---

### 2.10. Quản lý nhà cung cấp (Supplier)
* **Mô tả nghiệp vụ:** Quản lý đối tác cung cấp nguyên liệu/hàng may mặc cho MBBC. Kiểm tra tính duy nhất không trùng tên và số điện thoại, giới hạn độ dài ký tự form, ghi log hoạt động khi thêm/sửa/xóa.
* **Frontend:**
  * File Page: `client/src/pages/admin/suppliers/SuppliersPage.jsx`
  * File Modal: `client/src/pages/admin/suppliers/SupplierFormModal.jsx`
  * File Service API: `client/src/services/supplierApi.js`
* **Backend:**
  * Route: `server/routes/supplierRoutes.js`
  * Controller: `server/controllers/supplierController.js` (`getSuppliers`, `createSupplier`, `updateSupplier`, `deleteSupplier`)
* **Dữ liệu lưu tại:** Collection `suppliers` qua Model `server/models/Supplier.js`.
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `const createSupplier` trong `supplierController.js`

---

### 2.11. Giỏ hàng (Cart Context & LocalStorage)
* **Mô tả nghiệp vụ:** Hoạt động độc lập bằng React Context (`CartContext`), lưu trữ tức thì vào `localStorage` với key `mbbc_cart_v1` để khách không bị mất giỏ hàng khi reload trình duyệt. Hỗ trợ thêm sản phẩm kèm size/màu đã chọn, tăng giảm số lượng, xóa sản phẩm, tính tổng tiền và số lượng badge trên Header.
* **Frontend:**
  * File Context: `client/src/context/CartContext.jsx` (`addToCart`, `updateCartQty`, `removeFromCart`, `clearCart`, `totalCartAmount`)
  * Drawer giỏ hàng: `client/src/components/common/StoreModals.jsx` (khối `CART DRAWER SLIDE-OVER`)
  * Chọn biến thể: `client/src/components/VariantSelect.jsx`
* **Từ khóa Ctrl+F nhanh:**
  * Frontend: `addToCart` hoặc `mbbc_cart_v1` trong `CartContext.jsx`

---

### 2.12. Đặt hàng (Checkout) & Tích hợp cước GHN Staging
* **Mô tả nghiệp vụ:** Khách hàng mở modal thanh toán, điền thông tin người nhận:
  1. Chọn Tỉnh/Thành -> Quận/Huyện -> Phường/Xã từ Master Data Giao Hàng Nhanh (SearchableSelect gõ tìm kiếm gợi ý không dấu).
  2. Hệ thống gọi API GHN Staging (`POST /v2/shipping-order/fee`) tính cước vận chuyển thực tế theo trọng lượng gói hàng (chuẩn 250g/sản phẩm) từ kho Quận 4, TP.HCM đến địa chỉ khách.
  3. Khi bấm Đặt hàng: Backend kiểm tra tính còn hàng của từng sản phẩm và từng biến thể size/màu trong DB, tự động trừ tồn kho, xác thực độc lập lại phí ship GHN, sinh mã đơn ngẫu nhiên `DH-xxxx` và lưu đơn hàng vào CSDL.
* **Frontend:**
  * Modal Checkout: `client/src/components/common/StoreModals.jsx` (Dòng 564: gọi `createOrder`)
  * Service GHN Client: `client/src/services/shippingApi.js`
  * Service Order Client: `client/src/services/orderApi.js`
* **Backend:**
  * Service GHN: `server/services/ghnService.js` (Hàm `calculateShippingFee`, `getProvinces`, `getDistricts`, `getWards`)
  * Route Order: `server/routes/orderRoutes.js` (Dòng 15: `router.post('/', optionalAuth, createOrder)`)
  * Controller Order: `server/controllers/orderController.js` (Dòng 205: `const createOrder = async (req, res) => ...`)
* **Dữ liệu lưu tại:** Collection `orders` qua Model `server/models/Order.js`.
* **Từ khóa Ctrl+F nhanh:**
  * Frontend: `createOrder` trong `StoreModals.jsx`
  * Backend: `const createOrder = async` hoặc `ghnService.calculateShippingFee` trong `orderController.js`

---

### 2.13. Quản lý đơn hàng (Order Management)
* **Mô tả nghiệp vụ:** 
  * **Khách hàng:** Xem danh sách đơn của mình qua modal "Đơn hàng của tôi" (`/api/orders/my-orders`).
  * **Admin:** Xem toàn bộ đơn hàng hệ thống, lọc theo mã đơn, khách hàng, trạng thái xử lý (`pending` -> `processing` -> `shipping` -> `delivered` -> `cancelled`).
  * **Cơ chế hoàn tồn kho:** Nếu đơn hàng bị Admin đổi sang `cancelled` (Đã hủy), backend sẽ tự động duyệt qua các sản phẩm trong đơn và hoàn trả đúng số lượng tồn kho cho từng biến thể size/màu tương ứng.
* **Frontend:**
  * Trang Admin: `client/src/pages/admin/orders/OrdersPage.jsx` và `OrderDetailModal.jsx`
  * Khách hàng: `client/src/pages/customer/MyOrdersModal.jsx`
* **Backend:**
  * Route: `server/routes/orderRoutes.js`
  * Controller: `server/controllers/orderController.js` (`getOrders`, `getMyOrders`, `getOrderById`, `updateOrderStatus`)
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `updateOrderStatus` hoặc `status === 'cancelled'` trong `orderController.js`

---

### 2.14. Tự động xuất PDF & Gửi email xác nhận đơn hàng
* **Mô tả nghiệp vụ:** Ngay sau khi khách đặt hàng thành công (`createOrder` hoàn tất):
  1. Backend dùng thư viện `PDFKit` sinh file PDF phiếu xác nhận đơn hàng chuẩn khổ A4, nhúng logo MBBC và font Unicode hiển thị tiếng Việt có dấu 100% chuẩn xác.
  2. Dùng `Nodemailer` kết nối Gmail SMTP gửi email thông báo tiếp nhận đơn đến email khách hàng, đính kèm trực tiếp file PDF vừa sinh dưới dạng buffer (không lưu file tạm làm rác ổ đĩa).
  3. Tác vụ này chạy bất đồng bộ nền (`try/catch` độc lập), không làm treo hay nghẽn tốc độ phản hồi đơn hàng về client.
* **Backend:**
  * Service PDF: `server/services/pdfService.js` (Hàm `generateOrderPDF`)
  * Service Email: `server/services/emailService.js` (Hàm `sendOrderConfirmationEmail`)
  * Điểm kích hoạt: `server/controllers/orderController.js` (Dòng 383: `const pdfBuffer = await generateOrderPDF(order)`)
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `generateOrderPDF` trong `pdfService.js` hoặc `sendOrderConfirmationEmail` trong `emailService.js`

---

### 2.15. Đánh giá sản phẩm & Kiểm duyệt đánh giá (Reviews)
* **Mô tả nghiệp vụ:**
  * **Quy tắc chặt chẽ:** Chỉ khách hàng đã mua sản phẩm và đơn hàng đạt trạng thái `delivered` mới có quyền gửi đánh giá. Mỗi sản phẩm trong một đơn hàng chỉ được đánh giá 1 lần (Compound Unique Index: `productId + userId + orderId`).
  * **Kiểm duyệt (Moderation):** Đánh giá gửi lên có trạng thái ban đầu là `PENDING`. Admin vào trang Quản lý đánh giá (`/admin/reviews`) để Duyệt (`APPROVED`), Từ chối (`REJECTED`) hoặc Ẩn (`HIDDEN`).
  * **Điểm sao:** Chỉ các đánh giá `APPROVED` mới xuất hiện công khai trên trang sản phẩm và được tính vào điểm đánh giá trung bình `ratingAverage` của sản phẩm.
* **Frontend:**
  * Khách hàng: `client/src/components/customer/ReviewSection.jsx`, `ReviewFormModal.jsx`, `MyReviewsModal.jsx`
  * Admin: `client/src/pages/admin/reviews/ReviewsPage.jsx` và `ReviewDetailModal.jsx`
* **Backend:**
  * Route: `server/routes/reviewRoutes.js`
  * Controller: `server/controllers/reviewController.js` (`createReview`, `getPublicProductReviews`, `moderateReview`, `replyReview`)
  * Model: `server/models/Review.js`
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `checkReviewEligibility` hoặc `compound index` trong `reviewController.js` / `Review.js`

---

### 2.16. Dashboard & Thống kê doanh thu (Statistics)
* **Mô tả nghiệp vụ:** Tích hợp 100% dữ liệu thực từ MongoDB (không dùng mock data):
  * Tổng doanh thu thực nhận (từ các đơn hàng `delivered` hoặc `paid`).
  * Số đơn hàng mới đang chờ duyệt, giá trị vốn tồn kho thực tế.
  * Biểu đồ doanh thu & đơn hàng 7 ngày gần nhất.
  * Bảng Top 5 sản phẩm bán chạy nhất và cảnh báo sản phẩm sắp hết hàng trong kho.
* **Frontend:**
  * Dashboard: `client/src/pages/admin/AdminDashboard.jsx`
  * Trang thống kê chi tiết: `client/src/pages/admin/statistics/StatisticsPage.jsx`
* **Backend:**
  * Route: `server/routes/statisticRoutes.js`
  * Controller: `server/controllers/statisticController.js` (`getOverviewStats`, `getRevenueChart`, `getTopProducts`, `getOrderStatusDistribution`)
* **Từ khóa Ctrl+F nhanh:**
  * Backend: `getOverviewStats` hoặc `getRevenueChart` trong `statisticController.js`

---

### 2.17. Nhật ký hoạt động hệ thống (Activity Log / Audit Log)
* **Mô tả nghiệp vụ:** Ghi nhận minh bạch mọi thao tác quản trị viên và hệ thống (Đăng nhập, đăng xuất, CRUD sản phẩm kèm diff giá/tồn kho trước - sau, thay đổi trạng thái đơn, khóa mở tài khoản). Tự động làm sạch dữ liệu nhạy cảm (mật khẩu), lưu địa chỉ IP và UserAgent.
* **Frontend:** `client/src/pages/admin/activityLogs/ActivityLogsPage.jsx` và `ActivityLogDetailModal.jsx`
* **Backend:** `server/services/activityLogService.js` và `server/controllers/activityLogController.js`
* **Model:** `server/models/ActivityLog.js`
* **Từ khóa Ctrl+F nhanh:** `logActivity` trong `activityLogService.js`

---

## 3. GIẢI THÍCH BẢN CHẤT CODE CỐT LÕI (DÀNH CHO SINH VIÊN TRÌNH BÀY)

### 3.1. Luồng Request / Response giữa React và Express
* **Bản chất:** Trình duyệt chạy mã JavaScript (React) gửi một HTTP Request (qua thư viện Axios) đến máy chủ Node.js/Express đang lắng nghe tại cổng `5000`. Express nhận request, đọc `req.body` (dữ liệu gửi lên), `req.params` (tham số URL) hoặc `req.query` (chuỗi truy vấn), xử lý truy vấn MongoDB qua Mongoose và phản hồi về client bằng HTTP Response kèm mã trạng thái (status code: `200`, `201`, `400`, `401`, `403`, `500`) cùng payload JSON `{ success: true, data: ... }`.
* **Minh họa trong code:** File `client/src/services/api.js` cấu hình `baseURL: 'http://localhost:5000/api'` và tự động chèn header `Authorization: Bearer <token>` vào mọi request nhờ Axios Request Interceptor.

### 3.2. Asynchronous JavaScript: Async / Await & Try / Catch
* **Tại sao phải dùng:** Các thao tác đọc ghi CSDL MongoDB, gọi API bên thứ ba (GHN), gửi email (Gmail SMTP) hoặc upload ảnh Cloudinary là các tác vụ vào/ra (I/O) tốn thời gian. Node.js hoạt động theo cơ chế đơn luồng bất đồng bộ (Non-blocking I/O). Từ khóa `async/await` giúp viết mã bất đồng bộ trông tuần tự và dễ đọc như mã đồng bộ.
* **Try/Catch:** Bắt mọi ngoại lệ hoặc lỗi phát sinh trong khối `try` (ví dụ: mất kết nối DB, sai dữ liệu, token hết hạn) để chuyển sang khối `catch`, ghi log ra terminal và trả về mã lỗi JSON hợp lệ (`500` hoặc `400`) thay vì để sập server (crash).

### 3.3. Cơ chế Middleware trong Express
* **Bản chất:** Middleware là các hàm trung gian nằm giữa lúc Express nhận Request và trước khi đưa tới Controller xử lý cuối cùng. Nó có cấu trúc `(req, res, next)`. Nếu kiểm tra hợp lệ, nó gọi `next()` để chuyển sang bước kế tiếp; nếu không hợp lệ, nó ngắt luồng và trả response về ngay lập tức.
* **Trong dự án MBBC có 2 middleware chính:**
  1. `authenticateToken` (`server/middleware/authMiddleware.js`): Lấy chuỗi Bearer Token từ header, dùng `jwt.verify` để giải mã. Kiểm tra xem tài khoản có bị khóa hay xóa không, sau đó gắn thông tin vào `req.user = { userId, role }`.
  2. `requireAdmin` (`server/middleware/roleMiddleware.js`): Kiểm tra xem `req.user.role === 'admin'` hay không. Nếu không phải admin thì trả về mã `403 Forbidden`.

### 3.4. Cơ chế băm mật khẩu Bcrypt (Salt & Hash)
* **Bản chất:** Tuyệt đối không lưu mật khẩu dạng văn bản gốc (plain text) vào CSDL. Mật khẩu được băm một chiều bằng thuật toán `bcryptjs`.
* **Cơ chế Salt:** Trước khi băm, thư viện sinh ra một chuỗi ngẫu nhiên gọi là Salt (dự án dùng độ dài 10 rounds: `bcrypt.genSalt(10)`). Sau đó kết hợp mật khẩu với Salt để băm. Do đó, cùng một mật khẩu "123456" của 2 người dùng khác nhau sẽ ra 2 chuỗi băm hoàn toàn khác biệt trong CSDL, chống lại kiểu tấn công tra cứu bảng băm sẵn (Rainbow Table).
* **Đoạn code trong dự án:** Hook `userSchema.pre('save')` trong `server/models/User.js` (Dòng 58-65) tự động băm mật khẩu trước khi lưu. Khi đăng nhập, hàm `userSchema.methods.comparePassword` (Dòng 68) dùng `bcrypt.compare` để so khớp.

### 3.5. Cơ chế xác thực Token JWT (JSON Web Token)
* **Bản chất:** JWT là phương pháp xác thực không trạng thái (Stateless Authentication). Server không cần tạo session lưu trong RAM hay DB.
* **Cấu trúc:** Gồm 3 phần phân tách bởi dấu chấm `Header.Payload.Signature`:
  * *Header:* Thuật toán mã hóa (`HS256`).
  * *Payload:* Dữ liệu lưu trong token (`userId`, `role`, thời hạn hết hạn `expiresIn: '7d'`).
  * *Signature:* Chữ ký số tạo bởi bí mật `process.env.JWT_SECRET`. Bất kỳ ai sửa đổi payload trên client đều làm sai lệch chữ ký và bị server từ chối ngay lập tức khi verify.

### 3.6. ODM Mongoose: Schema, Model, Hook Pre-save & Compound Index
* **Schema:** Định nghĩa cấu trúc, kiểu dữ liệu, giá trị mặc định và các ràng buộc validate cho một tài liệu (document) trong MongoDB (ví dụ: `email` phải duy nhất, `stock` không được âm).
* **Pre-save Hook:** Đoạn mã tự động kích hoạt trước khi một document được lưu vào CSDL. Ví dụ: Trong `Product.js`, hook `pre('save')` tự động cộng dồn số tồn kho của tất cả các biến thể size/màu để cập nhật vào trường tổng `stock`.
* **Compound Unique Index:** Đánh chỉ mục kết hợp giữa nhiều trường dữ liệu. Ví dụ trong `Review.js`: `reviewSchema.index({ productId: 1, userId: 1, orderId: 1 }, { unique: true })` nhằm đảm bảo ở tầng cơ sở dữ liệu rằng một người dùng không thể gửi 2 lần đánh giá cho cùng một sản phẩm trong một đơn hàng.

### 3.7. Kỹ thuật Xóa mềm (Soft Delete)
* **Bản chất:** Khi bấm "Xóa" một khách hàng (`DELETE /api/customers/:id`), hệ thống KHÔNG gọi lệnh xóa vĩnh viễn `deleteOne()` hay `deleteMany()` khỏi MongoDB. Thay vào đó, trường `status` được đổi thành `'deleted'`.
* **Lý do quan trọng khi trả lời giảng viên:** Trong hệ thống thương mại điện tử thực tế, khách hàng đã từng đặt nhiều đơn hàng trong quá khứ. Nếu xóa cứng tài khoản khách hàng khỏi DB, các đơn hàng và hóa đơn lịch sử sẽ bị mất liên kết (mồ côi khóa ngoại `customerId`), gây sai lệch dữ liệu báo cáo tài chính và thống kê doanh thu.

### 3.8. Xử lý tải ảnh Cloudinary qua Multer
* **Bản chất:** Khi tạo/sửa sản phẩm hoặc gửi đánh giá có kèm hình ảnh, client gửi dưới dạng `multipart/form-data`. Backend sử dụng `multer.memoryStorage()` để tiếp nhận file ảnh trực tiếp vào bộ nhớ RAM (`req.file.buffer`), sau đó dùng stream đẩy thẳng lên dịch vụ đám mây Cloudinary mà không ghi tạm ra ổ đĩa máy chủ. Cloudinary trả về URL ảnh CDN bảo mật HTTPS để lưu vào trường `image` của sản phẩm.

---

## 4. KỊCH BẢN "GIẢNG VIÊN YÊU CẦU SỬA TRỰC TIẾP THÌ MỞ FILE NÀO?"

Dưới đây là các tình huống thực tế nhất mà Hội đồng chấm đồ án có thể yêu cầu bạn sửa trực tiếp trên màn hình:

### Tình huống 1: Giảng viên yêu cầu đổi thông báo lỗi hoặc thông báo thành công
* **Ví dụ:** Đổi câu thông báo đăng nhập sai mật khẩu từ "Mật khẩu không chính xác" thành "Bạn đã nhập sai mật khẩu, vui lòng kiểm tra lại".
* **File cần mở:** `server/controllers/authController.js`
* **Từ khóa Ctrl+F:** `Mật khẩu không chính xác` (khoảng dòng 355)
* **Cách test:** Mở trình duyệt vào trang `/login`, gõ mật khẩu sai và quan sát thông báo hiển thị trên giao diện.

### Tình huống 2: Đổi thời gian hết hạn của mã OTP hoặc độ dài mã OTP
* **Yêu cầu:** Cho mã OTP hết hạn sau 10 phút (thay vì 5 phút hiện tại) hoặc đổi mã OTP thành 4 số.
* **File cần mở:** `server/controllers/authController.js`
* **Từ khóa Ctrl+F:** `5 * 60 * 1000` (đổi `5` thành `10`) và hàm `generateOtp` (khoảng dòng 9: đổi `100000 + Math.random() * 900000` nếu đổi số ký tự).
* **Cách test:** Đăng ký tài khoản mới hoặc yêu cầu gửi lại OTP, kiểm tra email và DB xem trường `emailOtpExpires`.

### Tình huống 3: Bắt buộc mật khẩu phải từ 8 ký tự (thay vì 6 ký tự)
* **File cần mở:**
  1. Backend Model: `server/models/User.js` (khoảng dòng 21: đổi `minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự']`).
  2. Backend Validate: `server/controllers/authController.js` (khoảng dòng 47: đổi `password.length < 8`).
  3. Frontend Validate: `client/src/components/auth/RegisterValidationForm.jsx` (tìm `password.length < 6` đổi thành `8`).
* **Cách test:** Vào trang đăng ký `/register`, nhập mật khẩu 7 ký tự -> hệ thống sẽ chặn ngay lập tức.

### Tình huống 4: Sửa giá hiển thị hoặc đổi ký hiệu tiền tệ
* **Ví dụ:** Đổi cách hiển thị từ `₫` sang `VNĐ` hoặc thêm chữ `Đồng`.
* **File cần mở:**
  * Modal Store / Giỏ hàng: `client/src/components/common/StoreModals.jsx` (hàm `formatPrice` ở dòng 23).
  * Chi tiết sản phẩm: `client/src/pages/customer/ProductDetailPage.jsx` (hàm `formatPrice`).
  * Danh mục: `client/src/pages/customer/CategoryPage.jsx`.
  * Hóa đơn PDF: `server/services/pdfService.js` (hàm `formatCurrency` ở dòng 45).

### Tình huống 5: Giảng viên yêu cầu: "Đơn hàng phải từ 100,000 ₫ trở lên mới cho đặt hàng"
* **File cần mở:** `server/controllers/orderController.js`
* **Vị trí sửa:** Trong hàm `createOrder` (sau khi tính xong `totalAmount`, khoảng dòng 319).
* **Đoạn code thêm vào:**
  ```javascript
  if (totalAmount < 100000) {
    return res.status(400).json({
      success: false,
      message: 'Đơn hàng phải có tổng tiền hàng tối thiểu từ 100.000 ₫ trở lên',
    });
  }
  ```
* **Cách test:** Đặt một món phụ kiện giá 50.000 ₫ và bấm Đặt hàng -> Modal sẽ hiện thông báo lỗi từ chối.

### Tình huống 6: Khi hủy đơn hàng, hệ thống có hoàn lại tồn kho không? Xem và sửa ở đâu?
* **File cần mở:** `server/controllers/orderController.js`
* **Hàm cần xem:** `updateOrderStatus` (khoảng dòng 427-450).
* **Từ khóa Ctrl+F:** `if (status === 'cancelled' && oldStatus !== 'cancelled')`
* **Giải thích với thầy:** Code duyệt qua từng `item` trong đơn hàng, tìm sản phẩm và biến thể size/màu rồi thực hiện `variant.stock += item.quantity` và `product.save()`.

### Tình huống 7: Đổi tiêu đề hoặc nội dung trên Phiếu xuất hóa đơn PDF
* **File cần mở:** `server/services/pdfService.js`
* **Vị trí sửa:**
  * Tiêu đề công ty: Dòng 137 (`doc.text('M.B.B.C CLOTHING STORE')`)
  * Khẩu hiệu: Dòng 146 (`doc.text('- Made By Bảo Cường -')`)
  * Chân trang / Ghi chú: Dòng 500-550.
* **Cách test:** Đặt đơn hàng mới, mở email hoặc chạy test PDF để xem file PDF mới.

### Tình huống 8: Thay đổi trạng thái tài khoản khách hàng trực tiếp trong CSDL
* **Yêu cầu:** Giảng viên bảo: "Em hãy khóa tài khoản này trong MongoDB rồi thử đăng nhập xem có vào được không?".
* **Cách xử lý:** Mở MongoDB Compass hoặc Atlas, tìm collection `users`, đổi trường `status` của user từ `'active'` thành `'blocked'`.
* **Hiện tượng:** Vào web đăng nhập lại, hệ thống sẽ trả về mã `403` và hiện popup: *"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên qua email: admin@quanlybanhang.com"*.

---

## 5. BỘ CÂU HỎI BẢO VỆ ĐỒ ÁN THƯỜNG GẶP & CÂU TRẢ LỜI MẪU

#### Câu 1: Tại sao em sử dụng JWT (JSON Web Token) để xác thực người dùng thay vì dùng Session Cookie truyền thống?
* **Trả lời:** "Dạ thưa Thầy/Cô, em chọn JWT vì hệ thống của em thiết kế theo kiến trúc tách rời Frontend (React) và Backend (Express RESTful API). JWT có tính chất Stateless (không lưu trạng thái phía máy chủ), toàn bộ thông tin xác thực như `userId` và `role` đã được mã hóa kèm chữ ký số bí mật trong token. Khi mở rộng hệ thống hoặc triển khai server lên các nền tảng đám mây, server không cần tốn tài nguyên bộ nhớ RAM để quản lý Session Table và tránh được các vấn đề đồng bộ phiên giữa nhiều phiên bản máy chủ."

#### Câu 2: Khi người dùng đặt hàng thì tồn kho bị trừ ở đâu và làm sao tránh được việc bán quá số lượng thực có?
* **Trả lời:** "Dạ, việc trừ tồn kho được xử lý tập trung và an toàn tại Backend trong file `server/controllers/orderController.js` tại hàm `createOrder`. Trước khi tạo đơn, hệ thống truy vấn thông tin sản phẩm trực tiếp từ MongoDB. Nếu sản phẩm có phân loại biến thể, hệ thống tìm đúng biến thể theo Size và Màu sắc khách chọn, kiểm tra nếu `variant.stock < quantity` thì sẽ ngắt giao dịch ngay lập tức và ném lỗi thông báo số lượng còn lại cho khách. Chỉ khi tất cả các sản phẩm trong giỏ hàng đều thỏa mãn điều kiện tồn kho thì hệ thống mới trừ số lượng và gọi `product.save()`."

#### Câu 3: Mật khẩu của người dùng được bảo vệ như thế nào? Có trường hợp nào quản trị viên đọc được mật khẩu của khách không?
* **Trả lời:** "Dạ không thể đọc được ạ. Mật khẩu được mã hóa một chiều bằng thư viện `bcryptjs` với độ dài Salt là 10 vòng ngay trước khi ghi vào database thông qua Mongoose Pre-save Hook trong file `server/models/User.js`. Kể cả người quản trị mở trực tiếp MongoDB Atlas cũng chỉ nhìn thấy một chuỗi ký tự băm ngẫu nhiên. Khi kiểm tra đăng nhập, hệ thống chỉ dùng hàm `bcrypt.compare` để so khớp chứ không bao giờ giải mã ngược lại. Ngoài ra, trong Schema của User, em đã cài đặt phương thức `toJSON` tự động xóa trường `password` trước khi gửi dữ liệu về client."

#### Câu 4: Tại sao khi Admin xóa khách hàng, em lại dùng Xóa mềm (Soft Delete)?
* **Trả lời:** "Dạ thưa Thầy/Cô, trong một hệ thống bán lẻ và kho vận thực tế, mỗi khách hàng gắn liền với lịch sử các đơn đặt hàng, doanh thu và chứng từ kế toán. Nếu ta dùng lệnh xóa cứng (Hard Delete) xóa hẳn tài khoản ra khỏi collection `users`, các đơn hàng cũ sẽ bị lỗi liên kết dữ liệu mồ côi (orphaned data), dẫn đến việc tổng hợp báo cáo thống kê doanh thu bị sai lệch. Vì vậy, em chỉ cập nhật trạng thái `status: 'deleted'`. Các API lấy danh sách khách hàng và đăng nhập sẽ lọc bỏ trạng thái này, vừa bảo đảm tài khoản không thể sử dụng lại, vừa toàn vẹn được lịch sử kinh doanh."

#### Câu 5: Hệ thống của em gửi email OTP và PDF bằng giao thức gì? Có làm đơ ứng dụng khi gửi không?
* **Trả lời:** "Dạ, hệ thống gửi email qua giao thức SMTP chuẩn STARTTLS cổng 587 kết nối tới máy chủ Google Gmail thông qua thư viện `nodemailer`. Để giao diện không bị giật lag hay chờ đợi lâu, các tác vụ gửi email và sinh file PDF được em đặt chạy dưới dạng Promise bất đồng bộ nền (`sendOtpEmail` và `sendOrderConfirmationEmail`). Response tạo đơn hàng hoặc đăng ký vẫn trả về client ngay lập tức (`res.status(201)`), còn tiến trình gửi email chạy nền và có khối `try/catch` riêng để nếu mạng email gặp sự cố thì đơn hàng của khách vẫn được bảo toàn thành công."

#### Câu 6: Làm thế nào em tích hợp được tính phí vận chuyển Giao Hàng Nhanh?
* **Trả lời:** "Dạ, em sử dụng bộ API chính thức của Giao Hàng Nhanh môi trường Staging (Sandbox). Đầu tiên, frontend lấy danh mục Tỉnh/Thành, Quận/Huyện, Phường/Xã từ Master Data của GHN qua backend `server/services/ghnService.js`. Khi khách chọn đủ địa chỉ, hệ thống đóng gói thông tin gồm mã quận/huyện, phường/xã đến, trọng lượng gói hàng (ước tính 250g/sản phẩm) và gọi endpoint `POST /v2/shipping-order/fee` của GHN. Phí vận chuyển được tính độc lập lại ở backend khi khách bấm Đặt hàng để đảm bảo khách không thể chỉnh sửa giả mạo phí ship từ trình duyệt."

#### Câu 7: Cấu trúc biến thể sản phẩm (Size & Màu sắc) được lưu trữ trong MongoDB như thế nào?
* **Trả lời:** "Dạ, em áp dụng mô hình tài liệu nhúng (Embedded Document / Subdocument) của MongoDB. Trong `server/models/Product.js`, em định nghĩa một `variantSchema` chứa `size`, `color` và `stock`. Trong schema của `Product`, trường `variants` là một mảng chứa các subdocument này (`[variantSchema]`). Cách thiết kế này rất tối ưu cho hệ thống bán lẻ vì khi truy vấn một sản phẩm, toàn bộ thông tin biến thể và tồn kho của từng màu/size được lấy ra trong một câu truy vấn duy nhất mà không cần phải dùng lệnh `$lookup` (join) phức tạp sang bảng khác."

#### Câu 8: Phân hệ Activity Log (Nhật ký hoạt động) hoạt động như thế nào và tại sao lại cần thiết?
* **Trả lời:** "Dạ, Activity Log được xây dựng để phục vụ công tác kiểm toán và an toàn hệ thống thông tin. Mỗi khi Quản trị viên thực hiện một thao tác trọng yếu như đăng nhập, thay đổi giá sản phẩm, nhập xuất kho hoặc khóa tài khoản khách hàng, hàm `logActivity` trong `server/services/activityLogService.js` sẽ tự động ghi nhận lại: ai thực hiện, tác động lên đối tượng nào, các trường dữ liệu thay đổi trước và sau (`diffObjects`), thời gian, địa chỉ IP và trình duyệt sử dụng. Log được thiết kế an toàn (Fail-safe), nếu việc ghi log có lỗi thì cũng không làm gián đoạn luồng nghiệp vụ chính."

---
*Tài liệu được biên soạn đồng bộ 100% với mã nguồn thực tế của đồ án tốt nghiệp MBBC.*  
*Chúc bạn Bảo tự tin bảo vệ xuất sắc đồ án tốt nghiệp!*
