import { Session } from "../models/Session.js";
import { cookieName, cookieOptions, hashToken } from "../utils/session.js";
import { AppError } from "../utils/AppError.js";
export const requireAuth = (config) => async (req, res, next) => {
  const token = req.cookies[cookieName];
  const session =
    typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
      ? await Session.findOne({
          tokenHash: hashToken(token),
          expiresAt: { $gt: new Date() },
        }).populate("user")
      : null;
  if (!session?.user) {
    res.clearCookie(cookieName, cookieOptions(config));
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Please sign in. Your session may have expired.",
    );
  }
  req.user = session.user;
  req.session = session;
  next();
};
