const db = require("./db");

async function seedAccountMenus() {
  try {
    console.log("🚀 Seeding updated Account Menus...");

    // Ensure columns exist
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS menu_type INT NOT NULL DEFAULT 0");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS key VARCHAR(255)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_image_actived TEXT");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_bg_color VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_brd_color VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_txt_color VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS mnu_txt_color_actived VARCHAR(50)");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb");
    await db.query("ALTER TABLE account_menus ADD COLUMN IF NOT EXISTS policy JSONB DEFAULT '{}'::jsonb");

    // Clean existing account_menus first
    await db.query("TRUNCATE TABLE account_menus RESTART IDENTITY CASCADE");

    const menus = [
      // Nhóm 1: TÀI KHOẢN (ACCOUNT)
      {
        key: "hb-ac-profile",
        category: "TÀI KHOẢN",
        mnu_name: "Thông tin cá nhân",
        mnu_image: "https://img.icons8.com/fluency/96/user-male-circle.png",
        mnu_image_actived: "https://img.icons8.com/fluency/96/user-male-circle.png",
        mnu_bg_color: "#e3f2fd",
        mnu_brd_color: "#bbdefb",
        mnu_txt_color: "#1e88e5",
        mnu_txt_color_actived: "#1565c0",
        url: "/profile",
        menu_type: 1, // Native
        right_icon: "chevron_right",
        mnu_order: 1,
        requires_auth: true
      },
      {
        key: "hb-ac-change-password",
        category: "TÀI KHOẢN",
        mnu_name: "Đổi mật khẩu",
        mnu_image: "https://img.icons8.com/fluency/96/password.png",
        mnu_image_actived: "https://img.icons8.com/fluency/96/password.png",
        mnu_bg_color: "#efebe9",
        mnu_brd_color: "#d7ccc8",
        mnu_txt_color: "#5d4037",
        mnu_txt_color_actived: "#4e342e",
        url: "/change-password",
        menu_type: 1, // Native
        right_icon: "chevron_right",
        mnu_order: 2,
        requires_auth: true
      },

      // Nhóm 2: HỖ TRỢ (SUPPORT)
      {
        key: "hb-ac-language",
        category: "HỖ TRỢ",
        mnu_name: "Ngôn ngữ",
        mnu_image: "https://img.icons8.com/fluency/96/language.png",
        mnu_image_actived: "https://img.icons8.com/fluency/96/language.png",
        mnu_bg_color: "#e8f5e9",
        mnu_brd_color: "#c8e6c9",
        mnu_txt_color: "#4caf50",
        mnu_txt_color_actived: "#388e3c",
        url: "language",
        menu_type: 1, // Native
        right_icon: "chevron_right",
        mnu_order: 3,
        requires_auth: false
      },
      {
        key: "hb-ac-qr-scan",
        category: "HỖ TRỢ",
        mnu_name: "Quét mã QR",
        mnu_image: "https://img.icons8.com/fluency/96/qr-code.png",
        mnu_image_actived: "https://img.icons8.com/fluency/96/qr-code.png",
        mnu_bg_color: "#fff9c4",
        mnu_brd_color: "#fff59d",
        mnu_txt_color: "#fbc02d",
        mnu_txt_color_actived: "#f57f17",
        url: "qr_scan",
        menu_type: 1, // Native
        right_icon: "chevron_right",
        mnu_order: 4,
        requires_auth: false
      }
    ];

    for (const menu of menus) {
      await db.query(
        `INSERT INTO account_menus (
          key, category, mnu_name, mnu_image, mnu_image_actived, mnu_bg_color, mnu_brd_color, mnu_txt_color, mnu_txt_color_actived, url, menu_type, right_icon, mnu_order, requires_auth, is_actived, permissions, policy
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15, $16)`,
        [
          menu.key,
          menu.category,
          menu.mnu_name,
          menu.mnu_image,
          menu.mnu_image_actived,
          menu.mnu_bg_color,
          menu.mnu_brd_color,
          menu.mnu_txt_color,
          menu.mnu_txt_color_actived,
          menu.url,
          menu.menu_type,
          menu.right_icon,
          menu.mnu_order,
          menu.requires_auth,
          JSON.stringify([]),
          JSON.stringify({})
        ]
      );
    }

    console.log("🟢 Account menus successfully updated in Database!");
    process.exit(0);
  } catch (error) {
    console.error("🔴 Error seeding account menus:", error.message);
    process.exit(1);
  }
}

seedAccountMenus();
