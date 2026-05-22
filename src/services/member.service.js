const db = require("../db");

class MemberService {
  async bulkAdd(mini_app_id, user_ids, status = 1) {
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
          // Update existing member status
          const updateRes = await client.query(
            `UPDATE mini_app_members 
             SET status = $1 
             WHERE mini_app_id = $2 AND user_id = $3 
             RETURNING id, mini_app_id, user_id, status, added_at`,
            [status, mini_app_id, userId]
          );
          memberRow = updateRes.rows[0];
        } else {
          // Insert new member record
          const insertRes = await client.query(
            `INSERT INTO mini_app_members (mini_app_id, user_id, status)
             VALUES ($1, $2, $3)
             RETURNING id, mini_app_id, user_id, status, added_at`,
            [mini_app_id, userId, status]
          );
          memberRow = insertRes.rows[0];
        }

        addedMembers.push({
          ...memberRow,
          id: parseInt(memberRow.id),
          mini_app_id: parseInt(memberRow.mini_app_id),
          user_id: parseInt(memberRow.user_id)
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
    return this.bulkUpdateStatus(mini_app_id, user_ids, 3); // 3 represents 'Deleted' status
  }

  async bulkUpdateStatus(mini_app_id, user_ids, status) {
    // Verify Mini App exists
    const appCheck = await db.query("SELECT id FROM mini_apps WHERE id = $1", [mini_app_id]);
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      throw new Error("user_ids must be a non-empty array");
    }

    const result = await db.query(
      `UPDATE mini_app_members 
       SET status = $1 
       WHERE mini_app_id = $2 AND user_id = ANY($3::bigint[]) 
       RETURNING id, mini_app_id, user_id, status, added_at`,
      [status, mini_app_id, user_ids]
    );

    return result.rows.map(row => ({
      ...row,
      id: parseInt(row.id),
      mini_app_id: parseInt(row.mini_app_id),
      user_id: parseInt(row.user_id)
    }));
  }

  async listMembers(mini_app_id, status) {
    // Verify Mini App exists
    const appCheck = await db.query("SELECT id FROM mini_apps WHERE id = $1", [mini_app_id]);
    if (appCheck.rows.length === 0) {
      throw new Error("Mini App not found");
    }

    let query = `
      SELECT m.id as member_id, m.status, m.added_at, 
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
      status: row.status,
      added_at: row.added_at
    }));
  }
}

module.exports = new MemberService();
