const db = require("./db");

async function seedUserNet365Trade() {
  try {
    console.log("🚀 Re-configuring Database with user.net.365trade & home.user.net.365trade...");

    const targetUrl = "https://homebooking-user.vercel.app/#/";
    const parentAppId = "user.net.365trade";
    const childAppId = "home.user.net.365trade";

    // 1. Ensure Category 1 exists
    await db.query(`
      INSERT INTO mini_app_categories (id, name, code, icon_url, is_actived)
      VALUES (1, 'Business & Booking', 'business_booking', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', true)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code
    `);

    // 2. Create/Update Parent Mini App (user.net.365trade)
    const parentApp = await db.query(`
      INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
      VALUES ($1, $2, 1, 'Ứng dụng chính HomeBooking Super App', 'Super app quản lý hệ thống dịch vụ.', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', $3, '1.0.0', true, false, true)
      ON CONFLICT (app_id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        icon_url = EXCLUDED.icon_url,
        is_hidden = false,
        is_actived = true
      RETURNING *
    `, [parentAppId, 'HomeBooking Super App', targetUrl]);

    console.log("✅ Parent Mini App created/updated:", parentApp.rows[0].app_id);

    // 3. Create/Update Child Mini App (home.user.net.365trade)
    const childApp = await db.query(`
      INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
      VALUES ($1, $2, 1, 'Mini App đặt lịch HomeBooking', 'Mini app đặt phòng và dịch vụ.', 'https://cdn-icons-png.flaticon.com/512/2922/2922506.png', $3, '1.0.0', true, false, true)
      ON CONFLICT (app_id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        icon_url = EXCLUDED.icon_url,
        is_hidden = false,
        is_actived = true
      RETURNING *
    `, [childAppId, 'HomeBooking Mini App', targetUrl]);

    console.log("✅ Child Mini App created/updated:", childApp.rows[0].app_id);

    // 4. Create/Update Mini App Group
    const checkGroup = await db.query("SELECT * FROM mini_app_groups WHERE app_id = $1", [parentAppId]);
    if (checkGroup.rows.length === 0) {
      await db.query(
        "INSERT INTO mini_app_groups (name, app_id) VALUES ($1, $2)",
        ['Nhóm Dịch Vụ Nổi Bật', parentAppId]
      );
      console.log("✅ Mini App Group created for parent_app_id:", parentAppId);
    } else {
      await db.query(
        "UPDATE mini_app_groups SET name = $1 WHERE app_id = $2",
        ['Nhóm Dịch Vụ Nổi Bật', parentAppId]
      );
      console.log("✅ Mini App Group updated for parent_app_id:", parentAppId);
    }

    // 5. Update App Menus (Bottom Nav) with targetUrl and childAppId
    await db.query(`
      UPDATE app_menus 
      SET url = $1, app_id = $2 
      WHERE mnu_name IN ('M_MN_T_HOME', 'M_MN_T_B2B') OR key IN ('M_MN_T_HOME', 'M_MN_T_B2B')
    `, [targetUrl, childAppId]);

    console.log("🟢 All configurations for user.net.365trade and home.user.net.365trade successfully seeded in Database!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Seed Error:", error.message);
    process.exit(1);
  }
}

seedUserNet365Trade();
