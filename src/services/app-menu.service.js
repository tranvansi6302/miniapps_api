const db = require("../db");

class AppMenuService {
  async getAll(position) {
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
        COALESCE(ma.version, am.version) as version,
        COALESCE(ma.file_path, am.file_path) as file_path,
        CASE 
          WHEN am.menu_type = 1 THEN am.url
          WHEN am.url LIKE 'http://%' OR am.url LIKE 'https://%' THEN am.url
          WHEN am.app_id IS NOT NULL THEN
            CASE 
              WHEN am.url IS NOT NULL AND am.url <> '' THEN
                CASE 
                  WHEN RIGHT(ma.url, 1) = '/' AND LEFT(am.url, 1) = '/' THEN ma.url || SUBSTRING(am.url, 2)
                  WHEN RIGHT(ma.url, 1) <> '/' AND LEFT(am.url, 1) <> '/' THEN ma.url || '/' || am.url
                  ELSE ma.url || am.url
                END
              ELSE ma.url
            END
          ELSE am.url
        END as url,
        am.is_hidden,
        am.is_action_button,
        am.permissions,
        am.policy,
        COALESCE(ma.file_hash, am.file_hash) as file_hash,
        COALESCE(ma.file_checksum, am.file_checksum) as file_checksum,
        am.created_at
      FROM app_menus am
      LEFT JOIN mini_apps ma ON am.app_id = ma.app_id
    `;
    const values = [];
    if (position) {
      query += ` WHERE am.mnu_position = $1`;
      values.push(position);
    }
    query += ` ORDER BY am.mnu_order ASC, am.id ASC`;

    const result = await db.query(query, values);
    return result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      menupid: row.menupid ? parseInt(row.menupid) : null,
      requires_auth: row.requires_auth === true || row.requires_auth === 'true',
      is_hidden: row.is_hidden === true || row.is_hidden === 'true',
      is_action_button: row.is_action_button === true || row.is_action_button === 'true',
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || []),
      policy: typeof row.policy === 'string' ? JSON.parse(row.policy) : (row.policy || {}),
      file_hash: row.file_hash,
      file_checksum: row.file_checksum
    }));
  }

  async getTree(position) {
    const list = await this.getAll(position);
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
      "version", "file_path", "url", "is_hidden", "is_action_button", "permissions", "policy", "file_hash", "file_checksum"
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(key);
        placeholders.push(`$${idx++}`);
        values.push(key === 'permissions' || key === 'policy' ? JSON.stringify(data[key]) : data[key]);
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
      "version", "file_path", "url", "is_hidden", "is_action_button", "permissions", "policy", "file_hash", "file_checksum"
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(key === 'permissions' || key === 'policy' ? JSON.stringify(data[key]) : data[key]);
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
        COALESCE(ma.version, am.version) as version,
        COALESCE(ma.file_path, am.file_path) as file_path,
        CASE 
          WHEN am.menu_type = 1 THEN am.url
          WHEN am.url LIKE 'http://%' OR am.url LIKE 'https://%' THEN am.url
          WHEN am.app_id IS NOT NULL THEN
            CASE 
              WHEN am.url IS NOT NULL AND am.url <> '' THEN
                CASE 
                  WHEN RIGHT(ma.url, 1) = '/' AND LEFT(am.url, 1) = '/' THEN ma.url || SUBSTRING(am.url, 2)
                  WHEN RIGHT(ma.url, 1) <> '/' AND LEFT(am.url, 1) <> '/' THEN ma.url || '/' || am.url
                  ELSE ma.url || am.url
                END
              ELSE ma.url
            END
          ELSE am.url
        END as url,
        am.is_hidden,
        am.is_action_button,
        am.permissions,
        am.policy,
        COALESCE(ma.file_hash, am.file_hash) as file_hash,
        COALESCE(ma.file_checksum, am.file_checksum) as file_checksum,
        am.created_at
      FROM app_menus am
      LEFT JOIN mini_apps ma ON am.app_id = ma.app_id
      WHERE am.id = $1
    `;
    const res = await db.query(query, [id]);
    if (res.rows.length === 0) {
      throw new Error("Menu item not found");
    }
    const row = res.rows[0];
    return {
      ...row,
      id: parseInt(row.id),
      menupid: row.menupid ? parseInt(row.menupid) : null,
      requires_auth: row.requires_auth === true || row.requires_auth === 'true',
      is_hidden: row.is_hidden === true || row.is_hidden === 'true',
      is_action_button: row.is_action_button === true || row.is_action_button === 'true',
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || []),
      policy: typeof row.policy === 'string' ? JSON.parse(row.policy) : (row.policy || {}),
      file_hash: row.file_hash,
      file_checksum: row.file_checksum
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
