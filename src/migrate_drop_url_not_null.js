const db = require("./db");

async function runMigration() {
  try {
    console.log("🚀 Starting database alteration: drop NOT NULL on account_menus.url...");
    await db.query("ALTER TABLE account_menus ALTER COLUMN url DROP NOT NULL");
    console.log("🟢 Successfully dropped NOT NULL constraint on account_menus.url!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
