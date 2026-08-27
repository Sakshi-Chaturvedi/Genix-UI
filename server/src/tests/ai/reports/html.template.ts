import { ITestReport, ITestResult } from "../types/test.types.js";

function badge(passed: boolean): string {
  return passed
    ? `<span class="badge pass">PASS</span>`
    : `<span class="badge fail">FAIL</span>`;
}

function scoreBar(percentage: number): string {
  const color = percentage >= 80 ? "#22c55e" : percentage >= 60 ? "#f59e0b" : "#ef4444";
  return `<div class="score-bar-wrap"><div class="score-bar" style="width:${percentage}%;background:${color}"></div><span class="score-label">${percentage}%</span></div>`;
}

function providerChain(seq: string[] | undefined): string {
  if (!seq || seq.length === 0) return "–";
  if (seq.length === 1) return escHtml(seq[0]);
  return seq.map(escHtml).join(" <span class=\"arrow\">→</span> ");
}

function fallbackBadge(count: number): string {
  if (count === 0) return `<span class="fb-none">–</span>`;
  return `<span class="fb-count">${count}</span>`;
}

function resultRow(r: ITestResult): string {
  const failList = r.validation.structureErrors.concat(r.validation.qualityFailed);
  if (failList.length === 0 && r.failureReason) {
    failList.push(r.failureReason);
  }
  const failReasons = failList
    .slice(0, 5)
    .map(f => `<li>${escHtml(f)}</li>`)
    .join("");
  const score = r.validation.qualityScore;
  const fb = r.fallbackCount ?? 0;
  const retry = r.retryCount ?? 0;

  return `
  <tr class="${r.passed ? "row-pass" : "row-fail"}">
    <td>${badge(r.passed)}</td>
    <td><strong>${escHtml(r.name)}</strong><br/><small>${r.id} / ${r.feature}</small></td>
    <td>${r.latencyMs.toLocaleString()} ms</td>
    <td>${r.filesGenerated}</td>
    <td>${providerChain(r.providerSequence)}<br/><small>${escHtml(r.model)}</small></td>
    <td>${fallbackBadge(fb)}</td>
    <td>${retry > 0 ? `<span class="retry-count">${retry}</span>` : "–"}</td>
    <td>${escHtml(r.promptVersion)}</td>
    <td>
      ${scoreBar(score.percentage)}
      <small>A11y:${score.accessibility} | TS:${score.typing} | Arch:${score.architecture} | CSS:${score.styling} | Resp:${score.responsiveness}</small>
    </td>
    <td class="failures">${failReasons ? `<ul>${failReasons}</ul>` : "–"}</td>
  </tr>`;
}

