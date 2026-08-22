const db = require("../db");
const miniAppService = require("./mini-app.service");

class MiniAppGroupService {
  async create({ name, app_id }) {
    // Check if app_id exists in mini_apps
    const checkApp = await db.query("SELECT id FROM mini_apps WHERE app_id = $1", [app_id]);
    if (checkApp.rows.length === 0) {
      throw new Error("Mini App with this app_id does not exist");
    }
    return checkApp.rows[0];
  }

  async delete(id) {
    // If id is a parent mini_apps id, deleting parent deletes children via CASCADE
    const check = await db.query("SELECT id FROM mini_apps WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      throw new Error("Mini App group not found");
    }
    await db.query("DELETE FROM mini_apps WHERE id = $1", [id]);
    return true;
  }

  async update(id, { name, app_id }) {
    const check = await db.query("SELECT id FROM mini_apps WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      throw new Error("Mini App group not found");
    }

    if (name) {
      await db.query("UPDATE mini_apps SET name = $1 WHERE id = $2", [name, id]);
    }
    return (await db.query("SELECT * FROM mini_apps WHERE id = $1", [id])).rows[0];
  }

  async list(isTree = false) {
    // Query all Parent apps directly from mini_apps (where parent_id IS NULL)
    const parentsResult = await db.query(
      "SELECT id as mapping_id, name as group_name, app_id as parent_app_id, created_at as mapped_at FROM mini_apps WHERE parent_id IS NULL ORDER BY name ASC"
    );
    const parentGroups = parentsResult.rows;

    const allMappings = [];

    for (const group of parentGroups) {
      const query = `
        SELECT m.*, c.name as category_name
        FROM mini_apps m
        JOIN mini_app_categories c ON m.category_id = c.id
        WHERE m.parent_id = $1 OR m.app_id = $2 OR m.app_id LIKE $2 || '%'
        ORDER BY m.id DESC
      `;
      const appsResult = await db.query(query, [group.mapping_id, group.parent_app_id]);

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
