import { IPromptTemplate } from "../types/prompt.types.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

export const explanationPrompt: IPromptTemplate = {
  name: "explanation",
  version: "v1.0.0",
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt: (inputs: { code: string }) => `
FEATURE: Code Explanation
Provide a clear, technical explanation of the following component code:

\`\`\`tsx
${inputs.code}
\`\`\`

Guidelines:
- Explain:
  * Component Props (type interfaces, defaults)
  * State Management & Logic flow (useState, useEffect, custom hooks)
  * Styling approach (CSS Modules layout, responsiveness)
  * Accessibility implementation (roles, screen reader support, keyboard handlers)
  * Best practices used or potential improvements
- Format the explanation clearly within the "explanation" JSON field. No markdown files are needed.
`,
};
