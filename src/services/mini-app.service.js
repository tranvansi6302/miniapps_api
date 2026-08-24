const db = require("../db");
const { propagateGroupUpdates } = require("../utils/group.helper");

class MiniAppService {
  async resolveGroupInheritance(apps) {
    if (!apps || apps.length === 0) return apps;

    let resolvedApps = apps;

    // Fetch all parent groups
    const groupsRes = await db.query("SELECT id, name, app_id FROM mini_app_groups");
    if (groupsRes.rows.length > 0) {
      // Fetch parent apps themselves
      const parentAppIds = groupsRes.rows.map(g => g.app_id);
      const parentAppsRes = await db.query(
        `SELECT m.*, c.name as category_name,
         COALESCE(
           (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
           '[]'::json
         ) as permissions
         FROM mini_apps m
         JOIN mini_app_categories c ON m.category_id = c.id
         WHERE m.app_id = ANY($1)`,
        [parentAppIds]
      );

      const parentAppsMap = {};
      for (const parent of parentAppsRes.rows) {
        parentAppsMap[parent.app_id] = parent;
      }

      const groupsMap = {};
      for (const group of groupsRes.rows) {
        groupsMap[group.app_id] = group;
      }

      resolvedApps = apps.map(app => {
        // Find matching group parent prefix
        const matchingGroupParentId = parentAppIds.find(parentAppId => 
          app.app_id.startsWith(parentAppId)
        );

        if (matchingGroupParentId) {
          const parentApp = parentAppsMap[matchingGroupParentId];
          const group = groupsMap[matchingGroupParentId];

          // If it is a child app (not the parent itself)
          if (app.app_id !== matchingGroupParentId && parentApp) {
            return {
              ...app,
              category_id: parseInt(parentApp.category_id),
              category_name: parentApp.category_name,
              version: parentApp.version,
              file_path: parentApp.file_path,
              file_hash: parentApp.file_hash,
              file_checksum: parentApp.file_checksum,
              requires_auth: parentApp.requires_auth,
              is_maintenance: parentApp.is_maintenance,
              icon_url: parentApp.icon_url,
              policy: parentApp.policy,
              permissions: parentApp.permissions || [],
              group_id: group ? parseInt(group.id) : null,
              group_name: group ? group.name : null,
              group_app_id: matchingGroupParentId
            };
          } else if (group) {
            // It's the parent app itself
            return {
              ...app,
              group_id: parseInt(group.id),
              group_name: group.name,
              group_app_id: matchingGroupParentId
            };
          }
        }
        return app;
      });
    }

    // Default empty/null permissions to ['camera', 'location', 'storage']
    return resolvedApps.map(app => {
      const perms = app.permissions;
      if (!perms || !Array.isArray(perms) || perms.length === 0) {
        return {
          ...app,
          permissions: ["camera", "location", "storage"]
        };
      }
      return app;
    });
  }

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
    policy = {},
    file_hash,
    file_checksum
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

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO mini_apps (
          app_id, name, category_id, short_description, description, 
          icon_url, url, version, requires_auth, is_hidden, 
          is_actived, terms_url, privacy_policy_url, file_path, policy, file_hash, file_checksum
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
          policy && typeof policy === 'object' ? JSON.stringify(policy) : (policy || '{}'),
          file_hash || null,
          file_checksum || null
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
      const returnedPerms = (!permissions || !Array.isArray(permissions) || permissions.length === 0)
        ? ["camera", "location", "storage"]
        : permissions;
      return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id), permissions: returnedPerms };
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
    const resolved = await this.resolveGroupInheritance(result.rows);
    const app = resolved[0];
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
    const resolved = await this.resolveGroupInheritance(result.rows);
    const app = resolved[0];
    return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id) };
  }

  async checkAccessByAppId(appId, userId) {
    const parentGroupsRes = await db.query(
      "SELECT DISTINCT app_id FROM mini_app_groups WHERE $1 LIKE app_id || '%' OR $1 LIKE '%' || app_id",
      [appId]
    );

    let targetAppId = appId;
    if (parentGroupsRes.rows.length > 0) {
      targetAppId = parentGroupsRes.rows[0].app_id;
    }

    const appCheck = await db.query(
      `SELECT id FROM mini_apps WHERE app_id = $1`,
      [targetAppId]
    );
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }
    const app = appCheck.rows[0];

    const memberCheck = await db.query(
      `SELECT id FROM mini_app_members WHERE mini_app_id = $1 AND user_id = $2 AND status = 1`,
      [app.id, userId]
    );
    if (memberCheck.rows.length === 0) {
      throw new Error("Access denied");
    }

    return this.getByAppId(appId);
  }

  async update(id, data, performedBy = "admin") {
    // Check if exists
    const checkResult = await db.query("SELECT id, is_actived, version FROM mini_apps WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Mini App not found");
    }
    const oldApp = checkResult.rows[0];

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
      "policy",
      "file_hash",
      "file_checksum"
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
        if (field === "policy") {
          values.push(data[field] && typeof data[field] === 'object' ? JSON.stringify(data[field]) : (data[field] || '{}'));
        } else {
          values.push(data[field]);
        }
      }
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Check for is_actived changes
      if (data.is_actived !== undefined && oldApp.is_actived !== data.is_actived) {
        const action = "TOGGLE_ACTIVE";
        await client.query(
          `INSERT INTO mini_app_moderation_logs (mini_app_id, action, version, performed_by, checklist)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id, 
            action, 
            oldApp.version || "1.0.0", 
            performedBy, 
            JSON.stringify({ 
              is_actived: data.is_actived, 
              notes: `Trạng thái hoạt động đổi từ ${oldApp.is_actived} sang ${data.is_actived}` 
            })
          ]
        );
      }

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

        // Propagate updates to all other apps in the same group
        await propagateGroupUpdates(client, app.app_id, {
          version: data.version,
          file_path: data.file_path,
          file_hash: data.file_hash,
          file_checksum: data.file_checksum,
          url: data.url
        });
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

  async softDelete(id, performedBy = "admin") {
    const checkResult = await db.query("SELECT id, is_actived, version FROM mini_apps WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Mini App not found");
    }
    const oldApp = checkResult.rows[0];

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE mini_apps 
         SET is_actived = false 
         WHERE id = $1 
         RETURNING id, app_id, name, is_actived`,
        [id]
      );

      if (oldApp.is_actived !== false) {
        await client.query(
          `INSERT INTO mini_app_moderation_logs (mini_app_id, action, version, performed_by, checklist)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            "TOGGLE_ACTIVE",
            oldApp.version || "1.0.0",
            performedBy,
            JSON.stringify({
              is_actived: false,
              notes: `Xóa Mini App (Khóa hoạt động)`
            })
          ]
        );
      }

      await client.query('COMMIT');
      const app = result.rows[0];
      return { ...app, id: parseInt(app.id) };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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
    const rawApps = result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      category_id: parseInt(row.category_id)
    }));
    return this.resolveGroupInheritance(rawApps);
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
