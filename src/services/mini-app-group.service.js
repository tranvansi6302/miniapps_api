const db = require("../db");
const miniAppService = require("./mini-app.service");

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

  async update(id, { name, app_id }) {
    const check = await db.query("SELECT id FROM mini_app_groups WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      throw new Error("Group mapping not found");
    }

    if (app_id) {
      const checkApp = await db.query("SELECT id FROM mini_apps WHERE app_id = $1", [app_id]);
      if (checkApp.rows.length === 0) {
        throw new Error("Mini App with this app_id does not exist");
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (app_id !== undefined) {
      fields.push(`app_id = $${idx++}`);
      values.push(app_id);
    }

    values.push(id);
    const query = `
      UPDATE mini_app_groups
      SET ${fields.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `;
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async list(isTree = false) {
    const groupsResult = await db.query("SELECT id as mapping_id, name as group_name, app_id as parent_app_id, created_at as mapped_at FROM mini_app_groups ORDER BY name ASC");
    const parentGroups = groupsResult.rows;

    const allMappings = [];

    for (const group of parentGroups) {
      const query = `
        SELECT m.*, c.name as category_name
        FROM mini_apps m
        JOIN mini_app_categories c ON m.category_id = c.id
        WHERE (m.app_id LIKE $1 || '%' OR m.app_id LIKE '%' || $1) AND m.app_id <> $1
        ORDER BY m.id DESC
      `;
      const appsResult = await db.query(query, [group.parent_app_id]);
      
      const childApps = appsResult.rows.map(row => ({
        ...row,
        id: parseInt(row.id),
        category_id: parseInt(row.category_id),
        mapping_id: parseInt(group.mapping_id),
        group_name: group.group_name,
        parent_app_id: group.parent_app_id
      }));

      allMappings.push(...childApps);
    }

    // Resolve group inheritance to get policy, permissions, file_hash, file_checksum, group_id, etc.
    const resolvedMappings = await miniAppService.resolveGroupInheritance(allMappings);

    if (isTree) {
      const groupsMap = {};
      for (const item of resolvedMappings) {
        if (!groupsMap[item.group_name]) {
          groupsMap[item.group_name] = {
            name: item.group_name,
            parent_app_id: item.parent_app_id,
            mapping_id: item.mapping_id,
            children: []
          };
        }
        const { mapping_id, parent_app_id, ...appInfo } = item;
        groupsMap[item.group_name].children.push(appInfo);
      }
      return Object.values(groupsMap);
    }

    return resolvedMappings;
  }
}

module.exports = new MiniAppGroupService();
