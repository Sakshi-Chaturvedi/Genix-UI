import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import * as componentService from "../services/component.service.js";

/**
 * POST /api/components
 * Creates/saves a component for the logged-in user.
 */
export const createComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const component = await componentService.createComponent(userId, req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Component created successfully",
      data: component,
    });
  }
);

/**
 * GET /api/components
 * Retrieves all components created by the logged-in user with optional query filters.
 */
export const getUserComponents = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    
    const { projectId, componentType, isSaved } = req.query;
    const filters: componentService.IComponentFilters = {
      projectId: projectId ? String(projectId) : undefined,
      componentType: componentType ? String(componentType) : undefined,
      isSaved: isSaved !== undefined ? String(isSaved) : undefined,
    };

    const components = await componentService.getUserComponents(userId, filters);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Components fetched successfully",
      data: components,
    });
  }
);

/**
 * GET /api/components/:id
 * Retrieves a single component by ID belonging to the logged-in user.
 */
export const getComponentById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const componentId = req.params.id as string;
    const component = await componentService.getComponentById(userId, componentId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component fetched successfully",
      data: component,
    });
  }
);

/**
 * PATCH /api/components/:id
 * Updates details of a component belonging to the logged-in user.
 */
export const updateComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const componentId = req.params.id as string;
    const component = await componentService.updateComponent(userId, componentId, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component updated successfully",
      data: component,
    });
  }
);

/**
 * DELETE /api/components/:id
 * Deletes a component belonging to the logged-in user.
 */
export const deleteComponent = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const componentId = req.params.id as string;
    await componentService.deleteComponent(userId, componentId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Component deleted successfully",
    });
  }
);
