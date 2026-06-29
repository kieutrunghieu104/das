export function notFound(req, _res, next) {
  const err = new Error(`Không tìm thấy API: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

function duplicateMessageFromKey(keyValue = {}) {
  const fields = Object.keys(keyValue);
  if (fields.includes("phone")) return "Số điện thoại đã tồn tại.";
  if (fields.includes("email")) return "Email đã tồn tại.";
  if (fields.includes("name")) return "Tên đã tồn tại.";
  return "Dữ liệu đã tồn tại.";
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = statusCode === 500 ? "Lỗi hệ thống. Vui lòng thử lại sau." : err.message;
  let details = err.details;

  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Dữ liệu không hợp lệ.";
    details = err.issues;
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = duplicateMessageFromKey(err.keyValue);
    details = err.keyValue;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Mã dữ liệu không hợp lệ.";
    details = { path: err.path };
  }

  if (
    ["MongoNetworkError", "MongoServerSelectionError", "MongoTopologyClosedError"].includes(err.name) ||
    ["ECONNREFUSED", "ETIMEDOUT"].includes(err.code)
  ) {
    statusCode = 503;
    message = "Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại sau vài giây.";
    details = undefined;
  }

  res.status(statusCode).json({
    message,
    details: details || undefined
  });
}
