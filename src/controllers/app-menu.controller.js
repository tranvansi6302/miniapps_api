const appMenuService = require("../services/app-menu.service");
const responseHelper = require("../utils/response.helper");
const supabase = require("../utils/supabase.helper");
const path = require("path");

class AppMenuController {
  async getAll(req, res, next) {
    try {
      const { position, tree, app_id } = req.query;
      let data;
      if (tree === "true" || tree === true) {
        data = await appMenuService.getTree(position, app_id);
      } else {
        data = await appMenuService.getAll(position, app_id);
      }
      return responseHelper.success(res, data, "App menus fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await appMenuService.getById(id);
      return responseHelper.success(res, data, "App menu fetched successfully");
    } catch (error) {
      if (error.message === "Menu item not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const menu = await appMenuService.create(req.body);
      return responseHelper.success(res, menu, "App menu created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const menu = await appMenuService.update(id, req.body);
      return responseHelper.success(res, menu, "App menu updated successfully");
    } catch (error) {
      if (error.message === "Menu item not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await appMenuService.delete(id);
      return responseHelper.success(res, null, "App menu deleted successfully");
    } catch (error) {
      if (error.message === "Menu item not found") {
        return responseHelper.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return responseHelper.error(res, "No file uploaded or invalid file format.", null, 400);
      }

      // Check if Supabase helper is correctly initialized with credentials
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseKey) {
        return responseHelper.error(
          res, 
          "Supabase credentials are not configured in backend .env.", 
          null, 
          500
        );
      }

      const timestamp = Math.round(Date.now() / 1000);
      const ext = path.extname(req.file.originalname) || ".png";
      const fileName = `menu_img_${timestamp}${ext}`;

      const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "miniappstorage";

      // Upload the buffer to Supabase Storage Bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype || "image/png",
          upsert: true
        });

      if (error) {
        return responseHelper.error(res, `Supabase storage upload failed: ${error.message}`, null, 500);
      }

      // Retrieve public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return responseHelper.success(res, { url: publicUrl }, "Image uploaded successfully to Supabase Storage");
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return responseHelper.error(res, "items array is required", null, 400);
      }
      await appMenuService.updateOrder(items);
      return responseHelper.success(res, null, "App menus order updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppMenuController();
