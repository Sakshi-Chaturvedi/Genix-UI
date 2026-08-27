import { ITestSummary } from "../types/test.types.js";
import { evaluateQualityGate } from "./quality.gate.js";
import { loadQualityGateConfig, IQualityGateConfig } from "./gate.config.js";

function buildMockSummary(overrides: Partial<ITestSummary> = {}): ITestSummary {
  return {
    total: 10,
    passed: 10,
    failed: 0,
    passRate: 100,
    averageLatencyMs: 25000,
    averageQualityScore: 95,
    totalDurationMs: 250000,
    totalFallbackCount: 0,
    totalRetryCount: 0,
    p50LatencyMs: 20000,
    p95LatencyMs: 30000,
    p99LatencyMs: 35000,
    fallbackRate: 0,
    retryRate: 0,
    providerDistribution: { gemini: 10 },
    failureDistribution: {},
    ...overrides,
  };
}

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passedCount++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

export function runQualityGateUnitTests(): boolean {
  console.log("\n==========================================");
  console.log("Executing Quality Gate Unit Tests...");
  console.log("==========================================\n");

  const defaultConfig: IQualityGateConfig = {
    minPassRate: 100,
    maxFailedTests: 0,
    minAverageQuality: 80,
    maxP95LatencyMs: 0,
    maxP99LatencyMs: 0,
    maxFallbackRate: 100,
    maxRetryRate: 100,
  };

  // ── 1. Compliant Run ──────────────────────────────────────────────────────
  console.log("[1. Fully Compliant Run]");
  const compliantSummary = buildMockSummary();
  const res1 = evaluateQualityGate(compliantSummary, defaultConfig);
  assert(res1.passed === true, "Compliant summary passes Quality Gate");
  assert(res1.violations.length === 0, "Compliant summary produces 0 violations");

  // ── 2. Pass Rate Gate ─────────────────────────────────────────────────────
  console.log("\n[2. Pass Rate Gate]");
  const lowPassSummary = buildMockSummary({ passRate: 90, passed: 9, failed: 1 });
  const res2 = evaluateQualityGate(lowPassSummary, defaultConfig);
  assert(res2.passed === false, "Pass rate 90% fails gate when minPassRate = 100%");
  assert(res2.violations.some(v => v.rule === "minPassRate"), "Violation reported for minPassRate");

  // ── 3. Max Failed Tests Gate ──────────────────────────────────────────────
  console.log("\n[3. Max Failed Tests Gate]");
  const failedSummary = buildMockSummary({ failed: 2, passed: 8, passRate: 80 });
  const res3 = evaluateQualityGate(failedSummary, { ...defaultConfig, minPassRate: 50, maxFailedTests: 1 });
  assert(res3.passed === false, "Failed count 2 fails gate when maxFailedTests = 1");
  assert(res3.violations.some(v => v.rule === "maxFailedTests"), "Violation reported for maxFailedTests");

  // ── 4. Average Quality Score Gate ─────────────────────────────────────────
  console.log("\n[4. Minimum Average Quality Score Gate]");
  const lowQualitySummary = buildMockSummary({ averageQualityScore: 75 });
  const res4 = evaluateQualityGate(lowQualitySummary, defaultConfig);
  assert(res4.passed === false, "Quality score 75% fails gate when minAverageQuality = 80%");
  assert(res4.violations.some(v => v.rule === "minAverageQuality"), "Violation reported for minAverageQuality");

  // ── 5. P95 / P99 Latency Gate ─────────────────────────────────────────────
  console.log("\n[5. Latency Percentile Gates]");
  const highLatencySummary = buildMockSummary({ p95LatencyMs: 45000, p99LatencyMs: 60000 });
  const res5a = evaluateQualityGate(highLatencySummary, { ...defaultConfig, maxP95LatencyMs: 40000 });
  assert(res5a.passed === false, "P95 latency 45000ms fails gate when limit = 40000ms");
  assert(res5a.violations.some(v => v.rule === "maxP95LatencyMs"), "Violation reported for maxP95LatencyMs");

  const res5b = evaluateQualityGate(highLatencySummary, { ...defaultConfig, maxP99LatencyMs: 50000 });
  assert(res5b.passed === false, "P99 latency 60000ms fails gate when limit = 50000ms");
  assert(res5b.violations.some(v => v.rule === "maxP99LatencyMs"), "Violation reported for maxP99LatencyMs");

  // ── 6. Fallback & Retry Rate Gates ────────────────────────────────────────
  console.log("\n[6. Fallback and Retry Rate Gates]");
  const highFallbackSummary = buildMockSummary({ fallbackRate: 60, retryRate: 40 });
  const res6a = evaluateQualityGate(highFallbackSummary, { ...defaultConfig, maxFallbackRate: 50 });
  assert(res6a.passed === false, "Fallback rate 60% fails gate when limit = 50%");
  assert(res6a.violations.some(v => v.rule === "maxFallbackRate"), "Violation reported for maxFallbackRate");

  const res6b = evaluateQualityGate(highFallbackSummary, { ...defaultConfig, maxRetryRate: 30 });
  assert(res6b.passed === false, "Retry rate 40% fails gate when limit = 30%");
  assert(res6b.violations.some(v => v.rule === "maxRetryRate"), "Violation reported for maxRetryRate");

  // ── 7. Boundary Tests ─────────────────────────────────────────────────────
  console.log("\n[7. Boundary Condition Tests]");

  // Exact match pass rate
  const exactPassSummary = buildMockSummary({ passRate: 90, passed: 9, failed: 1 });
  const res7a = evaluateQualityGate(exactPassSummary, { ...defaultConfig, minPassRate: 90, maxFailedTests: 1 });
  assert(res7a.passed === true, "Boundary: passRate == minPassRate (90% == 90%) passes");

  // Exact match quality score
  const exactQualitySummary = buildMockSummary({ averageQualityScore: 80 });
  const res7b = evaluateQualityGate(exactQualitySummary, { ...defaultConfig, minAverageQuality: 80 });
  assert(res7b.passed === true, "Boundary: averageQualityScore == minAverageQuality (80% == 80%) passes");

  // Off-by-one boundary failure
  const offByOneQualitySummary = buildMockSummary({ averageQualityScore: 79 });
  const res7c = evaluateQualityGate(offByOneQualitySummary, { ...defaultConfig, minAverageQuality: 80 });
  assert(res7c.passed === false, "Boundary: averageQualityScore = 79% fails when limit = 80%");

  // ── 8. Environment Variable Configuration Loading ─────────────────────────
  console.log("\n[8. Environment Variable Parser Tests]");
  const customEnv = {
    QUALITY_GATE_MIN_PASS_RATE: "95",
    QUALITY_GATE_MAX_FAILED_TESTS: "2",
    QUALITY_GATE_MIN_AVG_QUALITY: "85",
    QUALITY_GATE_MAX_P95_LATENCY_MS: "30000",
    QUALITY_GATE_MAX_FALLBACK_RATE: "25",
    QUALITY_GATE_MAX_RETRY_RATE: "15",
  };
  const parsedConfig = loadQualityGateConfig(customEnv);
  assert(parsedConfig.minPassRate === 95, "Parsed QUALITY_GATE_MIN_PASS_RATE = 95");
  assert(parsedConfig.maxFailedTests === 2, "Parsed QUALITY_GATE_MAX_FAILED_TESTS = 2");
  assert(parsedConfig.minAverageQuality === 85, "Parsed QUALITY_GATE_MIN_AVG_QUALITY = 85");
  assert(parsedConfig.maxP95LatencyMs === 30000, "Parsed QUALITY_GATE_MAX_P95_LATENCY_MS = 30000");
  assert(parsedConfig.maxFallbackRate === 25, "Parsed QUALITY_GATE_MAX_FALLBACK_RATE = 25");
  assert(parsedConfig.maxRetryRate === 15, "Parsed QUALITY_GATE_MAX_RETRY_RATE = 15");

  console.log("\n==========================================");
  console.log("SUMMARY");
  console.log("=======");
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log("=========\n");

  return failedCount === 0;
}

if (process.argv[1]?.includes("runner.ts")) {
  const success = runQualityGateUnitTests();
  process.exit(success ? 0 : 1);
}
