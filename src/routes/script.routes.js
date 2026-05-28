const express = require("express");
const router = express.Router();
const scriptController = require("../controllers/script.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

const { requirePermission } = require("../middlewares/permission.middleware");

// Public endpoints (Accessible by Mini Apps without token)
router.get("/", scriptController.getActive);

// Protected endpoints (For Admin Management)
router.get("/history", authenticateToken, requirePermission("scripts", 0), scriptController.getHistory);
router.get("/:id", authenticateToken, requirePermission("scripts", 0), scriptController.getById);
router.post("/", authenticateToken, requirePermission("scripts", 1), scriptController.create);

module.exports = router;
