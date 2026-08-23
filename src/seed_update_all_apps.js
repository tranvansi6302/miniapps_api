const db = require("./db");

async function updateAllApps() {
  try {
    console.log("🚀 Updating and re-mapping all Mini Apps & Groups...");

    const parentAppId = "user.net.365trade";
    const homeAppId = "home.user.net.365trade";
    const servicesAppId = "services.user.net.365trade";

    const homeUrl = "https://homebooking-user.vercel.app/#/";
    const servicesUrl = "https://homebooking-user.vercel.app/#/services";

    // 1. Ensure Category 1 exists
    await db.query(`
      INSERT INTO mini_app_categories (id, name, code, icon_url, is_actived)
      VALUES (1, 'Business & Booking', 'business_booking', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', true)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code
    `);

    // 2. Clean up old references in mini_app_groups first
    await db.query("DELETE FROM mini_app_groups WHERE app_id = 'com.365ejsc.homebooking'");

    // 3. Insert/Update Parent Mini App (user.net.365trade)
    await db.query(`
      INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
      VALUES ($1, 'HomeBooking Super App', 1, 'Super app quản lý hệ thống dịch vụ.', 'Super App tổng', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', $2, '1.0.0', true, false, true)
      ON CONFLICT (app_id) DO UPDATE SET
        name = 'HomeBooking Super App',
        url = $2,
        is_hidden = false,
        is_actived = true
    `, [parentAppId, homeUrl]);
    console.log("✅ Parent Mini App updated:", parentAppId);

    // 4. Insert/Update Child Mini App 1 (home.user.net.365trade) -> https://homebooking-user.vercel.app/#/
    await db.query(`
      INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
      VALUES ($1, 'HomeBooking Home', 1, 'Mini app Trang chủ', 'Trang chủ ứng dụng HomeBooking', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', $2, '1.0.0', true, false, true)
      ON CONFLICT (app_id) DO UPDATE SET
        name = 'HomeBooking Home',
        url = $2,
        is_hidden = false,
        is_actived = true
    `, [homeAppId, homeUrl]);
    console.log("✅ Child Mini App 1 updated:", homeAppId, "->", homeUrl);

    // 5. Update old com.365ejsc.homebooking OR Insert/Update Child Mini App 2 (services.user.net.365trade) -> https://homebooking-user.vercel.app/#/services
    const checkOld = await db.query("SELECT id FROM mini_apps WHERE app_id = 'com.365ejsc.homebooking'");
    if (checkOld.rows.length > 0) {
      await db.query(`
        UPDATE mini_apps
        SET app_id = $1, name = 'HomeBooking Services', url = $2, is_hidden = false, is_actived = true
        WHERE app_id = 'com.365ejsc.homebooking'
      `, [servicesAppId, servicesUrl]);
      console.log("✅ Old Mini App com.365ejsc.homebooking renamed & updated to:", servicesAppId);
    } else {
      await db.query(`
        INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
        VALUES ($1, 'HomeBooking Services', 1, 'Mini app Dịch vụ HomeBooking', 'Quản lý danh mục dịch vụ lưu trú', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', $2, '1.0.0', true, false, true)
        ON CONFLICT (app_id) DO UPDATE SET
          name = 'HomeBooking Services',
          url = $2,
          is_hidden = false,
          is_actived = true
      `, [servicesAppId, servicesUrl]);
      console.log("✅ Child Mini App 2 updated:", servicesAppId, "->", servicesUrl);
    }

    // 6. Update Mini App Group to parent_app_id user.net.365trade
    const checkGroup = await db.query("SELECT * FROM mini_app_groups WHERE app_id = $1", [parentAppId]);
    if (checkGroup.rows.length === 0) {
      await db.query("INSERT INTO mini_app_groups (name, app_id) VALUES ('Nhóm Dịch Vụ Nổi Bật', $1)", [parentAppId]);
    } else {
      await db.query("UPDATE mini_app_groups SET name = 'Nhóm Dịch Vụ Nổi Bật' WHERE app_id = $1", [parentAppId]);
    }
    console.log("✅ Mini App Group configured for parent:", parentAppId);

    // 7. Update App Menus (Bottom Nav)
    await db.query(`
      UPDATE app_menus 
      SET url = $1, app_id = $2 
      WHERE mnu_name = 'M_MN_T_HOME' OR key = 'M_MN_T_HOME'
    `, [homeUrl, homeAppId]);

    await db.query(`
      UPDATE app_menus 
      SET url = $1, app_id = $2 
      WHERE mnu_name = 'M_MN_T_B2B' OR key = 'M_MN_T_B2B'
    `, [servicesUrl, servicesAppId]);

    console.log("🟢 All mini apps and menus updated cleanly!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Seed Error:", error.message);
    process.exit(1);
  }
}

updateAllApps();
