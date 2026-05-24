// src/controllers/beds.controller.js

const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

// GET /api/beds
const getBeds = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { wardId, status } = req.query;

    const where = {
      ...(wardId && { wardId: parseInt(wardId) }),
      ...(status && { status }),
    };

    const [beds, total] = await prisma.$transaction([
      prisma.bed.findMany({
        where,
        skip,
        take: limit,
        orderBy: { bedNumber: "asc" },
        include: {
          ward: {
            select: {
              name: true,
              type: true,
            },
          },
          patient: {
            select: {
              patientId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      prisma.bed.count({ where }),
    ]);

    return paginated(res, {
      data: beds,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/beds/wards
const getWards = async (req, res, next) => {
  try {
    const wards = await prisma.ward.findMany({
      where: {
        isActive: true,
      },

      include: {
        beds: {
          select: {
            id: true,
            status: true,
            bedNumber: true,
          },
        },
      },
    });

    const wardsWithStats = wards.map((ward) => ({
      ...ward,
      total: ward.beds.length,
      occupied: ward.beds.filter((b) => b.status === "OCCUPIED").length,
      free: ward.beds.filter((b) => b.status === "FREE").length,
      cleaning: ward.beds.filter((b) => b.status === "CLEANING").length,
    }));

    return success(res, {
      data: wardsWithStats,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/beds/:id
const getBed = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const bed = await prisma.bed.findUnique({
      where: { id },

      include: {
        ward: true,
        patient: true,
      },
    });

    if (!bed) {
      return error(res, {
        message: "Bed not found",
        statusCode: 404,
      });
    }

    return success(res, {
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/beds
const createBed = async (req, res, next) => {
  try {
    const bed = await prisma.bed.create({
      data: req.body,

      include: {
        ward: {
          select: {
            name: true,
          },
        },
      },
    });

    return success(res, {
      message: "Bed created successfully",
      statusCode: 201,
      data: bed,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/beds/wards
const createWard = async (req, res, next) => {
  try {
    const ward = await prisma.ward.create({
      data: req.body,
    });

    return success(res, {
      message: "Ward created successfully",
      statusCode: 201,
      data: ward,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/beds/:id
const updateBed = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const existingBed = await prisma.bed.findUnique({
      where: { id },
    });

    if (!existingBed) {
      return error(res, {
        message: "Bed not found",
        statusCode: 404,
      });
    }

    const data = { ...req.body };

    // Allocate bed
    if (data.patientId && !existingBed.patientId) {
      data.status = "OCCUPIED";
      data.assignedDate = new Date();
      data.dischargeDate = null;
    }

    // Remove patient from bed
    if (data.patientId === null && existingBed.patientId) {
      data.status = "CLEANING";
      data.dischargeDate = new Date();
    }

    const updatedBed = await prisma.bed.update({
      where: { id },

      data,

      include: {
        ward: {
          select: {
            name: true,
          },
        },

        patient: {
          select: {
            patientId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return success(res, {
      message: "Bed updated successfully",
      data: updatedBed,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/beds/:id
const deleteBed = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const existingBed = await prisma.bed.findUnique({
      where: { id },
    });

    if (!existingBed) {
      return error(res, {
        message: "Bed not found",
        statusCode: 404,
      });
    }

    await prisma.bed.delete({
      where: { id },
    });

    return success(res, {
      message: "Bed deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/beds/summary
const getBedSummary = async (req, res, next) => {
  try {
    const summary = await prisma.bed.groupBy({
      by: ["status"],

      _count: {
        id: true,
      },
    });

    const totals = {
      total: 0,
      free: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
      reserved: 0,
    };

    summary.forEach((item) => {
      totals.total += item._count.id;

      totals[item.status.toLowerCase()] = item._count.id;
    });

    return success(res, {
      data: totals,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/beds/:id/discharge
const dischargeBed = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const existingBed = await prisma.bed.findUnique({
      where: { id },
    });

    if (!existingBed) {
      return error(res, {
        message: "Bed not found",
        statusCode: 404,
      });
    }

    const updatedBed = await prisma.bed.update({
      where: { id },

      data: {
        patientId: null,
        status: "CLEANING",
        dischargeDate: new Date(),
      },
    });

    return success(res, {
      message: "Patient discharged successfully",
      data: updatedBed,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBeds,
  getWards,
  getBed,
  createBed,
  createWard,
  updateBed,
  deleteBed,
  getBedSummary,
  dischargeBed,
};