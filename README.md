# 🚀 Miniapps API Backend - Node.js + Supabase PostgreSQL

Hệ thống API backend hoàn chỉnh dành cho nền tảng quản lý **Mini App** kết nối trực tiếp với **Supabase PostgreSQL** thông qua cổng kết nối IPv4 (Connection Pooler). 

Backend được xây dựng theo kiến trúc phân tầng chuyên nghiệp (**Routers - Controllers - Services - Database Layer**) giúp mã nguồn mở rộng dễ dàng, bảo mật cao, và tích hợp sẵn cơ chế **tự động cập nhật Schema (Auto-Init)** khi server khởi động.

---

## 🛠️ 1. Cài đặt & Khởi chạy

### Cài đặt thư viện
```bash
npm install
```

### Cấu hình biến môi trường (`.env`)
Tạo hoặc cập nhật file `.env` tại thư mục gốc của dự án:
```env
# URL kết nối tới Connection Pooler của Supabase (Bắt buộc phải mã hóa ký tự đặc biệt ở mật khẩu như @ -> %40)
DATABASE_URL=postgresql://postgres.ivhrpetuemmqnmowsywk:365ejsc%402026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres

# Cấu hình JWT Tokens
ACCESS_TOKEN_SECRET=miniapps_access_secret_token_key_123456
REFRESH_TOKEN_SECRET=miniapps_refresh_secret_token_key_789012

PORT=3000
```

### Khởi chạy môi trường phát triển (Local Dev)
```bash
npm run dev
```
Nodemon sẽ tự động theo dõi thay đổi và khởi động lại server tại: `http://localhost:3000`

---

## 📂 2. Thiết kế Cơ sở dữ liệu (Database Schema)
Hệ thống sử dụng **6 bảng** quan hệ và các **chỉ mục (indexes)** để tối ưu truy vấn:
1.  `users`: Quản lý tài khoản quản trị viên nền tảng.
2.  `mini_app_categories`: Phân loại danh mục Mini App.
3.  `mini_apps`: Lưu trữ toàn bộ thông tin Mini App.
4.  `mini_app_members`: Thành viên/User được duyệt của từng Mini App.
5.  `bridge_scripts`: Các đoạn mã script JS Bridge tích hợp SDK.
6.  `refresh_tokens`: Lưu trữ Refresh Token để cấp lại Access Token mới.

> [!NOTE]  
> Toàn bộ các thao tác xóa dữ liệu (User, Category, Mini App, Script) đều sử dụng cơ chế **xóa mềm (Soft Delete)** bằng cách chuyển trạng thái `is_actived = false` thay vì xóa vật lý, đảm bảo an toàn toàn vẹn dữ liệu.

---

## 📋 3. Danh sách API Endpoints & Request Payloads

Tất cả các API được đặt dưới tiền tố `/api`. Các endpoint ghi dữ liệu (POST, PUT, DELETE) hoặc thông tin nhạy cảm yêu cầu phải đính kèm Header: `Authorization: Bearer <access_token>`.

### 🏥 3.1. Health Check (Công cộng)
*   **Endpoint:** `GET /health`
*   **Ý nghĩa:** Kiểm tra server và trạng thái kết nối tới Database.
*   **Response mẫu (200 OK):**
    ```json
    {
      "ok": true,
      "message": "API service is active and database is connected",
      "timestamp": "2026-05-22T13:30:00.123Z"
    }
    ```

---

### 🔑 3.2. Nhóm API Xác thực (Auth)
#### 1. Đăng ký tài khoản (`POST /api/auth/register` - Công cộng)
*   **Request Body:**
    ```json
    {
      "username": "admin_ejsc",
      "password": "Password365@",
      "full_name": "EJSC Administrator",
      "email": "admin@ejsc.com",
      "avatar_url": "https://avatar.placeholder/admin"
    }
    ```
#### 2. Đăng nhập (`POST /api/auth/login` - Công cộng)
*   **Request Body:**
    ```json
    {
      "username": "admin_ejsc",
      "password": "Password365@"
    }
    ```
