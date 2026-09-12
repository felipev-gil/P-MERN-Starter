import { createHash, randomBytes } from "node:crypto";
import { Session } from "../models/Session.js";
export const cookieName = "mern_session";
export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");
export const cookieOptions = (config) => ({
  httpOnly: true,
  secure: config.mode === "production",
  sameSite: config.sameSite,
  path: "/api",
});
export async function removeSession(req) {
  const token = req.cookies[cookieName];
  if (typeof token === "string")
    await Session.deleteOne({ tokenHash: hashToken(token) });
}
export async function issueSession(req, res, user, config) {
  await removeSession(req);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.sessionHours * 3600000);
  await Session.create({
    tokenHash: hashToken(token),
    user: user._id,
    expiresAt,
  });
  res.cookie(cookieName, token, {
    ...cookieOptions(config),
    expires: expiresAt,
  });
  return expiresAt;
}
