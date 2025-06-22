import { handleError } from "../../utils/errorHandler.js";

/**
 * Creates an Express middleware for validating the request body against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema The Zod schema to validate against.
 * @returns {import('express').RequestHandler} An Express middleware function.
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    // ZodError
    if (error.errors) {
      const validationErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        error: "Bad Request: Invalid body.",
        details: validationErrors,
      });
    }

    // Other errors
    handleError(error, "ValidationMiddleware", false);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default validateBody;
