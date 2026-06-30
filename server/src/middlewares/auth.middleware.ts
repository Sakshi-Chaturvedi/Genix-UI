import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import AppError from "../utils/errorHandler.js";
import { User } from "../models/user.model.js";

interface DecodedAccessToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to protect routes.
 * Reads access token from cookies first, then falls back to Authorization Bearer header.
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Try to read token from httpOnly cookie
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Fallback: read from Authorization header
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401
        )
      );
    }

    // Verify the JWT access token
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as DecodedAccessToken;

    // Find the user associated with the token
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token no longer exists.",
          401
        )
      );
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        new AppError("Invalid token. Please log in again!", 401)
      );
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError(
          "Your token has expired! Please log in again.",
          401
        )
      );
    }
    next(error);
  }
};

export default protect;
