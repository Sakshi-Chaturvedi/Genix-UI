/**
 * PromptOptimizer
 *
 * Normalizes and optimizes prompt strings before sending to an AI provider.
 * Performs two complementary operations:
 *
 * 1. TEXT NORMALIZATION — reduces token waste from whitespace/formatting:
 *    - Trim leading/trailing whitespace
 *    - Normalize Windows CRLF → LF
 *    - Collapse 3+ consecutive blank lines to 2
 *    - Remove trailing whitespace from every line
 *    - Remove common leading indentation (dedent)
 *
 * 2. OUTPUT CONSTRAINT INJECTION — appends a machine-readable directive block
 *    that instructs the model to return minimal, clean JSON output only.
 *    This significantly reduces response size (~5000 → ~1500 tokens for a
 *    Button component) without reducing code quality.
 *    Rules injected:
 *    - Return ONLY JSON (no markdown, no prose)
 *    - No comments, no documentation, no examples, no TODOs
 *    - Only the required files (no extras)
 *    - Keep implementation concise; avoid duplicate code
 *    - Prefer reusable components and helpers
 */
export class PromptOptimizer {
  /**
   * Compact, machine-readable output constraint directive injected into every
   * system instruction. Kept minimal intentionally — verbosity here is ironic.
   */
  private static readonly OUTPUT_CONSTRAINTS = `
OUTPUT CONSTRAINTS (STRICT — non-compliance causes a hard parse failure):
- Respond with ONLY a raw JSON object. Start with { and end with }.
- NO markdown code fences, NO prose, NO explanations outside JSON fields.
- NO inline comments (// ...) or block comments (/* ... */) in any file content.
- NO JSDoc or TypeDoc annotations unless the property is a public API surface.
- NO TODO, FIXME, HACK, NOTE, or placeholder comments of any kind.
- NO example usage blocks, NO "Usage:" sections, NO demonstration snippets.
- Generate ONLY the files strictly required to satisfy the request.
- Keep every implementation concise. Avoid boilerplate, duplicate code, and padding.
- Extract repeated logic into shared helpers or reusable sub-components.
- Omit the "explanation" field if it adds no value beyond the code itself.`.trim();

  /**
   * Normalizes a prompt string and injects output-reduction constraints.
   *
   * @param raw - The raw prompt string (may be undefined or null)
   * @param injectConstraints - Set to false to skip constraint injection (e.g., for user-facing prompts)
   * @returns Normalized + constrained string, or empty string if input is falsy
   */
  public static optimize(
    raw: string | null | undefined,
    injectConstraints = false
  ): string {
    if (!raw || typeof raw !== "string") return "";

    let text = raw;

    // 1. Normalize CRLF → LF
    text = text.replace(/\r\n/g, "\n");

    // 2. Trim leading/trailing whitespace from the full string
    text = text.trim();

    // 3. Remove trailing whitespace from each line
    text = text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");

    // 4. Collapse 3+ consecutive blank lines to exactly 2
    text = text.replace(/\n{3,}/g, "\n\n");

    // 5. Dedent: remove shared leading whitespace across all non-empty lines
    text = PromptOptimizer.dedent(text);

    // 6. Inject output constraints into system instructions only
    if (injectConstraints) {
      text = `${text}\n\n${PromptOptimizer.OUTPUT_CONSTRAINTS}`;
    }

    return text;
  }

  /**
   * Convenience method: optimizes AND injects output constraints.
   * Use this for system instructions sent to AI providers.
   */
  public static optimizeSystemInstruction(raw: string | null | undefined): string {
    return PromptOptimizer.optimize(raw, true);
  }

  /**
   * Convenience method: optimizes WITHOUT injecting constraints.
   * Use this for user-facing prompts (the user's actual request content).
   */
  public static optimizeUserPrompt(raw: string | null | undefined): string {
    return PromptOptimizer.optimize(raw, false);
  }

  /**
   * Removes the common leading whitespace prefix from all non-empty lines.
   * This is equivalent to Python's textwrap.dedent().
   */
  private static dedent(text: string): string {
    const lines = text.split("\n");
    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);

    if (nonEmptyLines.length === 0) return text;

    // Find minimum indentation across non-empty lines
    const minIndent = nonEmptyLines.reduce((min, line) => {
      const match = line.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      return Math.min(min, indent);
    }, Infinity);

    if (minIndent === 0) return text;

    return lines.map((line) => (line.trim() ? line.slice(minIndent) : line)).join("\n");
  }
}
