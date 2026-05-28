const menuService = require("../services/menu.service");
const responseHelper = require("../utils/response.helper");

class MenuController {
  async getAll(req, res, next) {
    try {
      const menus = await menuService.getAll();
      return responseHelper.success(res, menus, "Menus fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();
