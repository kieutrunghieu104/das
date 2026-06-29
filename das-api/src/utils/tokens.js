import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";

export function getJwtSecret() {
  return env.JWT_SECRET;
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email
    },
    getJwtSecret(),
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}
