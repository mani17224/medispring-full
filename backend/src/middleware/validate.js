// src/middleware/validate.js
const { error } = require("../utils/response");

/**
 * Validate req body against a Zod schema.
 * Usage: validate(myZodSchema)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return error(res, { message: "Validation failed", statusCode: 422, errors });
  }
  req.body = result.data; // use parsed/coerced values
  next();
};

module.exports = { validate };
