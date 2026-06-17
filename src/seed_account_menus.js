const db = require("./db");

async function seed() {
  try {
    console.log("Seeding account menus...");
    
    // Alter table to add menu_type if it doesn't exist
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS menu_type INT NOT NULL DEFAULT 0");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS icon_actived TEXT");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS bg_color VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS brd_color VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS txt_color VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS txt_color_actived VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb");

    // Clean existing account_menus first
    await db.query("TRUNCATE TABLE account_menus RESTART IDENTITY CASCADE");

    // Add entry in menus table for the frontend dashboard navigation permissions
    await db.query(`
      INSERT INTO menus (key, label)
      VALUES ('account-menus', 'Cấu hình menu tài khoản')
      ON CONFLICT (key) DO NOTHING
    `);

    const menus = [
      // Nhóm 1: TÀI KHOẢN
      {
        key: "hb-vw-mn-ac-profile",
        category: "hb-vw-mn-ac-group-account",
        name: "hb-vw-mn-ac-personal-info",
        icon: "https://img.icons8.com/fluency/96/user-male-circle.png",
        icon_actived: "https://img.icons8.com/fluency/96/user-male-circle.png",
        bg_color: "#e3f2fd",
        brd_color: "#bbdefb",
        txt_color: "#1e88e5",
        txt_color_actived: "#1565c0",
        url: "https://homebooking-user.vercel.app/#/profile",
        menu_type: 0,
        right_icon: null,
        order_num: 1,
        requires_auth: true
      },
      {
        key: "hb-vw-mn-ac-change-password",
        category: "hb-vw-mn-ac-group-account",
        name: "hb-vw-mn-ac-change-password",
        icon: "https://img.icons8.com/fluency/96/password.png",
        icon_actived: "https://img.icons8.com/fluency/96/password.png",
        bg_color: "#efebe9",
        brd_color: "#d7ccc8",
        txt_color: "#5d4037",
        txt_color_actived: "#4e342e",
        url: "https://homebooking-user.vercel.app/#/change-password",
        menu_type: 0,
        right_icon: null,
        order_num: 2,
        requires_auth: true
      },
      {
        key: "hb-vw-mn-ac-address-book",
        category: "hb-vw-mn-ac-group-account",
        name: "hb-vw-mn-ac-address-book",
        icon: "https://img.icons8.com/fluency/96/map-pin.png",
        icon_actived: "https://img.icons8.com/fluency/96/map-pin.png",
        bg_color: "#e8f5e9",
        brd_color: "#c8e6c9",
        txt_color: "#4caf50",
        txt_color_actived: "#388e3c",
        url: "https://homebooking-user.vercel.app/#/address-book",
        menu_type: 0,
        right_icon: null,
        order_num: 3,
        requires_auth: true
      },

      // Nhóm 3: HỖ TRỢ
      {
        key: "hb-vw-mn-ac-notifications",
        category: "hb-vw-mn-ac-group-support",
        name: "hb-vw-mn-ac-notifications",
        icon: "https://img.icons8.com/fluency/96/alarm.png",
        icon_actived: "https://img.icons8.com/fluency/96/alarm.png",
        bg_color: "#fff9c4",
        brd_color: "#fff59d",
        txt_color: "#fbc02d",
        txt_color_actived: "#f57f17",
        url: "https://homebooking-user.vercel.app/#/notifications",
        menu_type: 0,
        right_icon: null,
        order_num: 4,
        requires_auth: true
      },
      {
        key: "hb-vw-mn-ac-help-center",
        category: "hb-vw-mn-ac-group-support",
        name: "hb-vw-mn-ac-help-center",
        icon: "https://img.icons8.com/fluency/96/help.png",
        icon_actived: "https://img.icons8.com/fluency/96/help.png",
        bg_color: "#f3e5f5",
        brd_color: "#e1bee7",
        txt_color: "#8e24aa",
        txt_color_actived: "#6a1b9a",
        url: "https://homebooking-user.vercel.app/#/help-center",
        menu_type: 0,
        right_icon: null,
        order_num: 5,
        requires_auth: false
      },
      {
        key: "hb-vw-mn-ac-terms-and-policies",
        category: "hb-vw-mn-ac-group-support",
        name: "hb-vw-mn-ac-terms-and-policies",
        icon: "https://img.icons8.com/fluency/96/document.png",
        icon_actived: "https://img.icons8.com/fluency/96/document.png",
        bg_color: "#eceff1",
        brd_color: "#cfd8dc",
        txt_color: "#607d8b",
        txt_color_actived: "#37474f",
        url: "https://homebooking-user.vercel.app/#/terms-and-policies",
        menu_type: 0,
        right_icon: null,
        order_num: 6,
        requires_auth: false
      }
    ];

    for (const menu of menus) {
      await db.query(
        `INSERT INTO account_menus (
          key, category, name, icon, icon_actived, bg_color, brd_color, txt_color, txt_color_actived, url, menu_type, right_icon, order_num, requires_auth, is_active, permissions, policy
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15, $16)`,
        [menu.key, menu.category, menu.name, menu.icon, menu.icon_actived, menu.bg_color, menu.brd_color, menu.txt_color, menu.txt_color_actived, menu.url, menu.menu_type, menu.right_icon, menu.order_num, menu.requires_auth, JSON.stringify(menu.permissions || []), JSON.stringify(menu.policy || {})]
      );
    }

    console.log("🟢 Account menus seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Error seeding account menus:", error);
    process.exit(1);
  }
}

seed();
