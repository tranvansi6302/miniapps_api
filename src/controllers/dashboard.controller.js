const dashboardService = require("../services/dashboard.service");
const responseHelper = require("../utils/response.helper");

class DashboardController {
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats();
      return responseHelper.success(res, stats, "Dashboard statistics fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
