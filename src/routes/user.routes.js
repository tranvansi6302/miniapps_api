const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

const { requirePermission } = require("../middlewares/permission.middleware");

// Protected endpoints
router.get("/", authenticateToken, requirePermission("users", 0), userController.getAllActive);
router.get("/:id", authenticateToken, requirePermission("users", 0), userController.getById);
router.put("/:id", authenticateToken, requirePermission("users", 4), userController.update);
router.delete("/:id", authenticateToken, requirePermission("users", 2), userController.softDelete);

module.exports = router;
