// src/validators/billing.validator.js
const { z } = require("zod");

const createBillSchema = z.object({
  patientId: z.coerce.number().int().positive(),
  appointmentId: z.coerce.number().int().positive().optional(),
  amount: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["CASH","CARD","UPI","INSURANCE","BANK_TRANSFER"]),
  paymentStatus: z.enum(["PENDING","PAID","OVERDUE","REFUNDED"]).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().min(0),
  })).optional(),
});

const updateBillSchema = createBillSchema.partial();

module.exports = { createBillSchema, updateBillSchema };
