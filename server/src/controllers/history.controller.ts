import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import * as historyService from "../services/history.service.js";

/**
 * POST /api/history
 * Creates a new prompt history record.
 */
export const createHistory = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const history = await historyService.createHistory(userId, req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Prompt history recorded successfully",
      data: history,
    });
  }
);

/**
 * GET /api/history
 * Retrieves prompt history records for the authenticated user with optional filters.
 */
export const getUserHistory = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const { feature, status, projectId, model, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

    const history = await historyService.getUserHistory(userId, {
      feature: feature as string,
      status: status as string,
      projectId: projectId as string,
      model: model as string,
      limit: parsedLimit,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prompt history fetched successfully",
      data: history,
    });
  }
);

/**
 * GET /api/history/:id
 * Retrieves a specific prompt history record for the authenticated user.
 */
export const getHistoryById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const id = req.params.id as string;

    const history = await historyService.getHistoryById(userId, id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prompt history record fetched successfully",
      data: history,
    });
  }
);

/**
 * DELETE /api/history/:id
 * Deletes a specific prompt history record.
 */
export const deleteHistory = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const id = req.params.id as string;

    await historyService.deleteHistory(userId, id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prompt history record deleted successfully",
    });
  }
);

/**
 * DELETE /api/history
 * Clears complete prompt history for the authenticated user.
 */
export const clearUserHistory = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();

    await historyService.clearUserHistory(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prompt history cleared successfully",
    });
  }
);
