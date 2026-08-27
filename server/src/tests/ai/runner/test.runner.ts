import { IPromptCase, ITestResult, IValidationResult } from "../types/test.types.js";
import { callAIEndpoint } from "../utils/http.client.js";
import { validateStructure, validateQuality } from "../validators/output.validator.js";
import { getRuleSet } from "../rules/rule.registry.js";

export async function runSingleTest(testCase: IPromptCase): Promise<ITestResult> {
  const timestamp = new Date().toISOString();
  const ruleSet = getRuleSet(testCase.ruleSet);

  // If no rule set defined, skip quality validation
  const emptyRuleSet = {
    mustContain: [],
    mustNotContain: [],
    accessibilityRules: [],
    architectureRules: [],
    stylingRules: [],
    typescriptRules: [],
    qualityWeights: { accessibility: 20, typing: 20, architecture: 20, styling: 20, responsiveness: 20 },
  };

  const activeRules = ruleSet ?? emptyRuleSet;

  let httpResponse;
  try {
    httpResponse = await callAIEndpoint(testCase.endpoint, testCase.body);
  } catch (err: any) {
    return {
      id: testCase.id,
      name: testCase.name,
      feature: testCase.feature,
      passed: false,
      latencyMs: 0,
      provider: "unknown",
      model: "unknown",
      promptVersion: "unknown",
      filesGenerated: 0,
      validation: {
        structureValid: false,
        structureErrors: [`HTTP client error: ${err.message}`],
        qualityPassed: [],
        qualityFailed: [],
        qualityScore: { accessibility: 0, typing: 0, architecture: 0, styling: 0, responsiveness: 0, total: 0, percentage: 0 },
      },
      error: err.message,
      timestamp,
      fallbackCount: 0,
      retryCount: 0,
      providerSequence: [],
      failureReason: `HTTP client error: ${err.message}`,
    };
  }

  const structureCheck = validateStructure(httpResponse.data);
  const qualityCheck = validateQuality(httpResponse.data, activeRules);

  const meta = httpResponse.data?.data?.metadata ?? {};
  const filesGenerated = httpResponse.data?.data?.files?.length ?? 0;

  const validation: IValidationResult = {
    structureValid: structureCheck.valid && httpResponse.ok,
    structureErrors: [...(!httpResponse.ok ? [`HTTP ${httpResponse.status}: ${httpResponse.data?.message || "API Error"}`] : []), ...structureCheck.errors],
    qualityPassed: qualityCheck.passed,
    qualityFailed: qualityCheck.failed,
    qualityScore: qualityCheck.score,
  };

  const passed = validation.structureValid && qualityCheck.failed.length === 0;

  // Derive a single human-readable failure reason:
  //  1. If a provider attempt failed, use the first errorMessage.
  //  2. Otherwise, if quality checks failed, use the first qualityFailed entry.
  //  3. If a structure error exists, use that.
  //  4. If passed, leave empty.
  const rawAttempts: any[] = Array.isArray(meta.attempts) ? meta.attempts : [];
  const firstProviderFailure = rawAttempts.find((a: any) => !a.success && a.errorMessage);
  let failureReason = "";
  if (!passed) {
    if (firstProviderFailure?.errorMessage) {
      failureReason = firstProviderFailure.errorMessage as string;
    } else if (validation.qualityFailed.length > 0) {
      failureReason = validation.qualityFailed[0];
    } else if (validation.structureErrors.length > 0) {
      failureReason = validation.structureErrors[0];
    }
  }

  return {
    id: testCase.id,
    name: testCase.name,
    feature: testCase.feature,
    passed,
    latencyMs: httpResponse.latencyMs,
    provider: meta.provider ?? "unknown",
    model: meta.model ?? "unknown",
    promptVersion: meta.promptVersion ?? "unknown",
    filesGenerated,
    validation,
    error: !httpResponse.ok ? (httpResponse.data?.message ?? `HTTP ${httpResponse.status}`) : undefined,
    timestamp,
    // ── Phase 5/6: Pipeline telemetry extracted from response metadata ───────
    fallbackCount: typeof meta.fallbackCount === "number" ? meta.fallbackCount : 0,
    retryCount: typeof meta.retryCount === "number" ? meta.retryCount : 0,
    providerSequence: Array.isArray(meta.providerSequence) ? meta.providerSequence : [meta.provider ?? "unknown"],
    attempts: meta.attempts || [],
    pipelineStats: meta.pipelineStats || {},
    failureReason,
  };
}
