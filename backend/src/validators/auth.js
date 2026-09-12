import { body, validationResult } from "express-validator";
import { AppError } from "../utils/AppError.js";
const email = () =>
  body("email")
    .isString()
    .bail()
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .isLength({ max: 254 })
    .toLowerCase();
const password = () =>
  body("password")
    .isString()
    .bail()
    .isLength({ min: 12 })
    .withMessage("Use at least 12 characters.")
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Use at most 72 UTF-8 bytes.");
export const registerRules = [
  body("name")
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("Enter a name between 1 and 80 characters."),
  email(),
  password(),
];
export const loginRules = [email(), password()];
export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      Object.fromEntries(
        errors
          .array({ onlyFirstError: true })
          .map((error) => [error.path, error.msg]),
      ),
    );
  next();
}
