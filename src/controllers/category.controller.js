const categoryService = require("../services/category.service");
const responseHelper = require("../utils/response.helper");

class CategoryController {
  async create(req, res, next) {
    try {
      const { name, code, icon_url, is_actived } = req.body;
      if (!name || !code || !icon_url) {
        return responseHelper.error(res, "Name, code and icon_url are required", null, 400);
      }

      const category = await categoryService.create({ name, code, icon_url, is_actived });
      return responseHelper.success(res, category, "Category created successfully", 201);
    } catch (error) {
      if (error.message === "Category code already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async getAllActive(req, res, next) {
    try {
      const categories = await categoryService.getAllActive();
      return responseHelper.success(res, categories, "Active categories fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAll();
      return responseHelper.success(res, categories, "All categories fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getById(id);
      return responseHelper.success(res, category, "Category fetched successfully");
    } catch (error) {
      if (error.message === "Category not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, code, icon_url, is_actived } = req.body;

      const category = await categoryService.update(id, { name, code, icon_url, is_actived });
      return responseHelper.success(res, category, "Category updated successfully");
    } catch (error) {
      if (error.message === "Category not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      if (error.message === "Category code already exists") {
        return responseHelper.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.softDelete(id);
      return responseHelper.success(res, category, "Category soft-deleted successfully");
    } catch (error) {
      if (error.message === "Category not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new CategoryController();
