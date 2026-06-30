import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import env from "../config/env.js";
import * as authService from "../services/auth.service.js";

// ------- Cookie Constants & Helpers -------

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

/**
 * Parses a duration string like "15m" or "7d" into milliseconds.
 */
const parseExpiryToMs = (expiry: string): number => {
  const value = parseInt(expiry, 10);
  const unit = expiry.replace(/[0-9]/g, "").trim();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // fallback: 15 minutes
  }
};

const getAccessCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: parseExpiryToMs(env.ACCESS_TOKEN_EXPIRES_IN), // 15 minutes
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: parseExpiryToMs(env.REFRESH_TOKEN_EXPIRES_IN), // 7 days
});

const clearCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
});

// ------- Controllers -------

/**
 * POST /api/auth/register
 * Creates user, generates verification token, does NOT log in.
 */
export const register = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await authService.registerUser(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message:
        "Registration successful. Please verify your email to continue.",
      data: result,
    });
  }
);

/**
 * GET /api/auth/verify-user/:token
 * Verifies user email via the raw token in the URL.
 */
export const verifyEmail = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const token = req.params.token as string;
    const user = await authService.verifyEmail(token);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Email verified successfully. You can now log in.",
      data: user,
    });
  }
);

/**
 * POST /api/auth/resend-verification
 * Generates a new verification token for an unverified user.
 */
export const resendVerification = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;
    const result = await authService.resendVerification(email);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Verification email resent successfully.",
      data: result,
    });
  }
);

/**
 * POST /api/auth/login
 * Validates credentials, blocks unverified users, sets both cookies.
 */
export const login = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const result = await authService.loginUser(req.body);

    // Set both cookies
    res.cookie(ACCESS_COOKIE, result.accessToken, getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE, result.refreshToken, getRefreshCookieOptions());

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logged in successfully",
      data: {
        user: result.user,
      },
    });
  }
);

/**
 * POST /api/auth/refresh-token
 * Reads refreshToken from cookies, verifies it, sets a new accessToken cookie.
 */
export const refreshToken = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const refreshTokenCookie = req.cookies?.[REFRESH_COOKIE];

    if (!refreshTokenCookie) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "No refresh token found. Please log in.",
      });
      return;
    }

    const result = await authService.refreshAccessToken(refreshTokenCookie);

    // Set the new access token cookie
    res.cookie(ACCESS_COOKIE, result.accessToken, getAccessCookieOptions());

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Access token refreshed successfully",
    });
  }
);

/**
 * POST /api/auth/logout
 * Clears both access and refresh token cookies.
 */
export const logout = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie(ACCESS_COOKIE, clearCookieOptions());
    res.clearCookie(REFRESH_COOKIE, clearCookieOptions());

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Logged out successfully",
    });
  }
);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
export const me = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id.toString();
    const user = await authService.getUserById(userId!);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Current user profile fetched successfully",
      data: user,
    });
  }
);
