# FE_Computer — HK COMPUTER Storefront & Paper Admin Dashboard

Giao diện khách hàng và cổng quản trị Admin của hệ thống bán lẻ đa cơ sở **HK COMPUTER** (Laptop · PC & Màn hình · Phụ kiện công nghệ), viết bằng **HTML5 + CSS3 Design Tokens + Vanilla ES Modules** (không phụ thuộc bundler nặng).

## 1. Cấu trúc Module JavaScript (`assets/js/`)

Các module được tách nhỏ theo đúng trách nhiệm chức năng để dễ bảo trì và kiểm thử độc lập:

- **Hạ tầng & Cấu hình:**
  - `config.js` — Cấu hình trung tâm, endpoint REST và `FALLBACK_BRANCHES` (3 cơ sở trọng điểm `HN-THAIHA`, `HCM-QUAN10`, `DN-HAICHAU`).
  - `branch-store.js` — Nguồn dữ liệu chi nhánh thống nhất: luôn lấy dữ liệu chính từ `GET /api/branches` (single-flight cache) và **chỉ dùng `FALLBACK_BRANCHES` khi trang vừa khởi tạo hoặc Backend tạm mất kết nối**.
  - `api.js` — HTTP Client đính kèm Bearer JWT, tự động xoay vòng Refresh Cookie khi gặp `HTTP 401`, bóc tách chuẩn `ApiResponse<T>` (`400` lỗi nghiệp vụ / `500` lỗi hệ thống).
  - `utils.js`, `toast.js`, `theme.js` — Tiện ích định dạng tiền tệ VND, chống XSS (`escapeHtml`), kiểm tra SĐT 10 số và thông báo.
- **Khung giao diện khách hàng (`layout.js` & các module con):**
  - `layout.js` — Khung Header & Footer dùng chung.
  - `location-modal.js` — Hộp thoại chọn Tỉnh/Thành phố & Cơ sở xem tồn kho.
  - `quick-repair-modal.js` — Hộp thoại đặt lịch sửa chữa nhanh (`AT_STORE` / `AT_HOME`).
  - `mobile-nav.js` — Thanh điều hướng đáy cố định cho màn hình di động (`360px`+) và đồng bộ huy hiệu giỏ hàng.
- **Trang chủ & Tư vấn:**
  - `home.js` — Bộ lọc danh mục, thương hiệu, khoảng giá và lưới sản phẩm.
  - `product-compare.js` — Thanh nổi & bảng so sánh song song tối đa 3 mẫu Laptop/PC.
  - `home-repair.js` — Danh bạ 3 chi nhánh và biểu mẫu đặt lịch sửa chữa `#repair-center`.
  - `chat-widget.js` — Khung chat Trợ lý AI Hybrid (Quick Prompt Chips, hiệu ứng đang gõ, lọc chống XSS & whitelist nút mua hàng).
- **Tài khoản, Giỏ hàng & Quản trị:**
  - `auth.js`, `cart.js` — Đăng nhập/Đăng ký/OTP tách biệt cổng Khách & cổng Admin; đồng bộ giỏ hàng.
  - `admin-layout.js` — Khung quản trị phong cách **Creative Tim Paper Dashboard** (Sidebar + Topbar đáp ứng tốt trên cả Desktop & Mobile).

## 2. Chạy kiểm thử tự động Frontend

Yêu cầu **Node.js >= 20** (không cần cài thêm thư viện ngoài):

```bash
npm test
```

Bộ kiểm thử (`tests/frontend-integrity.test.mjs` & `tests/modules-unit.test.mjs`) tự động kiểm chứng:
1. Cú pháp hợp lệ của toàn bộ file `assets/js/*.js` và toàn bộ khối `<script type="module">` nội tuyến trong các trang `.html`.
2. Mọi đường dẫn `import` cục bộ đều trỏ tới file tồn tại thực tế và không còn liên kết cũ đã gỡ bỏ.
3. Logic đơn vị của `branch-store.js` (`API` vs `FALLBACK`), `api.js` (`handleResponse` 200/400/500), `product-compare.js` (giới hạn 3 máy), `utils.js` và bộ lọc chống XSS trong `chat-widget.js`.
