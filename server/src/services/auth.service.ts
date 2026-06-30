import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import AppError from "../utils/errorHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
} from "../utils/generateToken.js";
import env from "../config/env.js";

// ------- Response Interfaces -------

export interface IUserSafe {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  isEmailVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegisterResponse {
  user: IUserSafe;
  verificationUrl: string;
}

export interface ILoginResponse {
  user: IUserSafe;
  accessToken: string;
  refreshToken: string;
}

// ------- Helper -------

/**
 * Builds a consistent verification URL for development testing.
 * In production, this URL would be sent via email instead.
 */
const buildVerificationUrl = (rawToken: string): string => {
  return `${env.CLIENT_URL}/api/auth/verify-user/${rawToken}`;
};

/**
 * Strips a user document into a safe public object (no password, no tokens).
 */
const toSafeUser = (user: any): IUserSafe => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  plan: user.plan,
  isEmailVerified: user.isEmailVerified,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ------- Service Functions -------

/**
 * Registers a new user.
 * Does NOT log the user in — they must verify their email first.
 */
export const registerUser = async (body: {
  name: string;
  email: string;
  password: string;
}): Promise<IRegisterResponse> => {
  const { name, email, password } = body;

  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email is already registered", 400);
  }

  // Generate verification token
  const { rawToken, hashedToken, expiresAt } =
    generateEmailVerificationToken();

  // Create user with verification fields
  const user = await User.create({
    name,
    email,
    password,
    emailVerificationToken: hashedToken,
    emailVerificationExpire: expiresAt,
  });

  const verificationUrl = buildVerificationUrl(rawToken);

  return {
    user: toSafeUser(user),
    verificationUrl,
  };
};

/**
 * Verifies a user's email using the raw token from the URL.
 */
export const verifyEmail = async (rawToken: string): Promise<IUserSafe> => {
  // Hash the incoming token to match what is stored in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Find user with matching token that has not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpire: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError(
      "Verification token is invalid or has expired",
      400
    );
  }

  // Mark as verified and clear token fields
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  return toSafeUser(user);
};

/**
 * Resends a verification email for an unverified user.
 */
export const resendVerification = async (
  email: string
): Promise<{ verificationUrl: string }> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("No account found with that email", 404);
  }

  if (user.isEmailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  // Generate a fresh verification token
  const { rawToken, hashedToken, expiresAt } =
    generateEmailVerificationToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpire = expiresAt;
  await user.save();

  const verificationUrl = buildVerificationUrl(rawToken);

  return { verificationUrl };
};

/**
 * Logs in an existing, verified user.
 * Returns user data, an access token, and a refresh token.
 */
export const loginUser = async (body: {
  email: string;
  password: string;
}): Promise<ILoginResponse> => {
  const { email, password } = body;

  // Fetch user with password field included
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Compare password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  // Block login if email is not verified
  if (!user.isEmailVerified) {
    throw new AppError(
      "Please verify your email before logging in",
      403
    );
  }

  // Generate both tokens
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.role
  );
  const refreshToken = generateRefreshToken(
    user._id.toString(),
    user.refreshTokenVersion
  );

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Refreshes the access token using a valid refresh token from cookies.
 * Validates the token version against the DB to detect revoked tokens.
 */
export const refreshAccessToken = async (
  refreshTokenCookie: string
): Promise<{ accessToken: string }> => {
  // Verify the refresh token
  let decoded: any;
  try {
    decoded = jwt.verify(refreshTokenCookie, env.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(
        "Refresh token has expired. Please log in again.",
        401
      );
    }
    throw new AppError(
      "Invalid refresh token. Please log in again.",
      401
    );
  }

  // Find the user
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError(
      "The user belonging to this token no longer exists.",
      401
    );
  }

  // Check token version — if user logged out or changed password,
  // refreshTokenVersion would have been incremented, invalidating old tokens
  if (decoded.tokenVersion !== user.refreshTokenVersion) {
    throw new AppError(
      "Refresh token has been revoked. Please log in again.",
      401
    );
  }

  // Issue a fresh access token
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.role
  );

  return { accessToken };
};

/**
 * Finds user details by ID (for the /me endpoint).
 */
export const getUserById = async (userId: string): Promise<IUserSafe> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toSafeUser(user);
};
