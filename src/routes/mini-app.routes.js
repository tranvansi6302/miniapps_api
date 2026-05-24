const express = require("express");
const router = express.Router();
const miniAppController = require("../controllers/mini-app.controller");
const memberController = require("../controllers/member.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoints for mini-apps
router.get("/", miniAppController.list);
router.get("/:id", miniAppController.getById);
router.get("/app-id/:appId", miniAppController.getByAppId);
router.get("/:mini_app_id/members", memberController.listMembers);

// Protected endpoints for mini-apps
router.post("/", authenticateToken, miniAppController.create);
router.put("/:id", authenticateToken, miniAppController.update);
router.delete("/:id", authenticateToken, miniAppController.softDelete);
router.get("/app-id/:appId/check-access", authenticateToken, miniAppController.checkAccessByAppId);

// Protected member endpoints (nested under mini-apps)
router.post("/:mini_app_id/members", authenticateToken, memberController.bulkAdd);
router.put("/:mini_app_id/members", authenticateToken, memberController.bulkUpdateStatus);
router.delete("/:mini_app_id/members", authenticateToken, memberController.bulkRemove);

module.exports = router;
