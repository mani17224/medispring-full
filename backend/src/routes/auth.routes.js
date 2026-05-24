// src/routes/auth.routes.js
const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../validators/auth.validator");

router.post("/register",        validate(registerSchema),        ctrl.register);
router.post("/login",           validate(loginSchema),           ctrl.login);
router.post("/logout",          authenticate,                    ctrl.logout);
router.post("/refresh-token",                                    ctrl.refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema),  ctrl.forgotPassword);
router.post("/reset-password",  validate(resetPasswordSchema),   ctrl.resetPassword);
router.get ("/profile",         authenticate,                    ctrl.getProfile);

module.exports = router;
