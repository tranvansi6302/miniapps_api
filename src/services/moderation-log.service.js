const db = require("../db");

class ModerationLogService {
  async list({ mini_app_id, build_id, action, search, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const values = [];
    let idx = 1;

    let query = `
      SELECT 
        l.id, l.mini_app_id, l.build_id, l.action, l.version, l.performed_by, l.checklist, l.created_at,
        ma.name as mini_app_name, ma.app_id as mini_app_identifier
      FROM mini_app_moderation_logs l
      LEFT JOIN mini_apps ma ON l.mini_app_id = ma.id
      WHERE 1=1
    `;

    if (mini_app_id) {
      query += ` AND l.mini_app_id = $${idx++}`;
      values.push(parseInt(mini_app_id));
    }

    if (build_id) {
      query += ` AND l.build_id = $${idx++}`;
      values.push(parseInt(build_id));
    }

    if (action) {
      query += ` AND l.action = $${idx++}`;
      values.push(action);
    }

    if (search) {
      query += ` AND (l.performed_by ILIKE $${idx} OR ma.name ILIKE $${idx} OR l.version ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM (${query}) as subset
    `;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total);

    // Get paginated data
    query += ` ORDER BY l.created_at DESC, l.id DESC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(parseInt(limit), parseInt(offset));

    const res = await db.query(query, values);
    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      logs: res.rows.map(row => ({
        ...row,
        id: parseInt(row.id),
        mini_app_id: row.mini_app_id ? parseInt(row.mini_app_id) : null,
        build_id: row.build_id ? parseInt(row.build_id) : null,
        checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist) : (row.checklist || {})
      }))
    };
  }

  async create({ mini_app_id, build_id, action, version, performed_by, checklist }) {
    const query = `
      INSERT INTO mini_app_moderation_logs (mini_app_id, build_id, action, version, performed_by, checklist)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      mini_app_id ? parseInt(mini_app_id) : null,
      build_id ? parseInt(build_id) : null,
      action,
      version || null,
      performed_by,
      checklist ? JSON.stringify(checklist) : '{}'
    ];
    const res = await db.query(query, values);
    return res.rows[0];
  }

  async exportCsv() {
    const query = `
      SELECT 
        l.created_at, l.performed_by, ma.name as mini_app_name, ma.app_id as mini_app_identifier,
        l.action, l.version, l.checklist
      FROM mini_app_moderation_logs l
      LEFT JOIN mini_apps ma ON l.mini_app_id = ma.id
      ORDER BY l.created_at DESC, l.id DESC
    `;
    const res = await db.query(query);

    // CSV format with UTF-8 BOM
    let csv = "\ufeff";
    csv += "Thời gian,Người thực hiện,Tên Mini App,App ID,Hành động,Phiên bản,Nội dung Checklist / Chi tiết\n";

    for (const row of res.rows) {
      const dateStr = new Date(row.created_at).toLocaleString("vi-VN");
      const performedBy = `"${row.performed_by.replace(/"/g, '""')}"`;
      const appName = `"${(row.mini_app_name || 'Hệ thống/Đã xóa').replace(/"/g, '""')}"`;
      const appId = `"${(row.mini_app_identifier || '').replace(/"/g, '""')}"`;
      const action = `"${row.action.replace(/"/g, '""')}"`;
      const version = `"${(row.version || '').replace(/"/g, '""')}"`;

      // Format checklist details nicely into a single cell
      let details = "";
      if (row.checklist) {
        const checklist = typeof row.checklist === 'string' ? JSON.parse(row.checklist) : row.checklist;
        const items = [];
        if (checklist.checks) {
          Object.keys(checklist.checks).forEach(k => {
            items.push(`${k}: ${checklist.checks[k] ? 'Đạt' : 'Không đạt'}`);
          });
        }
        if (checklist.notes) {
          items.push(`Ghi chú: ${checklist.notes}`);
        }
        if (checklist.reason) {
          items.push(`Lý do từ chối: ${checklist.reason}`);
        }
        details = `"${items.join(" | ").replace(/"/g, '""')}"`;
      } else {
        details = '""';
      }

      csv += `${dateStr},${performedBy},${appName},${appId},${action},${version},${details}\n`;
    }

    return csv;
  }
}

module.exports = new ModerationLogService();
