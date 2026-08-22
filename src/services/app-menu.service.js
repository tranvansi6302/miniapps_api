const db = require("../db");
const miniAppService = require("./mini-app.service");

class AppMenuService {
  async getAll(position, appId) {
    let query = `
      SELECT 
        am.id,
        am.menu_type,
        am.mnu_name,
        am.mnu_image,
        am.mnu_image_actived,
        am.mnu_bg_color,
        am.mnu_brd_color,
        am.mnu_txt_color,
        am.mnu_txt_color_actived,
        am.mnu_order,
        am.mnu_position,
        am.menupid,
        am.app_id,
        am.requires_auth,
        am.url,
        am.is_hidden,
        am.is_action_button,
        am.created_at
      FROM app_menus am
    `;
    const values = [];
    const conditions = [];
    let idx = 1;

    if (position) {
      conditions.push(`am.mnu_position = $${idx++}`);
      values.push(position);
    }
    if (appId) {
      conditions.push(`am.app_id = $${idx++}`);
      values.push(appId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY am.mnu_order ASC, am.id ASC`;

    const result = await db.query(query, values);

    // Fetch all mini apps once to map the URL dynamically
    const allAppsRes = await miniAppService.getAll({ page: 1, limit: 1000 });
    const allApps = allAppsRes.data || [];
    const appsMap = {};
    for (const app of allApps) {
      appsMap[app.app_id] = app;
    }

    return result.rows.map(row => {
      let url = row.url;
      let miniapp_id = null;
      // If it is a webview menu and has app_id, resolve its url from mini_apps
      if (parseInt(row.menu_type || 0) === 0 && row.app_id) {
        const matchedApp = appsMap[row.app_id];
        if (matchedApp) {
          url = matchedApp.url;
          miniapp_id = parseInt(matchedApp.id);
        }
      }

      return {
        ...row,
        id: parseInt(row.id),
        menupid: row.menupid ? parseInt(row.menupid) : null,
        url: url,
        miniapp_id: miniapp_id,
        requires_auth: row.requires_auth === true || row.requires_auth === 'true',
        is_hidden: row.is_hidden === true || row.is_hidden === 'true',
        is_action_button: row.is_action_button === true || row.is_action_button === 'true'
      };
    });
  }

  async getTree(position, appId) {
    const list = await this.getAll(position, appId);
    const map = {};
    const tree = [];

    // Initialize all items with empty submenus
    for (const item of list) {
      map[item.id] = { ...item, submenus: [] };
    }

    // Connect parents and children
    for (const item of list) {
      const mapped = map[item.id];
      if (item.menupid && map[item.menupid]) {
        map[item.menupid].submenus.push(mapped);
      } else {
        tree.push(mapped);
      }
    }

    return tree;
  }

  async create(data) {
    const fields = [];
    const placeholders = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      "menu_type", "mnu_name", "mnu_image", "mnu_image_actived",
      "mnu_bg_color", "mnu_brd_color", "mnu_txt_color", "mnu_txt_color_actived",
      "url", "is_hidden", "is_action_button", "app_id"
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(key);
        placeholders.push(`$${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error("No fields provided to create menu");
    }

    const query = `
      INSERT INTO app_menus (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING id
    `;
    const res = await db.query(query, values);
    return this.getById(res.rows[0].id);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      "menu_type", "mnu_name", "mnu_image", "mnu_image_actived",
      "mnu_bg_color", "mnu_brd_color", "mnu_txt_color", "mnu_txt_color_actived",
      "url", "is_hidden", "is_action_button", "app_id"
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error("No fields provided to update menu");
    }

    values.push(id);
    const query = `
      UPDATE app_menus
      SET ${fields.join(", ")}
      WHERE id = $${idx}
    `;
    await db.query(query, values);
    return this.getById(id);
  }

  async delete(id) {
    const check = await db.query("SELECT id FROM app_menus WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      throw new Error("Menu item not found");
    }
    await db.query("DELETE FROM app_menus WHERE id = $1", [id]);
    return true;
  }

  async getById(id) {
    const query = `
      SELECT 
        am.id,
        am.menu_type,
        am.mnu_name,
        am.mnu_image,
        am.mnu_image_actived,
        am.mnu_bg_color,
        am.mnu_brd_color,
        am.mnu_txt_color,
        am.mnu_txt_color_actived,
        am.mnu_order,
        am.mnu_position,
        am.menupid,
        am.app_id,
        am.requires_auth,
        am.url,
        am.is_hidden,
        am.is_action_button,
        am.created_at
      FROM app_menus am
      WHERE am.id = $1
    `;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error("Menu item not found");
    }
    const row = res.rows[0];
    let url = row.url;
    let miniapp_id = null;
    if (parseInt(row.menu_type || 0) === 0 && row.app_id) {
      try {
        const matchedAppRes = await db.query("SELECT id, url FROM mini_apps WHERE app_id = $1", [row.app_id]);
        if (matchedAppRes.rows.length > 0) {
          url = matchedAppRes.rows[0].url;
          miniapp_id = parseInt(matchedAppRes.rows[0].id);
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
      miniapp_id: miniapp_id,
      menu_type: parseInt(row.menu_type || 0),
      right_icon: row.right_icon,
      mnu_order: parseInt(row.mnu_order),
      requires_auth: row.requires_auth === true || row.requires_auth === 'true',
      is_hidden: row.is_hidden === true || row.is_hidden === 'true',
      is_action_button: row.is_action_button === true || row.is_action_button === 'true'
    };
  }

  async updateOrder(items) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          "UPDATE app_menus SET mnu_order = $1 WHERE id = $2",
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

module.exports = new AppMenuService();
