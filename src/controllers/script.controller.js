const scriptService = require("../services/script.service");
const responseHelper = require("../utils/response.helper");

class ScriptController {
  async create(req, res, next) {
    try {
      const { type, version, description, content, is_actived } = req.body;
      if (!type || !version || !content) {
        return responseHelper.error(res, "Type, version and content are required", null, 400);
      }

      const script = await scriptService.create({ type, version, description, content, is_actived });
      return responseHelper.success(res, script, "Bridge script created successfully", 201);
    } catch (error) {
      if (error.message === "Bridge script with this type already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const script = await scriptService.getById(id);
      return responseHelper.success(res, script, "Bridge script fetched successfully");
    } catch (error) {
      if (error.message === "Bridge script not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getByType(req, res, next) {
    try {
      const { type } = req.params;
      const script = await scriptService.getByType(type);
      return responseHelper.success(res, script, "Bridge script fetched successfully");
    } catch (error) {
      if (error.message === "Bridge script not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { type, version, description, content, is_actived } = req.body;

      const script = await scriptService.update(id, { type, version, description, content, is_actived });
      return responseHelper.success(res, script, "Bridge script updated successfully");
    } catch (error) {
      if (error.message === "Bridge script not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message === "Bridge script with this type already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      const script = await scriptService.softDelete(id);
      return responseHelper.success(res, script, "Bridge script soft-deleted successfully");
    } catch (error) {
      if (error.message === "Bridge script not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { type, include_inactive } = req.query;
      const scripts = await scriptService.list({ type, include_inactive });
      return responseHelper.success(res, scripts, "Bridge scripts fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScriptController();
