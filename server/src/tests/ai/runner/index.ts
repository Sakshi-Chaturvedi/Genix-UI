import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { fileURLToPath } from "url";
import { IPromptCase, ITestResult, ITestReport, ITestSummary } from "../types/test.types.js";
import { runSingleTest } from "./test.runner.js";
import { saveReports } from "../reports/report.generator.js";
import testConfig from "../config/test.config.js";

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROMPTS_DIR = resolve(__dirname, "../prompts");

function loadPromptCases(): IPromptCase[] {
  const files = readdirSync(PROMPTS_DIR).filter(f => f.endsWith(".json"));
  return files.map(file => {
    const raw = readFileSync(join(PROMPTS_DIR, file), "utf-8");
    return JSON.parse(raw) as IPromptCase;
  });
}

function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Formats a provider sequence array for display: "gemini → openrouter" */
function formatProviderSequence(seq: string[] | undefined): string {
  if (!seq || seq.length === 0) return "–";
  return seq.join(" → ");
}

function printResultLine(result: ITestResult, index: number, total: number): void {
  const status = result.passed ? "✅" : "❌";
  const score = result.validation.qualityScore.percentage;
  const scoreStr = score >= 80 ? `\x1b[32m${score}%\x1b[0m` : score >= 60 ? `\x1b[33m${score}%\x1b[0m` : `\x1b[31m${score}%\x1b[0m`;

  // Fallback indicator
  const fallback = (result.fallbackCount ?? 0) > 0
    ? `\x1b[33m [↻ fallback×${result.fallbackCount}]\x1b[0m`
    : "";

  console.log(
    `  [${String(index).padStart(2, "0")}/${total}] ${status}  ${result.name.padEnd(35)} ` +
    `${String(result.latencyMs).padStart(6)} ms  Quality: ${scoreStr}  ` +
    `Provider: \x1b[36m${result.provider}\x1b[0m${fallback}`
  );

  // Print provider sequence if fallback occurred
  if ((result.fallbackCount ?? 0) > 0) {
    console.log(
      `             \x1b[90m↳ Chain: ${formatProviderSequence(result.providerSequence)}  ` +
      `Retries: ${result.retryCount ?? 0}\x1b[0m`
    );
  }

  if (!result.passed) {
    const topFailures = [...result.validation.structureErrors, ...result.validation.qualityFailed].slice(0, 3);
    topFailures.forEach(f => console.log(`             \x1b[31m↳ ${f}\x1b[0m`));
  }
}

