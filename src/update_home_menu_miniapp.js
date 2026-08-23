const db = require("./db");

async function updateHomeMenuMiniapp() {
  try {
    console.log("🚀 Updating M_MN_T_HOME in app_menus to menu_type = 0 (MiniApp) and home.user.net.365trade...");

    const targetUrl = "https://homebooking-user.vercel.app/#/";
    const homeAppId = "home.user.net.365trade";

    const res = await db.query(`
      UPDATE app_menus 
      SET menu_type = 0, 
          app_id = $1, 
          url = $2, 
          is_hidden = false
      WHERE mnu_name = 'M_MN_T_HOME' OR key = 'M_MN_T_HOME'
      RETURNING *
    `, [homeAppId, targetUrl]);

    console.log("✅ Updated M_MN_T_HOME in Database:", res.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error("🔴 Error updating home menu:", error.message);
    process.exit(1);
  }
}

updateHomeMenuMiniapp();
