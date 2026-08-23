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

      const timestamp = Math.round(Date.now() / 1000);
      const ext = path.extname(req.file.originalname) || ".png";
      const fileName = `menu_img_${timestamp}${ext}`;

      // Check if Supabase helper is correctly initialized with credentials
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseKey) {
        try {
          const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "miniappstorage";
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, req.file.buffer, {
              contentType: req.file.mimetype || "image/png",
              upsert: true
            });

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);

            return responseHelper.success(res, { url: publicUrl }, "Image uploaded successfully to Supabase Storage");
          }
        } catch (supabaseErr) {
          console.warn("⚠️ Supabase upload warning, falling back to local file storage:", supabaseErr.message);
        }
      }

      // Fallback: Save file to local uploads directory served statically at /uploads
      const fs = require("fs");
      const uploadsDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFilePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(localFilePath, req.file.buffer);

      const protocol = req.protocol || "http";
      const host = req.get("host") || `localhost:${process.env.PORT || 3000}`;
      const publicUrl = `${protocol}://${host}/uploads/${fileName}`;

      return responseHelper.success(res, { url: publicUrl }, "Image uploaded successfully to local storage");
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
