export interface IPromptTemplate {
  name: string;
  version: string;
  systemPrompt: string;
  buildUserPrompt: (inputs: any) => string;
}

export interface IBuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  fullPrompt: string;
  version: string;
}
