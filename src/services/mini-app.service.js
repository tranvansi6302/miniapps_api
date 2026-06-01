const db = require("../db");

class MiniAppService {
  async create({
    app_id,
    name,
    category_id,
    short_description,
    description,
    icon_url,
    url,
    version,
    requires_auth,
    is_hidden,
    is_actived,
    terms_url,
    privacy_policy_url,
    file_path,
    permissions = [],
    sub_apps = []
  }) {
    // Check if app_id already exists
    const checkAppId = await db.query("SELECT id FROM mini_apps WHERE app_id = $1", [app_id]);
    if (checkAppId.rows.length > 0) {
      throw new Error("Mini App with this app_id already exists");
    }

    // Verify category exists
    const checkCategory = await db.query("SELECT id FROM mini_app_categories WHERE id = $1", [category_id]);
    if (checkCategory.rows.length === 0) {
      throw new Error("Category does not exist");
    }

    const requiresAuthVal = requires_auth !== undefined ? requires_auth : false;
    const isHiddenVal = is_hidden !== undefined ? is_hidden : true;
    const isActiveVal = is_actived !== undefined ? is_actived : true;
    const isMaintenanceVal = is_maintenance !== undefined ? is_maintenance : false;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO mini_apps (
          app_id, name, category_id, short_description, description, 
          icon_url, url, version, requires_auth, is_hidden, 
          is_actived, terms_url, privacy_policy_url, file_path, sub_apps, is_maintenance
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          app_id,
          name,
          category_id,
          short_description,
          description,
          icon_url,
          url,
          version,
          requiresAuthVal,
          isHiddenVal,
          isActiveVal,
          terms_url,
          privacy_policy_url,
          file_path,
          Array.isArray(sub_apps) ? JSON.stringify(sub_apps) : (sub_apps || '[]'),
          isMaintenanceVal
        ]
      );

