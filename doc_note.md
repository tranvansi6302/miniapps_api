# Tài liệu Đặc tả Dữ liệu API & Danh sách Mini Apps

Tài liệu này tổng hợp toàn bộ các Mini Apps đang có trong hệ thống cơ sở dữ liệu, các API endpoints trả về dữ liệu và cách các menu liên kết động đến các ứng dụng này.

---

## 1. Danh sách đầy đủ các Mini Apps trong hệ thống

Dưới đây là tất cả các Mini Apps được cấu hình trong bảng `mini_apps` của cơ sở dữ liệu:

| ID | Mã Định Danh (`app_id`) | Tên ứng dụng | URL mặc định (Production) |
| :--- | :--- | :--- | :--- |
| 1 | `partner.global.homebooking` | Partner HomeBooking (Dành cho đối tác) | `https://hb-miniapp-partner.vercel.app/` |
| 2 | `user.global.homebooking` | HomeBooking (Dành cho khách hàng) | `https://homebooking-user.vercel.app` |
| 3 | `user.global.homebooking.home` | Trang chủ HomeBooking | `https://homebooking-user.vercel.app/#/` |
| 4 | `user.global.homebooking.profile` | Thông tin cá nhân | `https://homebooking-user.vercel.app/#/profile` |
| 5 | `user.global.homebooking.change-password` | Đổi mật khẩu | `https://homebooking-user.vercel.app/#/change-password` |
| 6 | `user.global.homebooking.address-book` | Sổ địa chỉ | `https://homebooking-user.vercel.app/#/address-book` |
| 7 | `user.global.homebooking.notifications` | Thông báo | `https://homebooking-user.vercel.app/#/notifications` |
| 8 | `user.global.homebooking.help-center` | Trung tâm trợ giúp | `https://homebooking-user.vercel.app/#/help-center` |
| 9 | `user.global.homebooking.terms-and-policies` | Điều khoản & Chính sách | `https://homebooking-user.vercel.app/#/terms-and-policies` |
| 10 | `user.global.homebooking.bookings` | Đặt chỗ | `https://homebooking-user.vercel.app/#/bookings` |
| 11 | `user.global.homebooking.services` | Dịch vụ | `https://homebooking-user.vercel.app/#/services` |
| 12 | `user.global.homebooking.activities` | Hoạt động | `https://homebooking-user.vercel.app/#/activities` |

---
    
## 2. Cách các API Menus truy vấn & Gắn URL động theo `app_id`

Khi các ứng dụng Client (như Mobile App) gọi đến các API lấy menu dưới đây, Backend sẽ tự động đối chiếu trường `app_id` của từng menu với danh sách Mini Apps ở trên để ghi đè trường `url` động tương ứng.

### 2.1. API App Menus (Thanh điều hướng chính)
* **Endpoint**: `GET /api/app-menus`
* **Cơ chế hoạt động**: Đối với các menu có `menu_type = 0` (Webview) và có khai báo `app_id`, Backend sẽ tìm Mini App tương ứng trong bảng `mini_apps` rồi gán URL của nó vào trường `url` trước khi trả về cho Client.
* **Cấu trúc JSON trả về mẫu**:
```json
{
  "id": 3,
  "menu_type": 0,
  "mnu_name": "hb-wv-user-nav-home",
  "mnu_image": "https://ivhrpetuemmqnmowsywk.supabase.co/storage/v1/object/public/miniappstorage/menu_img_1781194058.png",
  "mnu_image_actived": "https://ivhrpetuemmqnmowsywk.supabase.co/storage/v1/object/public/miniappstorage/menu_img_1781194064.png",
  "mnu_bg_color": "#ffff",
  "mnu_brd_color": "#fffff",
  "mnu_txt_color": "#33333",
  "mnu_txt_color_actived": "#003F3C",
  "mnu_order": 1,
  "mnu_position": "BOTTOM_NAV",
  "menupid": null,
  "app_id": "user.global.homebooking.home",
  "requires_auth": false,
  "url": "https://homebooking-user.vercel.app/#/", // Tự động lấy từ app_id: user.global.homebooking.home
  "is_hidden": false,
  "is_action_button": false
}
```

### 2.2. API Account Menus (Menu trong trang cá nhân)
* **Endpoint**: `GET /api/account-menus`
* **Cơ chế hoạt động**: Tương tự như trên, tự động đối chiếu `app_id` của từng item trong các phân mục cá nhân để lấy ra URL mới nhất của trang con tương ứng. Trả về cấu trúc được phân nhóm theo `category`.
* **Cấu trúc JSON trả về mẫu**:
```json
[
  {
    "category": "Cá nhân",
    "items": [
      {
        "id": 1,
        "key": "edit_profile",
        "category": "Cá nhân",
        "mnu_name": "Thông tin cá nhân",
        "mnu_image": "https://...",
        "url": "https://homebooking-user.vercel.app/#/profile", // Tự động lấy từ app_id: user.global.homebooking.profile
        "menu_type": 0,
        "right_icon": "chevron-right",
        "mnu_order": 1,
        "requires_auth": true,
        "is_hidden": false,
        "is_actived": true,
        "app_id": "user.global.homebooking.profile"
      }
    ]
  }
]
```
