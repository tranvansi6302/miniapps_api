const miniAppService = require("../services/mini-app.service");
const responseHelper = require("../utils/response.helper");

class MiniAppController {
  async create(req, res, next) {
    try {
      const {
        app_id,
        name,
        category_id,
        short_description,
        description,
        icon_url,
        url,
        version,
        requires_auth,
        is_hidden,
        is_actived,
        terms_url,
        privacy_policy_url,
        permissions
      } = req.body;

      if (!app_id || !name || !category_id || !url || !version) {
        return responseHelper.error(res, "app_id, name, category_id, url and version are required", null, 400);
      }

      const app = await miniAppService.create({
        app_id,
        name,
        category_id,
        short_description,
        description,
        icon_url,
        url,
        version,
        requires_auth,
        is_hidden,
        is_actived,
        terms_url,
        privacy_policy_url,
        permissions
      });

      return responseHelper.success(res, app, "Mini App created successfully", 201);
    } catch (error) {
      if (error.message.includes("already exists") || error.message.includes("does not exist")) {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const app = await miniAppService.getById(id);
      return responseHelper.success(res, app, "Mini App fetched successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getByAppId(req, res, next) {
    try {
      const { appId } = req.params;
      const app = await miniAppService.getByAppId(appId);
      return responseHelper.success(res, app, "Mini App fetched successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async checkAccessByAppId(req, res, next) {
    try {
      const { appId } = req.params;
      const userId = req.user.id;
      const app = await miniAppService.checkAccessByAppId(appId, userId);
      return responseHelper.success(res, app, "Access verified successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message === "Access denied") {
        return responseHelper.error(res, error.message, null, 403);
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const app = await miniAppService.update(id, req.body);
      return responseHelper.success(res, app, "Mini App updated successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message.includes("already exists") || error.message.includes("does not exist")) {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      const app = await miniAppService.softDelete(id);
      return responseHelper.success(res, app, "Mini App soft-deleted successfully");
    } catch (error) {
      if (error.message === "Mini App not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { category_id, search, include_hidden, include_inactive, mine } = req.query;
      const userId = req.user ? req.user.id : null;
      const apps = await miniAppService.list({
        category_id: category_id ? parseInt(category_id) : undefined,
        search,
        include_hidden,
        include_inactive,
        user_id: userId,
        mine
      });
      return responseHelper.success(res, apps, "Mini Apps fetched successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MiniAppController();
