// src/controllers/appointments.controller.js
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination, getOrderBy } = require("../utils/pagination");

// GET /api/appointments
const getAppointments = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { doctorId, patientId, status, date, dateFrom, dateTo } = req.query;

    const where = {
      ...(doctorId && { doctorId: parseInt(doctorId) }),
      ...(patientId && { patientId: parseInt(patientId) }),
      ...(status && { status }),
      ...(date && { appointmentDate: new Date(date) }),
      ...(dateFrom && dateTo && {
        appointmentDate: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      }),
    };

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: getOrderBy(req.query, ["appointmentDate", "appointmentTime", "createdAt", "status"]),
        include: {
          patient: { select: { patientId: true, firstName: true, lastName: true, phone: true } },
          doctor: { select: { name: true, specialization: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return paginated(res, { data: appointments, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/today
const getTodayAppointments = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: { appointmentDate: { gte: today, lt: tomorrow } },
      orderBy: { appointmentTime: "asc" },
      include: {
        patient: { select: { patientId: true, firstName: true, lastName: true } },
        doctor: { select: { name: true, specialization: true } },
      },
    });

    return success(res, { data: appointments });
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/:id
const getAppointment = async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        patient: true,
        doctor: true,
        bill: true,
      },
    });
    if (!appointment) return error(res, { message: "Appointment not found", statusCode: 404 });
    return success(res, { data: appointment });
  } catch (err) {
    next(err);
  }
};

// POST /api/appointments
const createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, appointmentDate, appointmentTime, ...rest } = req.body;

    // Check patient & doctor exist
    const [patient, doctor] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId } }),
      prisma.doctor.findUnique({ where: { id: doctorId } }),
    ]);
    if (!patient) return error(res, { message: "Patient not found", statusCode: 404 });
    if (!doctor) return error(res, { message: "Doctor not found", statusCode: 404 });

    // Check for slot conflict
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    });
    if (conflict) {
      return error(res, { message: "This time slot is already booked", statusCode: 409 });
    }

    // Assign token number for today's appointments
    const todayCount = await prisma.appointment.count({
      where: { appointmentDate: new Date(appointmentDate) },
    });
    const tokenNumber = `A-${todayCount + 1}`;

    const appointment = await prisma.appointment.create({
      data: { patientId, doctorId, appointmentDate: new Date(appointmentDate), appointmentTime, tokenNumber, ...rest },
      include: {
        patient: { select: { patientId: true, firstName: true, lastName: true } },
        doctor: { select: { name: true, specialization: true } },
      },
    });

    return success(res, { message: "Appointment booked", statusCode: 201, data: appointment });
  } catch (err) {
    next(err);
  }
};

// PUT /api/appointments/:id
const updateAppointment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Appointment not found", statusCode: 404 });

    const data = { ...req.body };
    if (data.appointmentDate) data.appointmentDate = new Date(data.appointmentDate);

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: { select: { patientId: true, firstName: true, lastName: true } },
        doctor: { select: { name: true, specialization: true } },
      },
    });
    return success(res, { message: "Appointment updated", data: appointment });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/appointments/:id (cancel)
const deleteAppointment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Appointment not found", statusCode: 404 });

    await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } });
    return success(res, { message: "Appointment cancelled" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAppointments, getTodayAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment };
