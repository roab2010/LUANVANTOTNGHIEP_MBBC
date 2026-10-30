# 🎬 CẨM NANG THỰC CHIẾN: KỊCH BẢN GIẢNG VIÊN YÊU CẦU SỬA CODE TRỰC TIẾP
> **Dự án:** Hệ thống Quản lý Bán hàng **M.B.B.C - Made By Bảo Cường**  
> **Mục tiêu:** Giúp sinh viên tự tin mở đúng file, sửa đúng dòng, giải thích rành mạch và chứng minh kết quả trực tiếp trên màn hình khi Hội đồng bảo vệ đồ án yêu cầu "Live Coding".  
> 💡 **Nguyên tắc cốt lõi của Web Fullstack:** Đa số các tính năng đều gồm **2 nửa không thể tách rời**:
> * **Backend (BE):** Xử lý nghiệp vụ, tính toán logic và lưu trữ cơ sở dữ liệu an toàn.
> * **Frontend (FE):** Giao diện hiển thị, bắt lỗi người dùng và gửi dữ liệu lên Backend.  
> ➔ *Khi Thầy/Cô yêu cầu sửa một chức năng, bạn phải biết sửa cả **BE lẫn FE** thì hệ thống mới chạy mượt mà và đồng bộ 100%!*

---

## 📑 MỤC LỤC 30 TÌNH HUỐNG THỰC CHIẾN ĐỈNH CAO (FULL BE + FE)

