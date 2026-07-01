import { Project, IProjectDocument } from "../models/project.model.js";
import AppError from "../utils/errorHandler.js";

/**
 * Creates a new project for a user.
 */
export const createProject = async (
  userId: string,
  data: { name: string; description?: string }
): Promise<IProjectDocument> => {
  const project = await Project.create({
    userId,
    ...data,
  });
  return project;
};

/**
 * Retrieves all projects belonging to a user.
 */
export const getUserProjects = async (userId: string): Promise<IProjectDocument[]> => {
  return await Project.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Retrieves a single project belonging to a user.
 */
export const getProjectById = async (
  userId: string,
  projectId: string
): Promise<IProjectDocument> => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return project;
};

/**
 * Updates a project details belonging to a user.
 */
export const updateProject = async (
  userId: string,
  projectId: string,
  data: { name?: string; description?: string }
): Promise<IProjectDocument> => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!project) {
    throw new AppError("Project not found", 404);
  }
  return project;
};

/**
 * Deletes a project belonging to a user.
 */
export const deleteProject = async (
  userId: string,
  projectId: string
): Promise<void> => {
  const project = await Project.findOneAndDelete({ _id: projectId, userId });
  if (!project) {
    throw new AppError("Project not found", 404);
  }
};
