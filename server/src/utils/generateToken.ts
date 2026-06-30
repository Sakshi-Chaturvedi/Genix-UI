import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env.js";

// ------- JWT Token Payloads -------

interface AccessTokenPayload {
  userId: string;
  role: string;
}

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

// ------- Token Generators -------

/**
 * Generates a short-lived JWT access token.
 * Payload: userId, role
 * Default expiry: 15 minutes (configurable via ACCESS_TOKEN_EXPIRES_IN)
 */
export const generateAccessToken = (
  userId: string,
  role: string
): string => {
  const payload: AccessTokenPayload = { userId, role };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

/**
 * Generates a long-lived JWT refresh token.
 * Payload: userId, tokenVersion
 * Default expiry: 7 days (configurable via REFRESH_TOKEN_EXPIRES_IN)
 *
 * tokenVersion is compared against the user's refreshTokenVersion in the DB.
 * If they don't match, the refresh token is considered revoked.
 */
export const generateRefreshToken = (
  userId: string,
  tokenVersion: number
): string => {
  const payload: RefreshTokenPayload = { userId, tokenVersion };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

// ------- Email Verification Token -------

/**
 * Generates a random email verification token.
 * Returns both the raw token (sent to user) and the hashed version (stored in DB).
 */
export const generateEmailVerificationToken = (): {
  rawToken: string;
  hashedToken: string;
  expiresAt: Date;
} => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Token expires in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return { rawToken, hashedToken, expiresAt };
};
