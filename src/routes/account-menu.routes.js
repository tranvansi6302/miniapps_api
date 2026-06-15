const express = require("express");
const router = express.Router();
const accountMenuController = require("../controllers/account-menu.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public endpoint to read menus
router.get("/", accountMenuController.getAll);

// Protected endpoints to manage menus
router.put("/order/bulk", authenticateToken, accountMenuController.updateOrder);
router.post("/", authenticateToken, accountMenuController.create);
router.put("/:id", authenticateToken, accountMenuController.update);
router.delete("/:id", authenticateToken, accountMenuController.delete);

module.exports = router;
