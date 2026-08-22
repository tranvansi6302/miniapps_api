const db = require('./db');

async function run() {
  try {
    console.log("1. Checking mini_app_groups table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS mini_app_groups (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        app_id VARCHAR(255) NOT NULL REFERENCES mini_apps(app_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("2. Creating Mini App...");
    const appRes = await db.query(
      `INSERT INTO mini_apps (app_id, name, category_id, short_description, description, icon_url, url, version, requires_auth, is_hidden, is_actived)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (app_id) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [
        'com.365ejsc.homebooking',
        'HomeBooking Mini App',
        1,
        'Ứng dụng đặt lịch HomeBooking',
        'Mini app đặt phòng và quản lý dịch vụ lưu trú.',
        'https://cdn-icons-png.flaticon.com/512/2922/2922506.png',
        'https://homebooking.example.com',
        '1.0.0',
        true,
        false,
        true
      ]
    );
    console.log("✅ Mini App created:", appRes.rows[0].app_id);

    console.log("3. Creating Mini App Group...");
    const checkDup = await db.query(
      "SELECT * FROM mini_app_groups WHERE name = $1 AND app_id = $2",
      ['Nhóm Dịch Vụ Nổi Bật', 'com.365ejsc.homebooking']
    );

    let groupData;
    if (checkDup.rows.length > 0) {
      groupData = checkDup.rows[0];
      console.log("ℹ️ Mini App Group already exists:", groupData);
    } else {
      const groupRes = await db.query(
        "INSERT INTO mini_app_groups (name, app_id) VALUES ($1, $2) RETURNING *",
        ['Nhóm Dịch Vụ Nổi Bật', 'com.365ejsc.homebooking']
      );
      groupData = groupRes.rows[0];
      console.log("✅ Mini App Group created:", groupData);
    }

    console.log("🎉 SUCCESS! Seed completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed Error:", err.message);
    process.exit(1);
  }
}

run();
