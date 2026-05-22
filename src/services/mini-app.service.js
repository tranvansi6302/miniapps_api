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
    privacy_policy_url
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

    const result = await db.query(
      `INSERT INTO mini_apps (
        app_id, name, category_id, short_description, description, 
        icon_url, url, version, requires_auth, is_hidden, 
        is_actived, terms_url, privacy_policy_url
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        privacy_policy_url
      ]
    );

    const app = result.rows[0];
    return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id) };
  }

  async getById(id) {
    const result = await db.query(
      `SELECT m.*, c.name as category_name 
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
      `SELECT m.*, c.name as category_name 
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
      "privacy_policy_url"
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
        values.push(data[field]);
      }
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const query = `
      UPDATE mini_apps 
      SET ${fields.join(", ")} 
      WHERE id = $${idx} 
      RETURNING *
    `;

    const result = await db.query(query, values);
    const app = result.rows[0];
    return { ...app, id: parseInt(app.id), category_id: parseInt(app.category_id) };
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

  async list({ category_id, search, include_hidden, include_inactive } = {}) {
    let query = `
      SELECT m.*, c.name as category_name 
      FROM mini_apps m
      JOIN mini_app_categories c ON m.category_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

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
}

module.exports = new MiniAppService();
