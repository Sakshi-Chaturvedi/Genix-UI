import { IPromptTemplate } from "../types/prompt.types.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

export const conversionPrompt: IPromptTemplate = {
  name: "conversion",
  version: "v1.0.0",
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt: (inputs: { code: string; sourceLanguage: string; targetLanguage: string }) => `
FEATURE: JavaScript to TypeScript Conversion
Convert the following code from ${inputs.sourceLanguage} to ${inputs.targetLanguage}:

\`\`\`${inputs.sourceLanguage}
${inputs.code}
\`\`\`

Guidelines:
- Maintain all existing logic, features, state behaviors, and layout flow of the component.
- Add strict TypeScript interfaces and types for all props, states, hooks, events, and helper functions.
- Do NOT use "any". If a type is complex, define an explicit type or interface.
- Enhance accessibility and styling if there are obvious bugs, but prioritize accurate conversion.
- Preserve named exports or convert default exports to named exports to follow project guidelines.
`,
};
