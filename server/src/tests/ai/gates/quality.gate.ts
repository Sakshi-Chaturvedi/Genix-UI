import { ITestSummary } from "../types/test.types.js";
import { IQualityGateConfig, loadQualityGateConfig } from "./gate.config.js";

export interface IGateViolation {
  rule: string;
  expected: string | number;
  actual: string | number;
  message: string;
  severity: "critical" | "warning";
}

export interface IGateEvaluationResult {
  passed: boolean;
  violations: IGateViolation[];
  summary: ITestSummary;
  config: IQualityGateConfig;
}

/**
 * Evaluates execution run telemetry against configured quality gate thresholds.
 */
export function evaluateQualityGate(
  summary: ITestSummary,
  config: IQualityGateConfig = loadQualityGateConfig()
): IGateEvaluationResult {
  const violations: IGateViolation[] = [];

  // Rule 1: Minimum Pass Rate (%)
  if (summary.passRate < config.minPassRate) {
    violations.push({
      rule: "minPassRate",
      expected: `>= ${config.minPassRate}%`,
      actual: `${summary.passRate}%`,
      message: `Pass rate ${summary.passRate}% is below minimum required threshold of ${config.minPassRate}%`,
      severity: "critical",
    });
  }

  // Rule 2: Maximum Failed Tests Count
  if (summary.failed > config.maxFailedTests) {
    violations.push({
      rule: "maxFailedTests",
      expected: `<= ${config.maxFailedTests}`,
      actual: summary.failed,
      message: `Failed test count ${summary.failed} exceeds maximum allowed limit of ${config.maxFailedTests}`,
      severity: "critical",
    });
  }

  // Rule 3: Minimum Average Quality Score (%)
  if (summary.averageQualityScore < config.minAverageQuality) {
    violations.push({
      rule: "minAverageQuality",
      expected: `>= ${config.minAverageQuality}%`,
      actual: `${summary.averageQualityScore}%`,
      message: `Average quality score ${summary.averageQualityScore}% is below minimum required threshold of ${config.minAverageQuality}%`,
      severity: "critical",
    });
  }

  // Rule 4: Maximum P95 Latency (ms) — Evaluated if > 0
  if (config.maxP95LatencyMs > 0 && summary.p50LatencyMs !== undefined) {
    if (summary.p95LatencyMs > config.maxP95LatencyMs) {
      violations.push({
        rule: "maxP95LatencyMs",
        expected: `<= ${config.maxP95LatencyMs} ms`,
        actual: `${summary.p95LatencyMs} ms`,
        message: `P95 latency of ${summary.p95LatencyMs} ms exceeds maximum allowed limit of ${config.maxP95LatencyMs} ms`,
        severity: "critical",
      });
    }
  }

  // Rule 5: Maximum P99 Latency (ms) — Evaluated if > 0
  if (config.maxP99LatencyMs > 0 && summary.p99LatencyMs !== undefined) {
    if (summary.p99LatencyMs > config.maxP99LatencyMs) {
      violations.push({
        rule: "maxP99LatencyMs",
        expected: `<= ${config.maxP99LatencyMs} ms`,
        actual: `${summary.p99LatencyMs} ms`,
        message: `P99 latency of ${summary.p99LatencyMs} ms exceeds maximum allowed limit of ${config.maxP99LatencyMs} ms`,
        severity: "critical",
      });
    }
  }

  // Rule 6: Maximum Fallback Rate (%)
  if (summary.fallbackRate !== undefined && summary.fallbackRate > config.maxFallbackRate) {
    violations.push({
      rule: "maxFallbackRate",
      expected: `<= ${config.maxFallbackRate}%`,
      actual: `${summary.fallbackRate}%`,
      message: `Provider fallback rate ${summary.fallbackRate}% exceeds maximum allowed limit of ${config.maxFallbackRate}%`,
      severity: "warning",
    });
  }

  // Rule 7: Maximum Retry Rate (%)
  if (summary.retryRate !== undefined && summary.retryRate > config.maxRetryRate) {
    violations.push({
      rule: "maxRetryRate",
      expected: `<= ${config.maxRetryRate}%`,
      actual: `${summary.retryRate}%`,
      message: `Provider retry rate ${summary.retryRate}% exceeds maximum allowed limit of ${config.maxRetryRate}%`,
      severity: "warning",
    });
  }

  const passed = violations.length === 0;

  return {
    passed,
    violations,
    summary,
    config,
  };
}
