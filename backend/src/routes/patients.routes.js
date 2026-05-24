// src/routes/patients.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/patients.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createPatientSchema, updatePatientSchema } = require("../validators/patient.validator");

router.get("/",    authenticate, ctrl.getPatients);
router.get("/:id", authenticate, ctrl.getPatient);
router.post("/",   authenticate, authorize("ADMIN","RECEPTIONIST","DOCTOR"), validate(createPatientSchema), ctrl.createPatient);
router.put("/:id", authenticate, authorize("ADMIN","RECEPTIONIST","DOCTOR"), validate(updatePatientSchema), ctrl.updatePatient);
router.delete("/:id", authenticate, authorize("ADMIN"), ctrl.deletePatient);

module.exports = router;