/** Returns a promise that resolves after `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log("\n\x1b[1m\x1b[35m╔══════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[1m\x1b[35m║   Genix UI — AI Regression Testing Framework     ║\x1b[0m");
  console.log("\x1b[1m\x1b[35m╚══════════════════════════════════════════════════╝\x1b[0m\n");

  console.log(`\x1b[36m  API URL          :\x1b[0m ${testConfig.apiBaseUrl}`);
  console.log(`\x1b[36m  Provider         :\x1b[0m ${testConfig.provider}`);
  console.log(`\x1b[36m  Model            :\x1b[0m ${testConfig.model}`);
  console.log(`\x1b[36m  Timeout          :\x1b[0m ${testConfig.timeoutMs}ms`);
  console.log(`\x1b[36m  Delay / Test     :\x1b[0m ${testConfig.delayBetweenTestsMs}ms`);
  console.log(`\x1b[36m  Concurrency      :\x1b[0m ${testConfig.concurrency}`);
  console.log(`\x1b[36m  Auth             :\x1b[0m ${testConfig.authToken ? "✓ Token provided" : "\x1b[31m✗ No token – set TEST_JWT_TOKEN\x1b[0m"}`);
  console.log();

  const promptCases = loadPromptCases();
  const total = promptCases.length;

  console.log(`\x1b[33m  Loaded ${total} test case(s) from prompts/\x1b[0m\n`);
  console.log("\x1b[90m  ─────────────────────────────────────────────────────\x1b[0m");

  const runId = generateRunId();
  const startTime = performance.now();
  const results: ITestResult[] = [];

  // ── Sequential execution (concurrency=1, default) — always continues on failure ──
  if (testConfig.concurrency <= 1) {
    for (let i = 0; i < promptCases.length; i++) {
      const tc = promptCases[i];
      process.stdout.write(`\n  Running: ${tc.name}...`);

      // Phase 5: continue on failure — runSingleTest never throws
      const result = await runSingleTest(tc);
      results.push(result);
      process.stdout.write("\r");
      printResultLine(result, i + 1, total);

      // Phase 5: configurable delay between tests to reduce rate-limit cascades
      if (i < promptCases.length - 1 && testConfig.delayBetweenTestsMs > 0) {
        await delay(testConfig.delayBetweenTestsMs);
      }
    }
  } else {
    // Batch parallel execution — preserves existing behaviour for concurrency > 1
    const batchSize = testConfig.concurrency;
    for (let i = 0; i < promptCases.length; i += batchSize) {
      const batch = promptCases.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(tc => runSingleTest(tc)));
      batchResults.forEach((result, j) => {
        results.push(result);
        printResultLine(result, i + j + 1, total);
      });
      // Apply inter-batch delay
      if (i + batchSize < promptCases.length && testConfig.delayBetweenTestsMs > 0) {
        await delay(testConfig.delayBetweenTestsMs);
      }
    }
  }

  const totalDurationMs = Math.round(performance.now() - startTime);

  // ── Build summary ─────────────────────────────────────────────────────────
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const passRate = Math.round((passed / results.length) * 100);
  const averageLatencyMs = Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length);
  const averageQualityScore = Math.round(results.reduce((s, r) => s + r.validation.qualityScore.percentage, 0) / results.length);
  const totalFallbackCount = results.reduce((s, r) => s + (r.fallbackCount ?? 0), 0);
  const totalRetryCount = results.reduce((s, r) => s + (r.retryCount ?? 0), 0);

  const summary: ITestSummary = {
    total: results.length,
    passed,
    failed,
    passRate,
    averageLatencyMs,
    averageQualityScore,
    totalDurationMs,
    totalFallbackCount,
    totalRetryCount,
  };

  const report: ITestReport = {
    runId,
    timestamp: new Date().toISOString(),
    config: {
      apiBaseUrl: testConfig.apiBaseUrl,
      provider: testConfig.provider,
      model: testConfig.model,
      delayBetweenTestsMs: testConfig.delayBetweenTestsMs,
    },
    summary,
    results,
  };

  // ── Save reports ──────────────────────────────────────────────────────────
  const { jsonPath, htmlPath } = saveReports(report, testConfig.outputDir);

  // ── Print summary banner ──────────────────────────────────────────────────
  const rateColor = passRate >= 80 ? "\x1b[32m" : passRate >= 60 ? "\x1b[33m" : "\x1b[31m";
  console.log("\n\x1b[90m  ─────────────────────────────────────────────────────\x1b[0m");
  console.log(`\n\x1b[1m  RESULTS SUMMARY\x1b[0m`);
  console.log(`  Pass Rate        : ${rateColor}${passRate}%\x1b[0m   (${passed} passed / ${failed} failed / ${total} total)`);
  console.log(`  Avg Latency      : \x1b[33m${averageLatencyMs.toLocaleString()} ms\x1b[0m`);
  console.log(`  Avg Quality      : \x1b[36m${averageQualityScore}%\x1b[0m`);
  console.log(`  Total Duration   : \x1b[90m${(totalDurationMs / 1000).toFixed(1)}s\x1b[0m`);
  console.log(`  Total Fallbacks  : ${totalFallbackCount > 0 ? `\x1b[33m${totalFallbackCount}\x1b[0m` : `\x1b[32m${totalFallbackCount}\x1b[0m`}`);
  console.log(`  Total Retries    : ${totalRetryCount > 0 ? `\x1b[33m${totalRetryCount}\x1b[0m` : `\x1b[32m${totalRetryCount}\x1b[0m`}`);
  console.log();
  console.log(`  \x1b[32m✓ JSON Report  :\x1b[0m ${jsonPath}`);
  console.log(`  \x1b[32m✓ HTML Report  :\x1b[0m ${htmlPath}`);
  console.log();

  // Exit with failure code if any tests failed (enables CI/CD gates)
  if (failed > 0) {
    console.log(`\x1b[31m  ✗ ${failed} test(s) failed. Regression detected.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m  ✓ All tests passed. No regressions detected.\x1b[0m\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("\n\x1b[31m[FATAL]\x1b[0m Test framework crashed:", err);
  process.exit(1);
});
