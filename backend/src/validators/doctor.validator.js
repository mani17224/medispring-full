// src/validators/doctor.validator.js
const { z } = require("zod");

const createDoctorSchema = z.object({
  name: z.string().min(1).max(200),
  specialization: z.string().min(1).max(100),
  qualification: z.string().max(255).optional(),
  experience: z.coerce.number().int().min(0).max(60),
  phone: z.string().max(20).optional(),
  email: z.string().email(),
  consultationFee: z.coerce.number().min(0),
  availability: z.string().max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_CALL", "IN_SURGERY", "ON_LEAVE", "INACTIVE"]).optional(),
  bio: z.string().optional(),
  // userId is optional – you may create a doctor without a portal login
  userId: z.coerce.number().int().positive().optional(),
});

const updateDoctorSchema = createDoctorSchema.partial();

module.exports = { createDoctorSchema, updateDoctorSchema };
