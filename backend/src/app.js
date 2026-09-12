import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { authRoutes } from "./routes/auth.js";
import { AppError } from "./utils/AppError.js";
import { notFound, errorHandler } from "./middlewares/errors.js";
export function createApp(config) {
  const app = express();
  app.set("env", config.mode);
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxyHops);
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        callback(
          origin && !config.origins.includes(origin)
            ? new AppError(403, "ORIGIN_DENIED", "Origin is not allowed.")
            : null,
          true,
        );
      },
    }),
  );
  // Browser writes must come from an explicitly allowed origin; this also protects login/logout from CSRF.
  app.use((req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !config.origins.includes(req.get("origin"))
    )
      throw new AppError(
        403,
        "ORIGIN_DENIED",
        "An allowed Origin header is required.",
      );
    next();
  });
  app.use(express.json({ limit: "16kb" }));
  app.use(cookieParser());
  app.get("/api/health", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res
      .status(connected ? 200 : 503)
      .json({
        data: {
          status: connected ? "ok" : "unavailable",
          database: connected ? "connected" : "disconnected",
        },
      });
  });
  app.use("/api/auth", authRoutes(config));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
