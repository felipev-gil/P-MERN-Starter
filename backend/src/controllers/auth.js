import bcrypt from "bcryptjs";
import { User, publicUser } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import {
  cookieName,
  cookieOptions,
  issueSession,
  removeSession,
} from "../utils/session.js";
// A fixed dummy hash keeps unknown-email logins on the password-check path.
const dummyHash = bcrypt.hashSync("not-a-real-user-password", 12);
export const register = (config) => async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  const expiresAt = await issueSession(req, res, user, config);
  res.status(201).json({ data: { user: publicUser(user), expiresAt } });
};
export const login = (config) => async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+passwordHash",
  );
  const valid = await bcrypt.compare(
    req.body.password,
    user?.passwordHash || dummyHash,
  );
  if (!user || !valid)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  const expiresAt = await issueSession(req, res, user, config);
  res.json({ data: { user: publicUser(user), expiresAt } });
};
export const currentUser = (req, res) =>
  res.json({
    data: { user: publicUser(req.user), expiresAt: req.session.expiresAt },
  });
export const logout = (config) => async (req, res) => {
  await removeSession(req);
  res.clearCookie(cookieName, cookieOptions(config));
  res.status(204).end();
};
