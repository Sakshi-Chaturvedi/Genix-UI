import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { ITestReport } from "../types/test.types.js";
import { generateHtmlReport } from "./html.template.js";

export function saveReports(report: ITestReport, outputDir: string): { jsonPath: string; htmlPath: string } {
  const absDir = resolve(outputDir);
  mkdirSync(absDir, { recursive: true });

  const jsonPath = resolve(absDir, "report.json");
  const htmlPath = resolve(absDir, "report.html");

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");
  writeFileSync(htmlPath, generateHtmlReport(report), "utf-8");

  return { jsonPath, htmlPath };
}
