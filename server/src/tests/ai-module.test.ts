import { PromptBuilder } from "../services/ai/builders/prompt.builder.js";
import { ResponseParser } from "../services/ai/parsers/response.parser.js";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ TEST PASSED: ${name}`);
  } catch (error) {
    console.error(`❌ TEST FAILED: ${name}`);
    console.error(error);
    process.exit(1);
  }
}

console.log("=== RUNNING AI MODULE OPTIMIZATION TESTS ===");

runTest("PromptBuilder template registry and compose", () => {
  const builder = new PromptBuilder();
  const componentTemplate = builder.getTemplate("component");
  if (componentTemplate.name !== "component") throw new Error("Incorrect template name resolved");
  if (componentTemplate.version !== "v1.0.0") throw new Error("Incorrect template version");

  const built = builder.build("component", { prompt: "Create a modern header button" });
  if (!built.systemPrompt.includes("world-class senior frontend engineer")) throw new Error("System prompt missing core instructions");
  if (!built.systemPrompt.includes("OUTPUT INSTRUCTIONS")) throw new Error("System prompt missing JSON schema instructions");
  if (!built.userPrompt.includes("Create a modern header button")) throw new Error("User prompt missing user input");
  if (built.version !== "v1.0.0") throw new Error("Prompt version mismatch");
});

runTest("ResponseParser successfully extracts JSON from markdown backticks", () => {
  const rawInput = "```json\n{\n  \"files\": [\n    {\n      \"path\": \"/src/components/Btn.tsx\",\n      \"content\": \"export const Btn = () => <button>Hello</button>;\",\n      \"type\": \"code\",\n      \"language\": \"typescript\"\n    }\n  ],\n  \"explanation\": \"Simple button\"\n}\n```";
  const parsed = ResponseParser.parse(rawInput);
  if (parsed.files.length !== 1) throw new Error("Expected exactly 1 file");
  if (parsed.files[0].path !== "/src/components/Btn.tsx") throw new Error("Unexpected file path");
  if (parsed.explanation !== "Simple button") throw new Error("Unexpected explanation");
});

runTest("ResponseParser throws error for missing files array", () => {
  const rawInput = "{\n  \"explanation\": \"Missing files array\"\n}";
  try {
    ResponseParser.parse(rawInput);
    throw new Error("Expected parser to throw on missing files");
  } catch (err: any) {
    if (!err.message.includes("missing a valid 'files' array")) throw err;
  }
});

runTest("ResponseParser throws error on invalid file type", () => {
  const rawInput = "{\n  \"files\": [\n    {\n      \"path\": \"/src/components/Btn.tsx\",\n      \"content\": \"export const Btn = () => <button>Hello</button>;\",\n      \"type\": \"invalid_type\",\n      \"language\": \"typescript\"\n    }\n  ]\n}";
  try {
    ResponseParser.parse(rawInput);
    throw new Error("Expected parser to throw on invalid file type");
  } catch (err: any) {
    if (!err.message.includes("Invalid file type")) throw err;
  }
});

console.log("=== ALL AI MODULE OPTIMIZATION TESTS COMPLETED SUCCESSFULLY ===");
