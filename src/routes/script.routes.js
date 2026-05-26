const express = require("express");
const router = express.Router();
const scriptController = require("../controllers/script.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoints
router.get("/", scriptController.getActive);
router.get("/history", scriptController.getHistory);
router.get("/:id", scriptController.getById);

// Protected endpoints
router.post("/", authenticateToken, scriptController.create);

module.exports = router;
