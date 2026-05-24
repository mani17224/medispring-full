// src/controllers/analytics.controller.js
const { prisma } = require("../config/database");
const { success } = require("../utils/response");

// GET /api/analytics/revenue
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get monthly revenue for the year
    const bills = await prisma.bill.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthly = months.map((m, i) => ({
      m,
      revenue: bills
        .filter((b) => new Date(b.createdAt).getMonth() === i)
        .reduce((sum, b) => sum + Number(b.totalAmount), 0),
    }));

    return success(res, { data: monthly });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/patients
const getPatientAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const patients = await prisma.patient.findMany({
      where: {
        createdAt: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) },
      },
      select: { createdAt: true, riskLevel: true },
    });

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthly = months.map((m, i) => ({
      m,
      patients: patients.filter((p) => new Date(p.createdAt).getMonth() === i).length,
    }));

    // Risk distribution
    const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    patients.forEach((p) => { riskCounts[p.riskLevel]++; });

    return success(res, { data: { monthly, riskDistribution: riskCounts } });
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/appointments
const getAppointmentAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const appointments = await prisma.appointment.findMany({
      where: {
        createdAt: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) },
      },
      select: { createdAt: true, status: true },
    });

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthly = months.map((m, i) => {
      const monthAppts = appointments.filter((a) => new Date(a.createdAt).getMonth() === i);
      return {
        m,
        total: monthAppts.length,
        completed: monthAppts.filter((a) => a.status === "COMPLETED").length,
        cancelled: monthAppts.filter((a) => a.status === "CANCELLED").length,
      };
    });

    // Status breakdown for the entire period
    const statusCounts = {};
    appointments.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

    // Doctor performance (top 10 by appointment count)
    const doctorPerformance = await prisma.appointment.groupBy({
      by: ["doctorId"],
      _count: { id: true },
      where: { status: "COMPLETED" },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const doctorIds = doctorPerformance.map((d) => d.doctorId);
    const doctors = await prisma.doctor.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true, specialization: true, rating: true },
    });

    const performance = doctorPerformance.map((d) => {
      const doctor = doctors.find((doc) => doc.id === d.doctorId);
      return { ...doctor, appointmentsCompleted: d._count.id };
    });

    return success(res, { data: { monthly, statusBreakdown: statusCounts, doctorPerformance: performance } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRevenueAnalytics, getPatientAnalytics, getAppointmentAnalytics };
