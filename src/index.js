const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = require("./db");
const apiRouter = require("./routes");
const { errorHandler } = require("./middlewares/error.middleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Serve static uploads folder
app.use("/uploads", express.static(uploadsDir));

// Auto-initialize Database Schema (Tables and Indexes)
async function initDb() {
  try {
    const sqlPath = path.join(__dirname, "../sql/init.sql");
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, "utf8");
      await pool.query(sql);
      console.log("🟢 Supabase Database Schema verified and tables loaded successfully.");
    } else {
      console.log("⚠️ init.sql file not found, skipping schema initialization.");
    }
  } catch (error) {
    console.error("🔴 Error initializing database schema:", error.message);
  }
}

// Health check endpoint (quick validation of database connection)
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");
    return res.status(200).json({
      ok: true,
      message: "API service is active and database is connected",
      timestamp: result.rows[0].server_time
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Health check failed (Database connection offline)",
      error: error.message
    });
  }
});

// Register unified API Router under /api prefix
app.use("/api", apiRouter);

// Standard 404 Catch-all handler for undefined paths
app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global central Error Handler Middleware
app.use(errorHandler);

// Execute schema check, then launch Express Server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server launched successfully on http://localhost:${PORT}`);
  });
});
