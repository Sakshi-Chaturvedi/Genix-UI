/**
 * Performance & Reliability test cases.
 *
 * Two independent suites:
 *
 * A) VALIDATOR BENCHMARK
 *    Runs validateQuality() repeatedly — 10 / 50 / 100 iterations — and
 *    records wall-clock latency for each call.  No I/O, no network.
 *
 * B) PROVIDER RELIABILITY
 *    Wires MockProvider instances directly into ProviderOrchestrator via DI.
 *    All assertions are explicit: we never claim "pass" just because no
 *    exception occurred.  Each scenario checks the exact error name / provider
 *    sequence / retry count returned by the orchestrator.
 *
 * Config override:
 *    The orchestrator reads aiConfig.maxRetries / retryBaseDelayMs.
 *    We patch those values locally inside each reliability test so that
 *    exponential-backoff sleeps don't bloat the test runtime.
 *    We restore the originals after each test.
 *
 * Provider ID note:
 *    resolveProviderOrder() builds providerMap with keys = provider.id.toLowerCase()
 *    and looks them up using the providerPriority array as-is.  Therefore:
 *      - All mock provider IDs MUST be lowercase.
 *      - The buildOrchestrator() priority list MUST use the exact same lowercase IDs.
 */

import { performance } from "perf_hooks";
import { validateQuality } from "../validators/output.validator.js";
import { ruleRegistry } from "../rules/rule.registry.js";
import { ProviderOrchestrator } from "../../../utils/ai/provider.orchestrator.js";
import {
  AllProvidersFailedError,
  AuthenticationError,
  ModelUnavailableError,
  SchemaValidationError,
} from "../../../utils/ai/ai.errors.js";
import aiConfig from "../../../config/ai.config.js";
import { MockProvider } from "./mock.provider.js";
import { fixtures, mediumFixture, largeFixture, multiFileFixture } from "./fixtures.js";
import { min, max, mean, p50, p95, p99, throughput } from "./metrics.js";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ILatencyProfile {
  label: string;
  iterations: number;
  samples: number[];      // raw ms per call
  totalMs: number;        // wall clock for the whole batch
}

