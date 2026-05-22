const authService = require("../services/auth.service");
const responseHelper = require("../utils/response.helper");

class AuthController {
  async register(req, res, next) {
    try {
      const { username, password, full_name, email, avatar_url } = req.body;
      if (!username || !password || !full_name) {
        return responseHelper.error(res, "Username, password and full name are required", null, 400);
      }

      const user = await authService.register({ username, password, full_name, email, avatar_url });
      return responseHelper.success(res, user, "User registered successfully", 201);
    } catch (error) {
      if (error.message === "Username already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return responseHelper.error(res, "Username and password are required", null, 400);
      }

      const result = await authService.login(username, password);
      return responseHelper.success(res, result, "Login successful");
    } catch (error) {
      if (error.message === "Invalid username or password") {
        return responseHelper.error(res, error.message, null, 401);
      }
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return responseHelper.error(res, "Refresh token is required", null, 400);
      }

      const result = await authService.refreshToken(refreshToken);
      return responseHelper.success(res, result, "Token refreshed successfully");
    } catch (error) {
      if (error.message.includes("Invalid or expired") || error.message.includes("suspended or deleted")) {
        return responseHelper.error(res, error.message, null, 401);
      }
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return responseHelper.error(res, "Refresh token is required to logout", null, 400);
      }

      await authService.logout(refreshToken);
      return responseHelper.success(res, null, "Logout successful");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
