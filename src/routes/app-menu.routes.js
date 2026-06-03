const express = require("express");
const router = express.Router();
const appMenuController = require("../controllers/app-menu.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const uploadImage = require("../middlewares/upload-image.middleware");

// Public endpoints to read menus
router.get("/", appMenuController.getAll);
router.get("/:id", appMenuController.getById);

// Protected endpoints
router.put("/order/bulk", authenticateToken, appMenuController.updateOrder);
router.post("/upload-image", authenticateToken, uploadImage.single("file"), appMenuController.uploadImage);
router.post("/", authenticateToken, appMenuController.create);
router.put("/:id", authenticateToken, appMenuController.update);
router.delete("/:id", authenticateToken, appMenuController.delete);

module.exports = router;
