import { JSONExtractionError } from "./ai.errors.js";
import logger from "../logger.js";

export type ParsedJSON = Record<string, any>;

/**
 * JSONExtractor — multi-strategy JSON extraction with pre-parse repair.
 *
 * Extraction order:
 *  S1. Strip markdown fences → brace-walk → JSON.parse
 *  S2. Raw text              → brace-walk → JSON.parse
 *  S3. Sanitize control chars → S1/S2 repeat
 *  S4. Repair common issues (trailing commas, truncated brace) → JSON.parse
 *  S5. Last-resort: JSON.parse the whole stripped string
 *
 * Each strategy attempts to recover valid JSON rather than immediately
 * throwing. Only throws JSONExtractionError when ALL strategies fail.
 * This prevents unnecessary retries caused by recoverable formatting
 * issues (e.g. raw newlines, trailing commas, trailing markdown).
 */
export class JSONExtractor {
  public static extract(rawText: string): ParsedJSON {
    if (!rawText || typeof rawText !== "string") {
      throw new JSONExtractionError(
        String(rawText ?? ""),
        "AI response is empty or not a string"
      );
    }

    // ── S1: Strip markdown fences → brace-walk ───────────────────────────────
    const stripped = JSONExtractor.stripMarkdownFences(rawText);
    const s1 = JSONExtractor.braceWalk(stripped);
    if (s1 !== null) return s1;

    // ── S2: Raw text → brace-walk (in case stripping was lossy) ─────────────
    const s2 = JSONExtractor.braceWalk(rawText);
    if (s2 !== null) return s2;

    // ── S3: Sanitize control characters then retry S1/S2 ────────────────────
    const sanitized = JSONExtractor.sanitizeControlChars(stripped);
    if (sanitized !== stripped) {
      const s3a = JSONExtractor.braceWalk(sanitized);
      if (s3a !== null) {
        logger.debug("[JSONExtractor] Recovered JSON after control-char sanitization");
        return s3a;
      }
    }

    // ── S4: Repair common JSON issues then try JSON.parse ────────────────────
    const repaired = JSONExtractor.repairJson(sanitized || stripped);
    if (repaired !== null) {
      logger.debug("[JSONExtractor] Recovered JSON via repair pass");
      return repaired;
    }

    // ── S5: Last resort — parse entire stripped string ───────────────────────
    try {
      const parsed = JSON.parse(stripped);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as ParsedJSON;
      }
    } catch { /* intentional */ }

    // Log the raw snippet to aid diagnosis (first 500 chars)
    logger.warn("[JSONExtractor] All extraction strategies failed", {
      rawSnippet: rawText.slice(0, 500),
    });

    throw new JSONExtractionError(
      rawText,
      "No valid JSON object found in AI provider response"
    );
  }

  // ─── Strip markdown fences ────────────────────────────────────────────────
  private static stripMarkdownFences(text: string): string {
    // Remove fenced code blocks: ```[lang]\n...\n```
    let result = text.replace(
      /```(?:json|typescript|ts|tsx|javascript|js|css)?\s*\n?([\s\S]*?)```/gi,
      "$1"
    );
    // Remove any remaining standalone fence markers
    result = result
      .replace(/^```[a-z]*\s*$/gim, "")
      .replace(/^```\s*$/gim, "");
    return result.trim();
  }

  // ─── Sanitize raw control characters inside JSON strings ─────────────────
  /**
   * Replaces raw control characters (U+0000–U+001F) that are illegal inside
   * JSON string values with their escaped equivalents. Gemini sometimes emits
   * raw newlines/tabs inside string values, which makes JSON.parse throw.
   */
  private static sanitizeControlChars(text: string): string {
    // Replace raw newlines / carriage returns / tabs inside string values.
    // We walk character by character to only touch content inside strings.
    let result = "";
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (escape) {
        escape = false;
        result += ch;
        continue;
      }

      if (ch === "\\" && inString) {
        escape = true;
        result += ch;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        result += ch;
        continue;
      }

      if (inString) {
        // Replace illegal raw control characters with their JSON escape
        const code = ch.charCodeAt(0);
        if (code < 0x20) {
          if (ch === "\n") { result += "\\n"; continue; }
          if (ch === "\r") { result += "\\r"; continue; }
          if (ch === "\t") { result += "\\t"; continue; }
          result += `\\u${code.toString(16).padStart(4, "0")}`;
          continue;
        }
      }

      result += ch;
    }

    return result;
  }

  // ─── Repair common LLM JSON issues ───────────────────────────────────────
  /**
   * Applies lightweight heuristic repairs:
   *  1. Remove trailing commas before } or ]
   *  2. Close unclosed braces/brackets (truncated response)
   *  3. Remove any trailing text after the last closing brace
   */
  private static repairJson(text: string): ParsedJSON | null {
    const start = text.indexOf("{");
    if (start === -1) return null;

    let working = text.slice(start);

    // Fix 1: trailing commas (,} or ,])
    working = working.replace(/,\s*([}\]])/g, "$1");

    // Fix 2: remove trailing non-JSON text after last `}`
    const lastBrace = working.lastIndexOf("}");
    if (lastBrace !== -1 && lastBrace < working.length - 1) {
      working = working.slice(0, lastBrace + 1);
    }

    // Fix 3: count open vs closed braces and close missing ones
    let openBraces = 0;
    let openBrackets = 0;
    let inStr = false;
    let esc = false;

    for (const ch of working) {
      if (esc) { esc = false; continue; }
      if (ch === "\\" && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }

    // Close any unclosed arrays first, then objects
    if (openBrackets > 0) working += "]".repeat(openBrackets);
    if (openBraces > 0) working += "}".repeat(openBraces);

    try {
      const parsed = JSON.parse(working);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as ParsedJSON;
      }
    } catch { /* repair didn't work */ }

    return null;
  }

  // ─── Brace-balanced walk ──────────────────────────────────────────────────
  /**
   * Walks `text` character-by-character tracking brace depth.
   * Returns the first complete, balanced JSON object found, or null.
   */
  private static braceWalk(text: string): ParsedJSON | null {
    const start = text.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (escape) { escape = false; continue; }
      if (char === "\\" && inString) { escape = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (inString) continue;

      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(start, i + 1);
          try {
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              return parsed as ParsedJSON;
            }
          } catch {
            // Try next opening brace
            const nextStart = text.indexOf("{", i + 1);
            if (nextStart === -1) return null;
            return JSONExtractor.braceWalk(text.slice(nextStart));
          }
          return null;
        }
      }
    }

    return null;
  }
}
