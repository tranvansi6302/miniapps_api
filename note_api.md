# Danh sách API (GET)

**Base URL**: `https://miniapps-api-2zb0.onrender.com/api`
**Xác thực (Protected)**: Thêm Header `Authorization: Bearer <token>`

---

### 1. Lấy danh sách Mini Apps
- **URL**: `/mini-apps`
- **Method**: `GET` (Public)
- **Input (Query Params)**:
  - `category_id` (number): Lọc theo ID danh mục.
  - `search` (string): Tìm kiếm theo mã `app_id` hoặc tên `name`.
  - `include_hidden` (boolean): Truyền `true` để lấy cả app ẩn.
  - `include_inactive` (boolean): Truyền `true` để lấy cả app ngừng hoạt động.
  - `mine` (boolean): Truyền `true` để lấy app của mình (Yêu cầu Token).
- **Output (JSON)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "app_id": "com.example.app",
      "name": "Tên ứng dụng",
      "category_id": 2,
      "category_name": "Tên danh mục",
      "short_description": "Mô tả ngắn...",
      "description": "Mô tả dài...",
      "icon_url": "https://...",
      "url": "https://...",
      "version": "1.0.0",
      "requires_auth": false,
      "is_hidden": false,
      "is_actived": true,
      "terms_url": "...",
      "privacy_policy_url": "...",
      "permissions": ["camera", "location"]
    }
  ],
  "message": "Mini Apps fetched successfully"
}
```

### 2. Lấy chi tiết Mini App bằng ID
- **URL**: `/mini-apps/:id`
- **Method**: `GET` (Public)
- **Input (Path Params)**:
  - `id` (number): ID gốc trong Database của Mini App.
- **Output (JSON)**: Trả về `data` là Object chứa chi tiết thông tin 1 Mini App (các trường tương tự API số 1).

### 3. Lấy chi tiết Mini App bằng App ID
- **URL**: `/mini-apps/app-id/:appId`
- **Method**: `GET` (Public)
- **Input (Path Params)**:
  - `appId` (string): Mã định danh tự đặt (`app_id`).
- **Output (JSON)**: Trả về `data` là Object chứa chi tiết thông tin 1 Mini App (các trường tương tự API số 1).

### 4. Kiểm tra quyền truy cập Mini App
- **URL**: `/mini-apps/app-id/:appId/check-access`
- **Method**: `GET` (Protected)
- **Input (Path Params)**:
  - `appId` (string): Mã định danh (`app_id`).
- **Output (JSON)**:
  - Đăng nhập và là thành viên: Trả về Object thông tin chi tiết Mini App.
  - Không có quyền: Báo lỗi `Access denied` (HTTP 403).

---

### 5. Lấy Bridge Script đang hoạt động (Active)
- **URL**: `/scripts`
- **Method**: `GET` (Public)
- **Output (JSON)**: Trả về Object chi tiết của phiên bản Script mới nhất (hoạt động).
```json
{
  "success": true,
  "data": {
    "id": 2,
    "version": "1.1.0",
    "description": "Cập nhật hàm callBridge API",
    "content": "console.log('v1.1.0');",
    "created_at": "2026-05-26T03:00:00.000Z"
  },
  "message": "Active bridge script fetched successfully"
}
```

### 6. Lấy lịch sử các phiên bản Bridge Script
- **URL**: `/scripts/history`
- **Method**: `GET` (Public)
- **Output (JSON)**: Trả về danh sách các phiên bản đã thay đổi (không bao gồm trường `content` để giảm dung lượng tải).
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "version": "1.1.0",
      "description": "Cập nhật hàm callBridge API",
      "created_at": "2026-05-26T03:00:00.000Z"
    },
    {
      "id": 1,
      "version": "1.0.0",
      "description": "First initial version",
      "created_at": "2026-05-26T02:50:00.000Z"
    }
  ],
  "message": "Bridge scripts history fetched successfully"
}
```

### 7. Lấy chi tiết phiên bản Bridge Script bằng ID
- **URL**: `/scripts/:id`
- **Method**: `GET` (Public)
- **Input (Path Params)**:
  - `id` (number): ID của phiên bản trong database.
- **Output (JSON)**: Trả về `data` là Object chứa đầy đủ thông tin của phiên bản chỉ định (bao gồm `content`).

### 8. Tạo phiên bản Bridge Script mới
- **URL**: `/scripts`
- **Method**: `POST` (Protected - Yêu cầu Token)
- **Body (JSON)**:
  - `version` (string, bắt buộc): Số phiên bản (ví dụ: "1.2.0"). Phải là duy nhất không trùng lặp.
  - `description` (string, không bắt buộc): Mô tả các thay đổi trong phiên bản này.
  - `content` (string, bắt buộc): Nội dung mã nguồn JavaScript của script.
- **Output (JSON)**: Trả về `data` là Object phiên bản vừa được tạo.
