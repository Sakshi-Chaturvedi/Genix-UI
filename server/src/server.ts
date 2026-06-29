import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import logger from "./utils/logger.js";

const server = http.createServer(app);

const startServer = () => {
  server.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

// Catch synchronous crashes
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down server...", err);
  process.exit(1);
});

// Catch asynchronous uncaught promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down server...", err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle graceful shutdowns
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    logger.info("Server process terminated successfully.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
