const db = require('./db');

async function updateCategoryKeys() {
  try {
    console.log('🔄 Updating account_menus category keys to M_ACC_T_ACCOUNT_GROUP and M_ACC_T_SP_GROUP...');

    // 1. Update TÀI KHOẢN -> M_ACC_T_ACCOUNT_GROUP
    await db.query(`
      UPDATE account_menus
      SET category = 'M_ACC_T_ACCOUNT_GROUP'
      WHERE category = 'TÀI KHOẢN' OR category = 'hb-vw-mn-ac-group-account';
    `);

    // 2. Update HỖ TRỢ -> M_ACC_T_SP_GROUP
    await db.query(`
      UPDATE account_menus
      SET category = 'M_ACC_T_SP_GROUP'
      WHERE category = 'HỖ TRỢ' OR category = 'hb-vw-mn-ac-group-support';
    `);

    const result = await db.query(`SELECT id, key, category, mnu_name FROM account_menus ORDER BY mnu_order ASC;`);
    console.log('🟢 Updated Account Menus in DB:');
    console.log(result.rows);

    process.exit(0);
  } catch (err) {
    console.error('🔴 Error updating category keys:', err.message);
    process.exit(1);
  }
}

updateCategoryKeys();