*   **Response mẫu (200 OK):** Trả về Access Token (hạn 15 phút) và Refresh Token (hạn 30 ngày).
    ```json
    {
      "ok": true,
      "message": "Login successful",
      "data": {
        "user": {
          "id": 1,
          "username": "admin_ejsc",
          "full_name": "EJSC Administrator",
          "email": "admin@ejsc.com",
          "avatar_url": "https://avatar.placeholder/admin"
        },
        "accessToken": "eyJhbGciOi...",
        "refreshToken": "eyJhbGciOi..."
      }
    }
    ```
#### 3. Làm mới Access Token (`POST /api/auth/refresh` - Công cộng)
*   **Request Body:**
    ```json
    {
      "refreshToken": "eyJhbGciOi..."
    }
    ```
#### 4. Đăng xuất (`POST /api/auth/logout` - Công cộng)
*   **Request Body:**
    ```json
    {
      "refreshToken": "eyJhbGciOi..."
    }
    ```

---

### 👥 3.3. Nhóm API Quản lý Người dùng (Users)
*   `GET /api/users` (Công cộng): Lấy danh sách tài khoản đang hoạt động (`is_actived = true`).
*   `GET /api/users/:id` (Công cộng): Lấy thông tin tài khoản cụ thể.
*   `PUT /api/users/:id` (Yêu cầu Auth): Cập nhật thông tin profile (cho phép đổi mật khẩu).
*   `DELETE /api/users/:id` (Yêu cầu Auth): Xóa mềm tài khoản (`is_actived = false`), thu hồi toàn bộ Refresh Tokens.

---

### 📁 3.4. Nhóm API Danh mục (Categories)
*   `GET /api/categories` (Công cộng): Lấy danh sách các danh mục đang hoạt động.
*   `GET /api/categories/:id` (Công cộng): Lấy chi tiết danh mục theo ID.
*   `GET /api/categories/all/admin` (Công cộng): Lấy toàn bộ danh mục kể cả danh mục đã tắt (Dành cho admin quản trị).
*   `POST /api/categories` (Yêu cầu Auth): Tạo danh mục mới.
    *   **Payload:** `{"name": "Du lịch & Đi lại", "code": "travel", "icon_url": "https://url-to-icon"}`
*   `PUT /api/categories/:id` (Yêu cầu Auth): Cập nhật thông tin danh mục.
*   `DELETE /api/categories/:id` (Yêu cầu Auth): Xóa mềm danh mục.

---

### 📱 3.5. Nhóm API Mini Apps
*   `GET /api/mini-apps` (Công cộng): Lấy danh sách Mini App đang hoạt động và không ẩn.
    *   *Query Parameters:*
        *   `category_id`: Lọc theo ID danh mục.
        *   `search`: Tìm kiếm theo tên hoặc `app_id` (không phân biệt chữ hoa/thường).
        *   `include_hidden=true`: Hiển thị cả các app đang ẩn (Yêu cầu Auth).
        *   `include_inactive=true`: Hiển thị cả các app đã bị dừng hoạt động (Yêu cầu Auth).
*   `GET /api/mini-apps/:id` (Công cộng): Lấy chi tiết Mini App theo ID.
*   `GET /api/mini-apps/app-id/:appId` (Công cộng): Lấy chi tiết Mini App theo chuỗi mã định danh duy nhất (ví dụ: `com.ejsc.booking`).
*   `POST /api/mini-apps` (Yêu cầu Auth): Tạo mới Mini App.
    *   **Payload:**
        ```json
        {
          "app_id": "com.ejsc.booking",
          "name": "EJSC Đặt Xe Nhanh",
          "category_id": 1,
          "short_description": "Ứng dụng đặt xe công nghệ tiện lợi",
          "description": "Mô tả đầy đủ chi tiết ứng dụng đặt xe...",
          "icon_url": "https://url-icon",
          "url": "https://booking.ejsc.com",
          "version": "1.0.0",
          "requires_auth": true,
          "is_hidden": false
        }
        ```
*   `PUT /api/mini-apps/:id` (Yêu cầu Auth): Cập nhật thông tin Mini App.
*   `DELETE /api/mini-apps/:id` (Yêu cầu Auth): Xóa mềm Mini App.

