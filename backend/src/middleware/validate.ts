import { Request, Response, NextFunction } from "express";

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      if (error && error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        const errorDetails = error.errors
          .map((err: any) => {
            const field = err.path && err.path.length > 0 ? err.path[err.path.length - 1] : "";
            return field ? `${field}: ${err.message}` : err.message;
          })
          .filter(Boolean)
          .join(". ");

        return res.status(400).json({
          success: false,
          message: errorDetails || "Validation failed",
          errors: error.errors,
        });
      }
      return res.status(400).json({ success: false, message: "Invalid request data. Please verify your inputs." });
    }
  };
};
