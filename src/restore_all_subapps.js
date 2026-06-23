const db = require("./db");

async function run() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    console.log("1. Re-inserting all sub-apps into mini_apps...");
    
    const subApps = [
      {
        app_id: 'user.global.homebooking.home',
        name: 'Trang chủ HomeBooking',
        url: 'https://homebooking-user.vercel.app/#/',
        category_id: 3,
        version: '1.0.0',
        requires_auth: false
      },
      {
        app_id: 'user.global.homebooking.profile',
        name: 'Thông tin cá nhân',
        url: 'https://homebooking-user.vercel.app/#/profile',
        category_id: 3,
        version: '1.0.0',
        requires_auth: true
      },
      {
        app_id: 'user.global.homebooking.change-password',
        name: 'Đổi mật khẩu',
        url: 'https://homebooking-user.vercel.app/#/change-password',
        category_id: 3,
        version: '1.0.0',
        requires_auth: true
      },
      {
        app_id: 'user.global.homebooking.address-book',
        name: 'Sổ địa chỉ',
        url: 'https://homebooking-user.vercel.app/#/address-book',
        category_id: 3,
        version: '1.0.0',
        requires_auth: true
      },
      {
        app_id: 'user.global.homebooking.notifications',
        name: 'Thông báo',
        url: 'https://homebooking-user.vercel.app/#/notifications',
        category_id: 3,
        version: '1.0.0',
        requires_auth: true
      },
      {
        app_id: 'user.global.homebooking.help-center',
        name: 'Trung tâm trợ giúp',
        url: 'https://homebooking-user.vercel.app/#/help-center',
        category_id: 3,
        version: '1.0.0',
        requires_auth: false
      },
      {
        app_id: 'user.global.homebooking.terms-and-policies',
        name: 'Điều khoản & Chính sách',
        url: 'https://homebooking-user.vercel.app/#/terms-and-policies',
        category_id: 3,
        version: '1.0.0',
        requires_auth: false
      },
      {
        app_id: 'user.global.homebooking.bookings',
        name: 'Đặt chỗ',
        url: 'https://homebooking-user.vercel.app/#/bookings',
        category_id: 3,
        version: '1.0.0',
        requires_auth: true
      },
      {
        app_id: 'user.global.homebooking.services',
        name: 'Dịch vụ',
        url: 'https://homebooking-user.vercel.app/#/services',
        category_id: 3,
        version: '1.0.0',
        requires_auth: false
      },
      {
        app_id: 'user.global.homebooking.activities',
        name: 'Hoạt động',
        url: 'https://homebooking-user.vercel.app/#/activities',
        category_id: 3,
        version: '1.0.0',
        requires_auth: true
      }
    ];

    for (const app of subApps) {
      await client.query(`
        INSERT INTO mini_apps (app_id, name, category_id, url, version, requires_auth, is_hidden, is_actived, policy)
        VALUES ($1, $2, $3, $4, $5, $6, false, true, '{}'::jsonb)
        ON CONFLICT (app_id) DO UPDATE 
        SET name = EXCLUDED.name, url = EXCLUDED.url, category_id = EXCLUDED.category_id, 
            version = EXCLUDED.version, requires_auth = EXCLUDED.requires_auth, 
            is_hidden = false, is_actived = true
      `, [app.app_id, app.name, app.category_id, app.url, app.version, app.requires_auth]);
    }
    console.log("Successfully seeded 10 sub-apps into mini_apps.");

    console.log("2. Mapping app_menus to individual sub-apps and setting url to null...");
    
    // hb-wv-user-nav-home -> user.global.homebooking.home
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking.home', url = null 
      WHERE mnu_name = 'hb-wv-user-nav-home'
    `);

    // hb-wv-user-nav-service -> user.global.homebooking.services
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking.services', url = null 
      WHERE mnu_name = 'hb-wv-user-nav-service'
    `);

    // hb-wv-user-nav-booking -> user.global.homebooking.bookings
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking.bookings', url = null 
      WHERE mnu_name = 'hb-wv-user-nav-booking'
    `);

    // hb-wv-user-nav-activity -> user.global.homebooking.activities
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking.activities', url = null 
      WHERE mnu_name = 'hb-wv-user-nav-activity'
    `);

    // hb-wv-user-nav-account -> user.global.homebooking.profile
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking.profile', url = null 
      WHERE mnu_name = 'hb-wv-user-nav-account'
    `);

    console.log("3. Mapping account_menus to individual sub-apps and setting url to null...");

    // hb-vw-mn-ac-profile -> user.global.homebooking.profile
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking.profile', url = null 
      WHERE key = 'hb-vw-mn-ac-profile'
    `);

    // hb-vw-mn-ac-change-password -> user.global.homebooking.change-password
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking.change-password', url = null 
      WHERE key = 'hb-vw-mn-ac-change-password'
    `);

    // hb-vw-mn-ac-address-book -> user.global.homebooking.address-book
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking.address-book', url = null 
      WHERE key = 'hb-vw-mn-ac-address-book'
    `);

    // hb-vw-mn-ac-notifications -> user.global.homebooking.notifications
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking.notifications', url = null 
      WHERE key = 'hb-vw-mn-ac-notifications'
    `);

    // hb-vw-mn-ac-help-center -> user.global.homebooking.help-center
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking.help-center', url = null 
      WHERE key = 'hb-vw-mn-ac-help-center'
    `);

    // hb-vw-mn-ac-terms-and-policies -> user.global.homebooking.terms-and-policies
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking.terms-and-policies', url = null 
      WHERE key = 'hb-vw-mn-ac-terms-and-policies'
    `);

    await client.query("COMMIT");
    console.log("🟢 Database successfully updated and restored!");
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔴 Failed to restore database mappings:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

run();
