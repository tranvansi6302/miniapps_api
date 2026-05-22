const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoints
router.get("/", userController.getAllActive);
router.get("/:id", userController.getById);

// Protected endpoints
router.put("/:id", authenticateToken, userController.update);
router.delete("/:id", authenticateToken, userController.softDelete);

module.exports = router;
