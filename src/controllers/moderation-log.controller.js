const moderationLogService = require("../services/moderation-log.service");
const responseHelper = require("../utils/response.helper");

class ModerationLogController {
  async list(req, res, next) {
    try {
      const { mini_app_id, build_id, action, search, page, limit } = req.query;
      const data = await moderationLogService.list({
        mini_app_id,
        build_id,
        action,
        search,
        page,
        limit
      });
      return responseHelper.success(res, data, "Moderation logs fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async export(req, res, next) {
    try {
      const csvContent = await moderationLogService.exportCsv();
      
      const fileName = `moderation_logs_${Math.round(Date.now() / 1000)}.csv`;
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      
      return res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ModerationLogController();
