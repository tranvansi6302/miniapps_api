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
  privacy_policy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Bảng mã cấu hình Bridge Scripts
CREATE TABLE IF NOT EXISTS bridge_scripts (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL UNIQUE,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_actived BOOLEAN NOT NULL DEFAULT TRUE,
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
