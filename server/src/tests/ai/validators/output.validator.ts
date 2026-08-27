import ts from "typescript";
import { ITestResult, IValidationResult, IQualityScore, IRuleSet } from "../types/test.types.js";

// ─── Structure Validator ──────────────────────────────────────────────────────

export function validateStructure(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Response is not a valid JSON object");
    return { valid: false, errors };
  }

  if (!data.success) {
    errors.push(`API returned success=false`);
  }

  const payload = data.data;
  if (!payload) {
    errors.push("Response is missing 'data' field");
    return { valid: false, errors };
  }

  if (!Array.isArray(payload.files)) {
    errors.push("Response 'data.files' is not an array");
    return { valid: false, errors };
  }

  if (payload.files.length === 0) {
    errors.push("Response 'data.files' array is empty");
  }

  // Validate each file object
  payload.files.forEach((file: any, index: number) => {
    if (!file.path || typeof file.path !== "string") {
      errors.push(`File[${index}]: missing or invalid 'path'`);
    }
    if (typeof file.content !== "string" || file.content.trim().length === 0) {
      errors.push(`File[${index}]: missing or empty 'content'`);
    }
    if (!["code", "style", "test", "storybook", "documentation", "config"].includes(file.type)) {
      errors.push(`File[${index}]: invalid 'type' value '${file.type}'`);
    }
    if (!file.language || typeof file.language !== "string") {
      errors.push(`File[${index}]: missing or invalid 'language'`);
    }
  });

  // Validate metadata
  const meta = payload.metadata;
  if (!meta) {
    errors.push("Response 'data.metadata' is missing");
  } else {
    if (!meta.provider) errors.push("Metadata: missing 'provider'");
    if (!meta.model) errors.push("Metadata: missing 'model'");
    if (!meta.promptVersion) errors.push("Metadata: missing 'promptVersion'");
    if (typeof meta.latencyMs !== "number") errors.push("Metadata: 'latencyMs' must be a number");
  }

  return { valid: errors.length === 0, errors };
}

// ─── AST & Code Helpers ───────────────────────────────────────────────────────

/**
  * Parses TS/TSX source code and checks if explicit TypeScript `any` type keyword is used.
  * Ignores string literals, prose, comments, documentation, and explanations.
  */
function containsExplicitAnyType(code: string, fileName: string): boolean {
  try {
    const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKind);

    let foundAny = false;
    function visit(node: ts.Node) {
      if (foundAny) return;
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        foundAny = true;
        return;
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return foundAny;
  } catch {
    return false;
  }
}

/**
  * Checks if component code contains inline style attributes like `style={{ ... }}`.
  * Ignores storybook files and test files.
  */
