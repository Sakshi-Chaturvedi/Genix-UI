import { Request, Response, NextFunction } from "express";
import env from "../config/env.js";
import logger from "../utils/logger.js";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  const success = false;

  // Log error using our utility logger
  logger.error(`${req.method} ${req.originalUrl} - Error:`, err);

  const isDev = env.NODE_ENV === "development";

  // Hide details of unexpected system exceptions in production
  if (!isDev && !err.isOperational) {
    statusCode = 500;
    message = "Something went wrong on our end!";
  }

  res.status(statusCode).json({
    success,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

export default globalErrorHandler;
