/**
 * Provider Verification Suite
 * ----------------------------
 * Standalone diagnostic script — does NOT use the orchestrator.
 * Calls healthCheck() on each provider directly, bypassing ResponseParser
 * and all production min/max length constraints.
 *
 * Run: npx tsx src/tests/ai/verify-providers.ts
 */
import { GeminiProvider } from "../../services/ai/providers/gemini.provider.js";
import { OpenRouterProvider } from "../../services/ai/providers/openrouter.provider.js";
import { GroqProvider } from "../../services/ai/providers/groq.provider.js";
import { OpenAIProvider } from "../../services/ai/providers/openai.provider.js";
import aiConfig from "../../config/ai.config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Replacement suggestions per provider ─────────────────────────────────────
const MODEL_SUGGESTIONS: Record<string, string[]> = {
  gemini: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"],
  openrouter: [
    "meta-llama/llama-3.1-70b-instruct",
    "meta-llama/llama-3.1-8b-instruct",
    "google/gemini-flash-1.5",
  ],
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
};

interface ProviderReport {
  // Identity
  provider: string;
  configuredModel: string;
  endpoint: string;
  apiKeyPresent: boolean;

  // Outcome
  status: "PASS" | "FAIL";
  providerAvailable: boolean;

  // Timing
  latencyMs: number;

  // HTTP details
  httpStatus?: number;
  errorType?: string;
  errorMessage?: string;
  providerCode?: string;
  rawBody?: string;

  // Success details
  rawResponseText?: string;
  parserStatus: "not_run" | "pass" | "not_applicable";

  // Suggestions
  suggestedModels?: string[];
}

function resolveEndpoint(id: string): string {
  if (id === "gemini") return "https://generativelanguage.googleapis.com";
  if (id === "openrouter") return aiConfig.providers.openrouter.endpoint ?? "https://openrouter.ai/api/v1";
  if (id === "groq") return "https://api.groq.com";
  if (id === "openai") return "https://api.openai.com";
  return "unknown";
}

function needsSuggestions(errorType: string | undefined): boolean {
  return ["Model Not Found", "Model Deprecated", "Model Unavailable"].includes(errorType ?? "");
}

async function runHealthCheck(
  providerId: string,
  model: string,
  apiKey: string | undefined,
  instance: any
): Promise<ProviderReport> {
  const endpoint = resolveEndpoint(providerId);

  console.log(`\n${"─".repeat(52)}`);
  console.log(`  Provider   : ${providerId}`);
  console.log(`  Model      : ${model}`);
  console.log(`  Endpoint   : ${endpoint}`);
  console.log(`  API Key    : ${apiKey ? "✓ present" : "✗ missing"}`);
  console.log(`${"─".repeat(52)}`);

  const hc = await instance.healthCheck();

  const report: ProviderReport = {
    provider: providerId,
    configuredModel: model,
    endpoint,
    apiKeyPresent: !!apiKey,
    status: hc.ok ? "PASS" : "FAIL",
    providerAvailable: hc.ok,
    latencyMs: hc.latencyMs ?? 0,
    httpStatus: hc.httpStatus,
    errorType: hc.errorType,
    errorMessage: hc.errorMessage,
    providerCode: hc.providerCode,
    rawBody: hc.rawBody,
    rawResponseText: hc.rawText,
    parserStatus: hc.ok ? "not_applicable" : "not_run",
  };

  if (needsSuggestions(hc.errorType)) {
    report.suggestedModels = MODEL_SUGGESTIONS[providerId.toLowerCase()] ?? [];
  }

  if (hc.ok) {
    console.log(`  Status     : ✅ PASS`);
    console.log(`  Latency    : ${hc.latencyMs}ms`);
    console.log(`  Response   : "${hc.rawText?.trim()}"`);
    if (hc.httpStatus) console.log(`  HTTP       : ${hc.httpStatus}`);
  } else {
    console.log(`  Status     : ❌ FAIL`);
    console.log(`  Error Type : ${hc.errorType ?? "Unknown"}`);
    console.log(`  HTTP       : ${hc.httpStatus ?? "N/A"}`);
    if (hc.providerCode) console.log(`  Code       : ${hc.providerCode}`);
    console.log(`  Message    : ${hc.errorMessage}`);
    if (hc.rawBody && hc.rawBody !== hc.errorMessage) {
      console.log(`  Raw Body   : ${hc.rawBody.slice(0, 300)}`);
    }
    if (report.suggestedModels?.length) {
      console.log(`  Suggestions: ${report.suggestedModels.join(", ")}`);
    }
    console.log(`  Latency    : ${hc.latencyMs}ms`);
  }

  return report;
}

