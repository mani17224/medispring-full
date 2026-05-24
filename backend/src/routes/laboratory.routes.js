// src/routes/laboratory.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/laboratory.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createLabTestSchema, updateLabTestSchema } = require("../validators/lab.validator");
const { uploadLabReport } = require("../config/multer");

router.get("/",    authenticate, ctrl.getLabTests);
router.get("/:id", authenticate, ctrl.getLabTest);
router.post("/",   authenticate, authorize("ADMIN","DOCTOR","LABORATORY_STAFF"), validate(createLabTestSchema), ctrl.createLabTest);
router.put("/:id", authenticate, authorize("ADMIN","DOCTOR","LABORATORY_STAFF"), validate(updateLabTestSchema), ctrl.updateLabTest);
router.delete("/:id", authenticate, authorize("ADMIN"), ctrl.deleteLabTest);
router.post("/:id/upload", authenticate, authorize("ADMIN","LABORATORY_STAFF"), uploadLabReport.single("report"), ctrl.uploadReport);

module.exports = router;
