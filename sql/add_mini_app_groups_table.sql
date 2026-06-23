-- Bảng gom nhóm Mini App mới
CREATE TABLE IF NOT EXISTS mini_app_groups (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  app_id VARCHAR(255) NOT NULL REFERENCES mini_apps(app_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mini_app_groups_name ON mini_app_groups(name);
