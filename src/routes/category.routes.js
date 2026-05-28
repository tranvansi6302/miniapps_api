const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

const { requirePermission } = require("../middlewares/permission.middleware");

// Public endpoints
router.get("/", categoryController.getAllActive);
router.get("/:id", categoryController.getById);

// Protected endpoints
router.get("/all/admin", authenticateToken, requirePermission("categories", 0), categoryController.getAll);
router.post("/", authenticateToken, requirePermission("categories", 1), categoryController.create);
router.put("/:id", authenticateToken, requirePermission("categories", 4), categoryController.update);
router.delete("/:id", authenticateToken, requirePermission("categories", 2), categoryController.softDelete);

module.exports = router;
