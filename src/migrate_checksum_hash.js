const db = require("./db");

async function runMigration() {
  try {
    console.log("🚀 Starting database migration for checksum and hash columns...");

    // 1. Alter account_menus table
    console.log("Adding version, file_path, file_hash, file_checksum to account_menus...");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS version VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS file_path TEXT");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS file_checksum VARCHAR(64)");

    // 2. Alter app_menus table
    console.log("Adding file_hash and file_checksum to app_menus...");
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64)");
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS file_checksum VARCHAR(64)");

    console.log("🟢 Database migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
