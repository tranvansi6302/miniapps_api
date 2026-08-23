const db = require("./db");

async function seedAllUserMiniApps() {
  try {
    console.log("🚀 Seeding & Updating all requested Mini Apps, App Menus & Account Menus...");

    // 1. Ensure category 1 exists
    await db.query(`
      INSERT INTO mini_app_categories (id, name, code, icon_url, is_actived)
      VALUES (1, 'Business & Booking', 'business_booking', 'https://img.icons8.com/fluency/96/briefcase.png', true)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `);

    // 2. Define Mini Apps
    const miniApps = [
      {
        app_id: "home.user.net.365trade",
        name: "HomeBooking Home",
        short_description: "Trang chủ ứng dụng HomeBooking",
        url: "https://homebooking-user.vercel.app/#/",
        icon_url: "https://img.icons8.com/fluency/96/home.png"
      },
      {
        app_id: "b2b.user.net.365trade",
        name: "HomeBooking B2B",
        short_description: "Mini app B2B Doanh nghiệp",
        url: "https://homebooking-user.vercel.app/#/b2b",
        icon_url: "https://img.icons8.com/fluency/96/briefcase.png"
      },
      {
        app_id: "post.user.net.365trade",
        name: "HomeBooking Đăng Tin",
        short_description: "Mini app Đăng bài / Đăng tin",
        url: "https://homebooking-user.vercel.app/#/post",
        icon_url: "https://img.icons8.com/fluency/96/plus.png"
      },
      {
        app_id: "notification.user.net.365trade",
        name: "HomeBooking Thông Báo",
        short_description: "Mini app Thông báo hệ thống",
        url: "https://homebooking-user.vercel.app/#/notification",
        icon_url: "https://img.icons8.com/fluency/96/alarm.png"
      },
      {
        app_id: "profile.user.net.365trade",
        name: "HomeBooking Thông Tin Cá Nhân",
        short_description: "Mini app Thay đổi thông tin cá nhân",
        url: "https://homebooking-user.vercel.app/#/profile",
        icon_url: "https://img.icons8.com/fluency/96/user-male-circle.png"
      },
      {
        app_id: "changepass.user.net.365trade",
        name: "HomeBooking Đổi Mật Khẩu",
        short_description: "Mini app Thay đổi mật khẩu",
        url: "https://homebooking-user.vercel.app/#/change-password",
        icon_url: "https://img.icons8.com/fluency/96/password.png"
      },
      {
        app_id: "helpcenter.user.net.365trade",
        name: "HomeBooking Trung Tâm Hỗ Trợ",
        short_description: "Mini app Trung tâm hỗ trợ",
        url: "https://homebooking-user.vercel.app/#/help-center",
        icon_url: "https://img.icons8.com/fluency/96/help.png"
      },
      {
        app_id: "privacy.user.net.365trade",
        name: "HomeBooking Chính Sách Bảo Mật",
        short_description: "Mini app Chính sách bảo mật",
        url: "https://homebooking-user.vercel.app/#/terms-and-policies",
        icon_url: "https://img.icons8.com/fluency/96/document.png"
      }
    ];

    for (const app of miniApps) {
      await db.query(`
        INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
        VALUES ($1, $2, 1, $3, $3, $4, $5, '1.0.0', false, false, true)
        ON CONFLICT (app_id) DO UPDATE SET
          name = EXCLUDED.name,
          short_description = EXCLUDED.short_description,
          url = EXCLUDED.url,
          icon_url = EXCLUDED.icon_url,
          is_hidden = false,
          is_actived = true
      `, [app.app_id, app.name, app.short_description, app.icon_url, app.url]);
    }
    console.log("✅ Mini Apps created/updated!");

    // 3. Seed / Update App Menus (Bottom Nav)
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS key VARCHAR(255)");
    await db.query("ALTER TABLE app_menus ADD COLUMN IF NOT EXISTS is_action_button BOOLEAN DEFAULT false");
    await db.query("TRUNCATE TABLE app_menus RESTART IDENTITY CASCADE");

    const appMenus = [
      {
        key: "M_MN_T_HOME",
        mnu_name: "M_MN_T_HOME",
        mnu_image: "https://img.icons8.com/fluency/96/home.png",
        url: "https://homebooking-user.vercel.app/#/",
        app_id: "home.user.net.365trade",
        menu_type: 0,
        mnu_position: "BOTTOM_NAV",
        mnu_order: 1,
        is_action_button: false,
        requires_auth: false
      },
      {
        key: "M_MN_T_B2B",
        mnu_name: "M_MN_T_B2B",
        mnu_image: "https://img.icons8.com/fluency/96/briefcase.png",
        url: "https://homebooking-user.vercel.app/#/b2b",
        app_id: "b2b.user.net.365trade",
        menu_type: 0,
        mnu_position: "BOTTOM_NAV",
        mnu_order: 2,
        is_action_button: false,
        requires_auth: false
      },
      {
        key: "M_MN_T_POST",
        mnu_name: "M_MN_T_POST",
        mnu_image: "https://img.icons8.com/fluency/96/plus.png",
        url: "https://homebooking-user.vercel.app/#/post",
        app_id: "post.user.net.365trade",
        menu_type: 1,
        mnu_position: "BOTTOM_NAV",
        mnu_order: 3,
        is_action_button: true,
        requires_auth: true
      },
      {
        key: "M_MN_T_NOTIFICATION",
        mnu_name: "M_MN_T_NOTIFICATION",
        mnu_image: "https://img.icons8.com/fluency/96/alarm.png",
        url: "https://homebooking-user.vercel.app/#/notification",
        app_id: "notification.user.net.365trade",
        menu_type: 1,
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
        app_id: null,
        menu_type: 1,
        mnu_position: "BOTTOM_NAV",
        mnu_order: 5,
        is_action_button: false,
        requires_auth: true
      }
    ];

    for (const menu of appMenus) {
      await db.query(
        `INSERT INTO app_menus (
          key, mnu_name, mnu_image, url, app_id, menu_type, mnu_position, mnu_order, is_action_button, requires_auth, is_hidden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false)`,
        [menu.key, menu.mnu_name, menu.mnu_image, menu.url, menu.app_id, menu.menu_type, menu.mnu_position, menu.mnu_order, menu.is_action_button, menu.requires_auth]
      );
    }
    console.log("✅ App Menus (Bottom Nav) updated!");

    // 4. Seed / Update Account Menus
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_name VARCHAR(255)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_image TEXT");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_order INT DEFAULT 0");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS menu_type INT NOT NULL DEFAULT 0");
    await db.query("TRUNCATE TABLE account_menus RESTART IDENTITY CASCADE");

    const accountMenus = [
      // Nhóm 1: TÀI KHOẢN
      {
        key: "M_ACC_T_PROFILE",
        category: "M_ACC_T_ACCOUNT_GROUP",
        mnu_name: "M_ACC_T_PROFILE",
        mnu_image: "https://img.icons8.com/fluency/96/user-male-circle.png",
        url: "https://homebooking-user.vercel.app/#/profile",
        app_id: "profile.user.net.365trade",
        menu_type: 0,
        mnu_order: 1,
        requires_auth: true
      },
      {
        key: "M_ACC_T_CHANGE_PASS",
        category: "M_ACC_T_ACCOUNT_GROUP",
        mnu_name: "M_ACC_T_CHANGE_PASS",
        mnu_image: "https://img.icons8.com/fluency/96/password.png",
        url: "https://homebooking-user.vercel.app/#/change-password",
        app_id: "changepass.user.net.365trade",
        menu_type: 0,
        mnu_order: 2,
        requires_auth: true
      },

      // Nhóm 2: HỖ TRỢ
      {
        key: "M_ACC_T_HELP_CENTER",
        category: "M_ACC_T_SP_GROUP",
        mnu_name: "M_ACC_T_HELP_CENTER",
        mnu_image: "https://img.icons8.com/fluency/96/help.png",
        url: "https://homebooking-user.vercel.app/#/help-center",
        app_id: "helpcenter.user.net.365trade",
        menu_type: 0,
        mnu_order: 3,
        requires_auth: false
      },
      {
        key: "M_ACC_T_PRIVACY_POLICY",
        category: "M_ACC_T_SP_GROUP",
        mnu_name: "M_ACC_T_PRIVACY_POLICY",
        mnu_image: "https://img.icons8.com/fluency/96/document.png",
        url: "https://homebooking-user.vercel.app/#/terms-and-policies",
        app_id: "privacy.user.net.365trade",
        menu_type: 0,
        mnu_order: 4,
        requires_auth: false
      },
      {
        key: "M_ACC_T_LANG",
        category: "M_ACC_T_SP_GROUP",
        mnu_name: "M_ACC_T_LANG",
        mnu_image: "https://img.icons8.com/fluency/96/language.png",
        url: "language",
        app_id: null,
        menu_type: 1,
        mnu_order: 5,
        requires_auth: false
      },
      {
        key: "M_ACC_T_SCAN_QR",
        category: "M_ACC_T_SP_GROUP",
        mnu_name: "M_ACC_T_SCAN_QR",
        mnu_image: "https://img.icons8.com/fluency/96/qr-code.png",
        url: "qr_scan",
        app_id: null,
        menu_type: 1,
        mnu_order: 6,
        requires_auth: false
      }
    ];

    for (const menu of accountMenus) {
      await db.query(
        `INSERT INTO account_menus (
          key, category, mnu_name, mnu_image, url, menu_type, mnu_order, requires_auth, is_hidden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)`,
        [menu.key, menu.category, menu.mnu_name, menu.mnu_image, menu.url, menu.menu_type, menu.mnu_order, menu.requires_auth]
      );
    }
    console.log("✅ Account Menus updated!");

    console.log("🟢 All requested mini apps, app menus and account menus seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Error seeding requested mini apps:", error);
    process.exit(1);
  }
}

seedAllUserMiniApps();
