// src/routes/doctors.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/doctors.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createDoctorSchema, updateDoctorSchema } = require("../validators/doctor.validator");
const { uploadProfileImage } = require("../config/multer");

router.get("/specializations", authenticate, ctrl.getSpecializations);
router.get("/",    authenticate, ctrl.getDoctors);
router.get("/:id", authenticate, ctrl.getDoctor);
router.post("/",   authenticate, authorize("ADMIN"), validate(createDoctorSchema), ctrl.createDoctor);
router.put("/:id", authenticate, authorize("ADMIN"), validate(updateDoctorSchema), ctrl.updateDoctor);
router.delete("/:id", authenticate, authorize("ADMIN"), ctrl.deleteDoctor);

module.exports = router;
