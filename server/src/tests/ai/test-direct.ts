import "../../config/env.js"; // load env vars first
import { GeminiProvider } from "../../services/ai/providers/gemini.provider.js";
import { PromptBuilder } from "../../services/ai/builders/prompt.builder.js";
import { performance } from "perf_hooks";
import accordionPrompt from "./prompts/accordion.prompt.json" assert { type: "json" };

async function main() {
  const startTime = performance.now();
  console.log(`Starting direct Gemini test with Accordion Prompt (thinkingBudget: 0)...`);

  const promptBuilder = new PromptBuilder();
  const builtPrompt = promptBuilder.build("component", {
    prompt: accordionPrompt.body.prompt,
  });

  const provider = new GeminiProvider();
  try {
    const result = await provider.generate({
      prompt: builtPrompt.userPrompt,
      systemInstruction: builtPrompt.systemPrompt,
      feature: "generate",
      options: {
        startTime,
        temperature: 0.1,
        // Disable thinking
        // @ts-ignore
        thinkingConfig: {
          thinkingBudget: 0
        }
      },
    });
    console.log("SUCCESS! Result generated successfully.");
    
    // We combine all content parts exactly as output.validator does:
    const files = result.files || [];
    const explanation = result.explanation || "";
    const contentParts = files.map((f: any) => `${f.path || ""}\n${f.content || ""}`);
    const allContent = [...contentParts, explanation].join("\n");
    
    console.log("Searching for case-insensitive 'any' in allContent...");
    const regex = /any/gi;
    let match;
    let matchCount = 0;
    while ((match = regex.exec(allContent)) !== null) {
      matchCount++;
      const index = match.index;
      // Get context around the match
      const start = Math.max(0, index - 40);
      const end = Math.min(allContent.length, index + 40);
      const snippet = allContent.substring(start, end).replace(/\n/g, "\\n");
      console.log(`Match #${matchCount} at index ${index}: "...${snippet}..."`);
    }
    
    if (matchCount === 0) {
      console.log("No matches found for 'any'!");
    }

    console.log("\nSearching for 'style={{' in allContent...");
    const styleRegex = /style=\{\{/gi;
    let styleMatchCount = 0;
    while ((match = styleRegex.exec(allContent)) !== null) {
      styleMatchCount++;
      const index = match.index;
      const start = Math.max(0, index - 40);
      const end = Math.min(allContent.length, index + 40);
      const snippet = allContent.substring(start, end).replace(/\n/g, "\\n");
      console.log(`style={{ Match #${styleMatchCount} at index ${index}: "...${snippet}..."`);
    }

    console.log("\nSearching for 'TODO' in allContent...");
    const todoRegex = /TODO/gi;
    let todoMatchCount = 0;
    while ((match = todoRegex.exec(allContent)) !== null) {
      todoMatchCount++;
      const index = match.index;
      const start = Math.max(0, index - 40);
      const end = Math.min(allContent.length, index + 40);
      const snippet = allContent.substring(start, end).replace(/\n/g, "\\n");
      console.log(`TODO Match #${todoMatchCount} at index ${index}: "...${snippet}..."`);
    }

    console.log("\nFiles generated:", result.files.length);
    for (const file of result.files) {
      console.log(`File: ${file.path}`);
    }
  } catch (err: any) {
    console.error("FAILED with error:", err);
  }
}

main();
