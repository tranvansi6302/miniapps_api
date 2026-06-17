const miniAppBuildService = require("../services/mini-app-build.service");
const responseHelper = require("../utils/response.helper");

class MiniAppBuildController {
  async list(req, res, next) {
    try {
      const { mini_app_id } = req.params;
      const builds = await miniAppBuildService.list(mini_app_id);
      return responseHelper.success(res, builds, "Mini App builds fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { mini_app_id } = req.params;
      const { version, changelog, reviewer_notes, file_path, file_hash, file_checksum } = req.body;

      if (!version) {
        return responseHelper.error(res, "Version number is required", null, 400);
      }

      const build = await miniAppBuildService.create(mini_app_id, {
        version,
        changelog,
        reviewer_notes,
        file_path,
        file_hash,
        file_checksum
      });
      return responseHelper.success(res, build, "New build registered successfully", 201);
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message === "Build with this version already exists for this Mini App") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { mini_app_id, id } = req.params;
      const { status, checklist } = req.body;
      const performedBy = req.body.performed_by || (req.user && req.user.username) || "admin";

      if (status === undefined) {
        return responseHelper.error(res, "Status value is required", null, 400);
      }

      const build = await miniAppBuildService.updateStatus(mini_app_id, id, status, performedBy, checklist);
      return responseHelper.success(res, build, "Build status updated successfully");
    } catch (error) {
      if (error.message === "Build not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message === "Invalid status code") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }
}

module.exports = new MiniAppBuildController();
