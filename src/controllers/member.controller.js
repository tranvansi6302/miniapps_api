const memberService = require("../services/member.service");
const responseHelper = require("../utils/response.helper");

class MemberController {
  async bulkAdd(req, res, next) {
    try {
      const { mini_app_id } = req.params;
      const { user_ids, status } = req.body;

      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return responseHelper.error(res, "user_ids must be a non-empty array", null, 400);
      }

      const statusVal = status !== undefined ? parseInt(status) : 1;
      const result = await memberService.bulkAdd(parseInt(mini_app_id), user_ids, statusVal);

      return responseHelper.success(res, result, "Members added successfully", 201);
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async bulkUpdateStatus(req, res, next) {
    try {
      const { mini_app_id } = req.params;
      const { user_ids, status } = req.body;

      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return responseHelper.error(res, "user_ids must be a non-empty array", null, 400);
      }

      if (status === undefined) {
        return responseHelper.error(res, "status is required", null, 400);
      }

      const result = await memberService.bulkUpdateStatus(parseInt(mini_app_id), user_ids, parseInt(status));
      return responseHelper.success(res, result, "Member statuses updated successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async bulkRemove(req, res, next) {
    try {
      const { mini_app_id } = req.params;
      const { user_ids } = req.body;

      if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return responseHelper.error(res, "user_ids must be a non-empty array", null, 400);
      }

      const result = await memberService.bulkRemove(parseInt(mini_app_id), user_ids);
      return responseHelper.success(res, result, "Members soft-removed successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async listMembers(req, res, next) {
    try {
      const { mini_app_id } = req.params;
      const { status } = req.query;

      const statusVal = status !== undefined ? parseInt(status) : undefined;
      const members = await memberService.listMembers(parseInt(mini_app_id), statusVal);

      return responseHelper.success(res, members, "Members fetched successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new MemberController();
