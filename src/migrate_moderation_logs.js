const db = require("./db");

async function runMigration() {
  try {
    console.log("🚀 Starting database migration for mini_app_moderation_logs table...");

    await db.query(`
      CREATE TABLE IF NOT EXISTS mini_app_moderation_logs (
        id SERIAL PRIMARY KEY,
        mini_app_id INT REFERENCES mini_apps(id) ON DELETE SET NULL,
        build_id INT REFERENCES mini_app_builds(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL, -- 'APPROVE_BUILD', 'REJECT_BUILD', 'TOGGLE_ACTIVE', 'TOGGLE_MAINTENANCE'
        version VARCHAR(50),
        performed_by VARCHAR(100) NOT NULL, -- Username of the admin
        checklist JSONB DEFAULT '{}'::jsonb, -- Checklist answers and comments
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Seeding moderation-logs menu item...");
    await db.query(`
      INSERT INTO menus (key, label)
      VALUES ('moderation-logs', 'Nhật ký kiểm duyệt')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log("🟢 Successfully created mini_app_moderation_logs table and seeded menu!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
