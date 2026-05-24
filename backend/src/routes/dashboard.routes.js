// src/routes/dashboard.routes.js
const router = require("express").Router();
const { getStats } = require("../controllers/dashboard.controller");
const { authenticate } = require("../middleware/auth");

router.get("/stats", authenticate, getStats);

module.exports = router;
