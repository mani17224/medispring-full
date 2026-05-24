// src/controllers/auth.controller.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { prisma } = require("../config/database");
const { generateTokenPair, verifyRefreshToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");
const { sendPasswordResetEmail } = require("../utils/email");
const logger = require("../config/logger");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, { message: "Email already registered", statusCode: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword, phone, role: role || "PATIENT" },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    });

    const tokens = generateTokenPair(user);

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    logger.info(`New user registered: ${email} (${user.role})`);

    return success(res, {
      message: "Registration successful",
      statusCode: 201,
      data: { user, ...tokens },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return error(res, { message: "Invalid credentials", statusCode: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, { message: "Invalid credentials", statusCode: 401 });
    }

    const tokens = generateTokenPair(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    const { password: _, refreshToken: __, ...safeUser } = user;

    logger.info(`User logged in: ${email}`);

    return success(res, {
      message: "Login successful",
      data: { user: safeUser, ...tokens },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    return success(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return error(res, { message: "Refresh token required", statusCode: 401 });

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, refreshToken: token },
    });

    if (!user) return error(res, { message: "Invalid refresh token", statusCode: 401 });

    const tokens = generateTokenPair(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

    return success(res, { message: "Token refreshed", data: tokens });
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return error(res, { message: "Invalid or expired refresh token", statusCode: 401 });
    }
    next(err);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return success(res, { message: "If that email exists, a reset link has been sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailErr) {
      logger.error("Failed to send reset email:", emailErr);
    }

    return success(res, { message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gt: new Date() } },
    });

    if (!user) {
      return error(res, { message: "Invalid or expired reset token", statusCode: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExp: null, refreshToken: null },
    });

    return success(res, { message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, role: true, profileImage: true, isActive: true, createdAt: true,
        doctor: { select: { id: true, specialization: true, status: true } },
        patient: { select: { id: true, patientId: true } },
      },
    });
    return success(res, { data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refreshToken, forgotPassword, resetPassword, getProfile };
