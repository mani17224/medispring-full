// src/routes/analytics.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/analytics.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/revenue",      authenticate, authorize("ADMIN","DOCTOR"), ctrl.getRevenueAnalytics);
router.get("/patients",     authenticate, authorize("ADMIN","DOCTOR"), ctrl.getPatientAnalytics);
router.get("/appointments", authenticate, authorize("ADMIN","DOCTOR"), ctrl.getAppointmentAnalytics);

module.exports = router;
