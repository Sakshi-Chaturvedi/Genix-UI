import { IPromptTemplate, IBuiltPrompt } from "../types/prompt.types.js";
import { componentPrompt } from "../prompts/component.prompt.js";
import { pagePrompt } from "../prompts/page.prompt.js";
import { conversionPrompt } from "../prompts/conversion.prompt.js";
import { improvementPrompt } from "../prompts/improvement.prompt.js";
import { explanationPrompt } from "../prompts/explanation.prompt.js";
import { OUTPUT_INSTRUCTIONS } from "../prompts/system.prompt.js";
import AppError from "../../../utils/errorHandler.js";

export class PromptBuilder {
  private templates = new Map<string, IPromptTemplate>();

  constructor() {
    this.registerTemplate(componentPrompt);
    this.registerTemplate(pagePrompt);
    this.registerTemplate(conversionPrompt);
    this.registerTemplate(improvementPrompt);
    this.registerTemplate(explanationPrompt);
  }

  public registerTemplate(template: IPromptTemplate): void {
    this.templates.set(template.name.toLowerCase(), template);
  }

  public getTemplate(name: string): IPromptTemplate {
    const template = this.templates.get(name.toLowerCase());
    if (!template) {
      throw new AppError(`Prompt template for feature '${name}' not found.`, 400);
    }
    return template;
  }

  public build(templateName: string, inputs: any): IBuiltPrompt {
    const template = this.getTemplate(templateName);
    const userPrompt = template.buildUserPrompt(inputs);
    
    // Combine the template's base system prompt with the global output schema constraints
    const systemPromptCombined = `${template.systemPrompt}\n${OUTPUT_INSTRUCTIONS}`;
    
    return {
      systemPrompt: systemPromptCombined,
      userPrompt: userPrompt,
      fullPrompt: `SYSTEM INSTRUCTIONS:\n${systemPromptCombined}\n\nUSER REQUEST:\n${userPrompt}`,
      version: template.version,
    };
  }
}
