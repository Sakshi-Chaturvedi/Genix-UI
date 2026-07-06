import { IPromptTemplate } from "../types/prompt.types.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

export const componentPrompt: IPromptTemplate = {
  name: "component",
  version: "v1.0.0",
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt: (inputs: { prompt: string }) => `
FEATURE: Component Generation
Generate a premium reusable React component based on the following request:
"${inputs.prompt}"

Guidelines:
- Ensure the component supports various states: loading, disabled, error, active.
- Incorporate icon support where appropriate (use inline SVGs or import icons from standard libraries like "remixicon-react" or "lucide-react").
- Include CSS transitions, hover effects, or micro-animations for interactive elements.
- Design the component API props to be flexible, reusable, and extensible.
- Enforce strict responsiveness and cross-device support using clean CSS media queries in the CSS module file.
`,
};
