import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import AppError from "../utils/errorHandler.js";

export const validate = (schema: AnyZodObject) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Only overwrite body safely
      if (parsed.body) {
        req.body = parsed.body;
      }

      // Do not assign req.query directly
      // Do not assign req.params directly

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((err) => err.message)
          .join(", ");

        return next(new AppError(errorMessages, 400));
      }

      next(error);
    }
  };
};

export default validate;