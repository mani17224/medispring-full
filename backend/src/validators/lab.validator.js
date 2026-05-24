// src/validators/lab.validator.js
const { z } = require("zod");

const createLabTestSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  doctorId: z.coerce.number().int().positive().optional(),
  testName: z.string().min(1).max(255),
  testCategory: z.string().max(100).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateLabTestSchema = z.object({
  testResult: z.string().optional(),
  normalRange: z.string().max(100).optional(),
  isCritical: z.boolean().optional(),
  status: z.enum(["PENDING","SAMPLE_COLLECTED","IN_PROGRESS","COMPLETED","CANCELLED"]).optional(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

module.exports = { createLabTestSchema, updateLabTestSchema };
