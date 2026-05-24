// src/routes/beds.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/beds.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createBedSchema, updateBedSchema, createWardSchema } = require("../validators/bed.validator");

router.get("/summary", authenticate, ctrl.getBedSummary);
router.get("/wards",   authenticate, ctrl.getWards);
router.post("/wards",  authenticate, authorize("ADMIN"), validate(createWardSchema), ctrl.createWard);
router.get("/",    authenticate, ctrl.getBeds);
router.get("/:id", authenticate, ctrl.getBed);
router.post("/",   authenticate, authorize("ADMIN","RECEPTIONIST"), validate(createBedSchema), ctrl.createBed);
router.post("/:id/discharge", authenticate, authorize("ADMIN","RECEPTIONIST","DOCTOR"), ctrl.dischargeBed);
router.put("/:id", authenticate, authorize("ADMIN","RECEPTIONIST","DOCTOR"), validate(updateBedSchema), ctrl.updateBed);
router.delete("/:id", authenticate, authorize("ADMIN"), ctrl.deleteBed);

module.exports = router;
