const bcrypt = require("bcryptjs");
const db = require("../db");

class UserService {
  async getAllActive() {
    const result = await db.query(
      `SELECT id, username, full_name, email, avatar_url, is_actived, created_at 
       FROM users 
       WHERE is_actived = true 
       ORDER BY id DESC`
    );
    return result.rows.map(row => ({ ...row, id: parseInt(row.id) }));
  }

  async getById(id) {
    const result = await db.query(
      `SELECT id, username, full_name, email, avatar_url, is_actived, created_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
    const user = result.rows[0];
    return { ...user, id: parseInt(user.id) };
  }

  async update(id, { username, password, full_name, email, avatar_url, is_actived }) {
    // Check user existence
    const checkResult = await db.query("SELECT id FROM users WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("User not found");
    }

    // Prepare fields to update
    const fields = [];
    const values = [];
    let idx = 1;

    if (username !== undefined) {
      // Check username duplicate
      const checkUsername = await db.query("SELECT id FROM users WHERE username = $1 AND id <> $2", [username, id]);
      if (checkUsername.rows.length > 0) {
        throw new Error("Username already exists");
      }
      fields.push(`username = $${idx++}`);
      values.push(username);
    }

    if (password !== undefined && password !== "") {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      fields.push(`password = $${idx++}`);
      values.push(hashedPassword);
    }

    if (full_name !== undefined) {
      fields.push(`full_name = $${idx++}`);
      values.push(full_name);
    }

    if (email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (avatar_url !== undefined) {
      fields.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }

    if (is_actived !== undefined) {
      fields.push(`is_actived = $${idx++}`);
      values.push(is_actived);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(", ")} 
      WHERE id = $${idx} 
      RETURNING id, username, full_name, email, avatar_url, is_actived, created_at
    `;

    const result = await db.query(query, values);
    const user = result.rows[0];
    return { ...user, id: parseInt(user.id) };
  }

  async softDelete(id) {
    const checkResult = await db.query("SELECT id FROM users WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const result = await db.query(
      `UPDATE users 
       SET is_actived = false 
       WHERE id = $1 
       RETURNING id, username, is_actived`,
      [id]
    );

    // Revoke refresh tokens as user is deactivated
    await db.query("DELETE FROM refresh_tokens WHERE user_id = $1", [id]);

    const user = result.rows[0];
    return { ...user, id: parseInt(user.id) };
  }
}

module.exports = new UserService();
