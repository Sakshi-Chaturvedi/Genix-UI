import { IPromptTemplate } from "../types/prompt.types.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

export const improvementPrompt: IPromptTemplate = {
  name: "improvement",
  version: "v1.0.0",
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt: (inputs: { code: string; prompt: string }) => `
FEATURE: Component Improvement
Improve the following React component code:

\`\`\`tsx
${inputs.code}
\`\`\`

Based on these instructions:
"${inputs.prompt}"

Guidelines:
- Focus on enhancing:
  * UX & Visual Polish (animations, micro-interactions, layout alignment)
  * Accessibility (semantic HTML, proper ARIA labels, keyboard focus)
  * Performance (unnecessary renders, hooks memoization)
  * API Design & Extensibility (prop structures, typing)
  * Code Cleanliness & Type Safety (refactoring, removing implicit any)
- Keep all other existing functional business logic intact unless requested otherwise.
`,
};
