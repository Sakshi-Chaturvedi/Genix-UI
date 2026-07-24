import dotenv from "dotenv";
dotenv.config();

export interface ITestConfig {
  apiBaseUrl: string;
  authToken: string;
  provider: string;
  model: string;
  /** HTTP request timeout for the regression test client (ms). */
  timeoutMs: number;
  /**
   * Per-provider timeout override map. If a provider key is present, that
   * value is used as the HTTP timeout when that provider is the active one.
   * Falls back to `timeoutMs` for providers not listed here.
   *
   * Example env var: TEST_PROVIDER_TIMEOUTS=gemini:90000,openrouter:60000
   */
  providerTimeouts: Record<string, number>;
  /**
   * Optional delay between test cases (ms). Helps avoid rate-limit cascades
   * when running against the Gemini Free API.
   * Set via TEST_DELAY_BETWEEN_TESTS_MS env var.
   */
  delayBetweenTestsMs: number;
  concurrency: number;
  outputDir: string;
  snapshotDir: string;
  generateSnapshots: boolean;
}

/**
 * Parses "key:value,key:value" env format into a Record<string, number>.
 */
function parseProviderTimeouts(raw: string | undefined): Record<string, number> {
  if (!raw) return {};
  const result: Record<string, number> = {};
  for (const pair of raw.split(",")) {
    const [key, val] = pair.split(":");
    if (key && val) {
      const ms = Number(val.trim());
      if (!isNaN(ms) && ms > 0) {
        result[key.trim().toLowerCase()] = ms;
      }
    }
  }
  return result;
}

export const testConfig: ITestConfig = {
  apiBaseUrl: process.env.TEST_API_BASE_URL || "http://localhost:5000",
  authToken: process.env.TEST_JWT_TOKEN || "",
  provider: process.env.AI_DEFAULT_PROVIDER || "gemini",
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 120000),
  providerTimeouts: parseProviderTimeouts(process.env.TEST_PROVIDER_TIMEOUTS),
  delayBetweenTestsMs: Number(process.env.TEST_DELAY_BETWEEN_TESTS_MS ?? 2000),
  concurrency: Number(process.env.TEST_CONCURRENCY ?? 1),
  outputDir: process.env.TEST_OUTPUT_DIR || "src/tests/ai/reports",
  snapshotDir: process.env.TEST_SNAPSHOT_DIR || "src/tests/ai/snapshots",
  generateSnapshots: process.env.TEST_GENERATE_SNAPSHOTS === "true",
};

export default testConfig;
