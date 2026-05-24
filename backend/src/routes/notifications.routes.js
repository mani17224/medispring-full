// src/routes/notifications.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/notifications.controller");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/",   authenticate, ctrl.getNotifications);
router.post("/",  authenticate, authorize("ADMIN"), ctrl.createNotification);
router.put("/mark-all-read", authenticate, ctrl.markAllAsRead);
router.put("/:id/read", authenticate, ctrl.markAsRead);

module.exports = router;
