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

// Enable trust proxy for reverse proxies (Render, Heroku, etc.)
app.set("trust proxy", true);

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

// Beautiful dark-themed responsive maintenance page served directly in the webview
app.get("/maintenance", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hệ thống đang bảo trì</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.15);
      --bg: #090d16;
      --card-bg: rgba(30, 41, 59, 0.45);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
      position: relative;
    }
    
    /* Background Glows */
    body::before, body::after {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: var(--primary);
      filter: blur(120px);
      opacity: 0.12;
      z-index: 0;
    }
    body::before { top: -10%; left: -10%; }
    body::after { bottom: -10%; right: -10%; }
    
    .container {
      width: 100%;
      max-width: 480px;
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      z-index: 1;
      position: relative;
      animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    /* Icon and animation */
    .icon-container {
      width: 80px;
      height: 80px;
      background: var(--primary-glow);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 28px;
      position: relative;
      animation: pulse 2s infinite ease-in-out;
    }
    
    .icon-container svg {
      width: 36px;
      height: 36px;
      fill: var(--primary);
      animation: spin 8s infinite linear;
    }
    
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    p {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 32px;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(234, 179, 8, 0.1);
      border: 1px solid rgba(234, 179, 8, 0.2);
      color: #fef08a;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 24px;
    }
    
    .status-dot {
      width: 6px;
      height: 6px;
      background-color: #eab308;
      border-radius: 50%;
      animation: blink 1.5s infinite;
    }

    .footer {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.4);
      margin-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 16px;
    }
    
    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0); }
    }
    
    @keyframes blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon-container">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.44 12.99l-.01.02c.04-.33.07-.67.07-1.01 0-.34-.03-.68-.07-1.01l.01.02 2.1-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65-.01-.02c-.04.33-.07.67-.07 1.01 0 .34.03.68.07 1.01l-.01-.02-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.1-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
      </svg>
    </div>
    <div class="status-badge">
      <div class="status-dot"></div>
      Đang nâng cấp bảo trì
    </div>
    <h1>Hệ thống bảo trì</h1>
    <p>Phân hệ này đang được tối ưu hóa nhằm mang lại trải nghiệm tốt nhất cho bạn. Vui lòng quay lại sau ít phút.</p>
    <div class="footer">
      Powered by EJSC Mini-App Platform
    </div>
  </div>
</body>
</html>
  `);
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
