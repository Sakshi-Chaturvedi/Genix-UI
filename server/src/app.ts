import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import env from "./config/env.js";
import AppError from "./utils/errorHandler.js";
import sendResponse from "./utils/sendResponse.js";
import globalErrorHandler from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Middleware config
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Server is healthy",
    data: {
      status: "UP",
      environment: env.NODE_ENV,
      uptime: process.uptime(),
    },
  });
});

// Auth endpoints
app.use("/api/auth", authRoutes);

// Fallback for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;