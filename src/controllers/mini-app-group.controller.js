const miniAppGroupService = require("../services/mini-app-group.service");
const responseHelper = require("../utils/response.helper");

class MiniAppGroupController {
  async list(req, res, next) {
    try {
      const { isChildren } = req.query;
      const isTree = isChildren === "true" || isChildren === true;
      const groups = await miniAppGroupService.list(isTree);
      return responseHelper.success(res, groups, "Mini App Groups fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, app_id } = req.body;
      if (!name || !app_id) {
        return responseHelper.error(res, "name and app_id are required", null, 400);
      }
      const mapping = await miniAppGroupService.create({ name, app_id });
      return responseHelper.success(res, mapping, "Mini App Group created successfully", 201);
    } catch (error) {
      if (error.message.includes("does not exist")) {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await miniAppGroupService.delete(id);
      return responseHelper.success(res, null, "Mini App Group deleted successfully");
    } catch (error) {
      if (error.message.includes("not found")) {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new MiniAppGroupController();
