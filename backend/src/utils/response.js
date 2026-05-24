// src/utils/response.js

/**
 * Standard success response
 */
const success = (res, { data = null, message = "Success", statusCode = 200, meta = null } = {}) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Standard error response
 */
const error = (res, { message = "Something went wrong", statusCode = 500, errors = null } = {}) => {
  const payload = { success: false, message };
  if (errors !== null) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Paginated response helper
 */
const paginated = (res, { data, total, page, limit, message = "Data fetched successfully" }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { success, error, paginated };
