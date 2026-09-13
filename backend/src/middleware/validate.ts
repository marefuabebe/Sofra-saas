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
      if (error && error.errors) {
        console.error("ZOD VALIDATION FAILED:", error.errors);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors,
        });
      }
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }
  };
};
