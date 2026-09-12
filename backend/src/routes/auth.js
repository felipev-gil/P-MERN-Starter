import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { register, login, logout, currentUser } from "../controllers/auth.js";
import { registerRules, loginRules, validate } from "../validators/auth.js";
import { requireAuth } from "../middlewares/auth.js";
export function authRoutes(config) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many attempts. Try again in 15 minutes.",
      },
    },
  });
  router.post("/register", limiter, registerRules, validate, register(config));
  router.post("/login", limiter, loginRules, validate, login(config));
  router.get("/me", requireAuth(config), currentUser);
  router.post("/logout", logout(config));
  return router;
}
