// src/routes/billing.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/billing.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { createBillSchema, updateBillSchema } = require("../validators/billing.validator");

router.get("/summary", authenticate, ctrl.getRevenueSummary);
router.get("/",    authenticate, ctrl.getBills);
router.get("/:id", authenticate, ctrl.getBill);
router.post("/",   authenticate, authorize("ADMIN","RECEPTIONIST"), validate(createBillSchema), ctrl.createBill);
router.put("/:id", authenticate, authorize("ADMIN","RECEPTIONIST"), validate(updateBillSchema), ctrl.updateBill);

module.exports = router;
