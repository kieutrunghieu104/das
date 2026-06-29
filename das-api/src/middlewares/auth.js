import jwt from "jsonwebtoken";
import * as userRepository from "../repository/userRepository.js";
import { getJwtSecret } from "../utils/tokens.js";

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    const err = new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
    err.statusCode = 401;
    return next(err);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await userRepository.findActiveUserById(payload.sub);

    if (!user || user.status !== "active") {
      const err = new Error("Tài khoản đang không hoạt động.");
      err.statusCode = 401;
      return next(err);
    }

    req.user = user;
    next();
  } catch (_error) {
    const err = new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
    err.statusCode = 401;
    next(err);
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error("Bạn không có quyền thực hiện thao tác này.");
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
}