function buildHtml(reports: ProviderReport[], generatedAt: string): string {
  const rows = reports.map(r => {
    const statusCell = r.status === "PASS"
      ? `<td class="pass">✅ PASS</td>`
      : `<td class="fail">❌ FAIL</td>`;

    const details = r.status === "FAIL" ? `
      <strong>${r.errorType ?? "Error"}</strong><br>
      ${r.errorMessage ? `<span class="mono">${escHtml(r.errorMessage)}</span><br>` : ""}
      ${r.providerCode ? `Code: <code>${r.providerCode}</code><br>` : ""}
      ${r.rawBody ? `<details><summary>Raw body</summary><pre>${escHtml(r.rawBody.slice(0, 600))}</pre></details>` : ""}
      ${r.suggestedModels?.length ? `<br><strong>Suggested:</strong> ${r.suggestedModels.join(", ")}` : ""}
    ` : `<span class="mono">${escHtml(r.rawResponseText ?? "—")}</span>`;

    return `<tr>
      <td><strong>${r.provider}</strong><br><small class="mono">${r.endpoint}</small></td>
      <td class="mono">${r.configuredModel}</td>
      ${statusCell}
      <td>${r.latencyMs}ms</td>
      <td>${r.httpStatus ?? "—"}</td>
      <td>${details}</td>
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Provider Health Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; background: #f8fafc; color: #1e293b; }
    h1 { margin-bottom: 4px; }
    p.ts { color: #64748b; font-size: 0.9em; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 4px rgba(0,0,0,.1); border-radius: 8px; overflow: hidden; }
    th { background: #1e293b; color: white; padding: 12px 14px; text-align: left; font-weight: 600; font-size: 0.85em; text-transform: uppercase; letter-spacing: .05em; }
    td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 0.9em; }
    tr:last-child td { border-bottom: none; }
    .pass { color: #059669; font-weight: 700; }
    .fail { color: #dc2626; font-weight: 700; }
    .mono { font-family: monospace; font-size: 0.85em; word-break: break-all; }
    pre { background: #f1f5f9; padding: 8px; border-radius: 4px; font-size: 0.8em; overflow-x: auto; margin: 4px 0 0; }
    details summary { cursor: pointer; color: #475569; font-size: 0.85em; }
    code { background: #e2e8f0; padding: 1px 5px; border-radius: 3px; font-size: 0.82em; }
  </style>
</head>
<body>
  <h1>🩺 Provider Health Report</h1>
  <p class="ts">Generated: ${generatedAt}</p>
  <table>
    <thead>
      <tr>
        <th>Provider / Endpoint</th>
        <th>Model</th>
        <th>Status</th>
        <th>Latency</th>
        <th>HTTP</th>
        <th>Details / Error</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function main() {
  const p = aiConfig.providers;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       Provider Verification Suite               ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\n  Using healthCheck() on each provider directly.");
  console.log("  Production ResponseParser and min-length rules are NOT applied.\n");

  const reports: ProviderReport[] = [];

  reports.push(await runHealthCheck("gemini",     p.gemini.model,     p.gemini.apiKey,     new GeminiProvider()));
  reports.push(await runHealthCheck("openrouter", p.openrouter.model, p.openrouter.apiKey, new OpenRouterProvider()));
  reports.push(await runHealthCheck("groq",       p.groq.model,       p.groq.apiKey,       new GroqProvider()));
  reports.push(await runHealthCheck("openai",     p.openai.model,     p.openai.apiKey,     new OpenAIProvider()));

  // ─── Final summary ───────────────────────────────────────────────────────────
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║          FINAL HEALTH SUMMARY                   ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  for (const r of reports) {
    const label = r.provider.padEnd(12);
    const dots  = ".".repeat(Math.max(2, 14 - r.provider.length));
    if (r.status === "PASS") {
      process.stdout.write(`  ${label}${dots} ✅ PASS  (${r.latencyMs}ms)\n`);
    } else {
      process.stdout.write(`  ${label}${dots} ❌ FAIL  (${r.errorType ?? "Unknown"})\n`);
    }
  }

  // ─── Write reports ───────────────────────────────────────────────────────────
  const generatedAt = new Date().toISOString();
  const jsonPath = path.resolve(process.cwd(), "provider-health-report.json");
  const htmlPath = path.resolve(process.cwd(), "provider-health-report.html");

  fs.writeFileSync(jsonPath, JSON.stringify(reports, null, 2), "utf-8");
  fs.writeFileSync(htmlPath, buildHtml(reports, generatedAt), "utf-8");

  console.log(`\n  JSON → ${jsonPath}`);
  console.log(`  HTML → ${htmlPath}\n`);
}

main().catch(err => {
  console.error("\n[FATAL] Verification suite crashed:", err);
  process.exit(1);
});
