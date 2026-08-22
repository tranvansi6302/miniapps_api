const db = require("../db");
const { propagateGroupUpdates } = require("../utils/group.helper");

class MiniAppService {
  async resolveGroupInheritance(apps) {
    if (!apps || apps.length === 0) return apps;

    // Fetch all parent apps (where parent_id = 0)
    const parentsRes = await db.query(
      `SELECT m.*, c.name as category_name,
       COALESCE(
         (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
         '[]'::json
       ) as permissions
       FROM mini_apps m
       JOIN mini_app_categories c ON m.category_id = c.id
       WHERE m.parent_id = 0 OR m.parent_id IS NULL`
    );

    const parentAppsMap = {};
    for (const parent of parentsRes.rows) {
      parentAppsMap[parent.id] = parent;
      parentAppsMap[parent.app_id] = parent;
    }

    return apps.map(app => {
      let parentApp = null;
      const pid = parseInt(app.parent_id || 0);

      if (pid > 0 && parentAppsMap[pid]) {
        parentApp = parentAppsMap[pid];
      } else {
        const matchingParentAppId = Object.keys(parentAppsMap).find(pAppId =>
          app.app_id !== pAppId && app.app_id.startsWith(pAppId)
        );
        if (matchingParentAppId) {
          parentApp = parentAppsMap[matchingParentAppId];
        }
      }

      // If this is a Child app (has a parent)
      if (parentApp && parseInt(app.id) !== parseInt(parentApp.id)) {
        return {
          ...app,
          parent_id: parseInt(parentApp.id),
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
          group_id: parseInt(parentApp.id),
          group_name: parentApp.name,
          group_app_id: parentApp.app_id
        };
      }

      // Cha (Parent app, parent_id = 0)
      return {
        ...app,
        parent_id: 0,
        permissions: (!app.permissions || !Array.isArray(app.permissions) || app.permissions.length === 0)
          ? ["camera", "location", "storage"]
          : app.permissions
      };
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
    requires_auth = false,
    is_hidden = true,
    is_actived = true,
    terms_url = null,
    file_path = null,
    policy = {},
    is_maintenance = false,
    permissions = [],
    parent_id = 0
  }) {
    // Check for duplicate app_id
    const checkDup = await db.query("SELECT id FROM mini_apps WHERE app_id = $1", [app_id]);
    if (checkDup.rows.length > 0) {
      throw new Error(`Mini App with app_id '${app_id}' already exists.`);
    }

    // Auto-detect parent_id (0 = Cha, >0 = Con)
    let effectiveParentId = parseInt(parent_id || 0);
    if (effectiveParentId === 0) {
      const parentSearch = await db.query(
        "SELECT id FROM mini_apps WHERE $1 LIKE app_id || '%' AND app_id <> $1 AND (parent_id = 0 OR parent_id IS NULL) LIMIT 1",
        [app_id]
      );
      if (parentSearch.rows.length > 0) {
        effectiveParentId = parseInt(parentSearch.rows[0].id);
      }
    }

    const query = `
      INSERT INTO mini_apps (
        app_id, name, category_id, short_description, description,
        icon_url, url, version, requires_auth, is_hidden, is_actived,
        terms_url, file_path, policy, is_maintenance, parent_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `;

    const values = [
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
      file_path,
      JSON.stringify(policy),
      is_maintenance,
      effectiveParentId
    ];

    const result = await db.query(query, values);
    const newApp = result.rows[0];

    // Save permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      for (const permCode of permissions) {
        await db.query(
          "INSERT INTO mini_app_permissions (mini_app_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [newApp.id, permCode]
        );
      }
    }

