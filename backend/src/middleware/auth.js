// src/middleware/auth.js
const { verifyAccessToken } = require("../utils/jwt");
const { prisma } = require("../config/database");
const { error } = require("../utils/response");

/**
 * Verify JWT and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, { message: "Access token required", statusCode: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, firstName: true, lastName: true },
    });

    if (!user || !user.isActive) {
      return error(res, { message: "User not found or inactive", statusCode: 401 });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return error(res, { message: "Access token expired", statusCode: 401 });
    }
    return error(res, { message: "Invalid access token", statusCode: 401 });
  }
};

/**
 * Role-based access control middleware factory
 * Usage: authorize("ADMIN", "DOCTOR")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, { message: "Authentication required", statusCode: 401 });
    }
    if (!roles.includes(req.user.role)) {
      return error(res, {
        message: `Access denied. Required roles: ${roles.join(", ")}`,
        statusCode: 403,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
