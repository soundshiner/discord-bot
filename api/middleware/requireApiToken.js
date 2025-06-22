import { handleError } from "../../utils/errorHandler.js";

/**
 * Middleware to protect routes with an API token.
 * It checks for the 'x-api-key' header and validates its value against
 * the ADMIN_API_KEY environment variable.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @param {function} next The next middleware function.
 */
const requireApiToken = (req, res, next) => {
  const apiKey = req.get("x-api-key");
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    // This is a server-side configuration error, not a client error.
    handleError(
      new Error("Admin API Key is not configured on the server."),
      "API Token Middleware",
      true
    );
    return res.status(500).json({ error: "Internal Server Error" });
  }

  if (!apiKey || apiKey !== adminApiKey) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or missing API Key." });
  }

  next();
};

export default requireApiToken;
