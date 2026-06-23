const db = require("../db");

class MiniAppGroupService {
  async create({ name, app_id }) {
    // Check if app_id exists in mini_apps
    const checkApp = await db.query("SELECT id FROM mini_apps WHERE app_id = $1", [app_id]);
    if (checkApp.rows.length === 0) {
      throw new Error("Mini App with this app_id does not exist");
    }

    // Check if mapping already exists
    const checkDup = await db.query("SELECT id FROM mini_app_groups WHERE name = $1 AND app_id = $2", [name, app_id]);
    if (checkDup.rows.length > 0) {
      return checkDup.rows[0];
    }

    const result = await db.query(
      "INSERT INTO mini_app_groups (name, app_id) VALUES ($1, $2) RETURNING *",
      [name, app_id]
    );
    return result.rows[0];
  }

  async delete(id) {
    const check = await db.query("SELECT id FROM mini_app_groups WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      throw new Error("Group mapping not found");
    }
    await db.query("DELETE FROM mini_app_groups WHERE id = $1", [id]);
    return true;
  }

  async list(isTree = false) {
    const query = `
      SELECT mag.id as mapping_id, mag.name as group_name, mag.created_at as mapped_at,
             m.*, c.name as category_name
      FROM mini_app_groups mag
      JOIN mini_apps m ON mag.app_id = m.app_id
      JOIN mini_app_categories c ON m.category_id = c.id
      ORDER BY mag.name ASC, m.id DESC
    `;
    const result = await db.query(query);
    const mappings = result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      category_id: parseInt(row.category_id),
      mapping_id: parseInt(row.mapping_id)
    }));

    if (isTree) {
      const groupsMap = {};
      for (const item of mappings) {
        if (!groupsMap[item.group_name]) {
          groupsMap[item.group_name] = {
            name: item.group_name,
            children: []
          };
        }
        const { mapping_id, group_name, mapped_at, ...appInfo } = item;
        groupsMap[item.group_name].children.push(appInfo);
      }
      return Object.values(groupsMap);
    }

    return mappings;
  }
}

module.exports = new MiniAppGroupService();
