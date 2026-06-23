const express = require("express");
const router = express.Router();
const miniAppGroupController = require("../controllers/mini-app-group.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoints
router.get("/", miniAppGroupController.list);

// Protected endpoints
router.post("/", authenticateToken, miniAppGroupController.create);
router.delete("/:id", authenticateToken, miniAppGroupController.delete);

module.exports = router;
