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
  
  // Combined content for positive rule checks (mustContain, accessibility, etc.)
  const allContent = files.map((f: any) => `${f.path || ""}\n${f.content || ""}`).join("\n");

  // ── 1. mustContain checks ────────────────────────────────────────────────
  for (const token of rules.mustContain) {
    if (allContent.includes(token)) {
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
  let a11yScore = rules.qualityWeights.accessibility;
  for (const rule of rules.accessibilityRules) {
    let satisfiesRule = allContent.includes(rule);

    // Native HTML semantics fallback for accessibility rules:
    if (!satisfiesRule) {
      if (rule === "role=" || rule === "role=\"button\"") {
        // Native <button> element or button HTML tag satisfies button role requirement
        satisfiesRule = /<button[\s>]/i.test(allContent) || /React\.ButtonHTMLAttributes/i.test(allContent);
      } else if (rule === "role=\"dialog\"") {
        satisfiesRule = /<dialog[\s>]/i.test(allContent) || /role=/i.test(allContent);
      } else if (rule === "role=\"navigation\"") {
        satisfiesRule = /<nav[\s>]/i.test(allContent) || /aria-label/i.test(allContent);
      }
    }

    if (satisfiesRule) {
      passed.push(`[a11y] Found: "${rule}"`);
    } else {
      const penalty = Math.floor(rules.qualityWeights.accessibility / Math.max(rules.accessibilityRules.length, 1));
      a11yScore = Math.max(0, a11yScore - penalty);
      failed.push(`[a11y] Missing: "${rule}"`);
    }
  }

  // ── 4. Architecture rules ────────────────────────────────────────────────
  let archScore = rules.qualityWeights.architecture;
  for (const rule of rules.architectureRules) {
    if (allContent.includes(rule)) {
      passed.push(`[arch] Found: "${rule}"`);
    } else {
      const penalty = Math.floor(rules.qualityWeights.architecture / Math.max(rules.architectureRules.length, 1));
      archScore = Math.max(0, archScore - penalty);
      failed.push(`[arch] Missing: "${rule}"`);
    }
  }

  // ── 5. Styling rules ─────────────────────────────────────────────────────
  let styleScore = rules.qualityWeights.styling;
  for (const rule of rules.stylingRules) {
    if (allContent.includes(rule)) {
      passed.push(`[style] Found: "${rule}"`);
    } else {
      const penalty = Math.floor(rules.qualityWeights.styling / Math.max(rules.stylingRules.length, 1));
      styleScore = Math.max(0, styleScore - penalty);
      failed.push(`[style] Missing: "${rule}"`);
    }
  }

  // ── 6. TypeScript rules ──────────────────────────────────────────────────
  let typingScore = rules.qualityWeights.typing;
  for (const rule of rules.typescriptRules) {
    let satisfiesRule = allContent.includes(rule);

    // Flexible TS node matching: React.ReactNode <-> ReactNode
    if (!satisfiesRule) {
      if (rule === ": React.ReactNode") {
        satisfiesRule = allContent.includes(": ReactNode") || allContent.includes("ReactNode") || allContent.includes("React.ReactElement");
      } else if (rule === ": React.FC") {
        satisfiesRule = allContent.includes(": FC") || allContent.includes("React.FC") || allContent.includes("forwardRef");
      } else if (rule === "React.ButtonHTMLAttributes") {
        satisfiesRule = allContent.includes("ButtonHTMLAttributes") || allContent.includes("HTMLButtonElement");
      }
    }

    if (satisfiesRule) {
      passed.push(`[ts] Found: "${rule}"`);
    } else {
      const penalty = Math.floor(rules.qualityWeights.typing / Math.max(rules.typescriptRules.length, 1));
      typingScore = Math.max(0, typingScore - penalty);
      failed.push(`[ts] Missing: "${rule}"`);
    }
  }

  // ── 7. Responsiveness check ──────────────────────────────────────────────
  let responsiveScore = rules.qualityWeights.responsiveness;
  const hasMediaQuery = allContent.includes("@media");
  if (hasMediaQuery) {
    passed.push("[responsive] CSS media queries detected");
  } else if (rules.qualityWeights.responsiveness > 0 && rules.stylingRules.length > 0) {
    responsiveScore = Math.max(0, responsiveScore - 10);
    failed.push("[responsive] No CSS media queries detected");
  }

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
