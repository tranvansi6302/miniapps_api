const miniAppService = require("../services/mini-app.service");
const responseHelper = require("../utils/response.helper");
const supabase = require("../utils/supabase.helper");
const path = require("path");
const crypto = require("crypto");


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
        file_path,
        permissions,
        policy
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
        file_path,
        permissions,
        policy
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
      const performedBy = (req.user && req.user.username) || "admin";
      const app = await miniAppService.update(id, req.body, performedBy);
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
      const performedBy = (req.user && req.user.username) || "admin";
      const app = await miniAppService.softDelete(id, performedBy);
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

  async getRolesMetadata(req, res, next) {
    try {
      const roles = await miniAppService.getRolesMetadata();
      return responseHelper.success(res, roles, "Roles metadata fetched successfully");
    } catch (error) {
      next(error);
    }
  }

  async uploadZip(req, res, next) {
    try {
      if (!req.file) {
        return responseHelper.error(res, "No file uploaded or invalid file format. Only .zip is allowed.", null, 400);
      }

      // Check if Supabase helper is correctly initialized with credentials
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseKey) {
        return responseHelper.error(
          res, 
          "Supabase credentials are not configured in backend .env. Please configure SUPABASE_ANON_KEY in your env variables.", 
          null, 
          500
        );
      }

      const appId = req.body.app_id || "app";
      // Clean app_id: keep letters, numbers, dots, dashes, underscores
      const cleanAppId = appId.replace(/[^a-zA-Z0-9.-_]/g, "");

      const version = req.body.version || "1.0.0";
      const cleanVersion = version.replace(/[^0-9.]/g, "");

      const timestamp = Math.round(Date.now() / 1000);
      const ext = path.extname(req.file.originalname) || ".zip";
      const fileName = `${cleanAppId}_v${cleanVersion}_${timestamp}${ext}`;

      const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "miniappstorage";

      // Upload the buffer to Supabase Storage Bucket
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype || "application/zip",
          upsert: true
        });

      if (error) {
        return responseHelper.error(res, `Supabase storage upload failed: ${error.message}`, null, 500);
      }

      // Retrieve public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

      return responseHelper.success(
        res, 
        { url: publicUrl, hash: hash, checksum: hash }, 
        "File uploaded successfully to Supabase Storage"
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MiniAppController();
