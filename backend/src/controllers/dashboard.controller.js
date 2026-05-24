// src/controllers/dashboard.controller.js
const { prisma } = require("../config/database");
const { success } = require("../utils/response");

// GET /api/dashboard/stats
const getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPatients,
      totalDoctors,
      availableDoctors,
      todayAppointments,
      pendingAppointments,
      totalBeds,
      occupiedBeds,
      icuOccupied,
      monthlyRevenue,
      pendingBills,
      criticalPatients,
      recentAppointments,
      unreadNotifications,
    ] = await prisma.$transaction([
      prisma.patient.count({ where: { isActive: true } }),
      prisma.doctor.count(),
      prisma.doctor.count({ where: { status: "AVAILABLE" } }),
      prisma.appointment.count({ where: { appointmentDate: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { status: "SCHEDULED", appointmentDate: { gte: today } } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
      prisma.bed.count({
        where: { status: "OCCUPIED", ward: { type: "ICU" } },
      }),
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      }),
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: { in: ["PENDING", "OVERDUE"] } },
      }),
      prisma.patient.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] }, isActive: true } }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { firstName: true, lastName: true, patientId: true } },
          doctor: { select: { name: true } },
        },
      }),
      prisma.notification.count({ where: { isRead: false } }),
    ]);

    return success(res, {
      data: {
        patients: { total: totalPatients, highRisk: criticalPatients },
        doctors: { total: totalDoctors, available: availableDoctors },
        appointments: {
          today: todayAppointments,
          pending: pendingAppointments,
          recent: recentAppointments,
        },
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: totalBeds - occupiedBeds,
          icu: icuOccupied,
        },
        revenue: {
          monthly: monthlyRevenue._sum.totalAmount || 0,
          outstanding: pendingBills._sum.totalAmount || 0,
        },
        notifications: { unread: unreadNotifications },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
