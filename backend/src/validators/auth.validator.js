// src/validators/auth.validator.js
const { z } = require("zod");

const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(20).optional(),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "LABORATORY_STAFF", "PHARMACIST", "PATIENT"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
