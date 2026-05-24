// src/validators/bed.validator.js
const { z } = require("zod");

const createBedSchema = z.object({
  bedNumber: z.string().min(1).max(20),
  wardId: z.coerce.number().int().positive(),
  status: z.enum(["FREE","OCCUPIED","CLEANING","MAINTENANCE","RESERVED"]).optional(),
  notes: z.string().optional(),
});

// patientId can be a positive int OR the literal string "null" / JS null
const updateBedSchema = z.object({
  patientId: z
    .union([z.coerce.number().int().positive(), z.null(), z.literal("null").transform(() => null)])
    .optional(),
  status: z.enum(["FREE","OCCUPIED","CLEANING","MAINTENANCE","RESERVED"]).optional(),
  assignedDate: z.string().datetime().optional().nullable(),
  dischargeDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
});

const createWardSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["ICU","GENERAL","MATERNITY","PEDIATRIC","SURGERY","EMERGENCY","PRIVATE"]),
  capacity: z.coerce.number().int().positive(),
  floor: z.string().max(20).optional(),
});

module.exports = { createBedSchema, updateBedSchema, createWardSchema };
