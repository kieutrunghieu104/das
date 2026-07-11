export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.validatedBody = schema.parse(req.body || {});
      next();
    } catch (error) {
      next(error);
    }
  };
}
