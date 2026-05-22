const db = require("../db");

class ScriptService {
  async create({ type, version, description, content, is_actived }) {
    // Check if script type already exists
    const checkType = await db.query("SELECT id FROM bridge_scripts WHERE type = $1", [type]);
    if (checkType.rows.length > 0) {
      throw new Error("Bridge script with this type already exists");
    }

    const isActiveVal = is_actived !== undefined ? is_actived : true;

    const result = await db.query(
      `INSERT INTO bridge_scripts (type, version, description, content, is_actived)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, version, description, content, is_actived, created_at`,
      [type, version, description, content, isActiveVal]
    );

    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async getById(id) {
    const result = await db.query(
      `SELECT id, type, version, description, content, is_actived, created_at 
       FROM bridge_scripts 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("Bridge script not found");
    }
    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async getByType(type) {
    const result = await db.query(
      `SELECT id, type, version, description, content, is_actived, created_at 
       FROM bridge_scripts 
       WHERE type = $1`,
      [type]
    );
    if (result.rows.length === 0) {
      throw new Error("Bridge script not found");
    }
    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async update(id, { type, version, description, content, is_actived }) {
    // Check existence
    const checkResult = await db.query("SELECT id FROM bridge_scripts WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Bridge script not found");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (type !== undefined) {
      const checkType = await db.query("SELECT id FROM bridge_scripts WHERE type = $1 AND id <> $2", [type, id]);
      if (checkType.rows.length > 0) {
        throw new Error("Bridge script with this type already exists");
      }
      fields.push(`type = $${idx++}`);
      values.push(type);
    }

    if (version !== undefined) {
      fields.push(`version = $${idx++}`);
      values.push(version);
    }

    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }

    if (content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(content);
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
      UPDATE bridge_scripts 
      SET ${fields.join(", ")} 
      WHERE id = $${idx} 
      RETURNING id, type, version, description, content, is_actived, created_at
    `;

    const result = await db.query(query, values);
    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async softDelete(id) {
    const checkResult = await db.query("SELECT id FROM bridge_scripts WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("Bridge script not found");
    }

    const result = await db.query(
      `UPDATE bridge_scripts 
       SET is_actived = false 
       WHERE id = $1 
       RETURNING id, type, is_actived`,
      [id]
    );

    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async list({ type, include_inactive } = {}) {
    let query = `
      SELECT id, type, version, description, content, is_actived, created_at 
      FROM bridge_scripts 
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (include_inactive !== "true" && include_inactive !== true) {
      query += ` AND is_actived = true`;
    }

    if (type) {
      query += ` AND type ILIKE $${idx++}`;
      values.push(`%${type}%`);
    }

    query += ` ORDER BY id DESC`;

    const result = await db.query(query, values);
    return result.rows.map(row => ({ ...row, id: parseInt(row.id) }));
  }
}

module.exports = new ScriptService();
