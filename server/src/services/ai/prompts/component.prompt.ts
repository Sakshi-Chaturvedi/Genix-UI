import { IPromptTemplate } from "../types/prompt.types.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

export const componentPrompt: IPromptTemplate = {
  name: "component",
  version: "v1.2.0",
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt: (inputs: { prompt: string }) => `
FEATURE: Component Generation
Generate a premium reusable React component based on the following request:
"${inputs.prompt}"

Guidelines:
- Support states: loading, disabled, error, active.
- Use icons (e.g., remixicon-react) and micro-animations.
- Flexible API props and clean CSS media queries in the CSS module (e.g., @media (max-width: 768px)).

Requirements:
- MUST use named export: "export const ComponentName: React.FC<ComponentNameProps> = ..." (or "export const ComponentName = forwardRef...").
- Include explicit type annotation ": React.FC<ComponentNameProps>" (or "React.FC") and extend "React.ButtonHTMLAttributes<HTMLButtonElement>" (or relevant HTML element attributes).
- Interface MUST explicitly include at least one string prop typed as ": string" (e.g., label?: string; or title?: string;) and one boolean prop typed as ": boolean" (e.g., isLoading?: boolean; or isDisabled?: boolean;).
- Apply tabIndex and onKeyDown to interactive elements.
- CSS modules only, no inline styles or hardcoded string classNames. Include at least one responsive @media query in the CSS module.
`,
};


