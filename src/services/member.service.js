const db = require("../db");

class MemberService {
  async bulkAdd(mini_app_id, user_ids, status = 1, role_code = 'tester') {
    // Verify Mini App exists
    const appCheck = await db.query("SELECT id FROM mini_apps WHERE id = $1", [mini_app_id]);
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      throw new Error("user_ids must be a non-empty array");
    }

    const addedMembers = [];
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      for (const userId of user_ids) {
        // Verify User exists and is active
        const userCheck = await client.query("SELECT id, username FROM users WHERE id = $1 AND is_actived = true", [userId]);
        if (userCheck.rows.length === 0) {
          continue; // Skip invalid or inactive users
        }

        // Check if member record already exists
        const memberCheck = await client.query(
          "SELECT id FROM mini_app_members WHERE mini_app_id = $1 AND user_id = $2",
          [mini_app_id, userId]
        );

        let memberRow;
        if (memberCheck.rows.length > 0) {
          // Update existing member status and role_code
          const updateRes = await client.query(
            `UPDATE mini_app_members 
             SET status = $1, role_code = $2 
             WHERE mini_app_id = $3 AND user_id = $4 
             RETURNING id, mini_app_id, user_id, status, role_code, added_at`,
            [status, role_code, mini_app_id, userId]
          );
          memberRow = updateRes.rows[0];
        } else {
          // Insert new member record
          const insertRes = await client.query(
            `INSERT INTO mini_app_members (mini_app_id, user_id, status, role_code)
             VALUES ($1, $2, $3, $4)
             RETURNING id, mini_app_id, user_id, status, role_code, added_at`,
            [mini_app_id, userId, status, role_code]
          );
          memberRow = insertRes.rows[0];
        }

        addedMembers.push({
          ...memberRow,
          id: parseInt(memberRow.id),
          mini_app_id: parseInt(memberRow.mini_app_id),
          user_id: parseInt(memberRow.user_id),
          role: memberRow.role_code,
          role_code: memberRow.role_code
        });
      }

      await client.query("COMMIT");
      return addedMembers;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkRemove(mini_app_id, user_ids) {
    return this.bulkUpdate(mini_app_id, user_ids, { status: 3 }); // 3 represents 'Deleted' status
  }

  async bulkUpdateStatus(mini_app_id, user_ids, status) {
    return this.bulkUpdate(mini_app_id, user_ids, { status });
  }

  async bulkUpdate(mini_app_id, user_ids, { status, role, role_code }) {
    // Verify Mini App exists
    const appCheck = await db.query("SELECT id FROM mini_apps WHERE id = $1", [mini_app_id]);
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      throw new Error("user_ids must be a non-empty array");
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }

    const targetRole = role_code !== undefined ? role_code : role;
    if (targetRole !== undefined) {
      fields.push(`role_code = $${idx++}`);
      values.push(targetRole);
    }

    if (fields.length === 0) {
      return [];
    }

    values.push(mini_app_id);
    values.push(user_ids);

    const query = `
      UPDATE mini_app_members 
      SET ${fields.join(", ")} 
      WHERE mini_app_id = $${idx++} AND user_id = ANY($${idx}::bigint[]) 
      RETURNING id, mini_app_id, user_id, status, role_code, added_at
    `;

    const result = await db.query(query, values);
    return result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      mini_app_id: parseInt(row.mini_app_id),
      user_id: parseInt(row.user_id),
      role: row.role_code,
      role_code: row.role_code
    }));
  }

  async listMembers(mini_app_id, status) {
    // Verify Mini App exists
    const appCheck = await db.query("SELECT id FROM mini_apps WHERE id = $1", [mini_app_id]);
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    let query = `
      SELECT m.id as member_id, m.status, m.added_at, m.role_code, 
             u.id as user_id, u.username, u.full_name, u.email, u.avatar_url
      FROM mini_app_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.mini_app_id = $1
    `;
    const values = [mini_app_id];

    if (status !== undefined) {
      query += ` AND m.status = $2`;
      values.push(status);
    }

    query += ` ORDER BY m.id DESC`;

    const result = await db.query(query, values);
    return result.rows.map(row => ({
      member_id: parseInt(row.member_id),
      user_id: parseInt(row.user_id),
      username: row.username,
      full_name: row.full_name,
      email: row.email,
      avatar_url: row.avatar_url,
      role: row.role_code,
      role_code: row.role_code,
      status: row.status,
      added_at: row.added_at
    }));
  }
}

module.exports = new MemberService();
