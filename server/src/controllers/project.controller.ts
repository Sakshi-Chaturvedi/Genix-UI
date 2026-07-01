import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync.js";
import sendResponse from "../utils/sendResponse.js";
import * as projectService from "../services/project.service.js";

/**
 * POST /api/projects
 * Creates a new project for the authenticated user.
 */
export const createProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const project = await projectService.createProject(userId, req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Project created successfully",
      data: project,
    });
  }
);

/**
 * GET /api/projects
 * Retrieves all projects belonging to the authenticated user.
 */
export const getUserProjects = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const projects = await projectService.getUserProjects(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Projects fetched successfully",
      data: projects,
    });
  }
);

/**
 * GET /api/projects/:id
 * Retrieves a single project belonging to the authenticated user.
 */
export const getProjectById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const projectId = req.params.id as string;
    const project = await projectService.getProjectById(userId, projectId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Project fetched successfully",
      data: project,
    });
  }
);

/**
 * PATCH /api/projects/:id
 * Updates a specific project belonging to the authenticated user.
 */
export const updateProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const projectId = req.params.id as string;
    const project = await projectService.updateProject(userId, projectId, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  }
);

/**
 * DELETE /api/projects/:id
 * Deletes a specific project belonging to the authenticated user.
 */
export const deleteProject = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const projectId = req.params.id as string;
    await projectService.deleteProject(userId, projectId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Project deleted successfully",
    });
  }
);
