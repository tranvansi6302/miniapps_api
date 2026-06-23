# Tổng kết giải pháp: Tự động kế thừa cấu hình từ Mini App cho Menu (Portal & Account)

Tài liệu này ghi lại chi tiết giải pháp thiết kế và các thay đổi đã thực hiện cho cả Backend và Frontend để tối ưu việc khai báo Menu liên kết với Mini App.

---

## 1. Vấn đề ban đầu
- Trước đây, khi cấu hình các menu liên kết đến Mini App (cả menu portal `app_menus` lẫn menu cá nhân `account_menus`), chúng ta phải khai báo thủ công các trường: `url`, `version`, `file_path`, `file_hash`, `file_checksum`, `permissions`, và `policy`.
- Việc này gây trùng lặp dữ liệu vì các trường này vốn dĩ đã được định nghĩa và quản lý tập trung ở bảng `mini_apps` của mỗi Mini App.
- Hơn nữa, cột `url` trong bảng `account_menus` bị ràng buộc `NOT NULL`, bắt buộc người dùng phải nhập mặc dù menu đó đã liên kết với Mini App (dẫn đến lỗi khi cấu hình).

---

## 2. Giải pháp triển khai hiện tại

### A. Phía Database (SQL & Migration)
1. **Loại bỏ ràng buộc `NOT NULL` của cột `url`** trong bảng `account_menus`.
   - Giúp cho phép cột `url` nhận giá trị `NULL` trong DB khi tạo mới hoặc cập nhật menu có liên kết `app_id`.
   - Script chạy migration: [migrate_drop_url_not_null.js](file:///d:/miniapps_dev/miniapps_api/src/migrate_drop_url_not_null.js) (`ALTER TABLE account_menus ALTER COLUMN url DROP NOT NULL`).
   - Cập nhật file cấu trúc gốc: [init.sql](file:///d:/miniapps_dev/miniapps_api/sql/init.sql).

### B. Phía Backend Services (API)
Khi Client gọi API lấy danh sách hoặc thông tin chi tiết của menu (`/api/menus`, `/api/account-menus`), hệ thống sẽ thực hiện truy vấn trực tiếp từ bảng `app_menus` và `account_menus` để trả về dữ liệu nguyên bản:
1. **Liên kết qua `app_id`**: Trả về `app_id` tương ứng (ví dụ: `user.global.homebooking` hoặc `partner.global.homebooking`).
2. **Đường dẫn con (`url`)**: Trả về sub-route nguyên bản (ví dụ: `/#/profile`, `/#/change-password`, `/#/`).
*Lưu ý:* Backend không còn thực hiện `LEFT JOIN` hay tự động ghép nối URL/Permissions/Policy nữa. Phía ứng dụng khách (Client/Super App) sẽ chịu trách nhiệm lấy thông tin chi tiết của Mini App từ API `/api/mini-apps` và tự động mapping/phân giải dựa theo `app_id` tương ứng của Menu.

*Các file backend được thay đổi:*
- [account-menu.service.js](file:///d:/miniapps_dev/miniapps_api/src/services/account-menu.service.js)
- [app-menu.service.js](file:///d:/miniapps_dev/miniapps_api/src/services/app-menu.service.js)

### C. Phía Frontend Portal (Giao diện Quản trị)
1. **Cập nhật quy tắc validate của ô nhập URL** trong trang cấu hình Menu cá nhân.
   - Đổi ràng buộc bắt buộc (required) thành xác thực điều kiện: Ô nhập URL chỉ bắt buộc khi **không** chọn Mini App liên kết.
   - Khi đã chọn Mini App liên kết (`app_id`), người dùng có thể bỏ trống ô URL này, hệ thống sẽ lưu `null` xuống database và tự động nhận diện URL của Mini App tương ứng ở runtime.

*File frontend được thay đổi:*
- [AccountMenuTab.jsx](file:///d:/miniapps_dev/frontend/src/components/AccountMenuTab.jsx)

---

## 3. Cách vận hành & Cấu hình sau thay đổi
- **Khi tạo Menu thường (không phải Mini App)**: Nhập đầy đủ Tên, Key, và URL chuyển trang tuyệt đối hoặc tương đối.
- **Khi tạo Menu Mini App**:
  1. Chỉ cần điền Tên hiển thị, Mã định danh (Key).
  2. Chọn Mini App mong muốn ở ô **"Liên kết Mini App"** (`app_id`).
  3. Để trống ô **"Đường dẫn chuyển trang / Deeplink"** (trừ trường hợp muốn trỏ vào một router con cụ thể của Mini App đó như `/settings`, `/profile`).
  4. Các ô thông tin khác như Phiên bản, Đường dẫn file build, Quyền truy cập, Policy bảo mật **không cần nhập** (để trống), hệ thống sẽ tự động đồng bộ từ cấu hình của Mini App đã liên kết.

---

## 4. Thực tế dọn dẹp dữ liệu (DB Cleanup & Remapping)
Chúng ta đã chạy script dọn dẹp dữ liệu [migrate_cleanup_miniapps.js](file:///d:/miniapps_dev/miniapps_api/src/migrate_cleanup_miniapps.js) để:
1. **Dọn dẹp bảng `mini_apps`**: Xóa 10 mini app phụ (như `user.global.homebooking.profile`, `user.global.homebooking.change-password`,...). Hiện tại chỉ giữ lại 3 Mini App chính trong hệ thống:
   - `user.global.homebooking` (App chính cho User)
   - `partner.global.homebooking` (App chính cho Partner)
   - `com.ejsc.testapp_32423` (App test EJSC)
2. **Cập nhật lại liên kết trong `account_menus` và `app_menus`**:
   - Chuyển tất cả các menu con về liên kết chung tới `app_id = 'user.global.homebooking'`.
   - Cập nhật lại cột `url` của từng menu con thành router tương ứng (ví dụ: `/profile` chuyển thành `/#/profile`, `/change-password` chuyển thành `/#/change-password`,...).
   - Khi API trả về, các URL này sẽ được tự động phân giải thành địa chỉ tuyệt đối chính xác (ví dụ: `https://homebooking-user.vercel.app/#/profile`).
   - Trên UI quản trị Portal, các menu đã được gom nhóm hiển thị cực kỳ gọn gàng dưới 2 Mini App chính.
3. **Loại bỏ cột `sub_apps`**:
   - Xóa bỏ cột `sub_apps` khỏi bảng `mini_apps` trong DB (`ALTER TABLE mini_apps DROP COLUMN IF EXISTS sub_apps`).
   - Loại bỏ code xử lý `sub_apps` trong service [mini-app.service.js](file:///d:/miniapps_dev/miniapps_api/src/services/mini-app.service.js) và controller [mini-app.controller.js](file:///d:/miniapps_dev/miniapps_api/src/controllers/mini-app.controller.js) để response trả về từ `/api/mini-apps` sạch hoàn toàn, không còn mảng lồng ghép.
