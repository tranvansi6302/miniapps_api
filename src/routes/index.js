const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const menuRoutes = require("./menu.routes");
const userRoutes = require("./user.routes");
const categoryRoutes = require("./category.routes");
const miniAppRoutes = require("./mini-app.routes");
const scriptRoutes = require("./script.routes");
const dashboardRoutes = require("./dashboard.routes");

// Mount sub-routers under specific resource namespaces
router.use("/auth", authRoutes);
router.use("/menus", menuRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/mini-apps", miniAppRoutes);
router.use("/scripts", scriptRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
