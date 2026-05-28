const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Dynamic menus require authentication
router.get("/", authenticateToken, menuController.getAll);

module.exports = router;
