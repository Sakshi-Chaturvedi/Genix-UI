import dotenv from "dotenv";
dotenv.config();

export interface IQualityGateConfig {
  /** Minimum acceptable pass rate percentage (0–100). Default: 100 */
  minPassRate: number;
  /** Maximum acceptable number of failed tests. Default: 0 */
  maxFailedTests: number;
  /** Minimum acceptable average quality score percentage (0–100). Default: 80 */
  minAverageQuality: number;
  /** Maximum allowable P95 latency in milliseconds (0 = disabled). Default: 0 */
  maxP95LatencyMs: number;
  /** Maximum allowable P99 latency in milliseconds (0 = disabled). Default: 0 */
  maxP99LatencyMs: number;
  /** Maximum allowable provider fallback rate percentage (0–100). Default: 100 (unrestricted) */
  maxFallbackRate: number;
  /** Maximum allowable retry rate percentage (0–100). Default: 100 (unrestricted) */
  maxRetryRate: number;
}

/**
  * Parses environment variables or custom environment object to produce Quality Gate thresholds.
  */
export function loadQualityGateConfig(env: Record<string, string | undefined> = process.env): IQualityGateConfig {
  return {
    minPassRate: env.QUALITY_GATE_MIN_PASS_RATE !== undefined 
      ? Number(env.QUALITY_GATE_MIN_PASS_RATE) 
      : 100,
    maxFailedTests: env.QUALITY_GATE_MAX_FAILED_TESTS !== undefined 
      ? Number(env.QUALITY_GATE_MAX_FAILED_TESTS) 
      : 0,
    minAverageQuality: env.QUALITY_GATE_MIN_AVG_QUALITY !== undefined 
      ? Number(env.QUALITY_GATE_MIN_AVG_QUALITY) 
      : 80,
    maxP95LatencyMs: env.QUALITY_GATE_MAX_P95_LATENCY_MS !== undefined 
      ? Number(env.QUALITY_GATE_MAX_P95_LATENCY_MS) 
      : 0,
    maxP99LatencyMs: env.QUALITY_GATE_MAX_P99_LATENCY_MS !== undefined 
      ? Number(env.QUALITY_GATE_MAX_P99_LATENCY_MS) 
      : 0,
    maxFallbackRate: env.QUALITY_GATE_MAX_FALLBACK_RATE !== undefined 
      ? Number(env.QUALITY_GATE_MAX_FALLBACK_RATE) 
      : 100,
    maxRetryRate: env.QUALITY_GATE_MAX_RETRY_RATE !== undefined 
      ? Number(env.QUALITY_GATE_MAX_RETRY_RATE) 
      : 100,
  };
}

export const defaultQualityGateConfig = loadQualityGateConfig();
