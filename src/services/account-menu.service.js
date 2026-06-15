const db = require("../db");

class AccountMenuService {
  async getAll() {
    const query = `
      SELECT id, category, name, icon, url, right_icon, order_num, requires_auth, is_active
      FROM account_menus
      WHERE is_active = true
      ORDER BY order_num ASC, id ASC
    `;
    const result = await db.query(query);
    
    // Group by category
    const grouped = {};
    for (const row of result.rows) {
      const cat = row.category;
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push({
        id: parseInt(row.id),
        category: row.category,
        name: row.name,
        icon: row.icon,
        url: row.url,
        right_icon: row.right_icon,
        order_num: parseInt(row.order_num),
        requires_auth: row.requires_auth === true || row.requires_auth === 'true'
      });
    }

    // Convert to array of groups for easy rendering
    return Object.keys(grouped).map(key => ({
      category: key,
      items: grouped[key]
    }));
  }

  async create(data) {
    const query = `
      INSERT INTO account_menus (category, name, icon, url, right_icon, order_num, requires_auth, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, category, name, icon, url, right_icon, order_num, requires_auth, is_active
    `;
    const values = [
      data.category,
      data.name,
      data.icon,
      data.url,
      data.right_icon || null,
      data.order_num || 0,
      data.requires_auth === true,
      data.is_active !== false
    ];
    const res = await db.query(query, values);
    return res.rows[0];
  }

  async update(id, data) {
    const query = `
      UPDATE account_menus
      SET category = $1, name = $2, icon = $3, url = $4, right_icon = $5, order_num = $6, requires_auth = $7, is_active = $8
      WHERE id = $9
      RETURNING id, category, name, icon, url, right_icon, order_num, requires_auth, is_active
    `;
    const values = [
      data.category,
      data.name,
      data.icon,
      data.url,
      data.right_icon || null,
      data.order_num || 0,
      data.requires_auth === true,
      data.is_active !== false,
      id
    ];
    const res = await db.query(query, values);
    if (res.rows.length === 0) {
      throw new Error("Account menu item not found");
    }
    return res.rows[0];
  }

  async delete(id) {
    const res = await db.query("DELETE FROM account_menus WHERE id = $1 RETURNING id", [id]);
    if (res.rows.length === 0) {
      throw new Error("Account menu item not found");
    }
    return true;
  }

  async updateOrder(items) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(
          "UPDATE account_menus SET order_num = $1 WHERE id = $2",
          [parseInt(item.order_num), parseInt(item.id)]
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

module.exports = new AccountMenuService();
