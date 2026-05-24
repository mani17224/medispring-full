// src/controllers/doctors.controller.js
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination, getOrderBy } = require("../utils/pagination");

// GET /api/doctors
const getDoctors = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, specialization, status } = req.query;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { specialization: { contains: search } },
          { email: { contains: search } },
        ],
      }),
      ...(specialization && { specialization }),
      ...(status && { status }),
    };

    const [doctors, total] = await prisma.$transaction([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(req.query, ["name", "rating", "experience", "consultationFee", "createdAt"]),
      }),
      prisma.doctor.count({ where }),
    ]);

    return paginated(res, { data: doctors, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/:id
const getDoctor = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        appointments: {
          take: 10,
          orderBy: { appointmentDate: "desc" },
          include: { patient: { select: { patientId: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!doctor) return error(res, { message: "Doctor not found", statusCode: 404 });
    return success(res, { data: doctor });
  } catch (err) {
    next(err);
  }
};

// POST /api/doctors
const createDoctor = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.create({ data: req.body });
    return success(res, { message: "Doctor created", statusCode: 201, data: doctor });
  } catch (err) {
    next(err);
  }
};

// PUT /api/doctors/:id
const updateDoctor = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Doctor not found", statusCode: 404 });

    const doctor = await prisma.doctor.update({ where: { id }, data: req.body });
    return success(res, { message: "Doctor updated", data: doctor });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/doctors/:id
const deleteDoctor = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.doctor.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Doctor not found", statusCode: 404 });

    await prisma.doctor.delete({ where: { id } });
    return success(res, { message: "Doctor deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/specializations - list unique specializations
const getSpecializations = async (req, res, next) => {
  try {
    const specs = await prisma.doctor.groupBy({
      by: ["specialization"],
      _count: { id: true },
      orderBy: { specialization: "asc" },
    });
    return success(res, { data: specs.map((s) => ({ name: s.specialization, count: s._count.id })) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor, getSpecializations };
