// src/routes/users.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/users.controller");
const { authenticate, authorize } = require("../middleware/auth");

// Public — anyone can request an account
router.post("/request", ctrl.requestAccount);

// Protected
router.get("/pending", authenticate, authorize("ADMIN"), ctrl.getPendingUsers);
router.get("/",        authenticate, authorize("ADMIN"), ctrl.getUsers);
router.post("/",       authenticate, authorize("ADMIN"), ctrl.createUser);
router.put("/:id/activate", authenticate, authorize("ADMIN"), ctrl.activateUser);
router.put("/:id",     authenticate, authorize("ADMIN"), ctrl.updateUser);
router.delete("/:id",  authenticate, authorize("ADMIN"), ctrl.deleteUser);

module.exports = router;
