const bcrypt = require("bcryptjs");
const db = require("../db");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt.helper");

class AuthService {
  async register({ username, password, full_name, email, avatar_url }) {
    // Kiểm tra username trùng lặp
    const checkUser = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0) {
      throw new Error("Username already exists");
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (username, password, full_name, email, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, full_name, email, avatar_url, menu_permissions, is_actived, created_at`,
      [username, hashedPassword, full_name, email, avatar_url]
    );

    return result.rows[0];
  }

  async login(username, password) {
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1 AND is_actived = true",
      [username]
    );
    if (result.rows.length === 0) {
      throw new Error("Invalid username or password");
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid username or password");
    }

    // Tạo tokens
    const payload = { 
      id: parseInt(user.id), 
      username: user.username,
      menu_permissions: user.menu_permissions 
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Lưu Refresh Token vào Database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 ngày sử dụng

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    return {
      user: {
        id: parseInt(user.id),
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        menu_permissions: user.menu_permissions
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token) {
    // Tìm refresh token còn hạn trong DB
    const result = await db.query(
      "SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    if (result.rows.length === 0) {
      throw new Error("Invalid or expired refresh token");
    }

    const dbToken = result.rows[0];
    
    // Lấy thông tin user
    const userResult = await db.query("SELECT id, username, menu_permissions FROM users WHERE id = $1 AND is_actived = true", [
      dbToken.user_id
    ]);
    if (userResult.rows.length === 0) {
      throw new Error("User associated with token is suspended or deleted");
    }

    const user = userResult.rows[0];
    const payload = { 
      id: parseInt(user.id), 
      username: user.username,
      menu_permissions: user.menu_permissions 
    };
    const accessToken = generateAccessToken(payload);

    return { accessToken };
  }

  async logout(token) {
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    return true;
  }
}

module.exports = new AuthService();