---

### 👥 3.6. Nhóm API Quản lý Thành viên Mini App (Members)
Các API này giúp doanh nghiệp quản lý danh sách người dùng được phép truy cập vào Mini App nội bộ.

#### 1. Thêm thành viên hàng loạt (`POST /api/mini-apps/:mini_app_id/members` - Yêu cầu Auth)
*   **Payload:**
    ```json
    {
      "user_ids": [1, 2, 5],
      "status": 1
    }
    ```
    *(Mặc định `status = 1` là Đã Duyệt. Sẽ tự động kiểm tra trùng lặp để cập nhật lại thay vì tạo dòng mới).*

#### 2. Cập nhật trạng thái thành viên hàng loạt (`PUT /api/mini-apps/:mini_app_id/members` - Yêu cầu Auth)
*   **Payload:** Chuyển trạng thái hàng loạt sang khóa tạm thời (`status = 2`).
    ```json
    {
      "user_ids": [1, 2],
      "status": 2
    }
    ```

#### 3. Xóa thành viên hàng loạt (`DELETE /api/mini-apps/:mini_app_id/members` - Yêu cầu Auth)
*   **Payload:** Đánh dấu thành viên là Đã xóa (`status = 3`).
    ```json
    {
      "user_ids": [1, 2]
    }
    ```

#### 4. Xem danh sách thành viên của Mini App (`GET /api/mini-apps/:mini_app_id/members` - Công cộng)
*   *Query Parameters:* `status=1` (Bộ lọc tùy chọn để lọc theo trạng thái).
*   **Response mẫu:** Trả kèm đầy đủ thông tin profile của User.
    ```json
    {
      "ok": true,
      "message": "Members fetched successfully",
      "data": [
        {
          "member_id": 12,
          "user_id": 2,
          "username": "si_tran",
          "full_name": "Trần Văn Sĩ",
          "email": "si@ejsc.com",
          "avatar_url": "https://avatar-url",
          "status": 1,
          "added_at": "2026-05-22T06:40:00.000Z"
        }
      ]
    }
    ```

---

### 📜 3.7. Nhóm API Quản lý JS Bridge Script
Dùng để quản lý các file/script SDK hỗ trợ ứng dụng Mini App gọi hàm native của điện thoại.

*   `GET /api/scripts` (Công cộng): Lấy danh sách các SDK Bridge Script đang hoạt động.
    *   *Query Parameters:* `type` (tìm kiếm theo loại SDK).
*   `GET /api/scripts/:id`: Xem chi tiết script theo ID.
*   `GET /api/scripts/type/:type`: Xem chi tiết script theo chuỗi định danh loại (ví dụ: `zalo_sdk`).
*   `POST /api/scripts` (Yêu cầu Auth): Tạo mới SDK Bridge Script.
    *   **Payload:**
        ```json
        {
          "type": "zalo_sdk",
          "version": "1.2.0",
          "description": "SDK Bridge hỗ trợ nền tảng Zalo Mini App",
          "content": "window.JSBridge = { ... }"
        }
        ```
*   `PUT /api/scripts/:id` (Yêu cầu Auth): Cập nhật SDK Bridge Script.
*   `DELETE /api/scripts/:id` (Yêu cầu Auth): Xóa mềm SDK.

---

## 📥 4. Tích hợp Postman Collection (Import Ăn Ngay)
Toàn bộ các API mẫu kể trên với đầy đủ Request Body JSON, Headers và cấu hình Token tự động đã được tổng hợp tại:
👉 [**`Miniapps_API.postman_collection.json`**](file:///d:/miniapps_dev/miniapps_api/Miniapps_API.postman_collection.json)

**Cách sử dụng:**
1. Mở phần mềm Postman và nhấn **Import**.
2. Kéo thả file `Miniapps_API.postman_collection.json` vào.
3. Collection đã cấu hình sẵn biến môi trường `{{baseUrl}}` mặc định trỏ về `http://localhost:3000`. Khi deploy, bạn chỉ cần cấu hình trị baseUrl trỏ về server mới là có thể chạy thử ngay!
