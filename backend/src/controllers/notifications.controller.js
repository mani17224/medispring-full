// src/controllers/notifications.controller.js
const { prisma } = require("../config/database");
const { success, error, paginated } = require("../utils/response");
const { getPagination } = require("../utils/pagination");

// GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { isRead, type } = req.query;

    const where = {
      OR: [{ userId: req.user.id }, { userId: null }], // user-specific + broadcast
      ...(isRead !== undefined && { isRead: isRead === "true" }),
      ...(type && { type }),
    };

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return paginated(res, {
      data: notifications,
      total,
      page,
      limit,
      message: "Notifications fetched",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/notifications
const createNotification = async (req, res, next) => {
  try {
    const notification = await prisma.notification.create({ data: req.body });
    return success(res, { message: "Notification created", statusCode: 201, data: notification });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) return error(res, { message: "Notification not found", statusCode: 404 });

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return success(res, { message: "Marked as read", data: notification });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/mark-all-read
const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return success(res, { message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, createNotification, markAsRead, markAllAsRead };
