// src/routes/appointments.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/appointments.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createAppointmentSchema, updateAppointmentSchema } = require("../validators/appointment.validator");

router.get("/today", authenticate, ctrl.getTodayAppointments);
router.get("/",    authenticate, ctrl.getAppointments);
router.get("/:id", authenticate, ctrl.getAppointment);
router.post("/",   authenticate, authorize("ADMIN","RECEPTIONIST","DOCTOR","PATIENT"), validate(createAppointmentSchema), ctrl.createAppointment);
router.put("/:id", authenticate, authorize("ADMIN","RECEPTIONIST","DOCTOR"), validate(updateAppointmentSchema), ctrl.updateAppointment);
router.delete("/:id", authenticate, authorize("ADMIN","RECEPTIONIST"), ctrl.deleteAppointment);

module.exports = router;
