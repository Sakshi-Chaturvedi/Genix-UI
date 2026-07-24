import { GoogleGenAI } from "@google/genai";
import aiConfig from "../../../config/ai.config.js";
import { OUTPUT_INSTRUCTIONS, SYSTEM_PROMPT } from "../../../services/ai/prompts/system.prompt.js";

async function run() {
  const apiKey = aiConfig.providers.gemini.apiKey;
  if (!apiKey) {
    console.error("No Gemini API key found");
    return;
  }
  
  console.log("Using API key:", apiKey.slice(0, 10) + "...");
  const client = new GoogleGenAI({ apiKey });
  const model = aiConfig.providers.gemini.model;
  
  const systemInstruction = `${SYSTEM_PROMPT}\n${OUTPUT_INSTRUCTIONS}`;
  const userPrompt = "Create a smooth animated Accordion component with multiple items, single or multi-expand mode, smooth height transition animation, Remix Icon chevron rotation, keyboard navigation, ARIA expanded/controls attributes, and customizable styling via CSS Modules.";

  const apiCfg = {
    systemInstruction,
    temperature: 0.2,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    thinkingConfig: {
      thinkingBudget: 0,
    },
  };

  console.log("Calling Gemini API (thinkingBudget: 0)...");
  try {
    const apiResult = await client.models.generateContent({
      model,
      contents: userPrompt,
      config: apiCfg,
    });
    
    console.log("API CALL SUCCESS!");
    console.log("finishReason:", apiResult.candidates?.[0]?.finishReason);
    console.log("Response text length:", apiResult.text?.length);
    console.log("usageMetadata:", apiResult.usageMetadata);
    console.log("------------------ RAW responseText (first 2000 chars) ------------------");
    console.log((apiResult.text ?? "").slice(0, 2000));
    console.log("-----------------------------------------------------");
    
    try {
      const parsed = JSON.parse(apiResult.text ?? "");
      console.log("\n✅ JSON.parse succeeded");
      console.log("  files.length =", Array.isArray(parsed.files) ? parsed.files.length : "NOT_ARRAY");
    } catch (e: any) {
      console.log("\n❌ JSON.parse FAILED:", e.message);
    }
  } catch (err: any) {
    console.error("API CALL FAILED:", err);
  }
}

run();
