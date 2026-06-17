const miniAppService = require("../services/mini-app.service");
const responseHelper = require("../utils/response.helper");
const supabase = require("../utils/supabase.helper");
const path = require("path");
const crypto = require("crypto");

function applyMaintenanceRedirect(app, req) {
  if (!app) return app;

  // We should NOT apply maintenance redirect to admin dashboard queries
  // to avoid accidentally saving the maintenance URL back to the database.
  const isDashboardRequest = req.headers.authorization || 
                             req.query.include_hidden === "true" || 
                             req.query.include_inactive === "true" ||
                             req.query.include_hidden === true || 
                             req.query.include_inactive === true;
  
  if (isDashboardRequest) {
    return app;
  }

  const protocol = req.protocol;
  const host = req.get('host');
  const maintenanceUrl = `${protocol}://${host}/maintenance`;

  const updatedApp = { ...app };

  if (updatedApp.is_maintenance === true || updatedApp.is_maintenance === 'true') {
    // Override main url
    updatedApp.url = maintenanceUrl;
    
    // Override sub apps path as well
    if (updatedApp.sub_apps) {
      try {
        let subAppsArray = typeof updatedApp.sub_apps === 'string' 
          ? JSON.parse(updatedApp.sub_apps) 
          : updatedApp.sub_apps;
        
        if (Array.isArray(subAppsArray)) {
          subAppsArray = subAppsArray.map(sub => ({
            ...sub,
            path: maintenanceUrl
          }));
          updatedApp.sub_apps = subAppsArray;
        }
      } catch (err) {
        console.error("Error parsing sub_apps for maintenance redirection:", err);
      }
    }
  } else {
    // If only specific sub_apps are marked as maintenance:
    if (updatedApp.sub_apps) {
      try {
        let subAppsArray = typeof updatedApp.sub_apps === 'string' 
          ? JSON.parse(updatedApp.sub_apps) 
          : updatedApp.sub_apps;
        
        if (Array.isArray(subAppsArray)) {
          let updated = false;
          subAppsArray = subAppsArray.map(sub => {
            if (sub.is_maintenance === true || sub.is_maintenance === 'true') {
              updated = true;
              return {
                ...sub,
                path: maintenanceUrl
              };
            }
            return sub;
          });
          if (updated) {
            updatedApp.sub_apps = subAppsArray;
          }
        }
      } catch (err) {
        console.error("Error parsing sub_apps for maintenance redirection:", err);
      }
    }
  }
  return updatedApp;
}

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
        is_maintenance,
        terms_url,
        privacy_policy_url,
        file_path,
        permissions,
        sub_apps,
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
        is_maintenance,
        terms_url,
        privacy_policy_url,
        file_path,
        permissions,
        sub_apps,
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
      let app = await miniAppService.getById(id);
      app = applyMaintenanceRedirect(app, req);
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
      let app = await miniAppService.getByAppId(appId);
      app = applyMaintenanceRedirect(app, req);
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
      let app = await miniAppService.checkAccessByAppId(appId, userId);
      app = applyMaintenanceRedirect(app, req);
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
      let apps = await miniAppService.list({
        category_id: category_id ? parseInt(category_id) : undefined,
        search,
        include_hidden,
        include_inactive,
        user_id: userId,
        mine
      });
      apps = apps.map(app => applyMaintenanceRedirect(app, req));
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
