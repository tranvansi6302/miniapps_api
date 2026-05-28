const express = require("express");
const router = express.Router();
const miniAppController = require("../controllers/mini-app.controller");
const memberController = require("../controllers/member.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

const { requirePermission } = require("../middlewares/permission.middleware");

// Public endpoints for mini-apps
router.get("/", miniAppController.list);
router.get("/meta/roles", miniAppController.getRolesMetadata);
router.get("/:id", miniAppController.getById);
router.get("/app-id/:appId", miniAppController.getByAppId);
router.get("/:mini_app_id/members", memberController.listMembers);

const miniAppBuildController = require("../controllers/mini-app-build.controller");
const upload = require("../middlewares/upload.middleware");

// Protected endpoints for mini-apps
router.post("/upload", authenticateToken, requirePermission("mini-apps", 1), upload.single("file"), miniAppController.uploadZip);
router.post("/", authenticateToken, requirePermission("mini-apps", 1), miniAppController.create);
router.put("/:id", authenticateToken, requirePermission("mini-apps", 4), miniAppController.update);
router.delete("/:id", authenticateToken, requirePermission("mini-apps", 2), miniAppController.softDelete);
router.get("/app-id/:appId/check-access", authenticateToken, miniAppController.checkAccessByAppId);

// Protected member endpoints (nested under mini-apps)
router.post("/:mini_app_id/members", authenticateToken, requirePermission("mini-apps", 4), memberController.bulkAdd);
router.put("/:mini_app_id/members", authenticateToken, requirePermission("mini-apps", 4), memberController.bulkUpdateStatus);
router.delete("/:mini_app_id/members", authenticateToken, requirePermission("mini-apps", 4), memberController.bulkRemove);

// Protected build/version endpoints (nested under mini-apps)
router.get("/:mini_app_id/builds", authenticateToken, requirePermission("mini-apps", 0), miniAppBuildController.list);
router.post("/:mini_app_id/builds", authenticateToken, requirePermission("mini-apps", 1), miniAppBuildController.create);
router.put("/:mini_app_id/builds/:id/status", authenticateToken, requirePermission("mini-apps", 4), miniAppBuildController.updateStatus);

module.exports = router;
