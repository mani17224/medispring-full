// src/validators/patient.validator.js
const { z } = require("zod");

const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  age: z.coerce.number().int().min(0).max(150).optional(),
  bloodGroup: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-"]).optional(),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().max(20).optional(),
  medicalHistory: z.string().optional(),
  currentCondition: z.string().max(255).optional(),
  riskLevel: z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]).optional(),
  userId: z.coerce.number().int().positive().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

module.exports = { createPatientSchema, updatePatientSchema };
