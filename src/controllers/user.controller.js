const userService = require("../services/user.service");
const responseHelper = require("../utils/response.helper");

class UserController {
  async getAllActive(req, res, next) {
    try {
      const users = await userService.getAllActive();
      return responseHelper.success(res, users, "Users fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getById(id);
      return responseHelper.success(res, user, "User fetched successfully");
    } catch (error) {
      if (error.message === "User not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { username, password, full_name, fullName, email, avatar_url, menu_permissions, is_actived } = req.body;

      const user = await userService.update(id, {
        username,
        password,
        full_name: full_name !== undefined ? full_name : fullName,
        email,
        avatar_url,
        menu_permissions,
        is_actived
      });

      return responseHelper.success(res, user, "User updated successfully");
    } catch (error) {
      if (error.message === "User not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message === "Username already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.softDelete(id);
      return responseHelper.success(res, result, "User deactivated successfully");
    } catch (error) {
      if (error.message === "User not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new UserController();
