const db = require("./db");

async function seed() {
  try {
    console.log("Seeding app menus...");
    
    // Clean existing app_menus first
    await db.query("TRUNCATE TABLE app_menus RESTART IDENTITY CASCADE");

    // Get an existing mini_app if any
    const miniAppsRes = await db.query("SELECT app_id FROM mini_apps LIMIT 1");
    const sampleAppId = miniAppsRes.rows.length > 0 ? miniAppsRes.rows[0].app_id : null;

    // 1. Seed root menu 1: Home Booking (possibly linked to a mini app)
    const parentMenuRes = await db.query(`
      INSERT INTO app_menus (
        menu_type, mnu_name, mnu_image, mnu_image_actived,
        mnu_bg_color, mnu_brd_color, mnu_txt_color, mnu_txt_color_actived,
        mnu_order, mnu_position, app_id, requires_auth, version, url, is_hidden
      ) VALUES (
        0, 'Đặt Phòng', 'https://img.icons8.com/color/96/home.png', 'https://img.icons8.com/color/96/home-active.png',
        '#edf7ee', '#e4f2e6', '#5cb561', '#388e3c',
        1, 'SIDEBAR', $1, false, '1.0.4', 'https://example.com/booking', false
      ) RETURNING id
    `, [sampleAppId]);

    const parentId = parentMenuRes.rows[0].id;

    // 2. Seed submenu of Home Booking
    await db.query(`
      INSERT INTO app_menus (
        menu_type, mnu_name, mnu_image, mnu_bg_color, mnu_brd_color,
        mnu_txt_color, mnu_order, mnu_position, menupid, requires_auth, url, is_hidden
      ) VALUES (
        0, 'Phòng của tôi', 'https://img.icons8.com/color/96/hotel.png', '#fff9c4', '#fff59d',
        '#fbc02d', 1, 'SIDEBAR', $1, true, 'https://example.com/booking/my-rooms', false
      )
    `, [parentId]);

    // 3. Seed Bottom Navigation menus
    await db.query(`
      INSERT INTO app_menus (
        menu_type, mnu_name, mnu_image, url, mnu_bg_color, mnu_brd_color,
        mnu_txt_color, mnu_order, mnu_position, requires_auth, is_hidden, is_action_button
      ) VALUES 
      (1, 'Trang chủ', 'https://img.icons8.com/fluency/96/home.png', '/home', '#e3f2fd', '#bbdefb', '#1e88e5', 1, 'BOTTOM_NAV', false, false, false),
      (1, 'Tin tức', 'https://img.icons8.com/fluency/96/news.png', '/news', '#f3e5f5', '#e1bee7', '#8e24aa', 2, 'BOTTOM_NAV', false, false, false),
      (1, 'Đặt lịch', 'https://img.icons8.com/fluency/96/plus.png', '/booking', '#e8f5e9', '#c8e6c9', '#4caf50', 3, 'BOTTOM_NAV', false, false, true),
      (1, 'Cá nhân', 'https://img.icons8.com/fluency/96/user.png', '/profile', '#efebe9', '#d7ccc8', '#5d4037', 4, 'BOTTOM_NAV', true, false, false)
    `);

    console.log("🟢 App menus seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Error seeding app menus:", error);
    process.exit(1);
  }
}

seed();
