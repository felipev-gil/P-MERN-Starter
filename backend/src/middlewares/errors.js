import { AppError } from "../utils/AppError.js";
export const notFound = (_req, _res, next) =>
  next(new AppError(404, "NOT_FOUND", "Route not found."));
export function errorHandler(error, req, res, _next) {
  let safe = error;
  if (error.code === 11000)
    safe = new AppError(
      409,
      "EMAIL_IN_USE",
      "This email is already registered.",
    );
  if (error.type === "entity.parse.failed")
    safe = new AppError(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  if (error.type === "entity.too.large")
    safe = new AppError(413, "BODY_TOO_LARGE", "Request body is too large.");
  if (!(safe instanceof AppError)) {
    // Avoid logging request bodies, credentials, or database connection strings.
    if (req.app.get("env") !== "test")
      console.error("Unhandled request error:", error.name);
    safe = new AppError(
      500,
      "INTERNAL_ERROR",
      "Something went wrong. Please try again.",
    );
  }
  res
    .status(safe.status)
    .json({
      error: {
        code: safe.code,
        message: safe.message,
        ...(safe.fields ? { fields: safe.fields } : {}),
      },
    });
}
