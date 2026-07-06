import { IPromptTemplate } from "../types/prompt.types.js";
import { SYSTEM_PROMPT } from "./system.prompt.js";

export const pagePrompt: IPromptTemplate = {
  name: "page",
  version: "v1.0.0",
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt: (inputs: { prompt: string }) => `
FEATURE: Page Generation
Generate a full page layout based on the following request:
"${inputs.prompt}"

Guidelines:
- The output should contain multiple reusable sub-components partitioned into a logical folder structure.
- Combine these sub-components into a main page component representing the overall page view.
- Ensure the page layout is fully responsive (mobile, tablet, desktop breakpoints using clean CSS media queries).
- Implement page-level state management, interactive sections, and smooth micro-interactions.
- Add mock data where appropriate to simulate dynamic data lists, tables, or charts.
- Organize the generated file structure cleanly in the JSON response files array.
`,
};
