const db = require("../db");

class MenuService {
  async getAll() {
    const result = await db.query(
      `SELECT id, key, label, created_at 
       FROM menus 
       ORDER BY id ASC`
    );
    return result.rows.map(row => ({ ...row, id: parseInt(row.id) }));
  }
}

module.exports = new MenuService();
