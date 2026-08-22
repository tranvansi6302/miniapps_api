const db = require("./db");

async function seedAppMenusCustom() {
  try {
    console.log("🚀 Seeding updated App Menus with M_MN_T_* naming convention...");

    // Ensure columns exist
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS key VARCHAR(255)");
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS is_action_button BOOLEAN DEFAULT false");

    // Clean existing app_menus first
    await db.query("TRUNCATE TABLE app_menus RESTART IDENTITY CASCADE");

    const appMenus = [
      {
        key: "M_MN_T_HOME",
        mnu_name: "M_MN_T_HOME",
        mnu_image: "https://img.icons8.com/fluency/96/home.png",
        url: "/home",
        menu_type: 1, // Native
        mnu_position: "BOTTOM_NAV",
        mnu_order: 1,
        is_action_button: false,
        requires_auth: false
      },
      {
        key: "M_MN_T_B2B",
        mnu_name: "M_MN_T_B2B",
        mnu_image: "https://img.icons8.com/fluency/96/briefcase.png",
        url: "/b2b",
        menu_type: 0, // Webview / Mini App
        mnu_position: "BOTTOM_NAV",
        mnu_order: 2,
        is_action_button: false,
        requires_auth: false
      },
      {
        key: "M_MN_T_POST",
        mnu_name: "M_MN_T_POST",
        mnu_image: "https://img.icons8.com/fluency/96/plus.png",
        url: "/post",
        menu_type: 1, // Native Action Button
        mnu_position: "BOTTOM_NAV",
        mnu_order: 3,
        is_action_button: true,
        requires_auth: true
      },
      {
        key: "M_MN_T_NOTIFICATION",
        mnu_name: "M_MN_T_NOTIFICATION",
        mnu_image: "https://img.icons8.com/fluency/96/alarm.png",
        url: "/notification",
        menu_type: 1, // Native
        mnu_position: "BOTTOM_NAV",
        mnu_order: 4,
        is_action_button: false,
        requires_auth: true
      },
      {
        key: "M_MN_T_ACCOUNT",
        mnu_name: "M_MN_T_ACCOUNT",
        mnu_image: "https://img.icons8.com/fluency/96/user-male-circle.png",
        url: "/account",
        menu_type: 1, // Native Account
        mnu_position: "BOTTOM_NAV",
        mnu_order: 5,
        is_action_button: false,
        requires_auth: true
      }
    ];

    for (const menu of appMenus) {
      await db.query(
        `INSERT INTO app_menus (
          key, mnu_name, mnu_image, url, menu_type, mnu_position, mnu_order, is_action_button, requires_auth, is_hidden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`,
        [
          menu.key,
          menu.mnu_name,
          menu.mnu_image,
          menu.url,
          menu.menu_type,
          menu.mnu_position,
          menu.mnu_order,
          menu.is_action_button,
          menu.requires_auth
        ]
      );
    }

    console.log("🟢 App menus (M_MN_T_*) successfully seeded in Database!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Error seeding app menus:", error.message);
    process.exit(1);
  }
}

seedAppMenusCustom();
