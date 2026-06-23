const db = require("./db");

async function runCleanup() {
  const client = await db.connect();
  try {
    console.log("🚀 Starting DB cleanup and mapping update...");
    await client.query("BEGIN");

    // 1. Update app_menus to map sub-routes to the main user.global.homebooking mini-app
    console.log("Updating app_menus to link to the main user app...");
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking', url = '/#/'
      WHERE mnu_name = 'hb-wv-user-nav-home'
    `);
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking', url = '/#/services'
      WHERE mnu_name = 'hb-wv-user-nav-service'
    `);
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking', url = '/#/bookings'
      WHERE mnu_name = 'hb-wv-user-nav-booking'
    `);
    await client.query(`
      UPDATE app_menus 
      SET app_id = 'user.global.homebooking', url = '/#/activities'
      WHERE mnu_name = 'hb-wv-user-nav-activity'
    `);

    // 2. Update account_menus to map sub-routes to the main user.global.homebooking mini-app
    console.log("Updating account_menus to link to the main user app...");
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking', url = '/#/profile'
      WHERE key = 'hb-vw-mn-ac-profile'
    `);
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking', url = '/#/change-password'
      WHERE key = 'hb-vw-mn-ac-change-password'
    `);
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking', url = '/#/address-book'
      WHERE key = 'hb-vw-mn-ac-address-book'
    `);
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking', url = '/#/notifications'
      WHERE key = 'hb-vw-mn-ac-notifications'
    `);
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking', url = '/#/help-center'
      WHERE key = 'hb-vw-mn-ac-help-center'
    `);
    await client.query(`
      UPDATE account_menus 
      SET app_id = 'user.global.homebooking', url = '/#/terms-and-policies'
      WHERE key = 'hb-vw-mn-ac-terms-and-policies'
    `);

    // 3. Delete redundant sub-app entries from mini_apps table
    console.log("Deleting redundant sub-apps from mini_apps...");
    const deleteResult = await client.query(`
      DELETE FROM mini_apps 
      WHERE app_id LIKE 'user.global.homebooking.%'
    `);
    console.log(`Deleted ${deleteResult.rowCount} redundant sub-app entries.`);

    await client.query("COMMIT");
    console.log("🟢 DB cleanup and mapping update successfully completed!");
    process.exit(0);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("🔴 Cleanup migration failed:", error);
    process.exit(1);
  } finally {
    client.release();
  }
}

runCleanup();
