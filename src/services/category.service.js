const db = require("../db");

class CategoryService {
  async create({ name, code, icon_url, is_actived }) {
    // Check if code already exists
    const checkCode = await db.query("SELECT id FROM mini_app_categories WHERE code = $1", [code]);
    if (checkCode.rows.length > 0) {
      throw new Error("Category code already exists");
    }

    const isActiveVal = is_actived !== undefined ? is_actived : true;

    const result = await db.query(
      `INSERT INTO mini_app_categories (name, code, icon_url, is_actived)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, code, icon_url, is_actived, created_at`,
      [name, code, icon_url, isActiveVal]
    );

    const category = result.rows[0];
    return { ...category, id: parseInt(category.id) };
  }

  async getAllActive() {
    const result = await db.query(
      `SELECT id, name, code, icon_url, is_actived, created_at 
       FROM mini_app_categories 
       WHERE is_actived = true 
       ORDER BY name ASC`
    );
    return result.rows.map(row => ({ ...row, id: parseInt(row.id) }));
  }

  async getAll() {
    const result = await db.query(
      `SELECT id, name, code, icon_url, is_actived, created_at 
       FROM mini_app_categories 
       ORDER BY id DESC`
    );
    return result.rows.map(row => ({ ...row, id: parseInt(row.id) }));
  }

  async getById(id) {
    const result = await db.query(
      `SELECT id, name, code, icon_url, is_actived, created_at 
       FROM mini_app_categories 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("Category not found");
    }
    const category = result.rows[0];
    return { ...category, id: parseInt(category.id) };
  }

  async update(id, { name, code, icon_url, is_actived }) {
    // Check if category exists
    const checkResult = await db.query("SELECT id FROM mini_app_categories WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Category not found");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    if (code !== undefined) {
      const checkCode = await db.query("SELECT id FROM mini_app_categories WHERE code = $1 AND id <> $2", [code, id]);
      if (checkCode.rows.length > 0) {
        throw new Error("Category code already exists");
      }
      fields.push(`code = $${idx++}`);
      values.push(code);
    }

    if (icon_url !== undefined) {
      fields.push(`icon_url = $${idx++}`);
      values.push(icon_url);
    }

    if (is_actived !== undefined) {
      fields.push(`is_actived = $${idx++}`);
      values.push(is_actived);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const query = `
      UPDATE mini_app_categories 
      SET ${fields.join(", ")} 
      WHERE id = $${idx} 
      RETURNING id, name, code, icon_url, is_actived, created_at
    `;

    const result = await db.query(query, values);
    const category = result.rows[0];
    return { ...category, id: parseInt(category.id) };
  }

  async softDelete(id) {
    const checkResult = await db.query("SELECT id FROM mini_app_categories WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Category not found");
    }

    const result = await db.query(
      `UPDATE mini_app_categories 
       SET is_actived = false 
       WHERE id = $1 
       RETURNING id, name, code, is_actived`,
      [id]
    );

    const category = result.rows[0];
    return { ...category, id: parseInt(category.id) };
  }
}

module.exports = new CategoryService();
