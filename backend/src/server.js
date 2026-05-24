// src/server.js
"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 – Register error handlers FIRST, before anything else
// This ensures we see ALL errors including those from require() calls
// ─────────────────────────────────────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("\n" + "═".repeat(60));
  console.error("❌  UNCAUGHT EXCEPTION — server cannot start");
  console.error("═".repeat(60));
  console.error("Error:", err.message);
  if (err.code) console.error("Code: ", err.code);
  console.error("\nStack:", err.stack);
  console.error("═".repeat(60) + "\n");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("\n" + "═".repeat(60));
  console.error("❌  UNHANDLED PROMISE REJECTION — server cannot start");
  console.error("═".repeat(60));
  console.error(reason);
  console.error("═".repeat(60) + "\n");
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 – Create required directories before anything reads/writes them
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require("fs");
const path = require("path");

[
  path.join(process.cwd(), "logs"),
  path.join(process.cwd(), "src", "uploads", "profiles"),
  path.join(process.cwd(), "src", "uploads", "lab-reports"),
].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 – Load .env and validate required variables
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config();

const REQUIRED = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missing  = REQUIRED.filter((k) => !process.env[k]);

if (missing.length > 0) {
  console.error("\n" + "═".repeat(60));
  console.error("❌  MISSING ENVIRONMENT VARIABLES");
  console.error("═".repeat(60));
  missing.forEach((k) => console.error(`   • ${k}  ← add this to your .env file`));
  console.error("\n   Copy .env.example to .env and fill in your values.");
  console.error("   " + path.join(process.cwd(), ".env.example"));
  console.error("═".repeat(60) + "\n");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 – Load app (this triggers all require() chains)
// ─────────────────────────────────────────────────────────────────────────────
console.log("📦  Loading application modules...");
const app = require("./app");
const { connectDB } = require("./config/database");
const logger = require("./config/logger");
const PORT = parseInt(process.env.PORT, 10) || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 – Connect to database and start HTTP server
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log("🔌  Connecting to MySQL...");

  await connectDB();   // throws on failure → caught by unhandledRejection above

  const server = app.listen(PORT, () => {
    logger.info("═".repeat(52));
    logger.info("  🏥  MediSpring Hospital API — RUNNING");
    logger.info("═".repeat(52));
    logger.info(`  URL  : http://localhost:${PORT}`);
    logger.info(`  Health: http://localhost:${PORT}/api/health`);
    logger.info(`  Mode : ${process.env.NODE_ENV || "development"}`);
    logger.info("═".repeat(52));
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌  Port ${PORT} is already in use.`);
      console.error(`   Stop the other process or change PORT in .env\n`);
    } else {
      console.error("❌  Server error:", err.message);
    }
    process.exit(1);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} — shutting down…`);
    server.close(() => { logger.info("Server closed."); process.exit(0); });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
})();
