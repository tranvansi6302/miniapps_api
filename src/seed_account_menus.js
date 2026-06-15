const db = require("./db");

async function seed() {
  try {
    console.log("Seeding account menus...");
    
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
        category: "TAI_KHOAN",
        name: "Thông tin cá nhân",
        icon: "https://img.icons8.com/fluency/96/user-male-circle.png",
        url: "/profile",
        right_icon: null,
        order_num: 1,
        requires_auth: true
      },
      {
        category: "TAI_KHOAN",
        name: "Đổi mật khẩu",
        icon: "https://img.icons8.com/fluency/96/password.png",
        url: "/change-password",
        right_icon: null,
        order_num: 2,
        requires_auth: true
      },
      {
        category: "TAI_KHOAN",
        name: "Bảo mật",
        icon: "https://img.icons8.com/fluency/96/privacy.png",
        url: "/security",
        right_icon: null,
        order_num: 3,
        requires_auth: true
      },
      {
        category: "TAI_KHOAN",
        name: "Sổ địa chỉ",
        icon: "https://img.icons8.com/fluency/96/map-pin.png",
        url: "/address-book",
        right_icon: null,
        order_num: 4,
        requires_auth: true
      },

      // Nhóm 2: GIAO DIỆN
      {
        category: "GIAO_DIEN",
        name: "Chủ đề",
        icon: "https://img.icons8.com/fluency/96/sun.png",
        url: "/theme",
        right_icon: null,
        order_num: 5,
        requires_auth: false
      },
      {
        category: "GIAO_DIEN",
        name: "Phông chữ",
        icon: "https://img.icons8.com/fluency/96/font.png",
        url: "/font-settings",
        right_icon: null,
        order_num: 6,
        requires_auth: false
      },
      {
        category: "GIAO_DIEN",
        name: "Ngôn ngữ",
        icon: "https://img.icons8.com/fluency/96/translation.png",
        url: "/language-settings",
        right_icon: null,
        order_num: 7,
        requires_auth: false
      },

      // Nhóm 3: HỖ TRỢ
      {
        category: "HO_TRO",
        name: "Thông báo",
        icon: "https://img.icons8.com/fluency/96/alarm.png",
        url: "/notifications",
        right_icon: null,
        order_num: 8,
        requires_auth: true
      }
    ];

    for (const menu of menus) {
      await db.query(
        `INSERT INTO account_menus (
          category, name, icon, url, right_icon, order_num, requires_auth, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [menu.category, menu.name, menu.icon, menu.url, menu.right_icon, menu.order_num, menu.requires_auth]
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
