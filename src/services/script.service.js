const db = require("../db");

class ScriptService {
  async create({ version, description, content }) {
    // Check if version already exists
    const checkVersion = await db.query("SELECT id FROM bridge_scripts WHERE version = $1", [version]);
    if (checkVersion.rows.length > 0) {
      throw new Error("Bridge script with this version already exists");
    }

    const result = await db.query(
      `INSERT INTO bridge_scripts (version, description, content)
       VALUES ($1, $2, $3)
       RETURNING id, version, description, content, created_at`,
      [version, description, content]
    );

    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async getActive() {
    const result = await db.query(
      `SELECT id, version, description, content, created_at 
       FROM bridge_scripts 
       ORDER BY id DESC 
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async getById(id) {
    const result = await db.query(
      `SELECT id, version, description, content, created_at 
       FROM bridge_scripts 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("Bridge script version not found");
    }
    const script = result.rows[0];
    return { ...script, id: parseInt(script.id) };
  }

  async getHistory() {
    const result = await db.query(
      `SELECT id, version, description, created_at 
       FROM bridge_scripts 
       ORDER BY id DESC`
    );
    return result.rows.map(row => ({ ...row, id: parseInt(row.id) }));
  }
}

module.exports = new ScriptService();
