const db = require("../db");
const miniAppService = require("./mini-app.service");

class AccountMenuService {
  async getById(id) {
    const query = `
      SELECT 
        am.id, am.key, am.category, am.mnu_name, am.mnu_image, am.mnu_image_actived, 
        am.mnu_bg_color, am.mnu_brd_color, am.mnu_txt_color, am.mnu_txt_color_actived, 
        am.url, am.menu_type, am.right_icon, am.mnu_order, am.requires_auth, am.is_hidden, am.is_actived,
        am.app_id
      FROM account_menus am
      WHERE am.id = $1
    `;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error("Account menu item not found");
    }
    const row = res.rows[0];
    let url = row.url;
    if (parseInt(row.menu_type || 0) === 0 && row.app_id) {
      try {
        const matchedApp = await miniAppService.getByAppId(row.app_id);
        if (matchedApp) {
          url = matchedApp.url;
        }
      } catch (_) {}
    }

    return {
      id: parseInt(row.id),
      key: row.key,
      category: row.category,
      mnu_name: row.mnu_name,
      mnu_image: row.mnu_image,
      mnu_image_actived: row.mnu_image_actived,
      mnu_bg_color: row.mnu_bg_color,
      mnu_brd_color: row.mnu_brd_color,
      mnu_txt_color: row.mnu_txt_color,
      mnu_txt_color_actived: row.mnu_txt_color_actived,
      url: url,
      menu_type: parseInt(row.menu_type || 0),
      right_icon: row.right_icon,
      mnu_order: parseInt(row.mnu_order),
      requires_auth: row.requires_auth === true || row.requires_auth === 'true',
      is_hidden: row.is_hidden === true || row.is_hidden === 'true',
      is_actived: row.is_actived === true || row.is_actived === 'true',
      app_id: row.app_id
    };
  }

  async getAll(queryOptions = {}) {
    const includeInactive = queryOptions.include_inactive === 'true' || queryOptions.include_inactive === true;
    let query = `
      SELECT 
        am.id, am.key, am.category, am.mnu_name, am.mnu_image, am.mnu_image_actived, 
        am.mnu_bg_color, am.mnu_brd_color, am.mnu_txt_color, am.mnu_txt_color_actived, 
        am.url, am.menu_type, am.right_icon, am.mnu_order, am.requires_auth, am.is_hidden, am.is_actived,
        am.app_id
      FROM account_menus am
      WHERE 1=1
    `;
    
    if (!includeInactive) {
      query += ` AND am.is_actived = true`;
    }
    
    query += ` ORDER BY am.mnu_order ASC, am.id ASC`;
    const result = await db.query(query);

    // Fetch all mini apps once to map the URL dynamically
    const allApps = await miniAppService.list();
    const appsMap = {};
    for (const app of allApps) {
      appsMap[app.app_id] = app;
    }
    
    // Group by category
    const grouped = {};
    for (const row of result.rows) {
      const cat = row.category;
      if (!grouped[cat]) {
        grouped[cat] = [];
      }

      let url = row.url;
      // If it is a webview menu and has app_id, resolve its url from mini_apps
      if (parseInt(row.menu_type || 0) === 0 && row.app_id) {
        const matchedApp = appsMap[row.app_id];
        if (matchedApp) {
          url = matchedApp.url;
        }
      }

      grouped[cat].push({
        id: parseInt(row.id),
        key: row.key,
        category: row.category,
        mnu_name: row.mnu_name,
        mnu_image: row.mnu_image,
        mnu_image_actived: row.mnu_image_actived,
        mnu_bg_color: row.mnu_bg_color,
        mnu_brd_color: row.mnu_brd_color,
        mnu_txt_color: row.mnu_txt_color,
        mnu_txt_color_actived: row.mnu_txt_color_actived,
        url: url,
        menu_type: parseInt(row.menu_type || 0),
        right_icon: row.right_icon,
        mnu_order: parseInt(row.mnu_order),
        requires_auth: row.requires_auth === true || row.requires_auth === 'true',
        is_hidden: row.is_hidden === true || row.is_hidden === 'true',
        is_actived: row.is_actived === true || row.is_actived === 'true',
        app_id: row.app_id
      });
    }

    // Convert to array of groups for easy rendering
    return Object.keys(grouped).map(key => ({
      category: key,
      items: grouped[key]
    }));
  }

  async create(data) {
    const query = `
      INSERT INTO account_menus (key, category, mnu_name, mnu_image, mnu_image_actived, mnu_bg_color, mnu_brd_color, mnu_txt_color, mnu_txt_color_actived, url, menu_type, right_icon, mnu_order, requires_auth, is_hidden, is_actived, app_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `;
    const values = [
      data.key,
      data.category,
      data.mnu_name,
      data.mnu_image,
      data.mnu_image_actived || null,
      data.mnu_bg_color || null,
      data.mnu_brd_color || null,
      data.mnu_txt_color || null,
      data.mnu_txt_color_actived || null,
      data.url || null,
      parseInt(data.menu_type || 0),
      data.right_icon || null,
      data.mnu_order || 0,
      data.requires_auth === true,
      data.is_hidden === true,
      data.is_actived !== false,
      data.app_id || null
    ];
    const res = await db.query(query, values);
    return this.getById(res.rows[0].id);
  }

  async update(id, data) {
    const query = `
      UPDATE account_menus
      SET key = $1, category = $2, mnu_name = $3, mnu_image = $4, mnu_image_actived = $5, mnu_bg_color = $6, mnu_brd_color = $7, mnu_txt_color = $8, mnu_txt_color_actived = $9, url = $10, menu_type = $11, right_icon = $12, mnu_order = $13, requires_auth = $14, is_hidden = $15, is_actived = $16, app_id = $17
      WHERE id = $18
      RETURNING id
    `;
    const values = [
      data.key,
      data.category,
      data.mnu_name,
      data.mnu_image,
      data.mnu_image_actived || null,
      data.mnu_bg_color || null,
      data.mnu_brd_color || null,
      data.mnu_txt_color || null,
      data.mnu_txt_color_actived || null,
      data.url || null,
      parseInt(data.menu_type || 0),
      data.right_icon || null,
      data.mnu_order || 0,
      data.requires_auth === true,
      data.is_hidden === true,
      data.is_actived !== false,
      data.app_id || null,
      id
    ];
    const res = await db.query(query, values);
    if (res.rows.length === 0) {
      throw new Error("Account menu item not found");
    }
    return this.getById(id);
  }

  async delete(id) {
    const res = await db.query("DELETE FROM account_menus WHERE id = $1 RETURNING id", [id]);
    if (res.rows.length === 0) {
      throw new Error("Account menu item not found");
    }
    return true;
  }

  async updateOrder(items) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          "UPDATE account_menus SET mnu_order = $1 WHERE id = $2",
          [parseInt(item.mnu_order), parseInt(item.id)]
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new AccountMenuService();
