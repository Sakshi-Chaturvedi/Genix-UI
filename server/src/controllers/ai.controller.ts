import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import { AIService, AIProviderFactory } from "../services/ai/ai.service.js";
import aiConfig from "../config/ai.config.js";

/**
 * POST /api/ai/generate
 * Generates a component from a text prompt (Testing Endpoint).
 */
export const generateComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const providerName = aiConfig.defaultProvider;
    const provider = AIProviderFactory.getProvider(providerName);
    const aiService = new AIService(provider);

    const generationResult = await aiService.generateComponent({
      prompt: req.body.prompt,
      options: req.body.options,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component generated successfully",
      data: {
        provider: generationResult.metadata?.provider,
        model: generationResult.metadata?.model,
        files: generationResult.files,
        explanation: generationResult.explanation,
        metadata: generationResult.metadata,
      },
    });
  }
);

/**
 * POST /api/ai/convert
 * Converts a component from JavaScript to TypeScript.
 */
export const convertComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "JavaScript to TypeScript conversion foundation triggered successfully",
      data: {
        files: [],
        explanation: "Foundation response payload placeholder",
      },
    });
  }
);

/**
 * POST /api/ai/improve
 * Improves an existing component based on input guidelines.
 */
export const improveComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component improvement foundation triggered successfully",
      data: {
        files: [],
        explanation: "Foundation response payload placeholder",
      },
    });
  }
);

/**
 * POST /api/ai/explain
 * Explains code of a component.
 */
export const explainComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component explanation foundation triggered successfully",
      data: {
        files: [],
        explanation: "Foundation response payload placeholder",
      },
    });
  }
);

/**
 * POST /api/ai/page
 * Generates a full page from a template or prompt.
 */
export const generatePage = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Page generation foundation triggered successfully",
      data: {
        files: [],
        explanation: "Foundation response payload placeholder",
      },
    });
  }
);
