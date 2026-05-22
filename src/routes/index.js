const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const categoryRoutes = require("./category.routes");
const miniAppRoutes = require("./mini-app.routes");
const scriptRoutes = require("./script.routes");

// Mount sub-routers under specific resource namespaces
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/mini-apps", miniAppRoutes);
router.use("/scripts", scriptRoutes);

module.exports = router;
