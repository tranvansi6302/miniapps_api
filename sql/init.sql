-- 1. Bảng danh mục Mini App
CREATE TABLE IF NOT EXISTS mini_app_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  icon_url TEXT NOT NULL,
  is_actived BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng ứng dụng Mini App
CREATE TABLE IF NOT EXISTS mini_apps (
  id BIGSERIAL PRIMARY KEY,
  app_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category_id BIGINT NOT NULL REFERENCES mini_app_categories(id) ON DELETE RESTRICT,
  short_description TEXT,
  description TEXT,
  icon_url TEXT,
  url TEXT NOT NULL,
  version VARCHAR(50) NOT NULL,
  requires_auth BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT TRUE,
  is_actived BOOLEAN NOT NULL DEFAULT TRUE,
  terms_url TEXT,
  file_path TEXT,
  policy JSONB DEFAULT '{}'::jsonb,
  is_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bảng mã cấu hình Bridge Scripts
CREATE TABLE IF NOT EXISTS bridge_scripts (
  id BIGSERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bảng người dùng quản trị
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  menu_permissions JSONB NOT NULL DEFAULT '{}',
  is_actived BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bảng thành viên Mini App
CREATE TABLE IF NOT EXISTS mini_app_members (
  id BIGSERIAL PRIMARY KEY,
  mini_app_id BIGINT NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status INT NOT NULL DEFAULT 1, -- 1: Đã duyệt, 2: Tạm khóa, 3: Đã xóa
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Bảng lưu trữ Refresh Token
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tạo chỉ mục (Indexes) để tối ưu hóa hiệu năng truy vấn
CREATE INDEX IF NOT EXISTS idx_mini_apps_category ON mini_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_members_app_user ON mini_app_members(mini_app_id, user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- 7. Bảng danh mục Quyền (Permissions)
CREATE TABLE IF NOT EXISTS permissions (
  code VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chèn dữ liệu mồi cho các quyền cơ bản (Nghiệp vụ bỏ qua nếu đã tồn tại)
INSERT INTO permissions (code, name, description) VALUES
  ('camera', 'Truy cập Camera', 'Cho phép ứng dụng sử dụng máy ảnh để chụp hình, quay video hoặc quét mã.'),
  ('location', 'Vị trí (Location)', 'Cho phép ứng dụng truy cập thông tin vị trí địa lý của thiết bị.'),
  ('storage', 'Lưu trữ (Storage)', 'Cho phép ứng dụng đọc và ghi tệp tin trên thiết bị lưu trữ.'),
  ('microphone', 'Microphone', 'Cho phép ứng dụng sử dụng micro để ghi âm thanh.'),
  ('push_notification', 'Thông báo đẩy (Push Notifications)', 'Cho phép ứng dụng gửi thông báo trực tiếp đến thiết bị người dùng.')
ON CONFLICT (code) DO NOTHING;

-- 8. Bảng Mapping Quyền và Mini App (Many-to-Many)
CREATE TABLE IF NOT EXISTS mini_app_permissions (
  mini_app_id BIGINT NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (mini_app_id, permission_code)
);

-- 9. Bảng Menu động để phân quyền
CREATE TABLE IF NOT EXISTS menus (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chèn dữ liệu cho các menu cơ bản ban đầu
INSERT INTO menus (key, label) VALUES
  ('dashboard', 'Tổng quan'),
  ('mini-apps', 'Ứng dụng Mini App'),
  ('categories', 'Danh mục Mini App'),
  ('users', 'Quản lý Người dùng'),
  ('scripts', 'SDK Bridge Scripts'),
  ('app-menus', 'Cấu hình Menu Portal')
ON CONFLICT (key) DO NOTHING;

-- 10. Bổ sung trường file_path vào bảng mini_apps nếu chưa tồn tại (Dành cho DB đã chạy từ trước)
ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb;
ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS is_maintenance BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES mini_apps(id) ON DELETE CASCADE;
ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb;
ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb;

-- 11. Bảng lưu trữ lịch sử các bản build / phiên bản
CREATE TABLE IF NOT EXISTS mini_app_builds (
  id BIGSERIAL PRIMARY KEY,
  mini_app_id BIGINT NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  changelog TEXT,
  reviewer_notes TEXT,
  status INT NOT NULL DEFAULT 1, -- 1: Chờ duyệt, 2: Đã duyệt, 3: Từ chối
  file_path TEXT, -- Đường dẫn tệp zip (HTML/JS/CSS) của bản build này
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Bảng Vai trò của Thành viên trong Mini App
CREATE TABLE IF NOT EXISTS mini_app_roles (
  code VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Bảng Mapping Quyền của Vai trò
CREATE TABLE IF NOT EXISTS mini_app_role_permissions (
  role_code VARCHAR(100) NOT NULL REFERENCES mini_app_roles(code) ON DELETE CASCADE,
  permission_code VARCHAR(100) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  PRIMARY KEY (role_code, permission_code)
);

-- 14. Bảng Danh mục Quyền chi tiết của Thành viên
CREATE TABLE IF NOT EXISTS mini_app_member_permissions (
  code VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Bổ sung trường file_path vào bảng mini_app_builds nếu chưa tồn tại (Dành cho DB đã chạy từ trước)
ALTER TABLE mini_app_builds ADD COLUMN IF NOT EXISTS file_path TEXT;


-- Bảng Menu Ứng Dụng (App Menus) dành cho Portal / FE
CREATE TABLE IF NOT EXISTS app_menus (
  id BIGSERIAL PRIMARY KEY,
  menu_type INT NOT NULL DEFAULT 0, -- 0: webview, 1: native
  mnu_name VARCHAR(255) NOT NULL,
  mnu_image TEXT,
  mnu_image_actived TEXT,
  mnu_bg_color VARCHAR(50),
  mnu_brd_color VARCHAR(50),
  mnu_txt_color VARCHAR(50),
  mnu_txt_color_actived VARCHAR(50),
  mnu_order INT NOT NULL DEFAULT 0,
  mnu_position VARCHAR(100) NOT NULL, -- e.g., 'SIDEBAR', 'BOTTOM_NAV'
  menupid BIGINT REFERENCES app_menus(id) ON DELETE CASCADE,
  app_id VARCHAR(255) REFERENCES mini_apps(app_id) ON DELETE SET NULL,
  requires_auth BOOLEAN NOT NULL DEFAULT FALSE,
  version VARCHAR(50),
  file_path TEXT,
  url TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_action_button BOOLEAN NOT NULL DEFAULT FALSE,
  permissions JSONB DEFAULT '[]'::jsonb,
  policy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_menus_menupid ON app_menus(menupid);
CREATE INDEX IF NOT EXISTS idx_app_menus_position ON app_menus(mnu_position);

-- Bảng Menu Tài Khoản (Account Menus) riêng biệt
CREATE TABLE IF NOT EXISTS account_menus (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon TEXT NOT NULL,
  icon_actived TEXT,
  bg_color VARCHAR(50),
  brd_color VARCHAR(50),
  txt_color VARCHAR(50),
  txt_color_actived VARCHAR(50),
  url VARCHAR(255),
  menu_type INT NOT NULL DEFAULT 0, -- 0: webview, 1: native
  right_icon TEXT,
  mnu_order INT NOT NULL DEFAULT 0,
  requires_auth BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  permissions JSONB DEFAULT '[]'::jsonb,
  policy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_menus_category ON account_menus(category);
CREATE INDEX IF NOT EXISTS idx_account_menus_mnu_order ON account_menus(mnu_order);
