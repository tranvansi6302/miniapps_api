const db = require("./db");
const bcrypt = require("bcryptjs");

async function fixAdmin() {
  try {
    const hash = await bcrypt.hash("admin123", 10);
    const perms = {
      dashboard: true,
      "mini-apps": true,
      categories: true,
      users: true,
      scripts: true,
      "app-menus": true,
      "account-menus": true
    };

    await db.query(
      `INSERT INTO users (username, password, full_name, email, menu_permissions, is_actived)
       VALUES ('admin', $1, 'Super Administrator', 'admin@ejsc.com', $2, true)
       ON CONFLICT (username) DO UPDATE SET password = $1, menu_permissions = $2, is_actived = true`,
      [hash, JSON.stringify(perms)]
    );

    console.log("🟢 Admin user account initialized successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    process.exit(0);
  } catch (err) {
    console.error("🔴 Error resetting admin user:", err.message);
    process.exit(1);
  }
}

fixAdmin();