1. [Tình huống 1: Đổi câu thông báo lỗi khi Đăng nhập (BE + FE)](#tình-huống-1-đổi-câu-thông-báo-lỗi-khi-đăng-nhập)
2. [Tình huống 2: Đổi mã OTP thành 4 số (BE + FE) hoặc tăng thời hạn lên 10 phút](#tình-huống-2-đổi-mã-otp-thành-4-số-be--fe-hoặc-thời-hạn-10-phút)
3. [Tình huống 3: Bắt buộc mật khẩu tối thiểu 8 ký tự (Model + BE + FE)](#tình-huống-3-bắt-buộc-mật-khẩu-tối-thiểu-8-ký-tự-3-tầng)
4. [Tình huống 4: Ràng buộc giá trị đơn hàng tối thiểu từ 100.000 ₫ (BE + FE)](#tình-huống-4-ràng-buộc-đơn-hàng-tối-thiểu-từ-100000-₫-be--fe)
5. [Tình huống 5: Kiểm tra logic Hoàn tồn kho khi Hủy đơn hàng (BE + FE)](#tình-huống-5-hoàn-tồn-kho-khi-hủy-đơn-hàng-be--fe)
6. [Tình huống 6: Đổi quy cách tính cước giao hàng GHN (BE + FE)](#tình-huống-6-thay-đổi-quy-cách-tính-phí-giao-hàng-ghn-be--fe)
7. [Tình huống 7: Thêm trường dữ liệu mới vào Sản phẩm (origin / barcode) (DB + BE + FE)](#tình-huống-7-thêm-trường-mới-vào-sản-phẩm-origin--barcode)
8. [Tình huống 8: Khóa tài khoản người dùng & Kiểm tra chặn đăng nhập (DB + BE + FE)](#tình-huống-8-khóa-tài-khoản-và-chặn-đăng-nhập-db--be--fe)
9. [Tình huống 9: Chỉ khách đã mua và nhận hàng thành công mới được Đánh giá (BE + FE)](#tình-huống-9-chỉ-khách-đã-nhận-hàng-thành-công-mới-được-đánh-giá-be--fe)
10. [Tình huống 10: Sửa thông tin cửa hàng trên Hóa đơn PDF A4 (BE + FE)](#tình-huống-10-sửa-thông-tin-trên-phiếu-hóa-đơn-pdf-a4-be--fe)
11. [Tình huống 11: Đổi số lượng sản phẩm mỗi trang (Phân trang từ 12 thành 8) (BE + FE)](#tình-huống-11-đổi-số-lượng-sản-phẩm-mỗi-trang-phân-trang-từ-12-thành-8-be--fe)
12. [Tình huống 12: Đổi cấu trúc tiền tố mã đơn hàng (DH-xxxx thành MBBC-2026-xxxx) (BE)](#tình-huống-12-đổi-cấu-trúc-tiền-tố-mã-đơn-hàng-dh-xxxx-thành-mbbc-2026-xxxx-be)
13. [Tình huống 13: Giới hạn số lượng mua tối đa cho mỗi món trong giỏ (Max 5 cái) (FE + BE)](#tình-huống-13-giới-hạn-số-lượng-mua-tối-đa-cho-mỗi-món-trong-giỏ-max-5-cái-fe--be)
14. [Tình huống 14: Miễn phí vận chuyển (Freeship) cho đơn hàng từ 500.000 ₫ (BE + FE)](#tình-huống-14-miễn-phí-vận-chuyển-freeship-cho-đơn-hàng-từ-500000-₫-be--fe)
15. [Tình huống 15: Đổi sắp xếp sản phẩm mặc định sang 'Giá rẻ nhất lên đầu' (BE)](#tình-huống-15-đổi-thứ-tự-sắp-xếp-sản-phẩm-mặc-định-từ-mới-nhất-sang-giá-rẻ-nhất-lên-đầu-be)
16. [Tình huống 16: Rút ngắn thời hạn Token đăng nhập JWT từ 7 ngày xuống 1 ngày (BE)](#tình-huống-16-rút-ngắn-thời-hạn-token-đăng-nhập-jwt-từ-7-ngày-thành-1-ngày-be)
17. [Tình huống 17: Bắt buộc Số điện thoại đăng ký chuẩn 10 số VN (FE + BE)](#tình-huống-17-bắt-buộc-số-điện-thoại-đăng-ký-phải-đúng-chuẩn-10-chữ-số-vn-fe--be)
18. [Tình huống 18: Hiển thị nhãn giảm giá (Sale Badge -%) trên thẻ sản phẩm (FE)](#tình-huống-18-hiển-thị-nhãn-giảm-giá-sale-badge--trên-thẻ-sản-phẩm-fe)
19. [Tình huống 19: Bắt buộc khách hàng phải nhập Địa chỉ nhà chi tiết (FE + BE)](#tình-huống-19-bắt-buộc-khách-hàng-phải-nhập-địa-chỉ-chi-tiết-khi-đặt-hàng-fe--be)
20. [Tình huống 20: Tự động đánh dấu đơn hàng là 'paid' khi chọn Chuyển khoản (BE)](#tình-huống-20-tự-động-đánh-dấu-đơn-hàng-là-paid-đã-thanh-toán-khi-chọn-chuyển-khoản-be)
21. [Tình huống 21: Đổi ngưỡng cảnh báo 'Sắp hết hàng' (Low Stock) từ 10 thành 5 sản phẩm (BE + FE)](#tình-huống-21-đổi-ngưỡng-cảnh-báo-sắp-hết-hàng-low-stock-từ-10-thành-5-sản-phẩm-be--fe)
22. [Tình huống 22: Chỉ cho phép Hủy đơn hàng khi ở trạng thái 'pending' (Chờ duyệt) (BE + FE)](#tình-huống-22-chỉ-cho-phép-hủy-đơn-hàng-khi-ở-trạng-thái-pending-chờ-duyệt-be--fe)
23. [Tình huống 23: Ràng buộc Giá bán phải lớn hơn hoặc bằng Giá nhập (price >= costPrice) (BE + FE)](#tình-huống-23-ràng-buộc-giá-bán-phải-lớn-hơn-hoặc-bằng-giá-nhập-price--costprice-be--fe)
24. [Tình huống 24: Bộ lọc từ ngữ nhạy cảm / Thô tục trong Đánh giá sản phẩm (BE)](#tình-huống-24-bộ-lọc-từ-ngữ-nhạy-cảm--thô-tục-trong-đánh-giá-sản-phẩm-be)
25. [Tình huống 25: Đổi thời gian chờ gửi lại mã OTP (Cool-down) từ 60s thành 30s (BE + FE)](#tình-huống-25-đổi-thời-gian-chờ-gửi-lại-mã-otp-cool-down-từ-60s-thành-30s-be--fe)
26. [Tình huống 26: Không cho phép Xóa Danh mục nếu đang có sản phẩm (Hard delete an toàn) (BE + FE)](#tình-huống-26-không-cho-phép-xóa-danh-mục-nếu-đang-có-sản-phẩm-hard-delete-an-toàn-be--fe)
27. [Tình huống 27: Mở rộng tính Tổng doanh thu Dashboard (Tính cả đơn 'delivered' VÀ 'paid') (BE)](#tình-huống-27-mở-rộng-tính-tổng-doanh-thu-dashboard-tính-cả-đơn-delivered-và-paid-be)
28. [Tình huống 28: Tự động khóa tài khoản sau 5 lần nhập sai mật khẩu liên tiếp (Model + BE)](#tình-huống-28-tự-động-khóa-tài-khoản-sau-5-lần-nhập-sai-mật-khẩu-liên-tiếp-model--be)
29. [Tình huống 29: Chỉ ghi log lịch sử (Activity Log) cho tài khoản Admin (BE)](#tình-huống-29-chỉ-ghi-log-lịch-sử-activity-log-cho-tài-khoản-admin-be)
30. [Tình huống 30: Ẩn số điện thoại khách hàng trên trang Admin (Masking Phone: 0901***567) (BE + FE)](#tình-huống-30-ẩn-số-điện-thoại-khách-hàng-trên-trang-admin-masking-phone-0901567-be--fe)
31. [BẢNG TRA CỨU NHANH (CHEAT SHEET 30 TÌNH HUỐNG BE & FE)](#bảng-tra-cứu-nhanh-cheat-sheet-30-tình-huống)

---

### TÌNH HUỐNG 1: Đổi câu thông báo lỗi khi Đăng nhập
> **Câu hỏi của Giảng viên:**  
> *"Bây giờ em đổi thông báo khi khách nhập sai mật khẩu từ 'Mật khẩu không chính xác' thành 'Bạn đã nhập sai mật khẩu, vui lòng kiểm tra lại' xem nào?"*

#### 1. Bản chất:
* Phía **Backend** kiểm tra so khớp mật khẩu bằng `bcrypt.compare`. Nếu sai, Backend trả về HTTP `401` kèm `{ message: '...' }`.
* Phía **Frontend**, React nhận chuỗi text trong `err.response.data.message` rồi gán vào state `error` để hiển thị khung thông báo đỏ cho khách thấy.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/authController.js](./server/controllers/authController.js#L353) *(Dòng 353 – 356)*
* **Frontend:** [client/src/pages/auth/LoginPage.jsx](./client/src/pages/auth/LoginPage.jsx#L101) *(Dòng 101 – 103 và dòng 190)*

#### 3. So sánh Code:
* **Bước 1 (Sửa Backend):** Trong [server/controllers/authController.js](./server/controllers/authController.js#L353):
  ```javascript
  // Trước khi sửa:
  return res.status(401).json({
    success: false,
    message: 'Mật khẩu không chính xác',
  });

  // Sau khi sửa:
  return res.status(401).json({
    success: false,
    message: 'Bạn đã nhập sai mật khẩu, vui lòng kiểm tra lại',
  });
  ```
* **Bước 2 (Chỉ cho thầy xem Frontend bắt lỗi ở đâu):** Trong [client/src/pages/auth/LoginPage.jsx](./client/src/pages/auth/LoginPage.jsx#L101):
  ```javascript
  // Dòng 101: Frontend tự động hứng message từ Backend trả về
  const message = err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
  setError(message); // Đẩy lên khung đỏ trên giao diện
  ```

#### 4. Cách test chứng minh:
1. Lưu file. Mở web vào `/login`.
2. Gõ email đúng: `ldvietcuong2002@gmail.com` và gõ bừa mật khẩu sai `111111`.
3. Bấm **Đăng nhập** ➔ Khung đỏ trên giao diện hiện ngay: *"Bạn đã nhập sai mật khẩu, vui lòng kiểm tra lại"*.

---

### TÌNH HUỐNG 2: Đổi mã OTP thành 4 số (BE + FE) hoặc thời hạn 10 phút
> **Câu hỏi của Giảng viên:**  
> *"Hệ thống của em đang dùng mã OTP 6 số. Bây giờ em đổi thành mã OTP 4 số xem? Hoặc tăng thời hạn hết hạn từ 5 phút lên 10 phút?"*

#### 1. Bản chất (Tại sao phải sửa cả BE và FE?):
* **Backend:** Chịu trách nhiệm sinh ra chuỗi 4 số ngẫu nhiên (`generateOtp`) và lưu vào MongoDB.
* **Frontend:** Chịu trách nhiệm vẽ các ô vuông trên màn hình. Nếu Backend sinh 4 số mà Frontend vẫn vẽ 6 ô vuông và bắt buộc nhập đủ 6 số (`code.length !== 6`) thì người dùng sẽ bị kẹt! Do đó **bắt buộc phải sửa cả 2 file**.

#### 2. Các file cần mở:
* **Backend:** [server/controllers/authController.js](./server/controllers/authController.js#L9) *(Dòng 9 – 11)*
* **Frontend:** [client/src/components/auth/OtpVerificationModal.jsx](./client/src/components/auth/OtpVerificationModal.jsx#L36) *(Dòng 36, 136, 243)*

#### 3. So sánh Code:

* **PHẦN A: Đổi OTP từ 6 số thành 4 số (Cần sửa đồng bộ cả Backend và Frontend):**
  * **Bước 1: Sửa Backend (sinh 4 số ngẫu nhiên):**
    Mở file: [server/controllers/authController.js](./server/controllers/authController.js#L9) (dòng 9 – 11)
    ```javascript
    // Trước khi sửa (Sinh từ 100000 đến 999999 - 6 chữ số):
    const generateOtp = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Sau khi sửa (Sinh từ 1000 đến 9999 - 4 chữ số):
    const generateOtp = () => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };
    ```
    *(Lưu ý: Phải viết đúng chữ `S` hoa trong `.toString()`)*.

  * **Bước 2: Sửa Frontend (đổi giao diện từ 6 ô thành 4 ô vuông):**
    Mở file: [client/src/components/auth/OtpVerificationModal.jsx](./client/src/components/auth/OtpVerificationModal.jsx#L36)
    * **Dòng 36:** Đổi state từ 6 ô thành 4 ô:
      ```javascript
      // Trước: const [otp, setOtp] = useState(['', '', '', '', '', '']);
      const [otp, setOtp] = useState(['', '', '', '']);
      ```
    * **Dòng 81 & Dòng 103:** Đổi chỉ số nhảy ô sang phải (từ 5 về 3):
      ```javascript
      if (index < 3) { inputRefs.current[index + 1]?.focus(); }
      ```
    * **Dòng 112, 117, 124, 128:** Đổi hàm dán mã (Paste) từ 6 thành 4:
      ```javascript
      const cleanDigits = pasteText.replace(/\D/g, '').slice(0, 4);
      for (let i = 0; i < 4; i++) { newOtp[i] = cleanDigits[i] || ''; }
      const focusIndex = Math.min(cleanDigits.length, 3);
      if (cleanDigits.length === 4) { handleVerify(cleanDigits); }
      ```
    * **Dòng 136:** Đổi điều kiện kiểm tra độ dài mã khi submit:
      ```javascript
      // Trước: if (code.length !== 6)
      if (code.length !== 4) {
        setError('Vui lòng nhập đầy đủ 4 chữ số mã xác minh');
        return;
      }
      ```
    * **Dòng 161:** Đổi reset mảng khi nhập sai:
      ```javascript
      setOtp(['', '', '', '']);
      ```
    * **Dòng 243:** Đổi chữ hiển thị hướng dẫn:
      ```javascript
      Chúng tôi đã gửi mã xác minh 4 chữ số đến địa chỉ email:
      ```
    * **Dòng 312 (QUAN TRỌNG NHẤT - NÚT BẤM):** Đổi điều kiện disabled của nút xác nhận để nút không bị mờ:
      ```javascript
      // Trước: disabled={loading || otp.join('').length !== 6 || isSuccess}
      // Sau:
      disabled={loading || otp.join('').length !== 4 || isSuccess}
      ```

* **PHẦN B: Tăng thời hạn hết hạn từ 5 phút lên 10 phút:**
  * Mở [server/controllers/authController.js](./server/controllers/authController.js#L68)
  * Dùng `Ctrl + F` tìm cụm: `5 * 60 * 1000` (đổi số `5` thành `10` ở các dòng 68, 96, 132, 265, 364):
    ```javascript
    // Trước: existingUser.emailOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    // Sau:
    existingUser.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    ```

#### 4. Cách test chứng minh:
1. Lưu cả 2 file (`authController.js` và `OtpVerificationModal.jsx`).
2. Ra trình duyệt, **bấm F5 tải lại trang web** (để React hủy modal cũ và nạp giao diện 4 ô mới).
3. Bấm Đăng ký tài khoản mới ➔ Màn hình hiện chuẩn xác **4 ô vuông**.
4. Nhìn vào Terminal Server Node.js lấy mã OTP 4 số gõ vào ➔ Nút "Xác nhận mã OTP" sáng màu đen và xác minh thành công!

---

### TÌNH HUỐNG 3: Bắt buộc mật khẩu tối thiểu 8 ký tự (3 tầng)
> **Câu hỏi của Giảng viên:**  
> *"Theo tiêu chuẩn bảo mật, mật khẩu phải có ít nhất 8 ký tự. Em sửa hệ thống bắt buộc nhập từ 8 ký tự trở lên xem?"*

#### 1. Bản chất:
* Cần bảo vệ ở cả **3 lớp**:
  1. **Lớp DB Model:** Schema chặn không cho lưu bản ghi nếu password < 8 ký tự.
  2. **Lớp Backend API:** Controller chặn và trả về lỗi `400 Bad Request` nếu client gửi password < 8 ký tự.
  3. **Lớp Frontend Form:** Form validate chặn ngay khi người dùng đang gõ phím.

#### 2. Các file cần mở & Sửa code:
* **Tầng 1 (Database Schema):** [server/models/User.js](./server/models/User.js#L21) (dòng 21):
  ```javascript
  // Đổi số 6 thành 8:
  minlength: [8, 'Mật khẩu phải có ít nhất 8 ký tự'],
  ```
* **Tầng 2 (Backend Controller):** [server/controllers/authController.js](./server/controllers/authController.js#L47) (dòng 47 – 51):
  ```javascript
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải có ít nhất 8 ký tự',
    });
  }
  ```
* **Tầng 3 (Frontend Form Validate):** [client/src/components/auth/RegisterValidationForm.jsx](./client/src/components/auth/RegisterValidationForm.jsx)
  * Bấm `Ctrl + F`, tìm `password.length < 6` ➔ Đổi số `6` thành `8` và đổi thông báo *"Mật khẩu phải có ít nhất 8 ký tự"*.

#### 3. Cách test chứng minh:
1. Mở modal Đăng ký trên web.
2. Gõ mật khẩu `1234567` (7 ký tự) ➔ Form báo đỏ ngay: *"Mật khẩu phải có ít nhất 8 ký tự"*. Gõ thêm ký tự thứ 8 ➔ Cảnh báo đỏ tự động biến mất!

---

### TÌNH HUỐNG 4: Ràng buộc đơn hàng tối thiểu từ 100.000 ₫ (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Cửa hàng yêu cầu: Đơn hàng phải từ 100.000 ₫ trở lên mới cho thanh toán. Em thêm điều kiện này ở đâu?"*

#### 1. Bản chất:
* **Backend:** Chặn tại hàm `createOrder` để dù hacker có gọi thẳng API thì cũng không thể tạo đơn hàng dưới 100k.
* **Frontend:** Kiểm tra ngay khi khách bấm nút "Tiến hành thanh toán" ở Giỏ hàng để báo ngay cho khách biết mà không cần đợi server từ chối.

#### 2. Các file cần mở:
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L320) *(Dòng 320)*
* **Frontend:** [client/src/components/common/StoreModals.jsx](./client/src/components/common/StoreModals.jsx#L721) *(Dòng 721)*

#### 3. So sánh Code:
* **Bước 1 (Backend):** Trong [server/controllers/orderController.js](./server/controllers/orderController.js#L320), sau dòng tính `totalAmount`:
  ```javascript
  // Chèn vào dòng 320:
  if (totalAmount < 100000) {
    return res.status(400).json({
      success: false,
      message: 'Chính sách cửa hàng: Đơn hàng phải có tổng tiền từ 100.000 ₫ trở lên',
    });
  }
  ```
* **Bước 2 (Frontend):** Trong [client/src/components/common/StoreModals.jsx](./client/src/components/common/StoreModals.jsx#L721), tại nút "TIẾN HÀNH THANH TOÁN" của giỏ hàng:
  ```javascript
  <button
    type="button"
    onClick={() => {
      // FE CHẶN NGAY TẠI GIỎ HÀNG:
       
      setIsCartOpen(false);
      setCheckoutError('');
      setIsCheckoutOpen(true);
    }}
    className="w-full py-3.5 bg-black text-white text-xs font-black tracking-widest uppercase"
  >
    TIẾN HÀNH THANH TOÁN
  </button>
  ```

#### 4. Cách test chứng minh:
1. Thêm 1 món tất/vớ 50.000 ₫ vào giỏ hàng.
2. Bấm "Tiến hành thanh toán" ➔ Trình duyệt hiện cảnh báo chặn ngay. Chọn thêm 1 áo 250.000 ₫ ➔ Cho phép thanh toán bình thường!

---

### TÌNH HUỐNG 5: Hoàn tồn kho khi Hủy đơn hàng (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Khi Admin Hủy đơn hàng, hệ thống có tự cộng trả lại số lượng tồn kho cho sản phẩm không? Mở code ra chỉ cho tôi thấy!"*

#### 1. File Backend cốt lõi:
* Mở file: [server/controllers/orderController.js](./server/controllers/orderController.js#L427) (Dòng **427 đến 450**).
* **Đoạn code chỉ tay vào màn hình:**
  ```javascript
  // DÒNG 428: Khi trạng thái chuyển sang 'cancelled'
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          // Nếu có biến thể Size / Màu -> Hoàn đúng biến thể đó
          if (product.variants?.length > 0 && item.size && item.color) {
            const variant = product.variants.find(
              (v) => v.size === item.size && v.color === item.color
            );
            if (variant) { variant.stock += item.quantity; } // <-- CỘNG TRẢ VÀO KHO
          } else {
            product.stock += item.quantity; // Hoàn kho sản phẩm đơn
          }
          await product.save();
        }
      }
    }
  }
  ```

#### 2. File Frontend Admin:
* Mở file: [client/src/pages/admin/orders/OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx)
* **Chỉ cho thầy xem:** Dropdown cập nhật trạng thái đơn hàng: khi Admin chọn sang `'cancelled'`, frontend gửi request `PUT /api/orders/:id/status` với body `{ status: 'cancelled' }` để kích hoạt logic hoàn kho ở trên.

---

### TÌNH HUỐNG 6: Thay đổi quy cách tính phí giao hàng GHN (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Phí giao hàng em đang cấu hình gói hàng nặng bao nhiêu? Bây giờ quần áo mùa đông nặng hơn, em đổi thành 500 gram / sản phẩm xem? Và kết quả hiển thị trên web ở đâu?"*

#### 1. File Backend (Tính toán cước):
* Mở file: [server/services/ghnService.js](./server/services/ghnService.js#L140) (Dòng **145 & 151**)
  ```javascript
  // Trước: const packageWeight = Math.max(250, totalQty * 250); // 250g
  // Sau khi sửa (500g / sản phẩm):
  const packageWeight = Math.max(500, totalQty * 500);

  // Kho xuất phát: Quận 4, TP.HCM (Mã GHN: 1446)
  const fromDistrictId = Number(process.env.GHN_FROM_DISTRICT_ID || 1446);
  ```

#### 2. File Frontend (Hiển thị kết quả cho khách):
* Mở file: [client/src/components/common/StoreModals.jsx](./client/src/components/common/StoreModals.jsx#L325) (Dòng **325 – 336**)
  * Hàm `fetchGHNFee` gửi `items` lên backend, nhận `res.data.data.total` và set vào state:
    ```javascript
    setShippingFee(res.data.data.total); // Hiển thị dòng Phí vận chuyển trên popup
    ```

---

### TÌNH HUỐNG 7: Thêm trường mới vào Sản phẩm (origin / barcode)
> **Câu hỏi của Giảng viên:**  
> *"Bây giờ tôi muốn sản phẩm có thêm trường 'Xuất xứ' (origin, ví dụ: Việt Nam, Hàn Quốc). Em làm theo từng bước cả DB, BE và FE cho tôi xem?"*

#### 1. Quy trình chuẩn 3 bước:
* **Bước 1: Khai báo vào Schema DB:** [server/models/Product.js](./server/models/Product.js#L40) (dòng 40):
  ```javascript
  origin: {
    type: String,
    default: 'Việt Nam',
    trim: true,
  },
  ```
* **Bước 2: Đón nhận ở Controller Backend:** [server/controllers/productController.js](./server/controllers/productController.js#L55) (dòng 55 & 140):
  * Lấy `origin` từ `req.body` và gán khi tạo/cập nhật: `origin: origin || 'Việt Nam'`.
* **Bước 3: Hiển thị lên Form Admin:** [client/src/pages/admin/products/ProductFormModal.jsx](./client/src/pages/admin/products/ProductFormModal.jsx)
  * Thêm 1 thẻ `<input>` cho người quản trị nhập:
    ```jsx
    <div>
      <label className="text-xs font-bold text-gray-700">Xuất xứ:</label>
      <input
        type="text"
        value={formData.origin || ''}
        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
        placeholder="VD: Việt Nam, Hàn Quốc..."
      />
    </div>
    ```

---

### TÌNH HUỐNG 8: Khóa tài khoản và chặn đăng nhập (DB + BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Em hãy khóa tài khoản khách hàng này lại rồi thử đăng nhập xem hệ thống có chặn không?"*

#### 1. Thao tác khóa tài khoản (Chọn 1 trong 2 cách):
* **Cách 1 (Từ giao diện Admin):** Vào trang Admin `/admin/customers` ➔ Bấm nút **Khóa** cạnh tài khoản đó.
* **Cách 2 (Trực tiếp trong MongoDB):** Mở MongoDB Atlas / Compass ➔ Collection `users` ➔ Đổi `"status": "active"` thành `"status": "blocked"`.

#### 2. Nơi xử lý Backend:
* Mở [server/controllers/authController.js](./server/controllers/authController.js#L314) (Dòng 314 – 334):
  * Kiểm tra `if (user.status === 'blocked')` ➔ Trả về mã HTTP `403` kèm câu: *"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên..."*.

#### 3. Nơi hiển thị Frontend:
* Mở [client/src/pages/auth/LoginPage.jsx](./client/src/pages/auth/LoginPage.jsx#L101):
  * Khách đăng nhập sẽ thấy ngay thông báo popup màu đỏ từ chối đăng nhập.

---

### TÌNH HUỐNG 9: Chỉ khách đã nhận hàng thành công mới được Đánh giá (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Làm sao em ngăn chặn được đánh giá ảo của người chưa mua hàng?"*

#### 1. File Backend (Kiểm tra điều kiện):
* Mở file: [server/controllers/reviewController.js](./server/controllers/reviewController.js#L230) (Dòng **230 đến 266**)
* Hàm `checkReviewEligibility` truy vấn vào bảng `orders`:
  ```javascript
  const deliveredOrders = await Order.find({
    'customer.customerId': userId,
    status: 'delivered', // <-- BẮT BUỘC ĐÃ GIAO HÀNG THÀNH CÔNG
    'items.product': prodObjectId,
  });
  if (deliveredOrders.length === 0) {
    return res.json({ success: true, data: { eligible: false, reason: 'Chỉ khách hàng đã nhận hàng thành công mới có thể gửi đánh giá.' } });
  }
  ```

#### 2. File Frontend (Ẩn/Hiện nút đánh giá):
* Mở file: [client/src/pages/customer/ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx)
  * Gọi API `checkReviewEligibility`. Nếu `eligible === false`, giao diện sẽ ẩn form viết đánh giá và hiển thị khung thông báo nhắc nhở khách hàng.

---

### TÌNH HUỐNG 10: Sửa thông tin trên Phiếu hóa đơn PDF A4 (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Bây giờ cửa hàng đổi tên thành 'MBBC FASHION STORE' hoặc đổi số Hotline in trên hóa đơn PDF, em sửa ở đâu?"*

#### 1. File Backend (Vẽ hóa đơn PDF vector):
* Mở file: [server/services/pdfService.js](./server/services/pdfService.js#L137) (Dòng **137 – 155**)
  ```javascript
  // Dòng 137: Tên cửa hàng
  doc.text('MBBC FASHION STORE', 145, 45);

  // Dòng 146: Hotline
  doc.text('- Hotline: 0987.654.321 -', 145, 62);
  ```

#### 2. File Frontend (Nút tải hóa đơn):
* Mở file: [client/src/pages/admin/orders/OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx)
  * Nút "In hóa đơn (PDF)" gọi endpoint `GET /api/orders/:id/invoice-pdf` để tải file PDF về máy tính.

---

### TÌNH HUỐNG 11: Đổi số lượng sản phẩm mỗi trang (Phân trang từ 12 thành 8) (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Hiện tại mỗi trang danh sách đang hiển thị 12 sản phẩm, em đổi lại thành 8 sản phẩm mỗi trang cho thầy xem?"*

#### 1. Bản chất:
* Backend nhận tham số `limit` từ query URL (mặc định là 12). Backend tính `skip = (page - 1) * limitNum` và query MongoDB: `Product.find().skip(skip).limit(limitNum)`.
* Khi đổi giá trị mặc định của `limit` sang `8`, mỗi trang sẽ chỉ trả về 8 sản phẩm và tổng số trang (`totalPages`) tự động tính lại theo công thức `Math.ceil(total / 8)`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/productController.js](./server/controllers/productController.js#L38) *(Dòng 38 và dòng 172)*
* **Frontend:** [client/src/pages/customer/CategoryPage.jsx](./client/src/pages/customer/CategoryPage.jsx)

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/productController.js](./server/controllers/productController.js#L38):**
  ```javascript
  // Dòng 38: Trước: limit = 12,
  limit = 8,

  // Dòng 172: Trước: const limitNum = parseInt(limit) || 12;
  const limitNum = parseInt(limit) || 8;
  ```

#### 4. Cách kiểm tra kết quả:
* Mở trang Danh mục sản phẩm trên web $\rightarrow$ Đếm số sản phẩm hiển thị trên 1 trang: chính xác 8 sản phẩm.
* Xem phân trang phía dưới: Số trang tự động tăng lên tương ứng.

---

### TÌNH HUỐNG 12: Đổi cấu trúc tiền tố mã đơn hàng (DH-xxxx thành MBBC-2026-xxxx) (BE)
> **Câu hỏi của Giảng viên:**  
> *"Mã đơn hàng đang sinh ra dạng DH-xxxx, giờ thầy muốn mã đơn hàng mang dấu ấn thương hiệu cửa hàng là MBBC-2026-xxxx thì sửa ở đâu?"*

#### 1. Bản chất:
* Khi khách hàng bấm Đặt hàng, Backend tự động sinh chuỗi `orderCode` ngẫu nhiên kết hợp giữa timestamp và 4 chữ số ngẫu nhiên để chống trùng lặp.
* Chuỗi tiền tố được ghép cứng dạng template string: `` `DH-${Date.now().toString().slice(-4)}${randomSuffix}` ``.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L348) *(Dòng 348 – 350)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/orderController.js](./server/controllers/orderController.js#L348):**
  ```javascript
  // Trước khi sửa:
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `DH-${Date.now().toString().slice(-4)}${randomSuffix}`;

  // Sau khi sửa:
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `MBBC-2026-${Date.now().toString().slice(-4)}${randomSuffix}`;
  ```

#### 4. Cách kiểm tra kết quả:
* Đặt 1 đơn hàng thử trên web $\rightarrow$ Kiểm tra trang Chi tiết đơn hàng hoặc Hóa đơn: Mã đơn hàng hiển thị chuẩn `MBBC-2026-xxxx`.

---

### TÌNH HUỐNG 13: Giới hạn số lượng mua tối đa cho mỗi món trong giỏ (Max 5 cái) (FE + BE)
> **Câu hỏi của Giảng viên:**  
> *"Để tránh bị đầu cơ tích trữ, thầy muốn mỗi món hàng khách chỉ được mua tối đa 5 cái trong giỏ, không cho tăng lên số 6, sửa chỗ nào?"*

#### 1. Bản chất:
* Phía **Frontend (`CartContext.jsx`)**: Hàm `updateCartQty` xử lý khi bấm nút cộng (`+`). Cần chặn nếu `newQty > 5` thì dừng lại và hiện thông báo.
* Phía **Backend (`orderController.js`)**: Kiểm tra `if (qty > 5)` để ngăn chặn người dùng cố tình can thiệp API bằng Postman.

#### 2. Các file cần mở & Vị trí:
* **Frontend:** [client/src/context/CartContext.jsx](./client/src/context/CartContext.jsx#L83) *(Dòng 83 – 96)*
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L245) *(Dòng 245 – 252)*

#### 3. So sánh Code:
* **Bước 1: Sửa Frontend trong [client/src/context/CartContext.jsx](./client/src/context/CartContext.jsx#L83):**
  ```javascript
  const updateCartQty = (index, delta) => {
    setCart((prevCart) => {
      if (index < 0 || index >= prevCart.length) return prevCart;
      const updated = [...prevCart];
      const newQty = updated[index].quantity + delta;

      // THÊM ĐIỀU KIỆN CHẶN TỐI ĐA 5 CÁI:
      if (newQty > 5) {
        showToast('Chính sách: Mỗi sản phẩm chỉ được mua tối đa 5 cái trong 1 đơn!');
        return prevCart;
      }

      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      } else {
        updated[index] = { ...updated[index], quantity: newQty };
        return updated;
      }
    });
  };
  ```

* **Bước 2: Sửa Backend trong [server/controllers/orderController.js](./server/controllers/orderController.js#L245):**
  ```javascript
  const qty = parseInt(item.quantity) || 1;
  if (qty > 5) {
    return res.status(400).json({
      success: false,
      message: `Sản phẩm "${product.name}" chỉ được mua tối đa 5 cái trong một đơn hàng`,
    });
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Mở popup Giỏ hàng, bấm nút `+` liên tục $\rightarrow$ Khi đạt mức 5, bấm tiếp `+` hệ thống hiện thông báo cảnh báo và không tăng lên 6.

---

### TÌNH HUỐNG 14: Miễn phí vận chuyển (Freeship) cho đơn hàng từ 500.000 ₫ (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Hiện tại hệ thống tính ship theo GHN. Giờ cửa hàng chạy chương trình: Đơn từ 500.000 ₫ trở lên thì Freeship 0đ, em gắn logic này ở đâu?"*

#### 1. Bản chất:
* Tiền ship được tính từ API GHN nhưng Backend có quyền ghi đè (override) thành `0` nếu tổng tiền hàng `totalAmount >= 500000`.
* Frontend cũng hiển thị phí vận chuyển là `0 ₫` hoặc `Miễn phí` để khách hàng yên tâm thanh toán.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L336) *(Dòng 336 – 345)*
* **Frontend:** [client/src/components/common/StoreModals.jsx](./client/src/components/common/StoreModals.jsx) *(Khu vực tính tạm tính Checkout)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/orderController.js](./server/controllers/orderController.js#L336):**
  ```javascript
  shippingFee = feeResult.total || 0;

  // THÊM VÀO NGAY DƯỚI DÒNG 336:
  if (totalAmount >= 500000) {
    shippingFee = 0; // Đơn hàng từ 500k miễn phí vận chuyển
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Chọn mua các món đồ có tổng tiền trên 500.000 ₫ $\rightarrow$ Điền địa chỉ nhận hàng $\rightarrow$ Phí vận chuyển hiển thị `0 ₫`, tổng thanh toán bằng đúng tiền hàng.

---

### TÌNH HUỐNG 15: Đổi thứ tự sắp xếp sản phẩm mặc định (Từ "Mới nhất" sang "Giá rẻ nhất lên đầu") (BE)
> **Câu hỏi của Giảng viên:**  
> *"Khi khách vừa vào web, thầy muốn mặc định phải thấy các sản phẩm rẻ nhất xếp lên đầu tiên, sửa chỗ nào?"*

#### 1. Bản chất:
* Mặc định khi khách không chọn tiêu chí lọc, API `/api/products` áp dụng `sortOption = { createdAt: -1, _id: -1 }` (sắp xếp giảm dần theo ngày tạo).
* Muốn giá rẻ nhất lên đầu, đổi sang `{ price: 1, _id: 1 }` (sắp xếp tăng dần theo trường `price`).

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/productController.js](./server/controllers/productController.js#L176) *(Dòng 176)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/productController.js](./server/controllers/productController.js#L176):**
  ```javascript
  // Trước khi sửa (Mặc định: Mới nhất):
  let sortOption = { createdAt: -1, _id: -1 };

  // Sau khi sửa (Mặc định: Giá tăng dần - rẻ nhất lên đầu):
  let sortOption = { price: 1, _id: 1 };
  ```

#### 4. Cách kiểm tra kết quả:
* Mở trang chủ hoặc danh mục sản phẩm $\rightarrow$ Sản phẩm có giá thấp nhất (ví dụ: 150.000 ₫) tự động đứng vị trí số 1.

---

### TÌNH HUỐNG 16: Rút ngắn thời hạn Token đăng nhập JWT từ 7 ngày thành 1 ngày (BE)
> **Câu hỏi của Giảng viên:**  
> *"Thời hạn Token 7 ngày là quá dài đối với trang thương mại điện tử. Em giảm xuống 1 ngày (hoặc 2 giờ) để tăng tính bảo mật xem nào?"*

#### 1. Bản chất:
* Sau khi xác thực thông tin đăng nhập thành công, Backend gọi hàm `jwt.sign(payload, secret, options)`. Thuộc tính `expiresIn` quy định thời gian sống của token (`7d` = 7 days, `1d` = 1 day, `2h` = 2 hours).

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/authController.js](./server/controllers/authController.js#L380) *(Dòng 380 – 384)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/authController.js](./server/controllers/authController.js#L380):**
  ```javascript
  // Trước khi sửa:
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Hết hạn sau 7 ngày
  );

  // Sau khi sửa:
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' } // Hết hạn sau 1 ngày (hoặc '2h' nếu muốn 2 giờ)
  );
  ```

#### 4. Cách kiểm tra kết quả:
* Đăng nhập trên web $\rightarrow$ F12 mở tab **Application** $\rightarrow$ **Local Storage** $\rightarrow$ Copy chuỗi `token` dán vào trang `jwt.io` $\rightarrow$ Xem trường `exp` sẽ thấy thời gian hết hạn đúng sau 24 giờ kể từ lúc tạo.

---

### TÌNH HUỐNG 17: Bắt buộc Số điện thoại đăng ký phải đúng chuẩn 10 chữ số VN (FE + BE)
> **Câu hỏi của Giảng viên:**  
> *"Số điện thoại hiện tại cho nhập tùy chọn 9 đến 11 số. Giờ thầy muốn bắt buộc phải nhập đúng 10 số và bắt đầu bằng các đầu số Việt Nam (03, 05, 07, 08, 09)?"*

#### 1. Bản chất:
* Frontend sử dụng biểu thức chính quy (Regex) trong Form validation (`RegisterValidationForm.jsx`).
* Cần đổi Regex thành: `/^(03|05|07|08|09)[0-9]{8}$/` (10 chữ số, 2 số đầu là mạng viễn thông VN).

#### 2. Các file cần mở & Vị trí:
* **Frontend:** [client/src/components/auth/RegisterValidationForm.jsx](./client/src/components/auth/RegisterValidationForm.jsx#L80) *(Dòng 80 – 84 và dòng 116 – 123)*
* **Backend Model:** [server/models/User.js](./server/models/User.js#L24)

#### 3. So sánh Code:
* **Sửa Frontend trong [client/src/components/auth/RegisterValidationForm.jsx](./client/src/components/auth/RegisterValidationForm.jsx#L80):**
  ```javascript
  // Dòng 80 - 84: Sửa hàm kiểm tra Regex
  case 'phone': {
    const val = data.phone.trim().replace(/\s+/g, '');
    if (val === '') return false; // Bắt buộc nhập, không cho để trống
    return /^(03|05|07|08|09)[0-9]{8}$/.test(val);
  }

  // Dòng 118: Đổi thuộc tính bắt buộc trong FIELD_CONFIG
  {
    key: 'phone',
    label: 'Số điện thoại',
    required: true,
    type: 'tel',
    placeholder: '0901234567',
    hint: 'Số điện thoại bắt buộc 10 số (đầu số 03, 05, 07, 08, 09)',
    autoComplete: 'tel',
  },
  ```

#### 4. Cách kiểm tra kết quả:
* Vào trang Đăng ký $\rightarrow$ Nhập thử SĐT 9 số hoặc bắt đầu bằng `01` $\rightarrow$ Form báo lỗi đỏ ngay lập tức. Nhập đúng `0912345678` $\rightarrow$ Form hợp lệ cho phép đăng ký.

---

### TÌNH HUỐNG 18: Hiển thị nhãn giảm giá (Sale Badge -%) trên thẻ sản phẩm (FE)
> **Câu hỏi của Giảng viên:**  
> *"Sản phẩm có giá gốc và giá bán, em tính phần trăm giảm giá và hiển thị nhãn đỏ '-20%' lên góc ảnh sản phẩm như thế nào?"*

#### 1. Bản chất:
* Công thức tính phần trăm giảm giá: `((originalPrice - price) / originalPrice) * 100`.
* Dùng `Math.round()` để làm tròn số nguyên đẹp mắt và dùng điều kiện `product.originalPrice > product.price` để chỉ hiện khi có giảm giá.

#### 2. Các file cần mở & Vị trí:
* **Frontend:** [client/src/pages/customer/ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx) hoặc Card sản phẩm trong [client/src/pages/customer/CustomerHome.jsx](./client/src/pages/customer/CustomerHome.jsx)

#### 3. So sánh Code:
* **Chèn vào góc hình ảnh sản phẩm:**
  ```jsx
  {product.originalPrice > product.price && (
    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
    </span>
  )}
  ```

#### 4. Cách kiểm tra kết quả:
* Xem sản phẩm có giá gốc 500.000 ₫ và giá bán 400.000 ₫ $\rightarrow$ Góc ảnh hiển thị huy hiệu đỏ `-20%`.

---

### TÌNH HUỐNG 19: Bắt buộc khách hàng phải nhập Địa chỉ chi tiết khi đặt hàng (FE + BE)
> **Câu hỏi của Giảng viên:**  
> *"Khách đặt hàng không nhập địa chỉ số nhà/tên đường khiến shipper không giao được. Em chặn không cho đặt hàng nếu để trống địa chỉ ở đâu?"*

#### 1. Bản chất:
* Backend trong hàm `createOrder` cần kiểm tra trường `customer.address.street` có tồn tại và không rỗng. Nếu rỗng thì trả về lỗi HTTP `400`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L209) *(Dòng 209 – 214)*
* **Frontend:** [client/src/components/common/StoreModals.jsx](./client/src/components/common/StoreModals.jsx) *(Form nhập địa chỉ nhận hàng)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/orderController.js](./server/controllers/orderController.js#L209):**
  ```javascript
  // Trước khi sửa:
  if (!customer || !customer.fullName || !customer.phone) {

  // Sau khi sửa:
  if (!customer || !customer.fullName || !customer.phone || !customer.address?.street?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhà chi tiết',
    });
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Khi bấm Thanh toán, để trống ô "Số nhà, tên đường" rồi bấm Đặt hàng $\rightarrow$ Hệ thống chặn lại và báo lỗi yêu cầu nhập đầy đủ địa chỉ.

---

### TÌNH HUỐNG 20: Tự động đánh dấu đơn hàng là 'paid' (Đã thanh toán) khi chọn Chuyển khoản (BE)
> **Câu hỏi của Giảng viên:**  
> *"Nếu khách chọn phương thức thanh toán là chuyển khoản ngân hàng, em muốn mặc định ghi nhận đã thanh toán ngay lúc tạo đơn thì sửa ở đâu?"*

#### 1. Bản chất:
* Mặc định đơn hàng tạo mới có `paymentStatus: 'unpaid'`.
* Khi khách chọn `paymentMethod === 'bank_transfer'`, Backend gán `paymentStatus = 'paid'` trước khi gọi `Order.create()`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L354) *(Dòng 354)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/orderController.js](./server/controllers/orderController.js#L354):**
  ```javascript
  // Trước khi gọi Order.create:
  const paymentStatus = paymentMethod === 'bank_transfer' ? 'paid' : 'unpaid';

  const order = await Order.create({
    orderCode,
    paymentMethod,
    paymentStatus, // Gán trạng thái thanh toán tự động
    ...
  });
  ```

#### 4. Cách kiểm tra kết quả:
* Đặt đơn hàng chọn phương thức "Chuyển khoản ngân hàng" $\rightarrow$ Vào trang Quản lý đơn hàng của Admin: Trạng thái thanh toán hiển thị nhãn xanh **Đã thanh toán (paid)** thay vì Chưa thanh toán.

---

### TÌNH HUỐNG 21: Đổi ngưỡng cảnh báo 'Sắp hết hàng' (Low Stock) từ 10 thành 5 sản phẩm (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Hệ thống đang đánh dấu 'Low stock' khi tồn kho <= 10. Em đổi ngưỡng này thành <= 5 sản phẩm ở cả trang Quản lý kho (Admin) và nhãn cảnh báo 'Chỉ còn X cái' ở trang Chi tiết sản phẩm?"*

#### 1. Bản chất:
* Phía **Backend (`warehouseController.js`)**: Dùng điều kiện `stock <= 10` để gán nhãn `statusLabel = 'low_stock'` và phục vụ bộ lọc kho. Cần đổi số 10 thành số 5.
* Phía **Frontend (`ProductDetailPage.jsx`)**: Kiểm tra `availableStock <= 5` để hiển thị nhãn màu vàng cam kèm hiệu ứng nhấp nháy `"Chỉ còn X cái"`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/warehouseController.js](./server/controllers/warehouseController.js#L30) *(Dòng 30 và dòng 53)*
* **Frontend:** [client/src/pages/customer/ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx#L573) *(Dòng 573)*

#### 3. So sánh Code:
* **Bước 1: Sửa Backend trong [server/controllers/warehouseController.js](./server/controllers/warehouseController.js#L30):**
  ```javascript
  // Dòng 30: Trước: filter.stock = { $gt: 0, $lte: 10 };
  filter.stock = { $gt: 0, $lte: 5 };

  // Dòng 53: Trước: else if (prod.stock <= 10) statusLabel = 'low_stock';
  else if (prod.stock <= 5) {
    statusLabel = 'low_stock';
  }
  ```

* **Bước 2: Sửa Frontend trong [client/src/pages/customer/ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx#L573):**
  ```jsx
  // Dòng 573: Đổi ngưỡng cảnh báo người mua từ 5 thành 3 (hoặc tùy Thầy yêu cầu):
  ) : availableStock <= 3 ? (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Chỉ còn {availableStock} {product.unit || 'cái'}
    </span>
  ) : (
  ```

#### 4. Cách kiểm tra kết quả:
* Vào Admin $\rightarrow$ Quản lý kho $\rightarrow$ Lọc tab "Sắp hết hàng" $\rightarrow$ Chỉ các sản phẩm có tồn kho từ 1 đến 5 cái mới xuất hiện.

---

### TÌNH HUỐNG 22: Chỉ cho phép Hủy đơn hàng khi ở trạng thái 'pending' (Chờ duyệt) (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Khách hoặc nhân viên chỉ được hủy đơn nếu đơn đang ở trạng thái 'Chờ duyệt' (pending). Nếu đơn đã chuyển sang 'Đang xử lý' (processing) hoặc 'Đang giao' (shipping) thì chặn lại không cho hủy, xử lý ở đâu?"*

#### 1. Bản chất:
* Backend trong hàm `updateOrderStatus` nhận trạng thái mới `status === 'cancelled'`. Cần kiểm tra nếu trạng thái cũ `oldStatus !== 'pending'` thì từ chối cập nhật và trả về mã lỗi HTTP `400`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/orderController.js](./server/controllers/orderController.js#L430) *(Dòng 430 – 435)*
* **Frontend:** [client/src/pages/admin/orders/OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx)

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/orderController.js](./server/controllers/orderController.js#L430):**
  ```javascript
  const oldStatus = order.status;

  // THÊM ĐIỀU KIỆN CHẶN HỦY ĐƠN:
  if (status === 'cancelled') {
    if (oldStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được xử lý hoặc đang vận chuyển, không thể hủy!',
      });
    }
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Chọn một đơn hàng đang có trạng thái `Đang xử lý` $\rightarrow$ Thử chuyển trạng thái sang `Đã hủy` $\rightarrow$ Hệ thống lập tức báo lỗi đỏ từ chối hủy.

---

### TÌNH HUỐNG 23: Ràng buộc Giá bán phải lớn hơn hoặc bằng Giá nhập (price >= costPrice) (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Để tránh nhân viên sơ ý bán lỗ vốn, thầy muốn khi thêm hoặc sửa sản phẩm, giá bán (price) bắt buộc phải lớn hơn hoặc bằng giá vốn nhập hàng (costPrice)?"*

#### 1. Bản chất:
* Kiểm tra nghiệp vụ tài chính tại `productController.js` trong cả hàm `createProduct` (thêm mới) và `updateProduct` (chỉnh sửa): nếu `Number(price) < Number(costPrice)` thì trả về lỗi `400`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/productController.js](./server/controllers/productController.js#L428) *(Dòng 428 – 436)*
* **Frontend:** [client/src/pages/admin/products/ProductFormModal.jsx](./client/src/pages/admin/products/ProductFormModal.jsx)

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/productController.js](./server/controllers/productController.js#L428):**
  ```javascript
  // Thêm ngay dưới đoạn kiểm tra costPrice:
  if (costPrice !== undefined && costPrice !== '') {
    if (Number(price) < Number(costPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Quy tắc kinh doanh: Giá bán không được thấp hơn giá vốn nhập hàng!',
      });
    }
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Vào Admin $\rightarrow$ Thêm sản phẩm mới $\rightarrow$ Nhập Giá nhập `200.000 ₫` nhưng nhập Giá bán `150.000 ₫` $\rightarrow$ Bấm Lưu $\rightarrow$ Hệ thống cảnh báo chặn lại ngay lập tức.

---

### TÌNH HUỐNG 24: Bộ lọc từ ngữ nhạy cảm / Thô tục trong Đánh giá sản phẩm (BE)
> **Câu hỏi của Giảng viên:**  
> *"Khi khách hàng gửi nhận xét đánh giá, nếu trong nội dung có chứa từ ngữ thô tục hoặc tiêu cực như 'lừa đảo', 'hàng giả', 'kém chất lượng' thì chặn không cho gửi, xử lý ở đâu?"*

#### 1. Bản chất:
* Sử dụng mảng danh sách từ khóa cấm (Blacklist Keywords). Trong hàm `createReview`, trước khi lưu vào MongoDB, dùng hàm `.some()` kiểm tra chuỗi `content.toLowerCase()` có chứa từ cấm nào không.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/reviewController.js](./server/controllers/reviewController.js#L350) *(Dòng 350 – 356)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/reviewController.js](./server/controllers/reviewController.js#L350):**
  ```javascript
  const trimmedContent = content.trim();

  // THÊM BỘ LỌC TỪ NGỮ CẤM:
  const bannedWords = ['lừa đảo', 'hàng giả', 'hàng nhái', 'kém chất lượng'];
  const hasBannedWord = bannedWords.some((word) =>
    trimmedContent.toLowerCase().includes(word)
  );

  if (hasBannedWord) {
    return res.status(400).json({
      success: false,
      message: 'Nhận xét của bạn chứa từ ngữ không phù hợp với tiêu chuẩn cộng đồng',
    });
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Mua hàng xong $\rightarrow$ Gửi đánh giá có nội dung: *"Shop lừa đảo"* $\rightarrow$ Bấm Gửi $\rightarrow$ Báo lỗi vi phạm tiêu chuẩn cộng đồng.

---

### TÌNH HUỐNG 25: Đổi thời gian chờ gửi lại mã OTP (Cool-down) từ 60s thành 30s (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Nút 'Gửi lại mã OTP' đang bắt người dùng chờ đếm ngược 60 giây. Em đổi thời gian chờ này xuống còn 30 giây (hoặc tăng lên 120 giây) ở đâu?"*

#### 1. Bản chất:
* Backend trong hàm `resendOtp` kiểm tra chênh lệch thời gian `timeSinceLastOtp < 60 * 1000` để chống spam email.
* Frontend trong `OtpVerificationModal.jsx` dùng state `countdown` (mặc định là 60) để đếm lùi từng giây trên nút bấm.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/authController.js](./server/controllers/authController.js#L253) *(Dòng 253 – 255)*
* **Frontend:** [client/src/components/auth/OtpVerificationModal.jsx](./client/src/components/auth/OtpVerificationModal.jsx#L42) *(Dòng 42)*

#### 3. So sánh Code:
* **Bước 1: Sửa Backend trong [server/controllers/authController.js](./server/controllers/authController.js#L253):**
  ```javascript
  // Trước khi sửa (60 giây):
  if (timeSinceLastOtp < 60 * 1000) {
    const remainingSeconds = Math.ceil((60 * 1000 - timeSinceLastOtp) / 1000);

  // Sau khi sửa (30 giây):
  if (timeSinceLastOtp < 30 * 1000) {
    const remainingSeconds = Math.ceil((30 * 1000 - timeSinceLastOtp) / 1000);
  ```

* **Bước 2: Sửa Frontend trong [client/src/components/auth/OtpVerificationModal.jsx](./client/src/components/auth/OtpVerificationModal.jsx#L42):**
  ```javascript
  // Dòng 42: Trước: const [countdown, setCountdown] = useState(60);
  const [countdown, setCountdown] = useState(30);

  // Khi bấm gửi lại mã: setCountdown(30);
  ```

#### 4. Cách kiểm tra kết quả:
* Bấm Đăng ký tài khoản $\rightarrow$ Bảng OTP hiện lên với đồng hồ đếm lùi từ 30s thay vì 60s.

---

### TÌNH HUỐNG 26: Không cho phép Xóa Danh mục nếu đang có sản phẩm (Hard delete an toàn) (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Hiện tại xóa danh mục là chuyển sang inactive. Nếu thầy muốn Xóa hẳn khỏi Database (Hard delete), nhưng phải có ràng buộc: nếu danh mục đang có sản phẩm thì KHÔNG ĐƯỢC XÓA, sửa thế nào?"*

#### 1. Bản chất:
* Trước khi gọi lệnh `Category.findByIdAndDelete(id)`, cần đếm số lượng sản phẩm liên kết: `Product.countDocuments({ category: category.name })`. Nếu kết quả `> 0` thì trả về lỗi `400`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/categoryController.js](./server/controllers/categoryController.js#L371) *(Dòng 371 – 385)*
* **Frontend:** [client/src/pages/admin/categories/CategoriesPage.jsx](./client/src/pages/admin/categories/CategoriesPage.jsx)

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/categoryController.js](./server/controllers/categoryController.js#L371):**
  ```javascript
  const deleteCategory = async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
      }

      // KIỂM TRA RÀNG BUỘC TOÀN VẸN DỮ LIỆU:
      const productCount = await Product.countDocuments({ category: category.name });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa: Đang có ${productCount} sản phẩm thuộc danh mục này!`,
        });
      }

      await Category.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Xóa vĩnh viễn danh mục thành công' });
    } catch (error) { ... }
  };
  ```

---

### TÌNH HUỐNG 27: Mở rộng tính Tổng doanh thu Dashboard (Tính cả đơn 'delivered' VÀ 'paid') (BE)
> **Câu hỏi của Giảng viên:**  
> *"Doanh thu trên trang Tổng quan thống kê (Dashboard) hiện tại chỉ cộng đơn 'delivered'. Thầy muốn tính doanh thu của tất cả đơn đã thanh toán 'paid' (kể cả đang giao hoặc đang chuẩn bị hàng) thì sửa chỗ nào?"*

#### 1. Bản chất:
* Hàm `getOverviewStats` trong `statisticController.js` duyệt qua mảng `allOrders`. Điều kiện cũ chỉ cộng khi `o.status === 'delivered'`. Cần mở rộng thêm điều kiện hoặc `o.paymentStatus === 'paid'`.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/statisticController.js](./server/controllers/statisticController.js#L32) *(Dòng 32 – 34)*
* **Frontend:** [client/src/pages/admin/overview/OverviewPage.jsx](./client/src/pages/admin/overview/OverviewPage.jsx)

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/statisticController.js](./server/controllers/statisticController.js#L32):**
  ```javascript
  // Trước khi sửa (Chỉ tính khi giao thành công):
  if (o.status === 'delivered') {
    totalRevenue += o.totalAmount || 0;
    deliveredOrdersCount++;
  }

  // Sau khi sửa (Giao thành công HOẶC đã thanh toán online):
  if (o.status === 'delivered' || o.paymentStatus === 'paid') {
    totalRevenue += o.totalAmount || 0;
    if (o.status === 'delivered') deliveredOrdersCount++;
  }
  ```

#### 4. Cách kiểm tra kết quả:
* Vào Admin Dashboard $\rightarrow$ Con số "Tổng doanh thu" tăng lên ngay lập tức nhờ cộng thêm các đơn hàng đã thanh toán VNPay/Chuyển khoản đang giao.

---

### TÌNH HUỐNG 28: Tự động khóa tài khoản sau 5 lần nhập sai mật khẩu liên tiếp (Model + BE)
> **Câu hỏi của Giảng viên:**  
> *"Để chống tấn công dò mật khẩu (Brute-force), nếu khách hàng nhập sai mật khẩu 5 lần thì tự động chuyển trạng thái tài khoản sang 'blocked', xử lý ở đâu?"*

#### 1. Bản chất:
* Thêm trường `failedLoginAttempts: { type: Number, default: 0 }` trong `User.js`.
* Trong `authController.js` (hàm `login`), mỗi lần so sánh mật khẩu `bcrypt.compare` bị `false`, ta tăng `user.failedLoginAttempts += 1`. Khi đạt mức $\ge 5$, gán `user.status = 'blocked'`.

#### 2. Các file cần mở & Vị trí:
* **Model:** [server/models/User.js](./server/models/User.js#L34)
* **Backend:** [server/controllers/authController.js](./server/controllers/authController.js#L353) *(Dòng 353 – 360)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/authController.js](./server/controllers/authController.js#L353):**
  ```javascript
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.status = 'blocked';
      await user.save();
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa do nhập sai mật khẩu 5 lần liên tiếp!',
      });
    }
    await user.save();
    return res.status(401).json({
      success: false,
      message: `Mật khẩu không chính xác. Bạn còn ${5 - user.failedLoginAttempts} lần thử.`,
    });
  }
  // Nếu đăng nhập đúng: Reset về 0: user.failedLoginAttempts = 0;
  ```

---

### TÌNH HUỐNG 29: Chỉ ghi log lịch sử (Activity Log) cho tài khoản Admin (BE)
> **Câu hỏi của Giảng viên:**  
> *"Hệ thống Activity Log đang ghi nhận mọi thao tác. Để tránh phình dữ liệu database, thầy muốn chỉ lưu log các hành động của Quản trị viên (Admin), còn khách hàng thì bỏ qua, sửa ở đâu?"*

#### 1. Bản chất:
* Hàm `logActivity` trong `activityLogService.js` được gọi ở mọi nơi. Ta chỉ cần đặt một dòng kiểm tra đầu hàm: nếu người thực hiện không phải `role === 'admin'` thì lập tức `return;` (thoát ngay không ghi vào MongoDB).

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/services/activityLogService.js](./server/services/activityLogService.js#L75) *(Dòng 75 – 82)*

#### 3. So sánh Code:
* **Sửa Backend trong [server/services/activityLogService.js](./server/services/activityLogService.js#L75):**
  ```javascript
  const logActivity = async (params) => {
    try {
      const { req, actor } = params;
      const role = actor?.role || req?.user?.role || 'anonymous';

      // CHỈ LƯU VẾT QUẢN TRỊ VIÊN:
      if (role !== 'admin') {
        return; // Bỏ qua khách hàng và khách vãng lai
      }

      // ... Các lệnh tạo ActivityLog.create bên dưới giữ nguyên
  ```

#### 4. Cách kiểm tra kết quả:
* Dùng tài khoản khách hàng đặt hàng hoặc đăng nhập $\rightarrow$ Vào trang Quản lý nhật ký hoạt động của Admin $\rightarrow$ Không có dòng log rác của khách hàng, bảng log rất sạch sẽ.

---

### TÌNH HUỐNG 30: Ẩn số điện thoại khách hàng trên trang Admin (Masking Phone: 0901***567) (BE + FE)
> **Câu hỏi của Giảng viên:**  
> *"Theo quy định bảo vệ dữ liệu cá nhân, nhân viên xem danh sách khách hàng không được thấy đầy đủ SĐT mà phải che 3 số ở giữa (VD: 0901***567), em làm thế nào?"*

#### 1. Bản chất:
* Phía Backend trong `customerController.js` trước khi trả về dữ liệu, duyệt qua danh sách khách hàng và áp dụng hàm che số điện thoại (Data Masking): lấy 4 số đầu + `***` + 3 số cuối.

#### 2. Các file cần mở & Vị trí:
* **Backend:** [server/controllers/customerController.js](./server/controllers/customerController.js#L36) *(Dòng 36 – 45)*
* **Frontend:** [client/src/pages/admin/customers/CustomersPage.jsx](./client/src/pages/admin/customers/CustomersPage.jsx)

#### 3. So sánh Code:
* **Sửa Backend trong [server/controllers/customerController.js](./server/controllers/customerController.js#L36):**
  ```javascript
  const [customers, total] = await Promise.all([ ... ]);

  // THỰC HIỆN CHE SỐ ĐIỆN THOẠI (MASKING):
  const maskedCustomers = customers.map((c) => {
    const custObj = c.toObject();
    if (custObj.phone && custObj.phone.length >= 7) {
      custObj.phone = custObj.phone.slice(0, 4) + '***' + custObj.phone.slice(-3);
    }
    return custObj;
  });

  res.json({
    success: true,
    data: { customers: maskedCustomers, pagination: ... },
  });
  ```

#### 4. Cách kiểm tra kết quả:
* Vào Admin $\rightarrow$ Quản lý khách hàng $\rightarrow$ Cột Số điện thoại hiển thị dạng `0901***567`, vừa thẩm mỹ vừa chuẩn bảo mật dữ liệu khách hàng!

---

## 📋 BẢNG TRA CỨU NHANH (CHEAT SHEET 30 TÌNH HUỐNG)
*(Mẹo: Bạn có thể giữ phím `Ctrl + Click chuột trái` vào tên file để mở ngay lập tức)*

| STT | Chức năng Giảng viên yêu cầu | File Backend (BE) | File Frontend (FE) |
| :---: | :--- | :--- | :--- |
| **1** | **Đổi câu thông báo Đăng nhập** | [authController.js](./server/controllers/authController.js#L353) | [LoginPage.jsx](./client/src/pages/auth/LoginPage.jsx#L101) |
| **2** | **Đổi OTP 4 số hoặc hạn 10 phút** | [authController.js](./server/controllers/authController.js#L9) | [OtpVerificationModal.jsx](./client/src/components/auth/OtpVerificationModal.jsx#L36) |
| **3** | **Đổi mật khẩu tối thiểu 8 ký tự** | [User.js](./server/models/User.js#L21) & [authController.js](./server/controllers/authController.js#L47) | [RegisterValidationForm.jsx](./client/src/components/auth/RegisterValidationForm.jsx) |
| **4** | **Đơn hàng tối thiểu 100.000 ₫** | [orderController.js](./server/controllers/orderController.js#L320) | [StoreModals.jsx](./client/src/components/common/StoreModals.jsx#L721) |
| **5** | **Hoàn tồn kho khi Hủy đơn hàng** | [orderController.js](./server/controllers/orderController.js#L427) | [OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx) |
| **6** | **Đổi trọng lượng / Kho gửi GHN** | [ghnService.js](./server/services/ghnService.js#L140) | [StoreModals.jsx](./client/src/components/common/StoreModals.jsx#L325) |
| **7** | **Thêm trường mới (Xuất xứ origin)** | [Product.js](./server/models/Product.js#L40) & [productController.js](./server/controllers/productController.js#L55) | [ProductFormModal.jsx](./client/src/pages/admin/products/ProductFormModal.jsx) |
| **8** | **Khóa tài khoản khách hàng** | [authController.js](./server/controllers/authController.js#L314) | [CustomersPage.jsx](./client/src/pages/admin/customers/CustomersPage.jsx) & [LoginPage.jsx](./client/src/pages/auth/LoginPage.jsx) |
| **9** | **Kiểm tra quyền Đánh giá sản phẩm** | [reviewController.js](./server/controllers/reviewController.js#L230) | [ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx) |
| **10** | **Sửa thông tin Hóa đơn PDF A4** | [pdfService.js](./server/services/pdfService.js#L137) | [OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx) |
| **11** | **Đổi phân trang (12 ➔ 8 sản phẩm)** | [productController.js](./server/controllers/productController.js#L38) | [CategoryPage.jsx](./client/src/pages/customer/CategoryPage.jsx) |
| **12** | **Đổi tiền tố mã đơn hàng (MBBC-2026-)** | [orderController.js](./server/controllers/orderController.js#L348) | [OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx) |
| **13** | **Giới hạn số lượng mua tối đa 5 cái** | [orderController.js](./server/controllers/orderController.js#L245) | [CartContext.jsx](./client/src/context/CartContext.jsx#L83) |
| **14** | **Freeship đơn hàng từ 500.000 ₫** | [orderController.js](./server/controllers/orderController.js#L336) | [StoreModals.jsx](./client/src/components/common/StoreModals.jsx) |
| **15** | **Mặc định xếp Giá rẻ nhất lên đầu** | [productController.js](./server/controllers/productController.js#L176) | [CategoryPage.jsx](./client/src/pages/customer/CategoryPage.jsx) |
| **16** | **Rút ngắn hạn Token JWT (1 ngày)** | [authController.js](./server/controllers/authController.js#L380) | Không cần sửa (Frontend tự lưu token mới) |
| **17** | **Bắt buộc SĐT 10 số chuẩn VN** | [User.js](./server/models/User.js#L24) | [RegisterValidationForm.jsx](./client/src/components/auth/RegisterValidationForm.jsx#L80) |
| **18** | **Hiển thị nhãn Sale Badge -%** | Không cần sửa (Backend đã có `originalPrice`) | [ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx) |
| **19** | **Bắt buộc nhập Địa chỉ chi tiết** | [orderController.js](./server/controllers/orderController.js#L209) | [StoreModals.jsx](./client/src/components/common/StoreModals.jsx) |
| **20** | **Tự động gán Paid khi Chuyển khoản** | [orderController.js](./server/controllers/orderController.js#L354) | [OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx) |
| **21** | **Cảnh báo Sắp hết hàng (Low Stock $\le$ 5)** | [warehouseController.js](./server/controllers/warehouseController.js#L30) | [ProductDetailPage.jsx](./client/src/pages/customer/ProductDetailPage.jsx#L573) |
| **22** | **Chỉ cho phép Hủy đơn hàng Pending** | [orderController.js](./server/controllers/orderController.js#L430) | [OrdersPage.jsx](./client/src/pages/admin/orders/OrdersPage.jsx) |
| **23** | **Giá bán phải $\ge$ Giá vốn nhập hàng** | [productController.js](./server/controllers/productController.js#L428) | [ProductFormModal.jsx](./client/src/pages/admin/products/ProductFormModal.jsx) |
| **24** | **Lọc từ ngữ nhạy cảm trong Đánh giá** | [reviewController.js](./server/controllers/reviewController.js#L350) | [ReviewSection.jsx](./client/src/components/customer/ReviewSection.jsx) |
| **25** | **Đổi Cool-down gửi lại OTP (30s)** | [authController.js](./server/controllers/authController.js#L253) | [OtpVerificationModal.jsx](./client/src/components/auth/OtpVerificationModal.jsx#L42) |
| **26** | **Chặn xóa Danh mục đang có sản phẩm** | [categoryController.js](./server/controllers/categoryController.js#L371) | [CategoriesPage.jsx](./client/src/pages/admin/categories/CategoriesPage.jsx) |
| **27** | **Mở rộng doanh thu (Delivered + Paid)** | [statisticController.js](./server/controllers/statisticController.js#L32) | [OverviewPage.jsx](./client/src/pages/admin/overview/OverviewPage.jsx) |
| **28** | **Khóa tài khoản sau 5 lần sai pass** | [authController.js](./server/controllers/authController.js#L353) | [User.js](./server/models/User.js#L34) |
| **29** | **Chỉ lưu Activity Log cho Admin** | [activityLogService.js](./server/services/activityLogService.js#L75) | [ActivityLogsPage.jsx](./client/src/pages/admin/activity-logs/ActivityLogsPage.jsx) |
| **30** | **Ẩn SĐT khách hàng (Masking 0901***567)** | [customerController.js](./server/controllers/customerController.js#L36) | [CustomersPage.jsx](./client/src/pages/admin/customers/CustomersPage.jsx) |

---
*Tài liệu thực chiến 30 tình huống đỉnh cao được biên soạn chuẩn xác 100% cả Backend lẫn Frontend cho đồ án tốt nghiệp MBBC 2026. Chúc bạn tự tin đạt điểm xuất sắc!*


