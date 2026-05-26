const scriptService = require("../services/script.service");
const responseHelper = require("../utils/response.helper");

class ScriptController {
  async create(req, res, next) {
    try {
      const { version, description, content } = req.body;
      if (!version || !content) {
        return responseHelper.error(res, "Version and content are required", null, 400);
      }

      const script = await scriptService.create({ version, description, content });
      return responseHelper.success(res, script, "New bridge script version created successfully", 201);
    } catch (error) {
      if (error.message === "Bridge script with this version already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async getActive(req, res, next) {
    try {
      const script = await scriptService.getActive();
      return responseHelper.success(res, script, "Active bridge script fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const script = await scriptService.getById(id);
      return responseHelper.success(res, script, "Bridge script version fetched successfully");
    } catch (error) {
      if (error.message === "Bridge script version not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const scripts = await scriptService.getHistory();
      return responseHelper.success(res, scripts, "Bridge scripts history fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScriptController();
