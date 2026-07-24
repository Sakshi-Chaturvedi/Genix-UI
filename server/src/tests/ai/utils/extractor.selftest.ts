/**
 * Quick self-test for JSONExtractor and AIResponseSchema validation.
 * Run: tsx src/tests/ai/utils/extractor.selftest.ts
 */
import { JSONExtractor } from "../../../utils/ai/json.extractor.js";
import { ResponseNormalizer } from "../../../utils/ai/response.normalizer.js";
import { validateAIResponse } from "../../../utils/ai/ai.response.schema.js";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

interface TestCase {
  name: string;
  input: string;
  expectSuccess: boolean;
}

const testCases: TestCase[] = [
  {
    name: "Pure JSON",
    input: `{"files":[{"path":"src/Button.tsx","content":"export const Button = () => <button>Click</button>;","type":"code","language":"typescript"}],"explanation":"A simple button."}`,
    expectSuccess: true,
  },
  {
    name: "Markdown-fenced JSON (```json ... ```)",
    input: "```json\n{\"files\":[{\"path\":\"src/Button.tsx\",\"content\":\"export const Button = () => <button />\",\"type\":\"code\",\"language\":\"typescript\"}]}\n```",
    expectSuccess: true,
  },
  {
    name: "Preamble text before JSON",
    input: "Sure! Here is the component you requested:\n\n{\"files\":[{\"path\":\"src/Card.tsx\",\"content\":\"export const Card = () => <div />\",\"type\":\"code\",\"language\":\"typescript\"}]}",
    expectSuccess: true,
  },
  {
    name: "Preamble + markdown fence",
    input: "Of course! Here you go:\n```json\n{\"files\":[{\"path\":\"src/Modal.tsx\",\"content\":\"export const Modal = () => <div role='dialog' />\",\"type\":\"code\",\"language\":\"typescript\"}]}\n```\nHope this helps!",
    expectSuccess: true,
  },
  {
    name: "Code content with braces (nested structure)",
    input: `{"files":[{"path":"src/Nav.tsx","content":"export const Nav = () => { const [open, setOpen] = React.useState(false); return <nav>{open ? <ul /> : null}</nav>; }","type":"code","language":"typescript"}]}`,
    expectSuccess: true,
  },
  {
    name: "Empty string — should fail",
    input: "",
    expectSuccess: false,
  },
  {
    name: "Plain text with no JSON — should fail",
    input: "I'm sorry, I cannot generate code right now.",
    expectSuccess: false,
  },
  {
    name: "JSON missing files array — should fail validation",
    input: `{"explanation":"This is a component."}`,
    expectSuccess: false,
  },
  {
    name: "JSON with empty files array — should fail validation",
    input: `{"files":[],"explanation":"Nothing generated."}`,
    expectSuccess: false,
  },
  {
    name: "File missing required language field — should fail validation",
    input: `{"files":[{"path":"src/X.tsx","content":"export const X = () => null","type":"code"}]}`,
    expectSuccess: false,
  },
  {
    name: "File with invalid type enum — should fail validation",
    input: `{"files":[{"path":"src/X.tsx","content":"export const X = () => null","type":"component","language":"typescript"}]}`,
    expectSuccess: false,
  },
];

let passed = 0;
let failed = 0;

console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║   JSONExtractor + AIResponseSchema Self-Test     ║");
console.log("╚══════════════════════════════════════════════════╝\n");

for (const tc of testCases) {
  try {
    const extracted = JSONExtractor.extract(tc.input);
    const normalized = ResponseNormalizer.normalize(extracted, "gemini", "gemini-2.5-flash");
    const validated = validateAIResponse(normalized);

    if (tc.expectSuccess) {
      console.log(`  ${GREEN}✓${RESET} ${tc.name}`);
      console.log(`      → files: ${validated.data.files.length}, explanation: ${validated.data.explanation ? "present" : "none"}`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${tc.name} — expected FAILURE but GOT SUCCESS`);
      failed++;
    }
  } catch (err: any) {
    if (!tc.expectSuccess) {
      console.log(`  ${GREEN}✓${RESET} ${tc.name} (correctly rejected)`);
      console.log(`      → ${err.constructor.name}: ${err.message.slice(0, 80)}`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${tc.name} — expected SUCCESS but GOT ERROR`);
      console.log(`      → ${err.constructor.name}: ${err.message}`);
      failed++;
    }
  }
}

console.log(`\n  Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);
process.exit(failed > 0 ? 1 : 0);
