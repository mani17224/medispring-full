// src/controllers/patients.controller.js
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination, getOrderBy } = require("../utils/pagination");

// Generate unique patient ID like PT-1042
const generatePatientId = async () => {
  const last = await prisma.patient.findFirst({ orderBy: { id: "desc" } });
  const nextNum = last ? parseInt(last.patientId.replace("PT-", "")) + 1 : 1000;
  return `PT-${nextNum}`;
};

// GET /api/patients
const getPatients = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, riskLevel, bloodGroup, gender } = req.query;

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { patientId: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { currentCondition: { contains: search } },
        ],
      }),
      ...(riskLevel && { riskLevel }),
      ...(bloodGroup && { bloodGroup }),
      ...(gender && { gender }),
    };

    const [patients, total] = await prisma.$transaction([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(req.query, ["firstName", "lastName", "createdAt", "riskLevel"]),
      }),
      prisma.patient.count({ where }),
    ]);

    return paginated(res, { data: patients, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/patients/:id
const getPatient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          take: 10,
          orderBy: { appointmentDate: "desc" },
          include: { doctor: { select: { name: true, specialization: true } } },
        },
        bills: { take: 10, orderBy: { createdAt: "desc" } },
        labTests: { take: 10, orderBy: { createdAt: "desc" } },
        beds: { where: { status: "OCCUPIED" }, take: 1 },
      },
    });
    if (!patient) return error(res, { message: "Patient not found", statusCode: 404 });
    return success(res, { data: patient });
  } catch (err) {
    next(err);
  }
};

// POST /api/patients
const createPatient = async (req, res, next) => {
  try {
    const patientId = await generatePatientId();
    const patient = await prisma.patient.create({
      data: { ...req.body, patientId },
    });
    return success(res, { message: "Patient created", statusCode: 201, data: patient });
  } catch (err) {
    next(err);
  }
};

// PUT /api/patients/:id
const updatePatient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Patient not found", statusCode: 404 });

    // Prevent patientId change
    const { patientId: _pid, ...data } = req.body;
    const patient = await prisma.patient.update({ where: { id }, data });
    return success(res, { message: "Patient updated", data: patient });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/patients/:id (soft delete)
const deletePatient = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Patient not found", statusCode: 404 });

    await prisma.patient.update({ where: { id }, data: { isActive: false } });
    return success(res, { message: "Patient deactivated" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPatients, getPatient, createPatient, updatePatient, deletePatient };
