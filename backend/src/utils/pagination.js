// src/utils/pagination.js

/**
 * Parse and validate pagination params from query string
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build a Prisma `orderBy` clause from query params
 * e.g. ?sortBy=createdAt&sortOrder=desc
 */
const getOrderBy = (query, allowedFields = ["createdAt", "updatedAt"]) => {
  const field = allowedFields.includes(query.sortBy) ? query.sortBy : "createdAt";
  const dir = query.sortOrder === "asc" ? "asc" : "desc";
  return { [field]: dir };
};

module.exports = { getPagination, getOrderBy };
