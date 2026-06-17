const db = require("./db");

async function runMigration() {
  try {
    console.log("🚀 Starting migration script...");

    // 1. Ensure columns exist on both tables
    console.log("Checking and altering tables...");
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb");
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb");

    // 2. Define default settings
    const defaultPermissions = ["camera", "location", "storage"];
    const defaultPolicy = {
      allowedDomains: ["homebooking-user.vercel.app", "miniapps-api-2zb0.onrender.com"],
      allowExternalNavigation: false,
      allowFileDownload: true
    };

    const permissionsStr = JSON.stringify(defaultPermissions);
    const policyStr = JSON.stringify(defaultPolicy);

    // 3. Update existing app_menus
    console.log("Updating all app_menus with default security configuration...");
    const updateAppMenusRes = await db.query(
      "UPDATE app_menus SET permissions = $1, policy = $2 RETURNING id",
      [permissionsStr, policyStr]
    );
    console.log(`Updated ${updateAppMenusRes.rowCount} items in app_menus.`);

    // 4. Update existing account_menus
    console.log("Updating all account_menus with default security configuration...");
    const updateAccountMenusRes = await db.query(
      "UPDATE account_menus SET permissions = $1, policy = $2 RETURNING id",
      [permissionsStr, policyStr]
    );
    console.log(`Updated ${updateAccountMenusRes.rowCount} items in account_menus.`);

    // 5. Check and Insert Language Menu in account_menus
    console.log("Checking for 'Ngôn ngữ' menu in account_menus...");
    const checkLangMenu = await db.query(
      "SELECT id FROM account_menus WHERE key = $1",
      ["hb-vw-mn-ac-language"]
    );

    if (checkLangMenu.rows.length === 0) {
      console.log("Inserting 'Ngôn ngữ' menu into account_menus...");
      await db.query(`
        INSERT INTO account_menus (
          key, category, name, icon, icon_actived, bg_color, brd_color, txt_color, txt_color_actived, url, menu_type, right_icon, order_num, requires_auth, is_active, permissions, policy
        ) VALUES (
          'hb-vw-mn-ac-language',
          'hb-vw-mn-ac-group-support',
          'hb-vw-mn-ac-language',
          'https://img.icons8.com/fluency/96/language.png',
          'https://img.icons8.com/fluency/96/language.png',
          '#e8f5e9', '#c8e6c9', '#4caf50', '#388e3c',
          'https://homebooking-user.vercel.app/#/language',
          0, null, 7, false, true,
          $1, $2
        )
      `, [permissionsStr, policyStr]);
      console.log("Inserted 'Ngôn ngữ' menu successfully.");
    } else {
      console.log("'Ngôn ngữ' menu already exists.");
    }

    console.log("🟢 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