export interface IReliabilityResult {
  name: string;
  passed: boolean;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Temporarily patch aiConfig to speed up tests, restore after. */
async function withFastConfig<T>(fn: () => Promise<T>): Promise<T> {
  const origRetries   = aiConfig.maxRetries;
  const origBaseDelay = aiConfig.retryBaseDelayMs;
  const origMaxDelay  = aiConfig.retryMaxDelayMs;
  aiConfig.maxRetries       = 2;   // 1 initial + 2 retries = 3 total attempts
  aiConfig.retryBaseDelayMs = 5;   // 5 ms base — barely perceptible
  aiConfig.retryMaxDelayMs  = 20;  // cap at 20 ms
  try {
    return await fn();
  } finally {
    aiConfig.maxRetries       = origRetries;
    aiConfig.retryBaseDelayMs = origBaseDelay;
    aiConfig.retryMaxDelayMs  = origMaxDelay;
  }
}

/**
 * Build a ProviderOrchestrator from an ordered list of MockProviders.
 *
 * IMPORTANT: All provider IDs must be lowercase because resolveProviderOrder()
 * builds providerMap with keys = provider.id.toLowerCase() and the priority
 * list is compared with those keys exactly.
 */
function buildOrchestrator(
  providers: MockProvider[],
  priority?: string[]
): ProviderOrchestrator {
  const order = priority ?? providers.map((p) => p.id);
  return new ProviderOrchestrator(providers, order);
}

/**
 * Reset all static shared state on ProviderOrchestrator between test runs.
 *
 * ProviderOrchestrator uses four static Maps/Sets (cooldowns, disabledProviders,
 * providerAttemptsMap, cooldownActivationsMap) that persist for the entire
 * process lifetime.  Without clearing them, a provider disabled in test N
 * causes it to be omitted from the priority list in test N+1.
 *
 * We access them by targeting known field names directly on the class —
 * this avoids any modification to the production class.
 */
function resetOrchestratorState(): void {
  const cls = ProviderOrchestrator as any;
  for (const key of ["cooldowns", "disabledProviders", "providerAttemptsMap", "cooldownActivationsMap"]) {
    const val = cls[key];
    if (val instanceof Map || val instanceof Set) {
      val.clear();
    }
  }
}

/** Wrap async test execution and catch expected errors into a result object. */
async function run(
  name: string,
  fn: () => Promise<{ passed: boolean; message: string }>
): Promise<IReliabilityResult> {
  resetOrchestratorState(); // isolate each test from shared static state
  try {
    const { passed, message } = await fn();
    return { name, passed, message };
  } catch (err: any) {
    return {
      name,
      passed: false,
      message: `[Unexpected throw] ${err?.message ?? String(err)}`,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE A — Validator Benchmark
// ─────────────────────────────────────────────────────────────────────────────

export function runValidatorBenchmarks(): ILatencyProfile[] {
  const profiles: ILatencyProfile[] = [];

  type BenchCase = { label: string; fixture: any; rules: any; iters: number };

  const cases: BenchCase[] = [
    // Basic fixtures at different iteration counts
    { label: "Button (10 iter)",          fixture: fixtures.button,    rules: ruleRegistry.button,    iters: 10  },
    { label: "Button (50 iter)",          fixture: fixtures.button,    rules: ruleRegistry.button,    iters: 50  },
    { label: "Button (100 iter)",         fixture: fixtures.button,    rules: ruleRegistry.button,    iters: 100 },
    // Other components at 100 iterations
    { label: "Card (100 iter)",           fixture: fixtures.card,      rules: ruleRegistry.card,      iters: 100 },
    { label: "Navbar (100 iter)",         fixture: fixtures.navbar,    rules: ruleRegistry.navbar,    iters: 100 },
    { label: "Modal (100 iter)",          fixture: fixtures.modal,     rules: ruleRegistry.modal,     iters: 100 },
    { label: "Accordion (100 iter)",      fixture: fixtures.accordion, rules: ruleRegistry.accordion, iters: 100 },
    // Larger payloads
    { label: "Medium fixture (100 iter)", fixture: mediumFixture,      rules: ruleRegistry.button,    iters: 100 },
    { label: "Large fixture (100 iter)",  fixture: largeFixture,       rules: ruleRegistry.button,    iters: 100 },
    { label: "Multi-file (100 iter)",     fixture: multiFileFixture,   rules: ruleRegistry.navbar,    iters: 100 },
  ];

  for (const { label, fixture, rules, iters } of cases) {
    const samples: number[] = [];
    const batchStart = performance.now();

    for (let i = 0; i < iters; i++) {
      const t0 = performance.now();
      validateQuality(fixture, rules);
      samples.push(performance.now() - t0);
    }

    const totalMs = performance.now() - batchStart;
    profiles.push({ label, iterations: iters, samples, totalMs });
  }

  return profiles;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE B — Provider Reliability
// ─────────────────────────────────────────────────────────────────────────────

export async function runReliabilityTests(): Promise<IReliabilityResult[]> {
  const results: IReliabilityResult[] = [];

  // ── 1. Primary provider succeeds on first attempt ─────────────────────────
  results.push(
    await run("Primary provider succeeds on first attempt", async () => {
      const primary = new MockProvider("primary", { kind: "success" });
      const orch = buildOrchestrator([primary]);
      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );
      const passed =
        response.metadata?.provider === "primary" && primary.callCount === 1;
      return {
        passed,
        message: passed
          ? "Provider responded on call #1"
          : `provider=${response.metadata?.provider}, callCount=${primary.callCount}`,
      };
    })
  );

  // ── 2. 429 → immediate cooldown → fallback (no retry on same provider) ────
  results.push(
    await run("429 → immediate fallback (no retry)", async () => {
      const err = Object.assign(new Error("Rate limit exceeded"), {
        name: "AIProviderError",
        status: 429,
      });
      // Use lowercase IDs that match the providerMap key lookup
      const primary  = new MockProvider("p429main", { kind: "throw", error: err });
      const fallback = new MockProvider("p429back",  { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["p429main", "p429back"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      const usedFallback = response.metadata?.provider === "p429back";
      const noRetry      = primary.callCount === 1;
      const passed       = usedFallback && noRetry;

      return {
        passed,
        message: passed
          ? "Immediate fallback on 429 ✓  primary callCount=1"
          : `usedFallback=${usedFallback}, primary.callCount=${primary.callCount}`,
      };
    })
  );

  // ── 3. 502 → retry within provider → then fallback ────────────────────────
  results.push(
    await run("502 → retry → fallback", async () => {
      const err = Object.assign(
        new Error("Bad gateway"),
        { name: "ProviderUnavailableError", status: 502 }
      );
      const primary  = new MockProvider("p502main", { kind: "throw", error: err });
      const fallback = new MockProvider("p502back",  { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["p502main", "p502back"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      // maxRetries=2 → total 3 attempts on primary before fallback
      const usedFallback   = response.metadata?.provider === "p502back";
      const retriedPrimary = primary.callCount === 3;
      const passed         = usedFallback && retriedPrimary;

      return {
        passed,
        message: passed
          ? "502 retried 3× on primary, then fallback succeeded ✓"
          : `usedFallback=${usedFallback}, primary.callCount=${primary.callCount} (expected 3)`,
      };
    })
  );

  // ── 4. 503 → retry → fallback ─────────────────────────────────────────────
  results.push(
    await run("503 → retry → fallback", async () => {
      const err = Object.assign(
        new Error("Service unavailable"),
        { name: "ProviderUnavailableError", status: 503 }
      );
      const primary  = new MockProvider("p503main", { kind: "throw", error: err });
      const fallback = new MockProvider("p503back",  { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["p503main", "p503back"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      const passed =
        response.metadata?.provider === "p503back" && primary.callCount === 3;

      return {
        passed,
        message: passed
          ? "503 retried 3× then fallback ✓"
          : `provider=${response.metadata?.provider}, callCount=${primary.callCount}`,
      };
    })
  );

  // ── 5. 504 → retry → fallback ─────────────────────────────────────────────
  results.push(
    await run("504 (timeout) → retry → fallback", async () => {
      const err = Object.assign(
        new Error("Gateway timeout"),
        { name: "AIProviderTimeoutError", status: 504 }
      );
      const primary  = new MockProvider("p504main", { kind: "throw", error: err });
      const fallback = new MockProvider("p504back",  { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["p504main", "p504back"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      const passed =
        response.metadata?.provider === "p504back" && primary.callCount === 3;

      return {
        passed,
        message: passed
          ? "504 retried 3× then fallback ✓"
          : `provider=${response.metadata?.provider}, callCount=${primary.callCount}`,
      };
    })
  );

  // ── 6. ModelUnavailableError → provider disabled → fallback (no retry) ────
  results.push(
    await run("ModelUnavailableError → provider disabled → fallback", async () => {
      const err = new ModelUnavailableError("Model decommissioned");
      const primary  = new MockProvider("pmodelx", { kind: "throw", error: err });
      const fallback = new MockProvider("pmodelbk", { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["pmodelx", "pmodelbk"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      // ModelUnavailable is NOT retried — so primary.callCount must be 1
      const passed =
        response.metadata?.provider === "pmodelbk" && primary.callCount === 1;

      return {
        passed,
        message: passed
          ? "ModelUnavailable disabled provider without retry ✓"
          : `provider=${response.metadata?.provider}, primary.callCount=${primary.callCount}`,
      };
    })
  );

  // ── 7. AuthenticationError → provider chain aborts immediately ────────────
  results.push(
    await run("AuthenticationError → chain aborts immediately", async () => {
      const err = new AuthenticationError("Invalid API key");
      const primary  = new MockProvider("pauthx",  { kind: "throw", error: err });
      const fallback = new MockProvider("pauthbk", { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["pauthx", "pauthbk"]);

      let caughtError: any = null;
      try {
        await withFastConfig(() =>
          orch.execute({ prompt: "test", feature: "generate" })
        );
      } catch (e) {
        caughtError = e;
      }

      // Must throw, fallback must NOT have been called.
      // AuthenticationError sets statusCode=401 via AppError constructor.
      const isAuthErr =
        caughtError instanceof AuthenticationError ||
        caughtError?.name === "AuthenticationError" ||
        caughtError?.statusCode === 401;
      const passed = isAuthErr && fallback.callCount === 0;

      return {
        passed,
        message: passed
          ? "AuthenticationError aborted chain without trying fallback ✓"
          : `caughtError.name=${caughtError?.name}, statusCode=${caughtError?.statusCode}, fallback.callCount=${fallback.callCount}`,
      };
    })
  );

  // ── 8. SchemaValidationError → immediate fallback (not retried) ───────────
  results.push(
    await run("SchemaValidationError → immediate fallback (no retry)", async () => {
      const err = new SchemaValidationError(["missing 'files' array"]);
      const primary  = new MockProvider("pschemax",  { kind: "throw", error: err });
      const fallback = new MockProvider("pschemabk", { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["pschemax", "pschemabk"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      // SchemaValidation is non-retryable → primary called exactly once
      const passed =
        response.metadata?.provider === "pschemabk" && primary.callCount === 1;

      return {
        passed,
        message: passed
          ? "SchemaValidationError triggered immediate fallback ✓"
          : `provider=${response.metadata?.provider}, primary.callCount=${primary.callCount}`,
      };
    })
  );

  // ── 9. Fallback provider succeeds after primary exhausts retries ──────────
  results.push(
    await run("Fallback provider succeeds after primary exhausts retries", async () => {
      const retryErr = Object.assign(
        new Error("Connection reset"),
        { name: "AIProviderError", status: 502 }
      );
      const primary  = new MockProvider("exhaustedx", { kind: "throw", error: retryErr });
      const fallback = new MockProvider("rescuerx",   { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["exhaustedx", "rescuerx"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      const passed =
        response.metadata?.provider === "rescuerx" &&
        response.success === true;

      return {
        passed,
        message: passed
          ? "Fallback provider recovered successfully ✓"
          : `success=${response.success}, provider=${response.metadata?.provider}`,
      };
    })
  );

  // ── 10. All providers fail → AllProvidersFailedError ─────────────────────
  results.push(
    await run("All providers fail → AllProvidersFailedError", async () => {
      const err = Object.assign(
        new Error("downstream error"),
        { name: "ProviderUnavailableError", status: 503 }
      );
      const p1 = new MockProvider("failx1", { kind: "throw", error: err });
      const p2 = new MockProvider("failx2", { kind: "throw", error: err });
      const orch = buildOrchestrator([p1, p2], ["failx1", "failx2"]);

      let caughtError: any = null;
      try {
        await withFastConfig(() =>
          orch.execute({ prompt: "test", feature: "generate" })
        );
      } catch (e) {
        caughtError = e;
      }

      const passed =
        caughtError instanceof AllProvidersFailedError ||
        caughtError?.name === "AllProvidersFailedError";

      return {
        passed,
        message: passed
          ? "AllProvidersFailedError thrown correctly ✓"
          : `caught: ${caughtError?.name ?? "nothing"}`,
      };
    })
  );

  // ── 11. Retry count is correct ────────────────────────────────────────────
  results.push(
    await run("Retry count matches maxRetries", async () => {
      const retryErr = Object.assign(
        new Error("Gateway timeout"),
        { name: "AIProviderTimeoutError", status: 504 }
      );
      const primary  = new MockProvider("retryctr", {
        kind: "throw-after-n",
        successCount: 0,   // always fails — exhaust retries
        error: retryErr,
      });
      const fallback = new MockProvider("retrybk", { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["retryctr", "retrybk"]);

      await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      // With maxRetries=2 patch, primary is called 3 times (1 + 2 retries)
      const passed = primary.callCount === 3;
      return {
        passed,
        message: passed
          ? "primary.callCount=3 matches maxRetries=2 ✓"
          : `primary.callCount=${primary.callCount} (expected 3)`,
      };
    })
  );

  // ── 12. Provider ordering follows providerPriority ────────────────────────
  results.push(
    await run("Provider ordering follows providerPriority", async () => {
      const a = new MockProvider("alpha", { kind: "success" });
      const b = new MockProvider("beta",  { kind: "success" });
      const c = new MockProvider("gamma", { kind: "success" });

      // Register in reverse order, but priority says alpha first
      const orch = buildOrchestrator([c, b, a], ["alpha", "beta", "gamma"]);

      const { response } = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      // Alpha must be selected first
      const passed = response.metadata?.provider === "alpha" && a.callCount === 1;
      return {
        passed,
        message: passed
          ? "providerPriority respected: alpha selected first ✓"
          : `provider=${response.metadata?.provider}`,
      };
    })
  );

  // ── 13. 429 activates cooldown; second request skips cooled-down provider ─
  results.push(
    await run("429 activates cooldown; subsequent call skips cooled-down provider", async () => {
      const err429 = Object.assign(
        new Error("Rate limit exceeded"),
        { name: "AIProviderError", status: 429 }
      );

      const primary  = new MockProvider("cdprimary",  { kind: "throw", error: err429 });
      const fallback = new MockProvider("cdfallback", { kind: "success" });
      const orch = buildOrchestrator([primary, fallback], ["cdprimary", "cdfallback"]);

      const first = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      // Second request — primary is still in cooldown so it should not be called
      const callsBefore = primary.callCount;
      const second = await withFastConfig(() =>
        orch.execute({ prompt: "test", feature: "generate" })
      );

      const primaryNotCalledAgain = primary.callCount === callsBefore;
      const passed =
        first.response.metadata?.provider === "cdfallback" &&
        second.response.metadata?.provider === "cdfallback" &&
        primaryNotCalledAgain;

      return {
        passed,
        message: passed
          ? "Cooldown active: primary skipped on second request ✓"
          : `1st=${first.response.metadata?.provider}, 2nd=${second.response.metadata?.provider}, primaryCalls=${primary.callCount}`,
      };
    })
  );

  return results;
}