function containsInlineStyleAttribute(code: string, fileName: string): boolean {
  try {
    const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKind);

    let foundInlineStyle = false;
    function visit(node: ts.Node) {
      if (foundInlineStyle) return;
      if (ts.isJsxAttribute(node) && node.name.getText() === "style") {
        if (node.initializer && ts.isJsxExpression(node.initializer)) {
          foundInlineStyle = true;
          return;
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return foundInlineStyle;
  } catch {
    return code.includes("style={{");
  }
}

/**
  * Checks if component code contains hardcoded string className attributes (e.g., className="btn").
  * Only evaluated on main component/page source files (not test/storybook files).
  */
function containsLiteralClassNameAttribute(code: string, fileName: string): boolean {
  try {
    const scriptKind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKind);

    let foundLiteralClass = false;
    function visit(node: ts.Node) {
      if (foundLiteralClass) return;
      if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
        if (node.initializer && ts.isStringLiteral(node.initializer)) {
          foundLiteralClass = true;
          return;
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return foundLiteralClass;
  } catch {
    return false;
  }
}

/**
  * Checks if code contains TODO comments or identifiers in actual TS/TSX source files.
  */
function containsTodoKeyword(code: string, fileName: string): boolean {
  return /\bTODO\b/.test(code);
}

// ─── Quality Validator ────────────────────────────────────────────────────────

function getCategoryTokens(rules: IRuleSet) {
  const a11yTokens = new Set(rules.accessibilityRules);
  const archTokens = new Set(rules.architectureRules);
  const styleTokens = new Set(rules.stylingRules);
  const tsTokens = new Set(rules.typescriptRules);
  const respTokens = new Set<string>();

  if (styleTokens.has("@media")) {
    styleTokens.delete("@media");
    respTokens.add("@media");
  }

  const a11yAllowed = ["aria-", "aria-expanded", "aria-controls", "aria-label", "role=", "tabIndex", "onKeyDown", "alt="];
  const tsAllowed = ["interface", "ButtonProps", "CardProps", "AccordionProps", "ProfileCardProps", "React.FC", "React.ReactNode", ": string", ": boolean", ": number"];
  
  for (const token of rules.mustContain) {
    if (a11yAllowed.includes(token)) {
      a11yTokens.add(token);
    } else if (tsAllowed.includes(token)) {
      tsTokens.add(token);
    } else if (token === ".module.css") {
      styleTokens.add(token);
    } else if (token === "@media") {
      respTokens.add(token);
    } else if (token.startsWith("export const")) {
      archTokens.add(token);
    }
  }

  return { a11yTokens, archTokens, styleTokens, tsTokens, respTokens };
}

function calculateProportionalScore(weight: number, failedCount: number, totalCount: number): number {
  if (totalCount === 0) return weight;
  const ratio = 1 - (failedCount / totalCount);
  return Math.max(0, Math.round(weight * ratio));
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\/|(?<!http:|https:)\/\/[^\r\n]*/g, "");
}

export function validateQuality(
  data: any,
  rules: IRuleSet
): { passed: string[]; failed: string[]; score: IQualityScore } {
  const passed: string[] = [];
  const failed: string[] = [];

  const files: any[] = data?.data?.files || [];
  
  // Categorize files
  const codeFiles = files.filter(
    (f) => f.type === "code" || (f.path && (f.path.endsWith(".tsx") || f.path.endsWith(".ts")))
  );
  const mainComponentFiles = codeFiles.filter(
    (f) => !f.path.endsWith(".test.tsx") && !f.path.endsWith(".stories.tsx")
  );
  const styleFiles = files.filter(
    (f) => f.type === "style" || (f.path && f.path.endsWith(".css"))
  );
  
  // Clean contents for positive rule checks
  const cleanComponentContent = mainComponentFiles
    .map((f: any) => stripComments(f.content || ""))
    .join("\n");

  const cleanStyleContent = styleFiles
    .map((f: any) => stripComments(f.content || ""))
    .join("\n");

  const { a11yTokens, archTokens, styleTokens, tsTokens, respTokens } = getCategoryTokens(rules);

  // ── 1. mustContain checks ────────────────────────────────────────────────
  for (const token of rules.mustContain) {
    let satisfies = false;
    if (token === ".module.css") {
      satisfies = cleanComponentContent.includes(".module.css") ||
                  files.some((f: any) => f.path && f.path.endsWith(".module.css"));
    } else {
      satisfies = cleanComponentContent.includes(token);
    }

    if (satisfies) {
      passed.push(`Contains required token: "${token}"`);
    } else {
      failed.push(`Missing required token: "${token}"`);
    }
  }

  // ── 2. mustNotContain checks (AST & Code-specific Analysis) ───────────────
  for (const token of rules.mustNotContain) {
    let violationFound = false;

    if (token === "any") {
      // AST check: TS explicit `any` type in any source file
      for (const file of codeFiles) {
        if (containsExplicitAnyType(file.content || "", file.path || "file.tsx")) {
          violationFound = true;
          break;
        }
      }
    } else if (token === "style={{" || token === "style={{ ") {
      // AST check: JSX inline style attribute in component files
      for (const file of mainComponentFiles) {
        if (containsInlineStyleAttribute(file.content || "", file.path || "file.tsx")) {
          violationFound = true;
          break;
        }
      }
    } else if (token === "className=\"") {
      // AST check: literal string className="foo" in main component files
      for (const file of mainComponentFiles) {
        if (containsLiteralClassNameAttribute(file.content || "", file.path || "file.tsx")) {
          violationFound = true;
          break;
        }
      }
    } else if (token === "TODO") {
      for (const file of codeFiles) {
        if (containsTodoKeyword(file.content || "", file.path || "file.tsx")) {
          violationFound = true;
          break;
        }
      }
    } else {
      // For framework tokens like "Tailwind", "@emotion", "styled-components"
      // inspect component source code files only (not explanation markdown)
      for (const file of codeFiles) {
        if ((file.content || "").includes(token)) {
          violationFound = true;
          break;
        }
      }
    }

    if (!violationFound) {
      passed.push(`Does not contain forbidden token: "${token}"`);
    } else {
      failed.push(`Contains forbidden token: "${token}"`);
    }
  }

  // ── 3. Accessibility rules ───────────────────────────────────────────────
  let a11yFailedCount = 0;
  for (const rule of a11yTokens) {
    let satisfiesRule = cleanComponentContent.includes(rule);

    // Native HTML semantics fallback for accessibility rules:
    if (!satisfiesRule) {
      if (rule === "role=" || rule === "role=\"button\"") {
        // Native <button> element or button HTML tag satisfies button role requirement
        satisfiesRule = /<button[\s>]/i.test(cleanComponentContent) || /React\.ButtonHTMLAttributes/i.test(cleanComponentContent);
      } else if (rule === "role=\"dialog\"") {
        satisfiesRule = /<dialog[\s>]/i.test(cleanComponentContent) || /role=/i.test(cleanComponentContent);
      } else if (rule === "role=\"navigation\"") {
        satisfiesRule = /<nav[\s>]/i.test(cleanComponentContent) || /aria-label/i.test(cleanComponentContent);
      }
    }

    if (satisfiesRule) {
      if (rules.accessibilityRules.includes(rule)) passed.push(`[a11y] Found: "${rule}"`);
    } else {
      a11yFailedCount++;
      if (rules.accessibilityRules.includes(rule)) failed.push(`[a11y] Missing: "${rule}"`);
    }
  }
  const a11yScore = calculateProportionalScore(rules.qualityWeights.accessibility, a11yFailedCount, a11yTokens.size);

  // ── 4. Architecture rules ────────────────────────────────────────────────
  let archFailedCount = 0;
  for (const rule of archTokens) {
    if (cleanComponentContent.includes(rule)) {
      if (rules.architectureRules.includes(rule)) passed.push(`[arch] Found: "${rule}"`);
    } else {
      archFailedCount++;
      if (rules.architectureRules.includes(rule)) failed.push(`[arch] Missing: "${rule}"`);
    }
  }
  const archScore = calculateProportionalScore(rules.qualityWeights.architecture, archFailedCount, archTokens.size);

  // ── 5. Styling rules ─────────────────────────────────────────────────────
  let styleFailedCount = 0;
  for (const rule of styleTokens) {
    let satisfiesRule = false;
    if (rule === ".module.css") {
      satisfiesRule = cleanComponentContent.includes(".module.css") ||
                      files.some((f: any) => f.path && f.path.endsWith(".module.css"));
    } else {
      satisfiesRule = cleanComponentContent.includes(rule);
    }

    if (satisfiesRule) {
      if (rules.stylingRules.includes(rule)) passed.push(`[style] Found: "${rule}"`);
    } else {
      styleFailedCount++;
      if (rules.stylingRules.includes(rule)) failed.push(`[style] Missing: "${rule}"`);
    }
  }
  const styleScore = calculateProportionalScore(rules.qualityWeights.styling, styleFailedCount, styleTokens.size);

  // ── 6. TypeScript rules ──────────────────────────────────────────────────
  let tsFailedCount = 0;
  for (const rule of tsTokens) {
    let satisfiesRule = cleanComponentContent.includes(rule);

    // Flexible TS node matching: React.ReactNode <-> ReactNode
    if (!satisfiesRule) {
      if (rule === ": React.ReactNode") {
        satisfiesRule = cleanComponentContent.includes(": ReactNode") || cleanComponentContent.includes("ReactNode") || cleanComponentContent.includes("React.ReactElement");
      } else if (rule === ": React.FC") {
        satisfiesRule = cleanComponentContent.includes(": FC") || cleanComponentContent.includes("React.FC") || cleanComponentContent.includes("forwardRef");
      } else if (rule === "React.ButtonHTMLAttributes") {
        satisfiesRule = cleanComponentContent.includes("ButtonHTMLAttributes") || cleanComponentContent.includes("HTMLButtonElement");
      }
    }

    if (satisfiesRule) {
      if (rules.typescriptRules.includes(rule)) passed.push(`[ts] Found: "${rule}"`);
    } else {
      tsFailedCount++;
      if (rules.typescriptRules.includes(rule)) failed.push(`[ts] Missing: "${rule}"`);
    }
  }
  const typingScore = calculateProportionalScore(rules.qualityWeights.typing, tsFailedCount, tsTokens.size);

  // ── 7. Responsiveness check ──────────────────────────────────────────────
  let respFailedCount = 0;
  for (const rule of respTokens) {
    let satisfiesRule = false;
    if (rule === "@media") {
      satisfiesRule = cleanStyleContent.includes("@media");
    } else {
      satisfiesRule = cleanComponentContent.includes(rule);
    }

    if (satisfiesRule) {
      if (rule === "@media") passed.push("[responsive] CSS media queries detected");
    } else {
      respFailedCount++;
      if (rule === "@media") failed.push("[responsive] No CSS media queries detected");
    }
  }
  const responsiveScore = calculateProportionalScore(rules.qualityWeights.responsiveness, respFailedCount, respTokens.size);

  const total = a11yScore + typingScore + archScore + styleScore + responsiveScore;
  const maxTotal = Object.values(rules.qualityWeights).reduce((sum, w) => sum + w, 0);
  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  return {
    passed,
    failed,
    score: {
      accessibility: a11yScore,
      typing: typingScore,
      architecture: archScore,
      styling: styleScore,
      responsiveness: responsiveScore,
      total,
      percentage,
    },
  };
}

function extractAllContent(data: any): string {
  try {
    const files: any[] = data?.data?.files || [];
    const explanation: string = data?.data?.explanation || "";
    const contentParts = files.map((f: any) => `${f.path || ""}\n${f.content || ""}`);
    return [...contentParts, explanation].join("\n");
  } catch {
    return "";
  }
}
