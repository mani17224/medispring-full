// src/validators/appointment.validator.js
const { z } = require("zod");

const createAppointmentSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  doctorId: z.coerce.number().int().positive(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  reason: z.string().max(500).optional(),
  notes: z.string().optional(),
  roomNumber: z.string().max(20).optional(),
  isTelemedicine: z.boolean().optional(),
});

const updateAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().max(500).optional(),
  status: z.enum(["SCHEDULED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]).optional(),
  notes: z.string().optional(),
  roomNumber: z.string().max(20).optional(),
  isTelemedicine: z.boolean().optional(),
});

module.exports = { createAppointmentSchema, updateAppointmentSchema };
