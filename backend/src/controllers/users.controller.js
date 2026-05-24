// src/controllers/users.controller.js
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { search, role } = req.query;
    const where = {
      ...(search && { OR: [
        { firstName: { contains: search } }, { lastName: { contains: search } }, { email: { contains: search } }
      ]}),
      ...(role && { role }),
    };
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    return paginated(res, { data: users, total, page, limit });
  } catch (err) { next(err); }
};

// POST /api/users  — admin creates user directly (bypasses register flow)
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, { message: "Email already registered", statusCode: 409 });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashed, phone, role: role || "PATIENT" },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
    });
    return success(res, { message: "User created", statusCode: 201, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { id }, data,
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
    });
    return success(res, { message: "User updated", data: user });
  } catch (err) { next(err); }
};

// DELETE /api/users/:id  — deactivate
const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) return error(res, { message: "Cannot deactivate your own account", statusCode: 400 });
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return success(res, { message: "User deactivated" });
  } catch (err) { next(err); }
};

// POST /api/users/request  — public: patient/staff requests account (pending admin approval)
const requestAccount = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role, department, licenseId } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, { message: "Email already registered", statusCode: 409 });
    const hashed = await bcrypt.hash(password, 12);
    // Create user as inactive — admin must approve
    const user = await prisma.user.create({
      data: {
        firstName, lastName, email, password: hashed, phone,
        role: role?.toUpperCase() || "PATIENT",
        isActive: false, // pending approval
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    return success(res, {
      message: "Account request submitted. You will be notified once approved by an administrator.",
      statusCode: 201,
      data: { id: user.id, email: user.email },
    });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/activate  — admin approves pending account
const activateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.update({
      where: { id }, data: { isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
    });
    return success(res, { message: "User activated", data: user });
  } catch (err) { next(err); }
};

// GET /api/users/pending  — list inactive/pending accounts
const getPendingUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, phone: true, createdAt: true },
    });
    return success(res, { data: users });
  } catch (err) { next(err); }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, requestAccount, activateUser, getPendingUsers };
