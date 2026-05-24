// src/controllers/laboratory.controller.js
const path = require("path");
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination, getOrderBy } = require("../utils/pagination");

// GET /api/laboratory
const getLabTests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { patientId, doctorId, status, isCritical } = req.query;

    const where = {
      ...(patientId && { patientId: parseInt(patientId) }),
      ...(doctorId && { doctorId: parseInt(doctorId) }),
      ...(status && { status }),
      ...(isCritical !== undefined && { isCritical: isCritical === "true" }),
    };

    const [tests, total] = await prisma.$transaction([
      prisma.labTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(req.query, ["createdAt", "scheduledAt", "status"]),
        include: {
          patient: { select: { patientId: true, firstName: true, lastName: true } },
          doctor: { select: { name: true, specialization: true } },
        },
      }),
      prisma.labTest.count({ where }),
    ]);

    return paginated(res, { data: tests, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/laboratory/:id
const getLabTest = async (req, res, next) => {
  try {
    const test = await prisma.labTest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { patient: true, doctor: true },
    });
    if (!test) return error(res, { message: "Lab test not found", statusCode: 404 });
    return success(res, { data: test });
  } catch (err) {
    next(err);
  }
};

// POST /api/laboratory
const createLabTest = async (req, res, next) => {
  try {
    const test = await prisma.labTest.create({
      data: req.body,
      include: {
        patient: { select: { patientId: true, firstName: true, lastName: true } },
        doctor: { select: { name: true } },
      },
    });
    return success(res, { message: "Lab test created", statusCode: 201, data: test });
  } catch (err) {
    next(err);
  }
};

// PUT /api/laboratory/:id
const updateLabTest = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Lab test not found", statusCode: 404 });

    const data = { ...req.body };
    if (data.completedAt) data.completedAt = new Date(data.completedAt);

    const test = await prisma.labTest.update({ where: { id }, data });
    return success(res, { message: "Lab test updated", data: test });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/laboratory/:id
const deleteLabTest = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Lab test not found", statusCode: 404 });

    await prisma.labTest.delete({ where: { id } });
    return success(res, { message: "Lab test deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/laboratory/:id/upload – upload report file
const uploadReport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.labTest.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Lab test not found", statusCode: 404 });

    if (!req.file) return error(res, { message: "No file uploaded", statusCode: 400 });

    const reportFile = `/uploads/lab-reports/${req.file.filename}`;
    const test = await prisma.labTest.update({
      where: { id },
      data: { reportFile, status: "COMPLETED", completedAt: new Date() },
    });
    return success(res, { message: "Report uploaded", data: test });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLabTests, getLabTest, createLabTest, updateLabTest, deleteLabTest, uploadReport };
