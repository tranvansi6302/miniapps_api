const db = require("./db");

async function runMigration() {
  try {
    console.log("🚀 Starting mini_apps migration for file_hash and file_checksum...");

    await db.query("ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64)");
    await db.query("ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS file_checksum VARCHAR(64)");

    console.log("🟢 Successfully added file_hash and file_checksum columns to mini_apps table!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
