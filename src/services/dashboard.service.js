const db = require("../db");

class DashboardService {
  async getStats() {
    // 1. KPI Cards
    const totalAppsRes = await db.query("SELECT COUNT(*)::int FROM mini_apps");
    const activeAppsRes = await db.query("SELECT COUNT(*)::int FROM mini_apps WHERE is_actived = true AND is_hidden = false");
    const pendingBuildsRes = await db.query("SELECT COUNT(*)::int FROM mini_app_builds WHERE status = 1");
    const totalUsersRes = await db.query("SELECT COUNT(*)::int FROM users");
    const totalCategoriesRes = await db.query("SELECT COUNT(*)::int FROM mini_app_categories WHERE is_actived = true");

    // 2. Category Distribution
    const categoryDistRes = await db.query(`
      SELECT 
        c.id::int,
        c.name,
        COUNT(m.id)::int as count
      FROM mini_app_categories c
      LEFT JOIN mini_apps m ON m.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);

    // 3. Build Status Distribution
    const buildStatusRes = await db.query(`
      SELECT 
        status::int,
        COUNT(*)::int as count
      FROM mini_app_builds
      GROUP BY status
    `);

    // 4. Permissions Request Distribution
    const permissionDistRes = await db.query(`
      SELECT 
        p.code,
        p.name,
        COUNT(map.mini_app_id)::int as count
      FROM permissions p
      LEFT JOIN mini_app_permissions map ON map.permission_code = p.code
      GROUP BY p.code, p.name
      ORDER BY count DESC
    `);

    // 5. Recent builds (5)
    const recentBuildsRes = await db.query(`
      SELECT 
        b.id::int, 
        m.name as app_name, 
        b.version, 
        b.created_at, 
        b.status::int
      FROM mini_app_builds b
      JOIN mini_apps m ON b.mini_app_id = m.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);

    // 6. Recent Mini Apps (5)
    const recentAppsRes = await db.query(`
      SELECT 
        id::int,
        name, 
        version, 
        created_at
      FROM mini_apps
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return {
      kpis: {
        totalApps: totalAppsRes.rows[0].count,
        activeApps: activeAppsRes.rows[0].count,
        pendingBuilds: pendingBuildsRes.rows[0].count,
        totalUsers: totalUsersRes.rows[0].count,
        totalCategories: totalCategoriesRes.rows[0].count
      },
      categoryDistribution: categoryDistRes.rows,
      buildStatusDistribution: buildStatusRes.rows,
      permissionDistribution: permissionDistRes.rows,
      recentBuilds: recentBuildsRes.rows,
      recentApps: recentAppsRes.rows
    };
  }
}

module.exports = new DashboardService();