    return newApp;
  }

  async getAll({ page = 1, limit = 20, search = "", category_id = null, is_actived = null, is_hidden = null }) {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const values = [];
    let idx = 1;

    if (search) {
      whereClauses.push(`(m.name ILIKE $${idx} OR m.app_id ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (category_id) {
      whereClauses.push(`m.category_id = $${idx}`);
      values.push(category_id);
      idx++;
    }

    if (is_actived !== null && is_actived !== undefined) {
      whereClauses.push(`m.is_actived = $${idx}`);
      values.push(is_actived === "true" || is_actived === true);
      idx++;
    }

    if (is_hidden !== null && is_hidden !== undefined) {
      whereClauses.push(`m.is_hidden = $${idx}`);
      values.push(is_hidden === "true" || is_hidden === true);
      idx++;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) FROM mini_apps m ${whereStr}`;
    const totalResult = await db.query(countQuery, values);
    const total = parseInt(totalResult.rows[0].count);

    const query = `
      SELECT m.*, c.name as category_name,
      COALESCE(
        (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
        '[]'::json
      ) as permissions
      FROM mini_apps m
      JOIN mini_app_categories c ON m.category_id = c.id
      ${whereStr}
      ORDER BY m.id DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const result = await db.query(query, [...values, limit, offset]);

    const appsWithNumbers = result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      category_id: parseInt(row.category_id),
      parent_id: parseInt(row.parent_id || 0)
    }));

    const resolvedApps = await this.resolveGroupInheritance(appsWithNumbers);

    return {
      data: resolvedApps,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    const query = `
      SELECT m.*, c.name as category_name,
      COALESCE(
        (SELECT json_agg(p.permission_code) FROM mini_app_permissions p WHERE p.mini_app_id = m.id), 
        '[]'::json
      ) as permissions
      FROM mini_apps m
      JOIN mini_app_categories c ON m.category_id = c.id
      WHERE m.id = $1
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    const app = result.rows[0];
    app.id = parseInt(app.id);
    app.category_id = parseInt(app.category_id);
    app.parent_id = parseInt(app.parent_id || 0);

    const resolved = await this.resolveGroupInheritance([app]);
    return resolved[0];
  }

  async update(id, updateData) {
    const current = await db.query("SELECT * FROM mini_apps WHERE id = $1", [id]);
    if (current.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    const allowedFields = [
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
      "file_path",
      "policy",
      "is_maintenance",
      "parent_id"
    ];

    const fields = [];
    const values = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        if (field === "policy") {
          values.push(JSON.stringify(updateData[field]));
        } else {
          values.push(updateData[field]);
        }
      }
    }

    if (fields.length > 0) {
      values.push(id);
      const query = `
        UPDATE mini_apps
        SET ${fields.join(", ")}
        WHERE id = $${idx}
        RETURNING *
      `;
      await db.query(query, values);
    }

    // If updating Cha (parent_id = 0), automatically update all Con (parent_id = id)
    const currentParentId = parseInt(current.rows[0].parent_id || 0);
    if (currentParentId === 0) {
      const childStatusFields = [];
      const childStatusVals = [];
      let cIdx = 1;

      const syncFields = ["is_actived", "is_hidden", "is_maintenance", "version", "file_path", "icon_url"];
      for (const field of syncFields) {
        if (updateData[field] !== undefined && updateData[field] !== null) {
          childStatusFields.push(`${field} = $${cIdx++}`);
          childStatusVals.push(updateData[field]);
        }
      }

      if (childStatusFields.length > 0) {
        childStatusVals.push(id);
        await db.query(
          `UPDATE mini_apps SET ${childStatusFields.join(", ")} WHERE parent_id = $${cIdx}`,
          childStatusVals
        );
      }
    }

    // Also propagate URL and shared fields via group helper
    const app_id = current.rows[0].app_id;
    await propagateGroupUpdates(db, app_id, updateData);

    // Handle permissions update if provided
    if (updateData.permissions && Array.isArray(updateData.permissions)) {
      await db.query("DELETE FROM mini_app_permissions WHERE mini_app_id = $1", [id]);
      for (const permCode of updateData.permissions) {
        await db.query(
          "INSERT INTO mini_app_permissions (mini_app_id, permission_code) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [id, permCode]
        );
      }
    }

    return await this.getById(id);
  }

  async delete(id) {
    const current = await db.query("SELECT * FROM mini_apps WHERE id = $1", [id]);
    if (current.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    // If deleting Cha (parent_id = 0), delete all Con (parent_id = id)
    const parentId = parseInt(current.rows[0].parent_id || 0);
    if (parentId === 0) {
      await db.query("DELETE FROM mini_apps WHERE parent_id = $1", [id]);
    }

    await db.query("DELETE FROM mini_apps WHERE id = $1", [id]);
    return true;
  }
}

module.exports = new MiniAppService();
