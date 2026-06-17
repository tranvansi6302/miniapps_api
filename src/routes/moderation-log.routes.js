const express = require("express");
const router = express.Router();
const moderationLogController = require("../controllers/moderation-log.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { requirePermission } = require("../middlewares/permission.middleware");

router.get("/", authenticateToken, requirePermission("mini-apps", 0), moderationLogController.list);
router.get("/export", authenticateToken, requirePermission("mini-apps", 0), moderationLogController.export);

module.exports = router;
