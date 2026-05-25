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
      "privacy_policy_url": "..."
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

### 5. Lấy danh sách Bridge Scripts
- **URL**: `/scripts`
- **Method**: `GET` (Public)
- **Input (Query Params)**:
  - `type` (string): Lọc theo loại script (tìm kiếm chứa từ khoá).
  - `include_inactive` (boolean): Lấy cả những script ngừng hoạt động.
- **Output (JSON)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "SDK",
      "version": "1.0.0",
      "description": "Bộ khung SDK chính",
      "content": "(function() { ... })();",
      "is_actived": true,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "message": "Bridge scripts fetched successfully"
}
```

### 6. Lấy chi tiết Bridge Script bằng ID
- **URL**: `/scripts/:id`
- **Method**: `GET` (Public)
- **Input (Path Params)**:
  - `id` (number): ID gốc của Script.
- **Output (JSON)**: Trả về `data` là Object chứa chi tiết thông tin 1 Bridge Script.

### 7. Lấy chi tiết Bridge Script bằng Type
- **URL**: `/scripts/type/:type`
- **Method**: `GET` (Public)
- **Input (Path Params)**:
  - `type` (string): Loại script (Khớp chính xác tên).
- **Output (JSON)**: Trả về `data` là Object chứa chi tiết thông tin 1 Bridge Script.