      const app = result.rows[0];

      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        for (const p of permissions) {
          await client.query(
            "INSERT INTO mini_app_permissions (mini_app_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [app.id, p]
          );
        }
      }

      await client.query('COMMIT');
      return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id), permissions };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getById(id) {
    const result = await db.query(
      `SELECT m.*, c.name as category_name,
       COALESCE(
         (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
         '[]'::json
       ) as permissions
       FROM mini_apps m 
       JOIN mini_app_categories c ON m.category_id = c.id 
       WHERE m.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("Mini App not found");
    }
    const app = result.rows[0];
    return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id) };
  }

  async getByAppId(appId) {
    const result = await db.query(
      `SELECT m.*, c.name as category_name,
       COALESCE(
         (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
         '[]'::json
       ) as permissions
       FROM mini_apps m 
       JOIN mini_app_categories c ON m.category_id = c.id 
       WHERE m.app_id = $1`,
      [appId]
    );
    if (result.rows.length === 0) {
      throw new Error("Mini App not found");
    }
    const app = result.rows[0];
    return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id) };
  }

  async checkAccessByAppId(appId, userId) {
    // Check app exists
    const appCheck = await db.query(
      `SELECT id FROM mini_apps WHERE app_id = $1`,
      [appId]
    );
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }
    const app = appCheck.rows[0];

    // Check if user is a member
    const memberCheck = await db.query(
      `SELECT id FROM mini_app_members WHERE mini_app_id = $1 AND user_id = $2 AND status = 1`,
      [app.id, userId]
    );
    if (memberCheck.rows.length === 0) {
      throw new Error("Access denied");
    }

    return this.getByAppId(appId);
  }

  async update(id, data) {
    // Check if exists
    const checkResult = await db.query("SELECT id FROM mini_apps WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      "app_id",
      "name",
      "category_id",
      "short_description",
      "description",
      "icon_url",
      "url",
      "version",
      "requires_auth",
      "is_hidden",
      "is_actived",
      "terms_url",
      "privacy_policy_url",
      "file_path",
      "sub_apps",
      "is_maintenance"
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === "app_id") {
          // Check app_id unique
          const checkAppId = await db.query("SELECT id FROM mini_apps WHERE app_id = $1 AND id <> $2", [data[field], id]);
          if (checkAppId.rows.length > 0) {
            throw new Error("Mini App with this app_id already exists");
          }
        }
        if (field === "category_id") {
          // Check category exists
          const checkCat = await db.query("SELECT id FROM mini_app_categories WHERE id = $1", [data[field]]);
          if (checkCat.rows.length === 0) {
            throw new Error("Category does not exist");
          }
        }
        fields.push(`${field} = $${idx++}`);
        if (field === "sub_apps") {
          values.push(Array.isArray(data[field]) ? JSON.stringify(data[field]) : (data[field] || '[]'));
        } else {
          values.push(data[field]);
        }
      }
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      let app;
      if (fields.length > 0) {
        values.push(id);
        const query = `
          UPDATE mini_apps 
          SET ${fields.join(", ")} 
          WHERE id = $${idx} 
          RETURNING *
        `;
        const result = await client.query(query, values);
        app = result.rows[0];
      } else {
        const result = await client.query("SELECT * FROM mini_apps WHERE id = $1", [id]);
        app = result.rows[0];
      }

      if (data.permissions !== undefined && Array.isArray(data.permissions)) {
        // Xóa permissions cũ
        await client.query("DELETE FROM mini_app_permissions WHERE mini_app_id = $1", [id]);

        // Thêm permissions mới
        if (data.permissions.length > 0) {
          for (const p of data.permissions) {
            await client.query(
              "INSERT INTO mini_app_permissions (mini_app_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [id, p]
            );
          }
        }
      }

      await client.query('COMMIT');
      return this.getById(id); // Lấy lại object sau khi update (bao gồm permissions và category_name)
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async softDelete(id) {
    const checkResult = await db.query("SELECT id FROM mini_apps WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    const result = await db.query(
      `UPDATE mini_apps 
       SET is_actived = false 
       WHERE id = $1 
       RETURNING id, app_id, name, is_actived`,
      [id]
    );

    const app = result.rows[0];
    return { ...app, id: parseInt(app.id) };
  }

  async list({ category_id, search, include_hidden, include_inactive, user_id, mine } = {}) {
    let query = `
      SELECT m.*, c.name as category_name,
      COALESCE(
        (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
        '[]'::json
      ) as permissions
      FROM mini_apps m
      JOIN mini_app_categories c ON m.category_id = c.id
    `;
    const values = [];
    let idx = 1;

    if (mine === "true" || mine === true) {
      if (!user_id) {
        throw new Error("User ID is required to list my apps");
      }
      query += ` JOIN mini_app_members mam ON mam.mini_app_id = m.id AND mam.status = 1 AND mam.user_id = $${idx++}`;
      values.push(user_id);
    }

    query += ` WHERE 1=1`;

    // Filter inactive by default
    if (include_inactive !== "true" && include_inactive !== true) {
      query += ` AND m.is_actived = true`;
    }

    // Filter hidden by default
    if (include_hidden !== "true" && include_hidden !== true) {
      query += ` AND m.is_hidden = false`;
    }

    if (category_id) {
      query += ` AND m.category_id = $${idx++}`;
      values.push(category_id);
    }

    if (search) {
      query += ` AND (m.app_id ILIKE $${idx} OR m.name ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    query += ` ORDER BY m.id DESC`;

    const result = await db.query(query, values);
    return result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      category_id: parseInt(row.category_id)
    }));
  }

  async getRolesMetadata() {
    const result = await db.query(`
      SELECT r.code, r.name, r.description,
             COALESCE(
               (SELECT json_agg(rp.permission_code) 
                FROM mini_app_role_permissions rp 
                WHERE rp.role_code = r.code), 
               '[]'::json
             ) as permissions
      FROM mini_app_roles r
      ORDER BY r.created_at ASC
    `);
    return result.rows;
  }
}

module.exports = new MiniAppService();
