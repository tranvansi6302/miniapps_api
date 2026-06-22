const accountMenuService = require("../services/account-menu.service");
const responseHelper = require("../utils/response.helper");

class AccountMenuController {
  async getAll(req, res, next) {
    try {
      const data = await accountMenuService.getAll(req.query);
      return responseHelper.success(res, data, "Account menus fetched and grouped successfully");
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await accountMenuService.create(req.body);
      return responseHelper.success(res, data, "Account menu created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = await accountMenuService.update(id, req.body);
      return responseHelper.success(res, data, "Account menu updated successfully");
    } catch (error) {
      if (error.message === "Account menu item not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await accountMenuService.delete(id);
      return responseHelper.success(res, null, "Account menu deleted successfully");
    } catch (error) {
      if (error.message === "Account menu item not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return responseHelper.error(res, "items array is required", null, 400);
      }
      await accountMenuService.updateOrder(items);
      return responseHelper.success(res, null, "Account menus order updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountMenuController();
