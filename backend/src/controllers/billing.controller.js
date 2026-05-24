// src/controllers/billing.controller.js
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination, getOrderBy } = require("../utils/pagination");

// Generate invoice number like INV-2048
const generateInvoiceNumber = async () => {
  const last = await prisma.bill.findFirst({ orderBy: { id: "desc" } });
  const nextNum = last ? parseInt(last.invoiceNumber.replace("INV-", "")) + 1 : 1000;
  return `INV-${nextNum}`;
};

// GET /api/billing
const getBills = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { patientId, paymentStatus, paymentMethod, dateFrom, dateTo } = req.query;

    const where = {
      ...(patientId && { patientId: parseInt(patientId) }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod && { paymentMethod }),
      ...(dateFrom && dateTo && {
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      }),
    };

    const [bills, total] = await prisma.$transaction([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(req.query, ["createdAt", "amount", "totalAmount", "paymentStatus"]),
        include: {
          patient: { select: { patientId: true, firstName: true, lastName: true } },
          appointment: { select: { id: true, appointmentDate: true, doctor: { select: { name: true } } } },
        },
      }),
      prisma.bill.count({ where }),
    ]);

    return paginated(res, { data: bills, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/billing/:id
const getBill = async (req, res, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        patient: true,
        appointment: { include: { doctor: true } },
      },
    });
    if (!bill) return error(res, { message: "Bill not found", statusCode: 404 });
    return success(res, { data: bill });
  } catch (err) {
    next(err);
  }
};

// POST /api/billing
const createBill = async (req, res, next) => {
  try {
    const { amount, discount = 0, tax = 0, ...rest } = req.body;
    const totalAmount = Number(amount) - Number(discount) + Number(tax);
    const invoiceNumber = await generateInvoiceNumber();

    const bill = await prisma.bill.create({
      data: { ...rest, amount, discount, tax, totalAmount, invoiceNumber },
      include: { patient: { select: { patientId: true, firstName: true, lastName: true } } },
    });
    return success(res, { message: "Invoice created", statusCode: 201, data: bill });
  } catch (err) {
    next(err);
  }
};

// PUT /api/billing/:id
const updateBill = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.bill.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Bill not found", statusCode: 404 });

    const data = { ...req.body };
    if (data.amount !== undefined || data.discount !== undefined || data.tax !== undefined) {
      const amount = data.amount ?? existing.amount;
      const discount = data.discount ?? existing.discount;
      const tax = data.tax ?? existing.tax;
      data.totalAmount = Number(amount) - Number(discount) + Number(tax);
    }

    // Set paidAt timestamp when marking as paid
    if (data.paymentStatus === "PAID" && !existing.paidAt) {
      data.paidAt = new Date();
    }

    const bill = await prisma.bill.update({ where: { id }, data });
    return success(res, { message: "Bill updated", data: bill });
  } catch (err) {
    next(err);
  }
};

// GET /api/billing/summary – revenue summary stats
const getRevenueSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, outstanding, pending] = await prisma.$transaction([
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      }),
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: { in: ["PENDING", "OVERDUE"] } },
      }),
      prisma.bill.count({ where: { paymentStatus: "PENDING" } }),
    ]);

    return success(res, {
      data: {
        revenueThisMonth: totalRevenue._sum.totalAmount || 0,
        outstanding: outstanding._sum.totalAmount || 0,
        pendingCount: pending,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBills, getBill, createBill, updateBill, getRevenueSummary };