function escHtml(s: string): string {
  return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function providerBreakdownTable(results: ITestResult[]): string {
  // Find the last result that has pipelineStats
  const lastResultWithStats = [...results].reverse().find(r => r.pipelineStats && Object.keys(r.pipelineStats).length > 0);
  const stats = lastResultWithStats?.pipelineStats;

  if (!stats) {
    return `<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.25rem;margin-bottom:2rem;color:#64748b;font-size:0.875rem;">No provider performance statistics available.</div>`;
  }

  const rows = Object.entries(stats).map(([provider, s]) => {
    return `
      <tr>
        <td style="font-weight:600;text-transform:capitalize;">${escHtml(provider)}</td>
        <td style="color:${s.successRate >= 80 ? "#22c55e" : s.successRate >= 50 ? "#f59e0b" : "#ef4444"}">${s.successRate}%</td>
        <td>${s.avgLatencyMs.toLocaleString()} ms</td>
        <td>${s.totalAttempts}</td>
        <td>${s.totalFailures}</td>
        <td>${s.totalRetries}</td>
        <td>${s.cooldownActivations}</td>
      </tr>
    `;
  }).join("");

  return `
    <h2 style="margin-top:2rem;margin-bottom:0.75rem;font-size:1.2rem;font-weight:600;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">📊 Provider Performance Breakdown</h2>
    <table style="margin-bottom:2.5rem;">
      <thead>
        <tr>
          <th>Provider</th>
          <th>Success Rate</th>
          <th>Avg Latency</th>
          <th>Total Attempts</th>
          <th>Total Failures</th>
          <th>Total Retries</th>
          <th>Cooldown Activations</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

export function generateHtmlReport(report: ITestReport): string {
  const { summary, results, config } = report;
  const passColor = summary.passRate >= 80 ? "#22c55e" : summary.passRate >= 60 ? "#f59e0b" : "#ef4444";
  const rows = results.map(resultRow).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Genix UI – AI Regression Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:2rem}
    h1{font-size:1.75rem;font-weight:700;margin-bottom:.25rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .subtitle{color:#64748b;font-size:.875rem;margin-bottom:2rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:2rem}
    .stat{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.25rem}
    .stat-label{font-size:.75rem;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem}
    .stat-value{font-size:1.75rem;font-weight:700}
    .stat-value.green{color:#22c55e}.stat-value.red{color:#ef4444}.stat-value.yellow{color:#f59e0b}.stat-value.blue{color:#60a5fa}.stat-value.purple{color:#a78bfa}
    table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden;font-size:.8rem}
    thead{background:#0f172a}
    th{padding:.75rem 1rem;text-align:left;color:#64748b;font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #334155}
    td{padding:.75rem 1rem;border-bottom:1px solid #1e293b;vertical-align:top}
    .row-pass td:first-child{border-left:3px solid #22c55e}
    .row-fail td:first-child{border-left:3px solid #ef4444}
    .badge{display:inline-block;padding:.2rem .6rem;border-radius:999px;font-size:.7rem;font-weight:700;letter-spacing:.05em}
    .badge.pass{background:#052e16;color:#22c55e;border:1px solid #16a34a}
    .badge.fail{background:#2d0000;color:#ef4444;border:1px solid #dc2626}
    .score-bar-wrap{width:100%;background:#334155;border-radius:999px;height:6px;margin-bottom:.3rem;position:relative}
    .score-bar{height:6px;border-radius:999px;transition:width .3s}
    .score-label{font-size:.7rem;color:#94a3b8}
    .failures ul{list-style:none;padding:0}
    .failures li{color:#f87171;font-size:.72rem;margin-bottom:.2rem}
    .failures li::before{content:"✗ ";color:#ef4444}
    .arrow{color:#6366f1;font-weight:bold}
    .fb-count{display:inline-block;background:#451a03;color:#f59e0b;border:1px solid #b45309;border-radius:999px;padding:.1rem .5rem;font-size:.7rem;font-weight:700}
    .fb-none{color:#475569;font-size:.7rem}
    .retry-count{display:inline-block;background:#1e1b4b;color:#a78bfa;border:1px solid #6366f1;border-radius:999px;padding:.1rem .5rem;font-size:.7rem;font-weight:700}
    .meta{color:#475569;font-size:.75rem;margin-top:2rem;text-align:center}
    .run-id{font-family:monospace;color:#6366f1}
  </style>
</head>
<body>
  <h1>⚡ Genix UI — AI Regression Report</h1>
  <p class="subtitle">Run ID: <span class="run-id">${report.runId}</span> &nbsp;|&nbsp; ${new Date(report.timestamp).toLocaleString()} &nbsp;|&nbsp; Provider: ${escHtml(config.provider)} / ${escHtml(config.model)}</p>

  <div class="grid">
    <div class="stat"><div class="stat-label">Pass Rate</div><div class="stat-value" style="color:${passColor}">${summary.passRate}%</div></div>
    <div class="stat"><div class="stat-label">Passed / Failed</div><div class="stat-value green">${summary.passed} <span style="font-size:1rem;color:#64748b;">/</span> <span class="red">${summary.failed}</span></div></div>
    <div class="stat"><div class="stat-label">Total Tests</div><div class="stat-value blue">${summary.total}</div></div>
    <div class="stat"><div class="stat-label">Avg Quality</div><div class="stat-value" style="color:${passColor}">${summary.averageQualityScore}%</div></div>
    <div class="stat"><div class="stat-label">Avg Latency</div><div class="stat-value yellow">${summary.averageLatencyMs.toLocaleString()} ms</div></div>
    <div class="stat"><div class="stat-label">P50 / P95 / P99</div><div class="stat-value blue" style="font-size:1.1rem;line-height:1.6;">${summary.p50LatencyMs || 0} / ${summary.p95LatencyMs || 0} / ${summary.p99LatencyMs || 0} ms</div></div>
    <div class="stat"><div class="stat-label">Fallbacks (Rate)</div><div class="stat-value ${summary.totalFallbackCount > 0 ? "yellow" : "green"}">${summary.totalFallbackCount} <span style="font-size:0.9rem;color:#94a3b8;">(${summary.fallbackRate ?? 0}%)</span></div></div>
    <div class="stat"><div class="stat-label">Retries (Rate)</div><div class="stat-value purple">${summary.totalRetryCount} <span style="font-size:0.9rem;color:#94a3b8;">(${summary.retryRate ?? 0}%)</span></div></div>
    <div class="stat"><div class="stat-label">Total Duration</div><div class="stat-value blue">${(summary.totalDurationMs / 1000).toFixed(1)} s</div></div>
  </div>

  ${providerBreakdownTable(results)}

  <h2 style="margin-bottom:0.75rem;font-size:1.2rem;font-weight:600;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">📋 Test Case Details</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Test</th>
        <th>Latency</th>
        <th>Files</th>
        <th>Provider Chain</th>
        <th>Fallbacks</th>
        <th>Retries</th>
        <th>Prompt Ver.</th>
        <th>Quality Score</th>
        <th>Failures</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <p class="meta">Generated by Genix UI AI Regression Framework &nbsp;|&nbsp; ${new Date().toUTCString()}</p>
</body>
</html>`;
}
