import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import { AIService, AIProviderFactory } from "../services/ai/ai.service.js";
import aiConfig from "../config/ai.config.js";

/**
 * POST /api/ai/generate
 * Generates a component from a text prompt.
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
    const providerName = aiConfig.defaultProvider;
    const provider = AIProviderFactory.getProvider(providerName);
    const aiService = new AIService(provider);

    const conversionResult = await aiService.convertJsToTs({
      code: req.body.code,
      sourceLanguage: req.body.sourceLanguage,
      targetLanguage: req.body.targetLanguage,
      options: req.body.options,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component converted successfully",
      data: {
        provider: conversionResult.metadata?.provider,
        model: conversionResult.metadata?.model,
        files: conversionResult.files,
        explanation: conversionResult.explanation,
        metadata: conversionResult.metadata,
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
    const providerName = aiConfig.defaultProvider;
    const provider = AIProviderFactory.getProvider(providerName);
    const aiService = new AIService(provider);

    const improvementResult = await aiService.improveComponent({
      code: req.body.code,
      prompt: req.body.prompt,
      options: req.body.options,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component improved successfully",
      data: {
        provider: improvementResult.metadata?.provider,
        model: improvementResult.metadata?.model,
        files: improvementResult.files,
        explanation: improvementResult.explanation,
        metadata: improvementResult.metadata,
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
    const providerName = aiConfig.defaultProvider;
    const provider = AIProviderFactory.getProvider(providerName);
    const aiService = new AIService(provider);

    const explanationResult = await aiService.explainComponent({
      code: req.body.code,
      options: req.body.options,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component explained successfully",
      data: {
        provider: explanationResult.metadata?.provider,
        model: explanationResult.metadata?.model,
        files: explanationResult.files,
        explanation: explanationResult.explanation,
        metadata: explanationResult.metadata,
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
    const providerName = aiConfig.defaultProvider;
    const provider = AIProviderFactory.getProvider(providerName);
    const aiService = new AIService(provider);

    const generationResult = await aiService.generatePage({
      prompt: req.body.prompt,
      options: req.body.options,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Page generated successfully",
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
