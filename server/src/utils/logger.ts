import env from "../config/env.js";

const isDev = env.NODE_ENV === "development";

export const logger = {
  info: (message: string, ...meta: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...meta);
  },
  error: (message: string, error?: any, ...meta: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error || "", ...meta);
  },
  warn: (message: string, ...meta: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...meta);
  },
  debug: (message: string, ...meta: any[]) => {
    if (isDev) {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...meta);
    }
  },
};

export default logger;
