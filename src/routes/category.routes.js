const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoints
router.get("/", categoryController.getAllActive);
router.get("/:id", categoryController.getById);
router.get("/all/admin", categoryController.getAll);

// Protected endpoints
router.post("/", authenticateToken, categoryController.create);
router.put("/:id", authenticateToken, categoryController.update);
router.delete("/:id", authenticateToken, categoryController.softDelete);

module.exports = router;
