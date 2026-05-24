// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const logger = require("./config/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

// ─── Security ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// ─── Rate limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many login attempts, please try again later" },
});
app.use("/api", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ─── Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ─────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Static uploads ──────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Health check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "MediSpring API is running 🏥", version: "1.0.0" });
});

// ─── Routes ──────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth.routes"));
app.use("/api/dashboard",     require("./routes/dashboard.routes"));
app.use("/api/doctors",       require("./routes/doctors.routes"));
app.use("/api/patients",      require("./routes/patients.routes"));
app.use("/api/appointments",  require("./routes/appointments.routes"));
app.use("/api/billing",       require("./routes/billing.routes"));
app.use("/api/laboratory",    require("./routes/laboratory.routes"));
app.use("/api/beds",          require("./routes/beds.routes"));
app.use("/api/notifications", require("./routes/notifications.routes"));
app.use("/api/analytics",     require("./routes/analytics.routes"));
app.use("/api/users",         require("./routes/users.routes"));

// ─── Error handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
