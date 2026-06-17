const db = require("./db");

async function restoreColumns() {
  try {
    console.log("Restoring app_menus column names to old version...");
    
    // Check current columns
    const res = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'app_menus';
    `);
    const cols = res.rows.map(r => r.column_name);
    
    if (cols.includes('name')) {
      console.log("Renaming name -> mnu_name");
      await db.query("ALTER TABLE app_menus RENAME COLUMN name TO mnu_name");
    }
    if (cols.includes('icon')) {
      console.log("Renaming icon -> mnu_image");
      await db.query("ALTER TABLE app_menus RENAME COLUMN icon TO mnu_image");
    }
    if (cols.includes('icon_actived')) {
      console.log("Renaming icon_actived -> mnu_image_actived");
      await db.query("ALTER TABLE app_menus RENAME COLUMN icon_actived TO mnu_image_actived");
    }
    if (cols.includes('bg_color')) {
      console.log("Renaming bg_color -> mnu_bg_color");
      await db.query("ALTER TABLE app_menus RENAME COLUMN bg_color TO mnu_bg_color");
    }
    if (cols.includes('brd_color')) {
      console.log("Renaming brd_color -> mnu_brd_color");
      await db.query("ALTER TABLE app_menus RENAME COLUMN brd_color TO mnu_brd_color");
    }
    if (cols.includes('txt_color')) {
      console.log("Renaming txt_color -> mnu_txt_color");
      await db.query("ALTER TABLE app_menus RENAME COLUMN txt_color TO mnu_txt_color");
    }
    if (cols.includes('txt_color_actived')) {
      console.log("Renaming txt_color_actived -> mnu_txt_color_actived");
      await db.query("ALTER TABLE app_menus RENAME COLUMN txt_color_actived TO mnu_txt_color_actived");
    }
    if (cols.includes('order_num')) {
      console.log("Renaming order_num -> mnu_order");
      await db.query("ALTER TABLE app_menus RENAME COLUMN order_num TO mnu_order");
    }
    if (cols.includes('is_active')) {
      console.log("Renaming is_active -> is_hidden and inverting boolean values");
      await db.query("ALTER TABLE app_menus RENAME COLUMN is_active TO is_hidden");
      await db.query("UPDATE app_menus SET is_hidden = NOT is_hidden");
    }
    
    console.log("🟢 Successfully restored old columns for app_menus!");
    process.exit(0);
  } catch (err) {
    console.error("🔴 Failed to restore columns:", err);
    process.exit(1);
  }
}

restoreColumns();
