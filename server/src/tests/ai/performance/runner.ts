/**
 * Performance & Reliability Test Runner
 *
 * Executes two independent suites and prints a structured report:
 *
 *   [A] Validator Performance  — CPU benchmark (no I/O)
 *   [B] Provider Reliability   — Orchestrator behaviour via MockProvider
 *
 * Exits with code 1 if any reliability test fails.
 * Validator benchmarks never "fail" — they are informational only.
 */
import { performance } from "perf_hooks";
import { runValidatorBenchmarks, runReliabilityTests } from "./test-cases.js";
import {
  min, max, mean, p50, p95, p99, throughput,
  successRate, failureRate,
} from "./metrics.js";

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toFixed(3);
}

function divider(char = "─", width = 60): string {
  return char.repeat(width);
}

function sectionHeader(title: string): void {
  console.log("\n" + divider("═"));
  console.log(title);
  console.log(divider("═"));
}

function subHeader(title: string): void {
  console.log("\n" + divider());
  console.log(title);
  console.log(divider());
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const runStart = performance.now();

  sectionHeader("Genix UI — Performance & Reliability Tests");

  // ══════════════════════════════════════════════════════════════════════════
  // SUITE A: Validator Benchmark
  // ══════════════════════════════════════════════════════════════════════════
  subHeader("[A] Validator Performance");

  const profiles = runValidatorBenchmarks();

  for (const p of profiles) {
    const ops   = throughput(p.iterations, p.totalMs);
    const minMs = min(p.samples);
    const maxMs = max(p.samples);
    const avg   = mean(p.samples);
    const med   = p50(p.samples);
    const pc95  = p95(p.samples);
    const pc99  = p99(p.samples);

    console.log(`\n  📊 ${p.label}`);
    console.log(`     Iterations : ${p.iterations}`);
    console.log(`     Total time : ${fmt(p.totalMs)} ms`);
    console.log(`     Throughput : ${ops} ops/sec`);
    console.log(`     Min        : ${fmt(minMs)} ms`);
    console.log(`     Max        : ${fmt(maxMs)} ms`);
    console.log(`     Mean       : ${fmt(avg)} ms`);
    console.log(`     P50        : ${fmt(med)} ms`);
    console.log(`     P95        : ${fmt(pc95)} ms`);
    console.log(`     P99        : ${fmt(pc99)} ms`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUITE B: Provider Reliability
  // ══════════════════════════════════════════════════════════════════════════
  subHeader("[B] Provider Reliability");
  console.log("  (Using MockProvider — no real API calls made)\n");

  const reliabilityStart = performance.now();
  const reliabilityResults = await runReliabilityTests();
  const reliabilityDuration = performance.now() - reliabilityStart;

  const passed  = reliabilityResults.filter(r => r.passed);
  const failed  = reliabilityResults.filter(r => !r.passed);

  for (const r of reliabilityResults) {
    const icon = r.passed ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}`);
    if (!r.passed) {
      console.log(`       [Detail] ${r.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  sectionHeader("Summary");

  const totalDuration = performance.now() - runStart;

  console.log(`\n  Validator benchmarks  : ${profiles.length} profiles executed`);
  console.log(`  Reliability scenarios : ${reliabilityResults.length} total`);
  console.log(`    ✅ Passed : ${passed.length}`);
  console.log(`    ❌ Failed : ${failed.length}`);
  console.log(`  Success rate   : ${successRate(passed.length, reliabilityResults.length)}%`);
  console.log(`  Failure rate   : ${failureRate(failed.length, reliabilityResults.length)}%`);
  console.log(`\n  Reliability suite duration : ${fmt(reliabilityDuration)} ms`);
  console.log(`  Total run duration         : ${fmt(totalDuration)} ms`);

  console.log("\n" + divider("═") + "\n");

  if (failed.length > 0) {
    console.error(`❌  ${failed.length} reliability test(s) failed:\n`);
    for (const f of failed) {
      console.error(`  • ${f.name}`);
      console.error(`    ${f.message}`);
    }
    console.error("");
    process.exit(1);
  } else {
    console.log("✅  All reliability tests passed.\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[Runner] Unexpected fatal error:", err);
  process.exit(1);
});
