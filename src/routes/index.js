const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const menuRoutes = require("./menu.routes");
const appMenuRoutes = require("./app-menu.routes");
const userRoutes = require("./user.routes");
const categoryRoutes = require("./category.routes");
const miniAppRoutes = require("./mini-app.routes");
const scriptRoutes = require("./script.routes");
const dashboardRoutes = require("./dashboard.routes");
const accountMenuRoutes = require("./account-menu.routes");
const moderationLogRoutes = require("./moderation-log.routes");
const miniAppGroupRoutes = require("./mini-app-group.routes");

// Mount sub-routers under specific resource namespaces
router.use("/auth", authRoutes);
router.use("/menus", menuRoutes);
router.use("/app-menus", appMenuRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/mini-apps", miniAppRoutes);
router.use("/scripts", scriptRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/account-menus", accountMenuRoutes);
router.use("/moderation-logs", moderationLogRoutes);
router.use("/mini-app-groups", miniAppGroupRoutes);


module.exports = router;
