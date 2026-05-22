const express = require("express");
const router = express.Router();
const scriptController = require("../controllers/script.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoints
router.get("/", scriptController.list);
router.get("/:id", scriptController.getById);
router.get("/type/:type", scriptController.getByType);

// Protected endpoints
router.post("/", authenticateToken, scriptController.create);
router.put("/:id", authenticateToken, scriptController.update);
router.delete("/:id", authenticateToken, scriptController.softDelete);

module.exports = router;
